"use client";

import { useMemo, useState } from "react";
import { authService } from "@/features/auth/service";
import { authStore } from "@/features/auth/store";
import type { AuthSession, LoginPayload } from "@/features/auth/types";

interface UseAuthResult {
  isLoading: boolean;
  error: string;
  login: (payload: LoginPayload) => Promise<AuthSession | null>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  return useMemo(
    () => ({
      isLoading,
      error,
      login: async (payload: LoginPayload) => {
        setIsLoading(true);
        setError("");

        try {
          const session = await authService.login(payload);
          authStore.setUser(session.user ?? null);
          return session;
        } catch {
          setError("Unable to login. Please check your account.");
          return null;
        } finally {
          setIsLoading(false);
        }
      },
      logout: async () => {
        setIsLoading(true);
        setError("");

        try {
          await authService.logout();
          authStore.clear();
        } catch {
          setError("Unable to logout right now.");
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [error, isLoading],
  );
}
