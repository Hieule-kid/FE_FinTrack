import { env } from "@/config/env";

type BackendMethod = "GET" | "POST" | "PUT" | "PATCH";

interface BackendRequestOptions {
  method: BackendMethod;
  path: string;
  body?: unknown;
  accessToken?: string;
}

export interface BackendApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

// Bound the wait so the serverless function returns a clean JSON 503 (which the client
// turns into a "waking up" retry) instead of being killed at `maxDuration` and emitting
// an opaque platform 504. Stays under the 60s route `maxDuration`.
const BACKEND_TIMEOUT_MS = 55_000;

export async function requestAuthBackend<T>(
  options: BackendRequestOptions,
): Promise<BackendApiResponse<T>> {
  if (!env.authServiceBaseUrl) {
    return {
      ok: false,
      status: 500,
      data: { message: "Missing AUTH_SERVICE_BASE_URL configuration" } as T,
    };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  try {
    const response = await fetch(`${env.authServiceBaseUrl}${options.path}`, {
      method: options.method,
      headers,
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });

    let data: T | null = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      status: isTimeout ? 503 : 502,
      data: {
        message: isTimeout
          ? "Auth service is starting up"
          : "Cannot reach backend auth API",
      } as T,
    };
  }
}
