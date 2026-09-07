"use client";

import { useCallback, useState } from "react";
import { authService } from "@/features/auth/service";
import { authStore } from "@/features/auth/store";
import { HttpError } from "@/services/http";
import { waitForServiceReady } from "@/services/warmup";
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "@/features/auth/types";

interface ErrorWithMessage {
  message?: string;
}

const LOGIN_FALLBACK_ERROR = "Unable to login. Please check your account.";
const SERVER_WAKE_TIMEOUT_ERROR =
  "The server is taking longer than expected to start. Please try again in a moment.";

/** Statuses that mean "backend not ready", not "bad credentials". */
const COLD_START_STATUSES = new Set([502, 503, 504]);

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    const data = error.data as ErrorWithMessage | null;
    if (data?.message) {
      return data.message;
    }
  }

  return fallback;
}

/**
 * True when the failure looks like the auth-service still cold-starting: an upstream 5xx
 * from the BFF, or a network-level failure (`TypeError`) — including a fetch aborted by
 * the OS backgrounding an installed PWA mid-request.
 */
function isColdStartError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return COLD_START_STATUSES.has(error.status);
  }
  return error instanceof TypeError;
}

interface UseAuthResult {
  isLoading: boolean;
  isWakingServer: boolean;
  error: string;
  login: (payload: LoginPayload) => Promise<AuthSession | null>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse | null>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setIsWakingServer(false);
    setError("");

    const attempt = async () => {
      const session = await authService.login(payload);
      authStore.setUser(session.user ?? null);
      return session;
    };

    try {
      return await attempt();
    } catch (err) {
      if (!isColdStartError(err)) {
        setError(extractErrorMessage(err, LOGIN_FALLBACK_ERROR));
        return null;
      }

      // Auth-service is booting — poll the warmup endpoint until it answers, then retry.
      setIsWakingServer(true);
      const ready = await waitForServiceReady("auth");
      setIsWakingServer(false);

      if (!ready) {
        setError(SERVER_WAKE_TIMEOUT_ERROR);
        return null;
      }

      try {
        return await attempt();
      } catch (retryErr) {
        setError(extractErrorMessage(retryErr, LOGIN_FALLBACK_ERROR));
        return null;
      }
    } finally {
      setIsLoading(false);
      setIsWakingServer(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError("");

    try {
      return await authService.register(payload);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to create account right now."));
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

  return { isLoading, isWakingServer, error, login, register, logout };
}
