import { NextResponse } from "next/server";
import {
  accessTokenCookieOptions,
  authCookies,
  refreshTokenCookieOptions,
  rolesCookieOptions,
} from "@/config/cookies";
import { env } from "@/config/env";
import type { AuthUser, UserRole } from "@/modules/auth/auth.types";

interface BackendLoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  roles?: UserRole[];
  [key: string]: unknown;
}

function extractRoles(payload: BackendLoginResponse): UserRole[] {
  if (Array.isArray(payload.roles)) {
    return payload.roles;
  }

  if (Array.isArray(payload.user?.roles)) {
    return payload.user.roles;
  }

  return [];
}

export async function POST(request: Request) {
  if (!env.serverApiBaseUrl) {
    return NextResponse.json(
      { message: "Missing API_BASE_URL configuration" },
      { status: 500 },
    );
  }

  const payload = await request.json();

  const upstreamResponse = await fetch(
    `${env.serverApiBaseUrl}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  let responseData: BackendLoginResponse = {};
  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseData = (await upstreamResponse.json()) as BackendLoginResponse;
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(responseData, { status: upstreamResponse.status });
  }

  if (!responseData.accessToken) {
    return NextResponse.json(
      { message: "Missing access token from auth API" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    user: responseData.user,
  });

  response.cookies.set(
    authCookies.accessToken,
    responseData.accessToken,
    accessTokenCookieOptions,
  );

  if (responseData.refreshToken) {
    response.cookies.set(
      authCookies.refreshToken,
      responseData.refreshToken,
      refreshTokenCookieOptions,
    );
  }

  const roles = extractRoles(responseData);
  if (roles.length > 0) {
    response.cookies.set(
      authCookies.roles,
      roles.join(","),
      rolesCookieOptions,
    );
  } else {
    response.cookies.delete(authCookies.roles);
  }

  return response;
}
