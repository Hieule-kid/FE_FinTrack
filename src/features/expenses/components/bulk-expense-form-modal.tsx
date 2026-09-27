"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { currencyOptions, formatCurrency } from "@/config/currency";
import { createExpenses } from "@/features/expenses/server/expenses.facade";
import type {
  CreateExpensePayload,
  Expense,
  ExpenseCategory,
} from "@/features/expenses/types";
import { formatAmountInput, parseAmountInput } from "@/utils/amount";

const MAX_ROWS = 50;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface BulkRow {
  key: number;
  amount: string;
  categoryId: string;
  spentOn: string;
  note: string;
}

interface BulkExpenseFormModalProps {
  categories: ExpenseCategory[];
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (expenses: Expense[]) => void;
}

export function BulkExpenseFormModal({
  categories,
  defaultCurrency,
  onClose,
  onSaved,
}: BulkExpenseFormModalProps) {
  function makeRow(
    key: number,
    seed?: Pick<BulkRow, "categoryId" | "spentOn">,
  ): BulkRow {
    return {
      key,
      amount: "",
      categoryId: seed?.categoryId ?? categories[0]?.id ?? "",
      spentOn: seed?.spentOn ?? todayIso(),
      note: "",
    };
  }

  const [currency, setCurrency] = useState(defaultCurrency);
  const [rows, setRows] = useState<BulkRow[]>(() => [makeRow(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addRow() {
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      const last = prev[prev.length - 1];
      const nextKey = prev.reduce((max, r) => Math.max(max, r.key), -1) + 1;
      return [
        ...prev,
        makeRow(
          nextKey,
          last
            ? { categoryId: last.categoryId, spentOn: last.spentOn }
            : undefined,
        ),
      ];
    });
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function updateRow(key: number, patch: Partial<BulkRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  const rowErrors = rows.map((row) => {
    const numericAmount = parseAmountInput(row.amount);
    return {
      amount:
        isNaN(numericAmount) || numericAmount < 0.01
          ? "Amount must be at least 0.01"
          : null,
      categoryId: !row.categoryId ? "Pick a category" : null,
      spentOn:
        row.spentOn > todayIso() ? "Date cannot be in the future" : null,
      note: row.note.length > 255 ? "Max 255 characters" : null,
    };
  });
  const hasErrors = rowErrors.some((e) => Object.values(e).some(Boolean));

  const total = rows.reduce(
    (sum, r) => sum + (parseAmountInput(r.amount) || 0),
    0,
  );

  async function handleSubmit() {
    if (hasErrors) return;
    setSaving(true);
    setError("");
    try {
      const payloads: CreateExpensePayload[] = rows.map((row) => ({
        amount: parseAmountInput(row.amount),
        currency,
        categoryId: row.categoryId,
        spentOn: row.spentOn,
        ...(row.note ? { note: row.note } : {}),
      }));
      const result = await createExpenses(payloads);
      if (!result) {
        setError(
          "Something went wrong. None of these expenses were saved. Please check your entries and try again.",
        );
        return;
      }
      onSaved(result);
      onClose();
    } catch {
      setError(
        "Something went wrong. None of these expenses were saved. Please check your entries and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} size="lg" closeOnEsc={!saving}>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <Typography variant="h2">Add multiple expenses</Typography>
        <Typography variant="muted">
          {rows.length} / {MAX_ROWS} rows
        </Typography>
      </div>

      {error && (
        <div className="rounded-lg border border-[#9b1c1c]/30 bg-[#fdecec] px-3 py-2">
          <Typography variant="body-sm" className="text-[#9b1c1c]">
            {error}
          </Typography>
        </div>
      )}

      <Select
        id="bulk-currency"
        label="Currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        options={currencyOptions}
        disabled={saving}
      />

      {/* Mobile: one stacked card per row — a horizontally-scrolling table is
          unusable for form input on a phone. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="border border-(--line) rounded-2xl p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Typography variant="label">Row {i + 1}</Typography>
              <Button
                variant="ghost"
                size="sm"
                disabled={saving || rows.length === 1}
                onClick={() => removeRow(row.key)}
                aria-label="Remove row"
              >
                <Icon type="delete" size={18} />
              </Button>
            </div>
            <Input
              label="Date"
              type="date"
              max={todayIso()}
              value={row.spentOn}
              error={rowErrors[i].spentOn ?? undefined}
              disabled={saving}
              onChange={(e) =>
                updateRow(row.key, { spentOn: e.target.value })
              }
            />
            <Select
              label="Category"
              value={row.categoryId}
              error={rowErrors[i].categoryId ?? undefined}
              disabled={saving}
              onChange={(e) =>
                updateRow(row.key, { categoryId: e.target.value })
              }
              options={categories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
            <Input
              label="Amount"
              type="text"
              inputMode="decimal"
              value={row.amount}
              error={rowErrors[i].amount ?? undefined}
              disabled={saving}
              onChange={(e) =>
                updateRow(row.key, {
                  amount: formatAmountInput(e.target.value),
                })
              }
            />
            <Input
              label="Note (optional)"
              maxLength={255}
              value={row.note}
              error={rowErrors[i].note ?? undefined}
              disabled={saving}
              onChange={(e) => updateRow(row.key, { note: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* Tablet/desktop: spreadsheet-style table with one shared header row */}
      <div className="hidden sm:block border border-(--line) rounded-2xl bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--line)">
              {["Date", "Category", "Amount", "Note", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-(--muted) whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line)">
            {rows.map((row, i) => (
              <tr key={row.key}>
                <td className="px-2 py-2 min-w-36">
                  <Input
                    aria-label="Date"
                    type="date"
                    max={todayIso()}
                    value={row.spentOn}
                    error={rowErrors[i].spentOn ?? undefined}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(row.key, { spentOn: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-2 min-w-40">
                  <Select
                    aria-label="Category"
                    value={row.categoryId}
                    error={rowErrors[i].categoryId ?? undefined}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(row.key, { categoryId: e.target.value })
                    }
                    options={categories.map((c) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                  />
                </td>
                <td className="px-2 py-2 min-w-32">
                  <Input
                    aria-label="Amount"
                    type="text"
                    inputMode="decimal"
                    value={row.amount}
                    error={rowErrors[i].amount ?? undefined}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(row.key, {
                        amount: formatAmountInput(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-2 py-2 min-w-40">
                  <Input
                    aria-label="Note"
                    maxLength={255}
                    value={row.note}
                    error={rowErrors[i].note ?? undefined}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(row.key, { note: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={saving || rows.length === 1}
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove row"
                  >
                    <Icon type="delete" size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <Button
          variant="secondary"
          size="sm"
          disabled={saving || rows.length >= MAX_ROWS}
          onClick={addRow}
          icon={<Icon type="plus-circle" size={14} />}
        >
          Add row
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-3.5">
        <Typography variant="body-sm" className="text-(--muted)">
          {rows.length} {rows.length === 1 ? "expense" : "expenses"} ·{" "}
          {formatCurrency(total, currency)}
        </Typography>
        <div className="flex gap-3">
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
            {saving
              ? "Saving…"
              : `Save all ${rows.length} ${rows.length === 1 ? "expense" : "expenses"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
