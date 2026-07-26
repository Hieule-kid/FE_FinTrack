"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isOnline, subscribeOnlineStatus } from "@/lib/offline/network";
import { startAutoSync } from "@/lib/offline/sync-manager";
import type { SyncProgress } from "@/lib/offline/types";
import { SYNC_PROGRESS_EVENT } from "@/lib/offline/types";

export function SyncStatusBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(true);
  const [progress, setProgress] = useState<SyncProgress>({
    status: "idle",
    total: 0,
    completed: 0,
    failed: 0,
    message: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    progress.status === "conflict" ||
    progress.status === "auth_required";

  const visible = showOffline || showSync;

  // Push body content down by the banner's actual rendered height so the fixed
  // banner never overlaps the header. ResizeObserver handles text-wrap on narrow
  // screens where the banner grows taller than one line.
  useLayoutEffect(() => {
    const el = bannerRef.current;
    if (!el) {
      document.body.style.paddingTop = "";
      return;
    }

    const sync = () => {
      document.body.style.paddingTop = `${el.offsetHeight}px`;
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.body.style.paddingTop = "";
    };
  }, [visible]);

  if (!visible) return null;

  const tone =
    progress.status === "auth_required"
      ? "bg-[#fff0f5] text-[#9b0028] border-[#f5c0ce]"
      : progress.status === "conflict"
        ? "bg-[#fff4e5] text-[#8a5c00] border-[#f3d9a5]"
        : progress.status === "error"
          ? "bg-[#ffe4e4] text-[#9b1c1c] border-[#f5bcbc]"
          : "bg-[#eef2ff] text-[#103aac] border-[#c8d4f2]";

  const message = showOffline
    ? "Offline — changes are saved on this device."
    : progress.message;

  return (
    <div
      ref={bannerRef}
      className={`fixed top-0 inset-x-0 z-50 px-4 py-2.5 text-sm font-medium border-b ${tone}`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-400 mx-auto flex items-center justify-between gap-3">
        <span className="leading-snug">{message}</span>
        {progress.status === "auth_required" && (
          <Link
            href="/login"
            className="text-xs font-semibold underline underline-offset-2 shrink-0 hover:opacity-80"
          >
            Log in
          </Link>
        )}
        {progress.status === "syncing" && progress.total > 0 && (
          <span className="text-xs opacity-80 shrink-0">
            {progress.completed}/{progress.total}
          </span>
        )}
      </div>
    </div>
  );
}
