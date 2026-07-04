import type { AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const authState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export const authStore = {
  getState: () => authState,
  setUser: (user: AuthUser | null) => {
    authState.user = user;
    authState.isAuthenticated = Boolean(user);
  },
  setAuthenticated: (value: boolean) => {
    authState.isAuthenticated = value;
  },
  clear: () => {
    authState.user = null;
    authState.isAuthenticated = false;
  },
};
