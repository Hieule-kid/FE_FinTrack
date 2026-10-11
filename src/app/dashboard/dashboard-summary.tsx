"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import { formatCurrencyCompact } from "@/config/currency";
import { useLanguage } from "@/features/language/hooks/use-language";
import type { CurrencySummary } from "@/features/planning/types";

interface DashboardSummaryProps {
  /** Server-computed totals across ALL plans. `null` means the summary request failed. */
  summary: CurrencySummary[] | null;
}

const PLACEHOLDER = "--";

const icons = {
  target: <Icon type="target" size={22} />,
  active: <Icon type="folder" size={22} />,
  completed: <Icon type="check-circle" size={22} />,
};

/**
 * Totals come from the server summary, never from the (possibly paged) plan list, and money is
 * never combined across currencies: each currency gets its own row of cards.
 */
export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  const failed = summary === null;
  const rows = summary ?? [];

  const planCount = rows.reduce((sum, r) => sum + r.planCount, 0);
  const completedCount = rows.reduce((sum, r) => sum + r.completedPlanCount, 0);

  const money = (value: string, currency: string) =>
    failed ? PLACEHOLDER : formatCurrencyCompact(value, currency);

  // No plans yet: one row of zeros rather than an empty gap. Failed: one row of placeholders.
  const moneyRows: CurrencySummary[] =
    rows.length > 0
      ? rows
      : [
          {
            currency: "USD",
            planCount: 0,
            completedPlanCount: 0,
            totalTarget: "0",
            totalSaved: "0",
            remaining: "0",
          },
        ];

  return (
    <div className="grid gap-3.5">
      {moneyRows.map((row) => (
        <div
          key={row.currency}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
        >
          <StatCard
            label={t("dashboard.totalTarget")}
            value={money(row.totalTarget, row.currency)}
            icon={icons.target}
            variant="blue"
          />
          <StatCard
            label={t("dashboard.totalSavings")}
            value={money(row.totalSaved, row.currency)}
            icon={icons.completed}
            variant="green"
          />
          <StatCard
            label={t("dashboard.remaining")}
            value={money(row.remaining, row.currency)}
            icon={icons.active}
            variant="amber"
          />
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <StatCard
          label={t("dashboard.activePlans")}
          value={failed ? PLACEHOLDER : String(planCount - completedCount)}
          icon={icons.active}
          variant="green"
        />
        <StatCard
          label={t("dashboard.plansCompleted")}
          value={failed ? PLACEHOLDER : String(completedCount)}
          icon={icons.completed}
          variant="amber"
        />
      </div>

      {failed && (
        <div className="flex items-center gap-3" role="alert">
          <Typography variant="muted">
            {t("dashboard.summaryUnavailable")}
          </Typography>
          <Button
            variant="secondary"
            size="sm"
            disabled={isRetrying}
            onClick={() => startRetry(() => router.refresh())}
          >
            {t("dashboard.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
