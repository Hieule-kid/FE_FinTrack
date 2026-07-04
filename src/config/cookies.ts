import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const isProduction = process.env.NODE_ENV === "production";

export const authCookies = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  roles: "roles",
} as const;

export const accessTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 15,
};

export const refreshTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const rolesCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
};
