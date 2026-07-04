import type { AuthUser, UserRole } from "@/features/auth/types";
import { requestAuthBackend } from "./auth-backend.service";

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
      path: "/api/auth/login",
      body: payload,
    });
  },

  profile(accessToken: string) {
    return requestAuthBackend<AuthUser>({
      method: "GET",
      path: "/api/auth/profile",
      accessToken,
    });
  },

  logout(accessToken?: string) {
    return requestAuthBackend<{ message?: string }>({
      method: "POST",
      path: "/api/auth/logout",
      accessToken,
    });
  },
};
