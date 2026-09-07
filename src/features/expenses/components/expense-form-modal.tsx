"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import {
  createExpense,
  updateExpense,
} from "@/features/expenses/server/expenses.facade";
import type {
  Expense,
  ExpenseCategory,
  ExpenseType,
} from "@/features/expenses/types";
import { formatAmountInput, parseAmountInput } from "@/utils/amount";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface ExpenseFormModalProps {
  /** Present → edit mode; absent → create mode. */
  expense?: Expense | null;
  categories: ExpenseCategory[];
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}

/**
 * Rendered only while open, and re-mounted per target (see the `key` at the call
 * site), so all fields initialise straight from props — no reset effect needed.
 */
export function ExpenseFormModal({
  expense,
  categories,
  defaultCurrency,
  onClose,
  onSaved,
}: ExpenseFormModalProps) {
  const isEdit = Boolean(expense);

  const [amount, setAmount] = useState(
    expense ? formatAmountInput(String(expense.amount)) : "",
  );
  const [currency, setCurrency] = useState(
    expense?.currency ?? defaultCurrency,
  );
  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? categories[0]?.id ?? "",
  );
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? todayIso());
  const [note, setNote] = useState(expense?.note ?? "");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">(
    expense?.expenseType ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numericAmount = parseAmountInput(amount);
  const errors = {
    amount:
      isNaN(numericAmount) || numericAmount < 0.01
        ? "Amount must be at least 0.01"
        : null,
    currency:
      currency.trim().length !== 3 ? "Use a 3-letter currency code" : null,
    categoryId: !categoryId ? "Pick a category" : null,
    spentOn: spentOn > todayIso() ? "Date cannot be in the future" : null,
    note: note.length > 255 ? "Note must not exceed 255 characters" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function handleSubmit() {
    if (hasErrors) return;
    setSaving(true);
    setError("");
    try {
      let result: Expense | null;
      if (expense) {
        result = await updateExpense(expense.id, {
          amount: numericAmount,
          currency: currency.toUpperCase(),
          categoryId,
          spentOn,
          note,
          ...(expenseType ? { expenseType } : {}),
        });
      } else {
        result = await createExpense({
          amount: numericAmount,
          currency: currency.toUpperCase(),
          categoryId,
          spentOn,
          ...(note ? { note } : {}),
        });
      }
      if (!result) {
        setError("Something went wrong. Please try again.");
        return;
      }
      onSaved(result);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} size="md">
      <Typography variant="h2">
        {isEdit ? "Edit expense" : "Record expense"}
      </Typography>

      <div className="grid grid-cols-1 gap-3">
        <Input
          id="expense-amount"
          label="Amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
        />
        <Input
          id="expense-currency"
          label="Currency"
          maxLength={3}
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />
      </div>

      <Select
        id="expense-category"
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categories.map((c) => ({
          label: `${c.name}${c.isSystem ? "" : " (custom)"}`,
          value: c.id,
        }))}
      />

      {isEdit && (
        <Select
          id="expense-type"
          label="Type override"
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
          options={[
            { label: "Fixed", value: "FIXED" },
            { label: "Variable", value: "VARIABLE" },
          ]}
        />
      )}

      <Input
        id="expense-date"
        label="Spent on"
        type="date"
        max={todayIso()}
        value={spentOn}
        onChange={(e) => setSpentOn(e.target.value)}
      />

      <Input
        id="expense-note"
        label="Note (optional)"
        maxLength={255}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {Object.values(errors).filter(Boolean).length > 0 && (
        <ul className="m-0 pl-4 text-xs text-[#9b1c1c]">
          {Object.values(errors)
            .filter(Boolean)
            .map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
        </ul>
      )}
      {error && (
        <Typography variant="body-sm" className="text-[#9b1c1c]">
          {error}
        </Typography>
      )}

      <div className="flex gap-3 justify-end mt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={saving || hasErrors}
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </Modal>
  );
}
