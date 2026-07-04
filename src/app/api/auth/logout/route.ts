import { NextResponse } from "next/server";
import { authCookies } from "@/config/cookies";

export async function POST() {
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
