import { http } from "@/services/http";
import type {
  AuthSession,
  LoginPayload,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
  ResponseUser,
} from "./types";

const AUTH_BASE_PATH = "/api/auth";
const AUTH_USER_PATH = "/api/users";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    return http.post<AuthSession>(`${AUTH_BASE_PATH}/login`, payload, {
      useBaseUrl: false,
    });
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return http.post<RegisterResponse>(`${AUTH_BASE_PATH}/register`, payload, {
      useBaseUrl: false,
    });
  },

  async profile(): Promise<ResponseUser<AuthUser>> {
    return http.get<ResponseUser<AuthUser>>(`${AUTH_USER_PATH}/profile`, {
      useBaseUrl: false,
    });
  },

  async logout(): Promise<void> {
    await http.post<void>(`${AUTH_BASE_PATH}/logout`, undefined, {
      useBaseUrl: false,
    });
  },
};
