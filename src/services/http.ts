import { handleUnauthorized } from "./interceptor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  useBaseUrl?: boolean;
  /** Skip the automatic logout-on-401 behaviour. Use for background sync requests
   *  where a session expiry should not silently sign the user out. */
  skipUnauthorized?: boolean;
}

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, statusText: string, data: unknown) {
    super(`Request failed: ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  method: HttpMethod,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, useBaseUrl = true, skipUnauthorized = false } = options;
  const url = useBaseUrl ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let responseData: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseData = await response.json();
  }

  if (!response.ok) {
    if (!skipUnauthorized) await handleUnauthorized(response.status);
    throw new HttpError(response.status, response.statusText, responseData);
  }

  return responseData as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(path, "GET", options),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
  ) => request<T>(path, "POST", { ...options, body }),
  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
  ) => request<T>(path, "PUT", { ...options, body }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
  ) => request<T>(path, "PATCH", { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(path, "DELETE", options),
};
