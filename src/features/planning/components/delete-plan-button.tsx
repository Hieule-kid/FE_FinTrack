"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/features/planning/server/planning.facade";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Icon } from "@/components/ui/icon";

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
        <Icon type="delete" size={15} />
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
