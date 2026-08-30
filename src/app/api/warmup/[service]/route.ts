import { NextResponse } from "next/server";
import { env } from "@/config/env";

/**
 * BFF passthrough for the cold-start warmup mechanism.
 *
 * The browser hits `/api/warmup/auth` and `/api/warmup/planning` as soon as the login
 * page mounts. This handler forwards a bare `GET /ping` to the corresponding Spring Boot
 * service so the JVM + Spring context start cold-starting while the user is still typing.
 *
 * It never surfaces an error: a sleeping/unreachable backend just yields `{ ok: false }`.
 * The request still lands on the backend and triggers its boot even if we time out waiting.
 */

export const dynamic = "force-dynamic";
// A cold Spring Boot service on Render's free tier can take minutes; give the ping room
// so it isn't cut off by the platform's default function timeout.
export const maxDuration = 60;

const PING_TIMEOUT_MS = 30_000;

const SERVICE_BASE_URLS: Record<string, string> = {
  auth: env.authServiceBaseUrl,
  planning: env.planningServiceBaseUrl,
};

type WarmupRouteContext = {
  params: Promise<{ service: string }>;
};

export async function GET(_request: Request, context: WarmupRouteContext) {
  const { service } = await context.params;
  const baseUrl = SERVICE_BASE_URLS[service];

  if (!baseUrl) {
    return NextResponse.json(
      { service, ok: false, status: 0, error: "unknown service" },
      { status: 404 },
    );
  }

  const startedAt = Date.now();
  const target = `${baseUrl.replace(/\/$/, "")}/ping`;

  try {
    const res = await fetch(target, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    return NextResponse.json({
      service,
      ok: res.ok,
      status: res.status,
      elapsedMs: Date.now() - startedAt,
    });
  } catch {
    // Timeout / DNS / connection refused — the backend may still be booting from
    // the connection we just opened. Report a non-error so the client stays quiet.
    return NextResponse.json({
      service,
      ok: false,
      status: 0,
      elapsedMs: Date.now() - startedAt,
    });
  }
}
