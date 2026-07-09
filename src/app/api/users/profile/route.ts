import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookies } from "@/config/cookies";
import { authFacade } from "@/features/auth/server/auth.facade";

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

  return NextResponse.json(backendResponse.data);
}
