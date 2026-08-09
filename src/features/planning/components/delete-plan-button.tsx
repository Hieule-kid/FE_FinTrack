"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/features/planning/server/planning.facade";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const IconTrash = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

interface DeletePlanButtonProps {
  planId: string;
  planName: string;
  /** If provided, navigate here after a successful delete; otherwise refresh the current page. */
  afterDeleteHref?: string;
}

export function DeletePlanButton({
  planId,
  planName,
  afterDeleteHref,
}: DeletePlanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      const ok = await deletePlan(planId);
      if (ok) {
        if (afterDeleteHref) {
          router.push(afterDeleteHref);
        } else {
          router.refresh();
        }
      }
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ui-button ui-button--ghost ui-button--sm delete-plan-btn"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${planName}`}
      >
        {IconTrash}
      </button>
      <ConfirmModal
        open={open}
        title="Delete plan?"
        message={`"${planName}" and all its milestones will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={deleting}
      />
    </>
  );
}
