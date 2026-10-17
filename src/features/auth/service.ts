import { http } from "@/services/http";
import type {
  AuthSession,
  LoginPayload,
  AuthUser,
  ForgotPasswordPayload,
  MessageResponse,
  ResetPasswordPayload,
  RegisterPayload,
  RegisterResponse,
  ResponseUser,
  UpdateCurrencyRequest,
  UpdateUserProfileRequest,
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

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<MessageResponse> {
    return http.post<MessageResponse>(
      `${AUTH_BASE_PATH}/forgot-password`,
      payload,
      { useBaseUrl: false, skipUnauthorized: true },
    );
  },

  // skipUnauthorized: the backend answers 401 for a bad/expired token, which must surface
  // as a form error — not trigger the global silent-logout interceptor.
  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    return http.post<MessageResponse>(
      `${AUTH_BASE_PATH}/reset-password`,
      payload,
      { useBaseUrl: false, skipUnauthorized: true },
    );
  },

  async profile(): Promise<ResponseUser<AuthUser>> {
    return http.get<ResponseUser<AuthUser>>(`${AUTH_USER_PATH}/profile`, {
      useBaseUrl: false,
    });
  },

  async updateProfile(
    payload: UpdateUserProfileRequest,
  ): Promise<ResponseUser<AuthUser>> {
    return http.put<ResponseUser<AuthUser>>(
      `${AUTH_USER_PATH}/profile`,
      payload,
      { useBaseUrl: false },
    );
  },

  async updateCurrency(
    payload: UpdateCurrencyRequest,
  ): Promise<ResponseUser<AuthUser>> {
    return http.patch<ResponseUser<AuthUser>>(
      `${AUTH_USER_PATH}/currency`,
      payload,
      { useBaseUrl: false },
    );
  },

  async logout(): Promise<void> {
    await http.post<void>(`${AUTH_BASE_PATH}/logout`, undefined, {
      useBaseUrl: false,
    });
  },
};
