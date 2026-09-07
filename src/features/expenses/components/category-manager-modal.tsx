"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { createCategory } from "@/features/expenses/server/expenses.facade";
import type { ExpenseCategory, ExpenseType } from "@/features/expenses/types";

interface CategoryManagerModalProps {
  categories: ExpenseCategory[];
  onClose: () => void;
  onCreated: (category: ExpenseCategory) => void;
}

const typeBadge: Record<ExpenseType, string> = {
  FIXED: "bg-[#e8f0ff] text-[var(--brand)]",
  VARIABLE: "bg-[#fef3e0] text-[var(--warn)]",
};

/** Rendered only while open (see the call site), so state starts fresh each time. */
export function CategoryManagerModal({
  categories,
  onClose,
  onCreated,
}: CategoryManagerModalProps) {
  const [name, setName] = useState("");
  const [defaultType, setDefaultType] = useState<ExpenseType>("VARIABLE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmed = name.trim();
  const nameError =
    trimmed.length === 0
      ? null
      : trimmed.length > 50
        ? "Name must not exceed 50 characters"
        : null;

  async function handleCreate() {
    if (!trimmed || nameError) return;
    setSaving(true);
    setError("");
    try {
      const { category, error: apiError } = await createCategory({
        name: trimmed,
        defaultType,
      });
      if (category) {
        onCreated(category);
        setName("");
      } else {
        setError(apiError ?? "Failed to create category.");
      }
    } catch {
      setError("Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} size="md">
      <Typography variant="h2">Expense categories</Typography>

      <ul className="m-0 p-0 list-none grid gap-1.5 max-h-56 overflow-y-auto">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-(--line) px-3 py-2 text-sm"
          >
            <Typography
              as="span"
              variant="body-sm"
              className="font-medium truncate"
            >
              {c.name}
            </Typography>
            <span className="flex items-center gap-2 shrink-0">
              <Typography
                as="span"
                variant="caption"
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeBadge[c.defaultType]}`}
              >
                {c.defaultType === "FIXED" ? "Fixed" : "Variable"}
              </Typography>
              {!c.isSystem && (
                <Typography as="span" variant="caption" className="text-[11px]">
                  custom
                </Typography>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-(--line) pt-4 grid gap-3">
        <Typography variant="h3">Add a category</Typography>
        <Input
          id="category-name"
          label="Name"
          placeholder="e.g. Pet care"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          id="category-type"
          label="Default type"
          value={defaultType}
          onChange={(e) => setDefaultType(e.target.value as ExpenseType)}
          options={[
            {
              label: "Variable — fluctuates period to period",
              value: "VARIABLE",
            },
            { label: "Fixed — predictable recurring cost", value: "FIXED" },
          ]}
        />
        {nameError && (
          <Typography variant="caption" className="text-[#9b1c1c]">
            {nameError}
          </Typography>
        )}
        {error && (
          <Typography variant="body-sm" className="text-[#9b1c1c]">
            {error}
          </Typography>
        )}
      </div>

      <div className="flex gap-3 justify-end mt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={saving}
        >
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreate}
          disabled={saving || !trimmed || Boolean(nameError)}
        >
          {saving ? "Adding…" : "Add category"}
        </Button>
      </div>
    </Modal>
  );
}
