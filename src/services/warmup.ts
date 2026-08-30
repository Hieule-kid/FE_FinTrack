/**
 * Client-side cold-start warmup.
 *
 * Fires lightweight pings at the BFF warmup routes (`/api/warmup/<service>`) which proxy
 * to each Spring Boot service's `/ping`. Goal: start Render's free-tier services
 * cold-starting the moment the user lands on the login page, so the waits overlap with
 * the user typing their credentials instead of stacking sequentially.
 *
 * Never throws and never surfaces anything to the UI. De-dupes in-flight calls and
 * throttles re-fires to once per 5 minutes per service (persisted in sessionStorage so a
 * component remount doesn't re-fire).
 */

export type WarmupService = "auth" | "planning";

const WARMUP_TIMEOUT_MS = 150_000;
const MIN_INTERVAL_BETWEEN_WARMUPS_MS = 5 * 60 * 1000;
const SLOW_WARMUP_THRESHOLD_MS = 20_000;
const STORAGE_KEY_PREFIX = "fintrack:warmup:lastAttempt:";

const DEBUG =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_DEBUG_WARMUP === "true";

export interface WarmupResult {
  service: WarmupService;
  ok: boolean;
  elapsedMs: number;
}

const inFlight = new Map<WarmupService, Promise<WarmupResult>>();

function readLastAttempt(service: WarmupService): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_PREFIX + service);
    return raw ? Number.parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeLastAttempt(service: WarmupService, at: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_PREFIX + service, String(at));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — throttling just won't persist.
  }
}

async function pingOnce(service: WarmupService): Promise<WarmupResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(`/api/warmup/${service}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    const elapsedMs = Date.now() - start;
    let ok = res.ok;
    try {
      const body = (await res.json()) as { ok?: boolean };
      ok = ok && body.ok !== false;
    } catch {
      // ignore body parse issues; res.ok is enough
    }
    return { service, ok, elapsedMs };
  } catch {
    return { service, ok: false, elapsedMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

function warmupOne(service: WarmupService): Promise<WarmupResult> {
  const existing = inFlight.get(service);
  if (existing) return existing;

  const now = Date.now();
  if (now - readLastAttempt(service) < MIN_INTERVAL_BETWEEN_WARMUPS_MS) {
    return Promise.resolve({ service, ok: true, elapsedMs: 0 });
  }

  writeLastAttempt(service, now);
  const promise = pingOnce(service).finally(() => inFlight.delete(service));
  inFlight.set(service, promise);
  return promise;
}

export function warmupServices(
  services: WarmupService[],
): Promise<WarmupResult[]> {
  return Promise.allSettled(services.map(warmupOne)).then((results) => {
    const resolved = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { service: services[i], ok: false, elapsedMs: 0 },
    );

    if (DEBUG) {
      console.info("[warmup]", resolved);
    }
    for (const r of resolved) {
      if (r.elapsedMs > SLOW_WARMUP_THRESHOLD_MS) {
        console.warn(
          `[warmup] ${r.service} took ${r.elapsedMs}ms — service was likely cold`,
        );
      }
    }

    return resolved;
  });
}
