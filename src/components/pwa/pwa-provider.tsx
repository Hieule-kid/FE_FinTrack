"use client";

import { useEffect } from "react";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { SyncStatusBanner } from "@/components/pwa/sync-status-banner";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In dev mode unregister every SW so stale cached HTML/chunks from
      // a previous production build don't cause 500s on the dev server.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          void reg.unregister();
        }
      });
      return;
    }

    // In production: remove the legacy stub SW at /sw.js (pre-serwist).
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        const url = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? "";
        if (url.endsWith("/sw.js") && !url.includes("/serwist/")) {
          void reg.unregister();
        }
      }
    });
  }, []);

  return (
    <>
      <SyncStatusBanner />
      {children}
      <PwaInstallBanner />
    </>
  );
}
