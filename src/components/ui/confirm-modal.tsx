"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Typography } from "@/components/ui/typography";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <Modal onClose={onCancel} size="sm">
      <Typography variant="h2">{title}</Typography>
      <Typography
        variant="muted"
        className="min-w-0 whitespace-pre-line line-clamp-4"
      >
        {message}
      </Typography>
      <div className="flex gap-3 justify-end mt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
