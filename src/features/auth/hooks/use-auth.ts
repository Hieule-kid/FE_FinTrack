"use client";

import { useMemo, useState } from "react";
import { authService } from "@/features/auth/service";
import { authStore } from "@/features/auth/store";
import { HttpError } from "@/services/http";
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "@/features/auth/types";

interface ErrorWithMessage {
  message?: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    const data = error.data as ErrorWithMessage | null;
    if (data?.message) {
      return data.message;
    }
  }

  return fallback;
}

interface UseAuthResult {
  isLoading: boolean;
  error: string;
  login: (payload: LoginPayload) => Promise<AuthSession | null>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse | null>;
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
        } catch (error) {
          setError(
            extractErrorMessage(
              error,
              "Unable to login. Please check your account.",
            ),
          );
          return null;
        } finally {
          setIsLoading(false);
        }
      },
      register: async (payload: RegisterPayload) => {
        setIsLoading(true);
        setError("");

        try {
          return await authService.register(payload);
        } catch (error) {
          setError(
            extractErrorMessage(error, "Unable to create account right now."),
          );
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
