import type { AuthUser } from "./auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}

const authState: AuthState = {
  user: null,
  accessToken: null,
};

export const authStore = {
  getState: () => authState,
  setUser: (user: AuthUser | null) => {
    authState.user = user;
  },
  setAccessToken: (token: string | null) => {
    authState.accessToken = token;
  },
  clear: () => {
    authState.user = null;
    authState.accessToken = null;
  },
};
