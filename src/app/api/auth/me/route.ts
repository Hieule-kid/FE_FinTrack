import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookies, rolesCookieOptions } from "@/config/cookies";
import { env } from "@/config/env";
import type { AuthUser, UserRole } from "@/modules/auth/auth.types";

function extractRoles(user: AuthUser): UserRole[] {
  if (Array.isArray(user.roles)) {
    return user.roles;
  }

  return [];
}

export async function GET(request: NextRequest) {
  if (!env.serverApiBaseUrl) {
    return NextResponse.json(
      { message: "Missing API_BASE_URL configuration" },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(authCookies.accessToken)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstreamResponse = await fetch(`${env.serverApiBaseUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let responseData: unknown = null;
  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseData = await upstreamResponse.json();
  }

  if (!upstreamResponse.ok) {
    const response = NextResponse.json(responseData, {
      status: upstreamResponse.status,
    });

    if (upstreamResponse.status === 401) {
      response.cookies.delete(authCookies.accessToken);
      response.cookies.delete(authCookies.refreshToken);
      response.cookies.delete(authCookies.roles);
    }

    return response;
  }

  const user = responseData as AuthUser;
  const response = NextResponse.json(user);
  const roles = extractRoles(user);

  if (roles.length > 0) {
    response.cookies.set(
      authCookies.roles,
      roles.join(","),
      rolesCookieOptions,
    );
  }

  return response;
}
