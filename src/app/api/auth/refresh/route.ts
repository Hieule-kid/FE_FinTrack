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
  const accessToken = (
    typeof d.accessToken === "string" ? d.accessToken
    : typeof d.access_token === "string" ? d.access_token
    : undefined
  );

  if (!accessToken) {
    return NextResponse.json({ message: "No access token in refresh response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.accessToken, accessToken, accessTokenCookieOptions);

  const newRefreshToken = (
    typeof d.refreshToken === "string" ? d.refreshToken
    : typeof d.refresh_token === "string" ? d.refresh_token
    : undefined
  );
  if (newRefreshToken) {
    response.cookies.set(authCookies.refreshToken, newRefreshToken, refreshTokenCookieOptions);
  }

  return response;
}
