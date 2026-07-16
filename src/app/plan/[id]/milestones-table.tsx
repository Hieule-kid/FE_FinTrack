"use client";

import { useState } from "react";
import { http } from "@/services/http";
import type {
  Milestone,
  PlanDetail,
  ResponsePlanning,
} from "@/features/planning/types";

const PLANS_PATH = "/api/planning/api/v1/plans";

function formatCurrency(value: number, currency = "USD") {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-[#fef3d6] text-[#8a5c00]" },
  COMPLETED: { label: "Completed", className: "bg-[#d6f3e6] text-[#006b3f]" },
  MISSED: { label: "Missed", className: "bg-[#ffe4e4] text-[#9b1c1c]" },
};

const IconPencil = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconCheck = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface Props {
  planId: string;
  milestones: Milestone[];
  currency: string;
  onUpdate?: (plan: PlanDetail) => void;
}

export function MilestonesTable({
  planId,
  milestones: initial,
  currency,
  onUpdate,
}: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setEditValue(String(m.actualSaved));
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(milestoneId: string) {
    const actualSaved = parseFloat(editValue);
    if (isNaN(actualSaved) || actualSaved < 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setSavingId(milestoneId);
    setError("");
    try {
      const res = await http.patch<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${planId}/milestones/${milestoneId}`,
        { actualSaved },
        { useBaseUrl: false },
      );
      if (res.data) {
        setMilestones(res.data.milestones);
        onUpdate?.(res.data);
      }
      setEditingId(null);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function completeMilestone(milestoneId: string) {
    setCompletingId(milestoneId);
    setError("");
    try {
      const res = await http.post<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${planId}/milestones/${milestoneId}/complete`,
        undefined,
        { useBaseUrl: false },
      );
      if (res.data) {
        setMilestones(res.data.milestones);
        onUpdate?.(res.data);
      }
    } catch {
      setError("Failed to complete milestone. Please try again.");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] overflow-hidden">
      {error && (
        <p className="px-6 py-2 text-sm text-[#9b1c1c] bg-[#ffe4e4]">{error}</p>
      )}
      <div>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-(--line)">
              {[
                "Period",
                "Target",
                "Actual Saved",
                "Deadline",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3.5 text-left text-xs font-semibold text-(--muted) whitespace-nowrap last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line)">
            {milestones.map((m) => {
              const isEditing = editingId === m.id;
              const isSaving = savingId === m.id;
              const isCompleting = completingId === m.id;
              const cfg = statusConfig[m.status] ?? {
                label: formatLabel(m.status),
                className: "bg-gray-100 text-gray-600",
              };
              return (
                <tr key={m.id} className="hover:bg-[#f8faff] transition-colors">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    {m.timeline}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(m.targetSavings, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 border border-(--brand) rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                        autoFocus
                        min={0}
                        step={0.01}
                      />
                    ) : m.actualSaved > 0 ? (
                      <span className="text-(--ok) font-medium">
                        {formatCurrency(m.actualSaved, currency)}
                      </span>
                    ) : (
                      <span className="text-(--muted)">
                        {formatCurrency(m.actualSaved, currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(m.deadline)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(m.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-(--brand) hover:opacity-90 disabled:opacity-60 transition-opacity px-3.5 py-1.5 rounded-full cursor-pointer"
                          >
                            {IconCheck} {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="text-sm text-(--muted) hover:text-(--foreground) disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(m)}
                            disabled={isCompleting}
                            className="flex items-center gap-1.5 text-sm text-(--muted) hover:text-(--foreground) disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            {IconPencil} Edit
                          </button>
                          {m.status !== "COMPLETED" && (
                            <button
                              onClick={() => completeMilestone(m.id)}
                              disabled={isCompleting}
                              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-(--brand) hover:opacity-90 disabled:opacity-60 transition-opacity px-3.5 py-1.5 rounded-full cursor-pointer"
                            >
                              {IconCheck} {isCompleting ? "…" : "Complete"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
