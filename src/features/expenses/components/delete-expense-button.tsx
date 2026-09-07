"use client";

import { useState } from "react";
import { deleteExpense } from "@/features/expenses/server/expenses.facade";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Icon } from "@/components/ui/icon";

interface DeleteExpenseButtonProps {
  expenseId: string;
  label: string;
  onDeleted: (expenseId: string) => void;
}

export function DeleteExpenseButton({
  expenseId,
  label,
  onDeleted,
}: DeleteExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      const ok = await deleteExpense(expenseId);
      if (ok) onDeleted(expenseId);
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
      >
        <Icon type="delete" size={15} color='#c0392b'/>
      </Button>
      <ConfirmModal
        open={open}
        title="Delete expense?"
        message={`"${label}" will be removed from your expense history. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={deleting}
      />
    </>
  );
}
