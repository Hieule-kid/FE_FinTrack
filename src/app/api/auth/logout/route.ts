import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookies } from "@/config/cookies";
import { authFacade } from "@/features/auth/server/auth.facade";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(authCookies.accessToken)?.value;
  await authFacade.logout(accessToken);

  const response = NextResponse.json({ authenticated: false });

  response.cookies.set(authCookies.accessToken, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  response.cookies.set(authCookies.refreshToken, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  response.cookies.set(authCookies.roles, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  return response;
}
