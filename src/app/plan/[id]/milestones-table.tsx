"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { http } from "@/services/http";
import type { Milestone, PlanDetail, ResponsePlanning } from "@/features/planning/types";

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

const IconPencil = <Icon type="edit" size={14} />;
const IconUndo = <Icon type="undo" size={14} />;
const IconCheck = <Icon type="check" size={14} />;

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
  const [undoingId, setUndoingId] = useState<string | null>(null);
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

  async function undoMilestone(milestoneId: string) {
    setUndoingId(milestoneId);
    setError("");
    try {
      const res = await http.post<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${planId}/milestones/${milestoneId}/undo`,
        undefined,
        { useBaseUrl: false },
      );
      if (res.data) {
        setMilestones(res.data.milestones);
        onUpdate?.(res.data);
      }
    } catch {
      setError("Failed to undo milestone. Please try again.");
    } finally {
      setUndoingId(null);
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
              const isUndoing = undoingId === m.id;
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
                            disabled={isCompleting || isUndoing}
                            className="flex items-center gap-1.5 text-sm text-(--muted) hover:text-(--foreground) disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            {IconPencil} Edit
                          </button>
                          {m.status === "COMPLETED" ? (
                            <button
                              onClick={() => undoMilestone(m.id)}
                              disabled={isUndoing}
                              className="flex items-center gap-1.5 text-sm text-(--muted) hover:text-(--foreground) disabled:opacity-60 transition-colors cursor-pointer"
                            >
                              {IconUndo} {isUndoing ? "…" : "Undo"}
                            </button>
                          ) : (
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
