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
  email: string;
  password: string;
}
