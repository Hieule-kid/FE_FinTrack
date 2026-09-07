"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  /** Called on backdrop click and (unless disabled) on Escape. */
  onClose: () => void;
  children: ReactNode;
  /** Card max-width. Defaults to `"md"`. */
  size?: "sm" | "md";
  /** Close when Escape is pressed. Defaults to `true`. */
  closeOnEsc?: boolean;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

/**
 * Centered overlay dialog: fixed backdrop, click-outside to close, optional
 * Escape-to-close, and a scrollable white card. The card is a `flex flex-col`,
 * so children stack with consistent spacing and the card height tracks content.
 */
export function Modal({
  onClose,
  children,
  size = "md",
  closeOnEsc = true,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, closeOnEsc]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${sizeClass[size]} mx-4 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
