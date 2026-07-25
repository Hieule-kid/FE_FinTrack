"use client";

import { useEffect, useState } from "react";

const BANNER_STORAGE_KEY = "hide_pwa_banner";
const BANNER_HIDE_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isBannerHidden(): boolean {
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) return false;
    const hiddenUntil = Number(raw);
    return Date.now() < hiddenUntil;
  } catch {
    return false;
  }
}

function hideBannerForDays(days: number) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(BANNER_STORAGE_KEY, String(until));
  } catch {
    // ignore storage errors
  }
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"install" | "ios">("install");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || isBannerHidden()) return;

    if (isIosSafari()) {
      setMode("ios");
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("install");
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    hideBannerForDays(BANNER_HIDE_DAYS);
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-(--line) bg-white/95 backdrop-blur shadow-[0_12px_40px_rgba(17,38,99,0.15)] p-4 grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[15px] text-(--text-main)">Install FinTrack</p>
            <p className="text-sm text-(--text-muted) mt-1">
              {mode === "ios"
                ? "Add FinTrack to your Home Screen for a native app experience and offline access."
                : "Install the app on your device for faster access and offline financial planning."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="text-(--text-muted) hover:text-(--text-main) text-lg leading-none px-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {mode === "ios" ? (
          <p className="text-sm text-(--text-main) bg-[#f5f7ff] rounded-xl px-3 py-2.5 leading-relaxed">
            Tap <strong>Share</strong> at the bottom of Safari, then choose{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            className="w-full rounded-full bg-(--brand) text-white font-semibold text-sm py-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Install app
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="text-sm text-(--text-muted) hover:text-(--text-main) cursor-pointer"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
