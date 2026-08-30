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

// A cold auth-service on Render's free tier can take minutes to answer; keep the
// function alive long enough that the first login after an idle period doesn't 504.
export const maxDuration = 60;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function pickStringValue(
  sources: UnknownRecord[],
  keys: string[],
): string | undefined {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
  }

  return undefined;
}

function normalizeLoginResponse(payload: unknown): UnknownRecord {
  if (!isRecord(payload)) {
    return {};
  }

  const containers: UnknownRecord[] = [payload];

  for (const key of ["data", "result", "payload", "body"]) {
    const nested = payload[key];
    if (isRecord(nested)) {
      containers.push(nested);
    }
  }

  const accessToken = pickStringValue(containers, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
    "jwtToken",
  ]);

  const refreshToken = pickStringValue(containers, [
    "refreshToken",
    "refresh_token",
  ]);

  const user = containers.find((container) => isRecord(container.user))?.user;
  const roles = containers.find((container) =>
    Array.isArray(container.roles),
  )?.roles;

  return {
    ...payload,
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
    ...(user ? { user } : {}),
    ...(roles ? { roles } : {}),
  };
}

export async function POST(request: Request) {
  const payload = await request.json();

  const backendResponse = await authFacade.login(payload);
  if (!backendResponse.ok) {
    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
    });
  }

  const responseData = normalizeLoginResponse(backendResponse.data);

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
    responseData.accessToken as string,
    accessTokenCookieOptions,
  );

  if (responseData.refreshToken) {
    response.cookies.set(
      authCookies.refreshToken,
      responseData.refreshToken as string,
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
