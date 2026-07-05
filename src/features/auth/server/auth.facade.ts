import type { AuthUser, UserRole } from "@/features/auth/types";
import { requestAuthBackend } from "./auth.service";

const AUTH_BACKEND_BASE_PATH = "/api/v1/auth";

export interface BackendLoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  roles?: UserRole[];
  [key: string]: unknown;
}

export function extractRolesFromLoginPayload(
  payload: BackendLoginResponse,
): UserRole[] {
  if (Array.isArray(payload.roles)) {
    return payload.roles;
  }

  if (Array.isArray(payload.user?.roles)) {
    return payload.user.roles;
  }

  return [];
}

export function extractRolesFromUser(user: AuthUser): UserRole[] {
  if (Array.isArray(user.roles)) {
    return user.roles;
  }

  return [];
}

export const authFacade = {
  login(payload: unknown) {
    return requestAuthBackend<BackendLoginResponse>({
      method: "POST",
      path: `${AUTH_BACKEND_BASE_PATH}/login`,
      body: payload,
    });
  },

  register(payload: unknown) {
    return requestAuthBackend<{ message?: string }>({
      method: "POST",
      path: `${AUTH_BACKEND_BASE_PATH}/register`,
      body: payload,
    });
  },

  profile(accessToken: string) {
    return requestAuthBackend<AuthUser>({
      method: "GET",
      path: `${AUTH_BACKEND_BASE_PATH}/profile`,
      accessToken,
    });
  },

  logout(accessToken?: string) {
    return requestAuthBackend<{ message?: string }>({
      method: "POST",
      path: `${AUTH_BACKEND_BASE_PATH}/logout`,
      accessToken,
    });
  },
};
