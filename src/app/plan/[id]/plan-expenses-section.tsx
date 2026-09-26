"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import {
  getPlanExpenseSummary,
  listExpenses,
} from "@/features/expenses/server/expenses.facade";
import type { Expense, PlanExpenseSummary } from "@/features/expenses/types";

function formatCurrency(value: number, currency = "USD") {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  planId: string;
  currency: string;
}

/**
 * Read-only rollup of expenses linked to this plan. Purely informational — it
 * does not feed into the plan's own totalSaved/remaining/progress figures,
 * which stay driven by manual milestone entries.
 */
export function PlanExpensesSection({ planId, currency }: Props) {
  const [summary, setSummary] = useState<PlanExpenseSummary | null>(null);
  const [recent, setRecent] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryResult, recentPage] = await Promise.all([
          getPlanExpenseSummary(planId),
          listExpenses({ planId, page: 0, size: 5 }),
        ]);
        if (cancelled) return;
        if (!summaryResult) {
          setError("Couldn't load spending for this goal.");
          return;
        }
        setSummary(summaryResult);
        setRecent(recentPage?.content ?? []);
      } catch {
        if (!cancelled) setError("Couldn't load spending for this goal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const heading = (
    <Typography as="h2" variant="h2">
      Spending against this goal
    </Typography>
  );

  if (loading) {
    return (
      <section className="grid gap-3">
        {heading}
        <Typography variant="muted">Loading…</Typography>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="grid gap-3">
        {heading}
        <Typography variant="body-sm" className="text-[#9b1c1c]">
          {error || "Couldn't load spending for this goal."}
        </Typography>
      </section>
    );
  }

  const hasLinkedExpenses =
    summary.expenseCount > 0 || summary.excludedCount > 0;

  if (!hasLinkedExpenses) {
    return (
      <section className="grid gap-3">
        {heading}
        <div className="border border-(--line) rounded-2xl bg-white p-5">
          <Typography variant="muted">
            No expenses are linked to this goal yet. Link one when recording an{" "}
            <Link href="/expenses" className="text-(--brand) font-semibold">
              expense
            </Link>
            .
          </Typography>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        {heading}
        <Link
          href={`/expenses?planId=${planId}`}
          className="text-sm text-(--brand) font-semibold shrink-0"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <StatCard
          label="Total spent"
          value={formatCurrency(summary.totalSpent, currency)}
          icon={<Icon type="wallet" size={22} />}
          variant="amber"
        />
        <StatCard
          label="Linked expenses"
          value={String(summary.expenseCount)}
          icon={<Icon type="folder" size={22} />}
          variant="blue"
        />
      </div>

      {summary.excludedCount > 0 && (
        <Typography variant="caption" className="text-(--muted)">
          {summary.excludedCount} expense
          {summary.excludedCount === 1 ? "" : "s"} recorded in a different
          currency {summary.excludedCount === 1 ? "isn't" : "aren't"} included
          in the total above.
        </Typography>
      )}

      {recent.length === 0 ? (
        <Typography variant="caption" className="text-(--muted)">
          No linked expenses in the last 30 days.
        </Typography>
      ) : (
        <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--line)">
                {["Date", "Note", "Amount"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-(--muted) whitespace-nowrap last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--line)">
              {recent.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 whitespace-nowrap font-medium">
                    {formatDate(e.spentOn)}
                  </td>
                  <td className="px-5 py-3 max-w-60 truncate text-(--muted)">
                    {e.note || "—"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-semibold text-right">
                    {formatCurrency(e.amount, e.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
