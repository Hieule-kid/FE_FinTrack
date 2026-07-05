import { env } from "@/config/env";

type BackendMethod = "GET" | "POST";

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
  } catch {
    return {
      ok: false,
      status: 502,
      data: { message: "Cannot reach backend auth API" } as T,
    };
  }
}
