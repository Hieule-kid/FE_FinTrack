"use client";

import { useEffect } from "react";
import { warmupServices, type WarmupService } from "@/services/warmup";

/**
 * Fires cold-start warmup pings for the given services on mount, and again whenever the
 * tab becomes visible after being hidden. Fire-and-forget: throttling and de-duping live
 * in `warmupServices`, and failures never surface to the UI.
 *
 * Intended for first-touch public pages (the login form) so Render's free-tier services
 * start booting before the user needs them.
 */
export function useServiceWarmup(services: WarmupService[]): void {
  // Stable key so the effect doesn't re-run on every render from a new array identity.
  const key = services.join(",");

  useEffect(() => {
    const trigger = () => {
      void warmupServices(services);
    };

    trigger();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        trigger();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
