import {
  accessTokenCookieOptions,
  authCookies,
  refreshTokenCookieOptions,
} from "@/config/cookies";
import { env } from "@/config/env";
import { authFacade } from "@/features/auth/server/auth.facade";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// A cold planning-service on Render's free tier can take minutes to answer.
export const maxDuration = 60;

function buildPlanningUrl(
  request: NextRequest,
  pathSegments: string[],
): string {
  const baseUrl = env.planningServiceBaseUrl.replace(/\/$/, "");
  const joinedPath = pathSegments.join("/");
  const search = request.nextUrl.search;
  return `${baseUrl}/${joinedPath}${search}`;
}

function copyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  return headers;
}

interface RefreshedTokens {
  accessToken: string;
  refreshToken?: string;
}

async function tryRefreshTokens(
  request: NextRequest,
): Promise<RefreshedTokens | null> {
  const refreshToken = request.cookies.get(authCookies.refreshToken)?.value;
  if (!refreshToken) return null;

  try {
    const result = await authFacade.refresh(refreshToken);
    if (!result.ok || !result.data) return null;

    const d = result.data as Record<string, unknown>;
    // BE wraps the response in ApiResponse<T> so tokens are nested under d.data
    const payload =
      typeof d.data === "object" && d.data !== null
        ? (d.data as Record<string, unknown>)
        : d;
    const accessToken =
      typeof payload.accessToken === "string"
        ? payload.accessToken
        : typeof payload.access_token === "string"
          ? payload.access_token
          : undefined;
    if (!accessToken) return null;

    const newRefresh =
      typeof payload.refreshToken === "string"
        ? payload.refreshToken
        : typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : undefined;
    return { accessToken, refreshToken: newRefresh };
  } catch {
    // Auth service unreachable — treat as unable to refresh.
    return null;
  }
}

async function fetchUpstream(
  request: NextRequest,
  pathSegments: string[],
  accessToken: string,
  body: string | undefined,
): Promise<Response> {
  const headers = copyRequestHeaders(request);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(buildPlanningUrl(request, pathSegments), {
    method: request.method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });
}

function applyRefreshedCookies(
  response: NextResponse,
  tokens: RefreshedTokens,
): void {
  response.cookies.set(
    authCookies.accessToken,
    tokens.accessToken,
    accessTokenCookieOptions,
  );
  if (tokens.refreshToken) {
    response.cookies.set(
      authCookies.refreshToken,
      tokens.refreshToken,
      refreshTokenCookieOptions,
    );
  }
}

async function proxyPlanningRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!env.planningServiceBaseUrl) {
    return NextResponse.json(
      { message: "Missing PLANNING_SERVICE_BASE_URL configuration" },
      { status: 500 },
    );
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  let accessToken = request.cookies.get(authCookies.accessToken)?.value;
  let refreshedTokens: RefreshedTokens | null = null;

  // Cookie missing — try a silent refresh before giving up.
  if (!accessToken) {
    refreshedTokens = await tryRefreshTokens(request);
    if (!refreshedTokens) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    accessToken = refreshedTokens.accessToken;
  }

  let response: Response;
  try {
    response = await fetchUpstream(request, pathSegments, accessToken, body);
  } catch (err) {
    console.error("[planning proxy] fetch failed:", err);
    const errResponse = NextResponse.json(
      { message: "Cannot reach planning service" },
      { status: 502 },
    );
    // Deliver any freshly-issued tokens even on upstream failure so a rotating
    // refresh token is not silently consumed and discarded.
    if (refreshedTokens) applyRefreshedCookies(errResponse, refreshedTokens);
    return errResponse;
  }

  // Upstream says the token is expired — try refresh once and retry.
  if (response.status === 401 && !refreshedTokens) {
    refreshedTokens = await tryRefreshTokens(request);
    if (refreshedTokens) {
      try {
        response = await fetchUpstream(
          request,
          pathSegments,
          refreshedTokens.accessToken,
          body,
        );
      } catch (err) {
        console.error(
          "[planning proxy] fetch failed after token refresh:",
          err,
        );
        const errResponse = NextResponse.json(
          { message: "Cannot reach planning service" },
          { status: 502 },
        );
        applyRefreshedCookies(errResponse, refreshedTokens);
        return errResponse;
      }
    }
  }

  if (!response.ok) {
    console.error(
      "[planning proxy] upstream error",
      response.status,
      buildPlanningUrl(request, pathSegments),
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });

  if (refreshedTokens) {
    applyRefreshedCookies(nextResponse, refreshedTokens);
  }

  return nextResponse;
}

type PlanningRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: PlanningRouteContext) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function PUT(request: NextRequest, context: PlanningRouteContext) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}
