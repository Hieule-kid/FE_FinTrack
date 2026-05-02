import { http } from "@/services/http";
import type { LoginPayload, AuthTokens, AuthUser } from "./auth.types";

const AUTH_BASE_PATH = "/api/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    return http.post<AuthTokens>(`${AUTH_BASE_PATH}/login`, payload);
  },

  async me(): Promise<AuthUser> {
    return http.get<AuthUser>(`${AUTH_BASE_PATH}/me`);
  },
};
