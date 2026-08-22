export type UserRole = "USER" | "ADMIN" | string;

export interface ResponseUser<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface AuthUser extends ResponseUser<AuthUser> {
  id: string;
  email: string;
  roles: UserRole[];
  fullName?: string;
  currency: string;
}

export interface AuthSession {
  authenticated: boolean;
  user?: AuthUser;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export type Currency = "USD" | "VND" | string;

export interface RegisterPayload {
  fullName?: string;
  username: string;
  email: string;
  password: string;
  currency: Currency;
}

export interface RegisterResponse {
  message?: string;
  [key: string]: unknown;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  email?: string;
  currency?: Currency;
}

export interface UpdateCurrencyRequest {
  currency: Currency;
}
