"use client";

import { useCallback, useState } from "react";
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

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError("");

    try {
      const session = await authService.login(payload);
      authStore.setUser(session.user ?? null);
      return session;
    } catch (err) {
      setError(
        extractErrorMessage(err, "Unable to login. Please check your account."),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError("");

    try {
      return await authService.register(payload);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Unable to create account right now."),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  return { isLoading, error, login, register, logout };
}
