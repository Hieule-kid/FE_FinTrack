import { NextResponse } from "next/server";
import {
  accessTokenCookieOptions,
  authCookies,
  refreshTokenCookieOptions,
  rolesCookieOptions,
} from "@/config/cookies";
import {
  authFacade,
  extractRolesFromLoginPayload,
} from "@/features/auth/server/auth.facade";

export async function POST(request: Request) {
  const payload = await request.json();

  const backendResponse = await authFacade.login(payload);
  if (!backendResponse.ok) {
    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
    });
  }

  const responseData = backendResponse.data ?? {};

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

  const roles = extractRolesFromLoginPayload(responseData);
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
