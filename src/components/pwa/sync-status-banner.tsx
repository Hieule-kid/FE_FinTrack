"use client";

import { useEffect, useState } from "react";
import { isOnline, subscribeOnlineStatus } from "@/lib/offline/network";
import { startAutoSync } from "@/lib/offline/sync-manager";
import type { SyncProgress } from "@/lib/offline/types";
import { SYNC_PROGRESS_EVENT } from "@/lib/offline/types";

export function SyncStatusBanner() {
  const [online, setOnline] = useState(true);
  const [progress, setProgress] = useState<SyncProgress>({
    status: "idle",
    total: 0,
    completed: 0,
    failed: 0,
    message: "",
  });

  useEffect(() => {
    setOnline(isOnline());
    const stopAutoSync = startAutoSync();
    const unsubOnline = subscribeOnlineStatus(setOnline);

    function onSyncProgress(event: Event) {
      setProgress((event as CustomEvent<SyncProgress>).detail);
    }

    window.addEventListener(SYNC_PROGRESS_EVENT, onSyncProgress);
    return () => {
      stopAutoSync();
      unsubOnline();
      window.removeEventListener(SYNC_PROGRESS_EVENT, onSyncProgress);
    };
  }, []);

  const showOffline = !online;
  const showSync =
    progress.status === "syncing" ||
    progress.status === "error" ||
    progress.status === "conflict";

  if (!showOffline && !showSync) return null;

  const tone =
    progress.status === "conflict"
      ? "bg-[#fff4e5] text-[#8a5c00] border-[#f3d9a5]"
      : progress.status === "error"
        ? "bg-[#ffe4e4] text-[#9b1c1c] border-[#f5bcbc]"
        : !online
          ? "bg-[#eef2ff] text-[#103aac] border-[#c8d4f2]"
          : "bg-[#eef2ff] text-[#103aac] border-[#c8d4f2]";

  const message = showOffline
    ? "Offline mode — changes are saved on this device."
    : progress.message;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 px-4 py-2 text-sm font-medium border-b ${tone}`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        <span>{message}</span>
        {progress.status === "syncing" && progress.total > 0 && (
          <span className="text-xs opacity-80">
            {progress.completed}/{progress.total}
          </span>
        )}
      </div>
    </div>
  );
}
