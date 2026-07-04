import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookies, rolesCookieOptions } from "@/config/cookies";
import {
  authFacade,
  extractRolesFromUser,
} from "@/features/auth/server/auth.facade";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(authCookies.accessToken)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await authFacade.profile(accessToken);
  if (!backendResponse.ok) {
    const response = NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
    });

    if (backendResponse.status === 401) {
      response.cookies.delete(authCookies.accessToken);
      response.cookies.delete(authCookies.refreshToken);
      response.cookies.delete(authCookies.roles);
    }

    return response;
  }

  const user = backendResponse.data;
  if (!user) {
    return NextResponse.json(
      { message: "Invalid auth response from backend" },
      { status: 502 },
    );
  }

  const response = NextResponse.json(user);
  const roles = extractRolesFromUser(user);

  if (roles.length > 0) {
    response.cookies.set(
      authCookies.roles,
      roles.join(","),
      rolesCookieOptions,
    );
  }

  return response;
}
