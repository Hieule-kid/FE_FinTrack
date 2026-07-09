export type UserRole = "user" | "admin" | string;

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
  currency: Currency;
}

export interface AuthSession {
  authenticated: boolean;
  user?: AuthUser;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export type RegisterRole = "USER" | "ADMIN" | string;

export type Currency = "USD" | "VND" | string;

export interface RegisterPayload {
  fullName?: string;
  username: string;
  email: string;
  password: string;
  role: RegisterRole;
  currency: Currency;
}

export interface RegisterResponse {
  message?: string;
  [key: string]: unknown;
}
