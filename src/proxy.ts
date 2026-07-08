import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookies } from "./config/cookies";
import { hasRole } from "./utils/roles";

export function proxy(req: NextRequest) {
  const token = req.cookies.get(authCookies.accessToken)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const rolesCookie = req.cookies.get(authCookies.roles)?.value ?? "";
    const roles = rolesCookie.split(",").filter(Boolean);

    if (!hasRole({ roles: roles.map((r) => r.toLowerCase()) }, "admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
