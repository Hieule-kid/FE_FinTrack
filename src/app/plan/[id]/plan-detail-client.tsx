"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import type { PlanDetail } from "@/features/planning/types";
import { MilestonesTable } from "./milestones-table";

function formatCurrency(value: number, currency = "USD") {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const IconTarget = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconDollar = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconTrend = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);
const IconBar = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

interface Props {
  plan: PlanDetail;
}

export function PlanDetailClient({ plan }: Props) {
  const [totalSaved, setTotalSaved] = useState(plan.totalSaved);
  const [remaining, setRemaining] = useState(plan.remaining);
  const [progressPercent, setProgressPercent] = useState(plan.progressPercent);

  function handleUpdate(updated: PlanDetail) {
    setTotalSaved(updated.totalSaved);
    setRemaining(updated.remaining);
    setProgressPercent(updated.progressPercent);
  }

  const stats = [
    {
      label: "Total Target",
      value: formatCurrency(plan.targetAmount, plan.currency),
      icon: IconTarget,
      variant: "blue" as const,
    },
    {
      label: "Total Saved",
      value: formatCurrency(totalSaved, plan.currency),
      icon: IconDollar,
      variant: "green" as const,
      valueClassName: "text-(--ok)",
    },
    {
      label: "Remaining",
      value: formatCurrency(remaining, plan.currency),
      icon: IconTrend,
      variant: "amber" as const,
      valueClassName: "text-(--warn)",
    },
    {
      label: "Progress",
      value: `${progressPercent}%`,
      icon: IconBar,
      variant: "blue" as const,
      valueClassName: "text-(--brand)",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <section className="grid gap-3">
        <Typography as="h2" variant="h2">
          Milestones
        </Typography>
        <MilestonesTable
          planId={plan.id}
          milestones={plan.milestones}
          currency={plan.currency}
          onUpdate={handleUpdate}
        />
      </section>
    </>
  );
}
