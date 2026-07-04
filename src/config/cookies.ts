const isProduction = process.env.NODE_ENV === "production";

export const authCookies = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  roles: "roles",
} as const;

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 15,
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const rolesCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
};
