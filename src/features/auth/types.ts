export type UserRole = "user" | "admin" | string;

export interface AuthUser {
  id: string;
  email: string;
  roles: UserRole[];
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

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: RegisterRole;
}

export interface RegisterResponse {
  message?: string;
  [key: string]: unknown;
}
