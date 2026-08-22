"use client";

import { useEffect, useState } from "react";
import { authService } from "@/features/auth/service";
import type { AuthUser } from "@/features/auth/types";

const PROFILE_CACHE_KEY = "fintrack_profile";

export function getCachedProfile(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: AuthUser): void {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // sessionStorage unavailable (SSR, private mode quota)
  }
}

export function clearCachedProfile(): void {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // ignore
  }
}

interface UseProfileResult {
  profile: AuthUser | null;
  isLoading: boolean;
  error: string;
  setProfile: (profile: AuthUser) => void;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve(getCachedProfile()).then((cached) => {
      if (cancelled) return;

      if (cached !== null) {
        setProfile(cached);
        setIsLoading(false);
        return;
      }

      authService
        .profile()
        .then((data) => {
          if (!cancelled) {
            const user = (data as unknown as { data: AuthUser }).data ?? (data as unknown as AuthUser);
            setProfile(user);
            setCachedProfile(user);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Failed to load profile.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, isLoading, error, setProfile };
}