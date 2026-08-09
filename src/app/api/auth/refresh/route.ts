import {
  accessTokenCookieOptions,
  authCookies,
  refreshTokenCookieOptions,
} from "@/config/cookies";
import { authFacade } from "@/features/auth/server/auth.facade";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(authCookies.refreshToken)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const result = await authFacade.refresh(refreshToken);
  if (!result.ok || !result.data) {
    return NextResponse.json({ message: "Token refresh failed" }, { status: 401 });
  }

  const d = result.data as Record<string, unknown>;
  // BE wraps the response in ApiResponse<T> so tokens are nested under d.data
  const payload =
    typeof d.data === "object" && d.data !== null
      ? (d.data as Record<string, unknown>)
      : d;
  const accessToken =
    typeof payload.accessToken === "string" ? payload.accessToken
    : typeof payload.access_token === "string" ? payload.access_token
    : undefined;

  if (!accessToken) {
    return NextResponse.json({ message: "No access token in refresh response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.accessToken, accessToken, accessTokenCookieOptions);

  const newRefreshToken =
    typeof payload.refreshToken === "string" ? payload.refreshToken
    : typeof payload.refresh_token === "string" ? payload.refresh_token
    : undefined;
  if (newRefreshToken) {
    response.cookies.set(authCookies.refreshToken, newRefreshToken, refreshTokenCookieOptions);
  }

  return response;
}
