/**
 * Client-side cold-start warmup.
 *
 * Fires lightweight pings at the BFF warmup routes (`/api/warmup/<service>`) which proxy
 * to each Spring Boot service's `/ping`. Goal: start Render's free-tier services
 * cold-starting the moment the user lands on the login page, so the waits overlap with
 * the user typing their credentials instead of stacking sequentially.
 *
 * `warmupServices` never throws and never surfaces anything to the UI. It de-dupes
 * in-flight calls and throttles re-fires to once per 5 minutes per service (persisted in
 * sessionStorage so a component remount doesn't re-fire).
 *
 * `waitForServiceReady` is the opposite: a deliberate, un-throttled poll used right before
 * a real request (e.g. login) so the caller can block until the cold service actually
 * answers instead of firing into a still-booting backend and timing out.
 */

export type WarmupService = "auth" | "planning";

const WARMUP_TIMEOUT_MS = 30_000;
const MIN_INTERVAL_BETWEEN_WARMUPS_MS = 5 * 60 * 1000;
const SLOW_WARMUP_THRESHOLD_MS = 20_000;
const STORAGE_KEY_PREFIX = "fintrack:warmup:lastAttempt:";

/** Per-attempt timeout while polling for readiness — short so the loop reacts quickly. */
const READINESS_ATTEMPT_TIMEOUT_MS = 15_000;
/** Gap between readiness polls once one comes back not-ready. */
const READINESS_POLL_INTERVAL_MS = 3_000;
/** Hard ceiling on how long we'll wait for a cold service to come up. */
const READINESS_MAX_WAIT_MS = 180_000;

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

async function pingOnce(
  service: WarmupService,
  timeoutMs: number = WARMUP_TIMEOUT_MS,
): Promise<WarmupResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Polls the warmup endpoint for `service` until it answers `ok` or `maxWaitMs` elapses.
 * Unlike `warmupServices` this bypasses the 5-minute throttle — call it right before a
 * real request so you block on a genuinely-ready backend instead of a still-booting one.
 * Never throws; returns `true` once the service responds, `false` on timeout/abort.
 */
export async function waitForServiceReady(
  service: WarmupService,
  options: { maxWaitMs?: number; signal?: AbortSignal } = {},
): Promise<boolean> {
  const { maxWaitMs = READINESS_MAX_WAIT_MS, signal } = options;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline && !signal?.aborted) {
    const attemptTimeout = Math.min(
      READINESS_ATTEMPT_TIMEOUT_MS,
      Math.max(1_000, deadline - Date.now()),
    );
    const result = await pingOnce(service, attemptTimeout);
    if (result.ok) return true;
    if (signal?.aborted) return false;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await delay(Math.min(READINESS_POLL_INTERVAL_MS, remaining), signal);
  }

  return false;
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
