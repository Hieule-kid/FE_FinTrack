import { http } from "@/services/http";
import type { AuthSession, LoginPayload, AuthUser } from "./types";

const AUTH_BASE_PATH = "/api/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    return http.post<AuthSession>(`${AUTH_BASE_PATH}/login`, payload, {
      useBaseUrl: false,
    });
  },

  async me(): Promise<AuthUser> {
    return http.get<AuthUser>(`${AUTH_BASE_PATH}/me`, {
      useBaseUrl: false,
    });
  },

  async logout(): Promise<void> {
    await http.post<void>(`${AUTH_BASE_PATH}/logout`, undefined, {
      useBaseUrl: false,
    });
  },
};
