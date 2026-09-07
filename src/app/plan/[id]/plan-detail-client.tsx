"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
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

const IconTarget = <Icon type="target" size={22} />;
const IconDollar = <Icon type="dollar" size={22} />;
const IconTrend = <Icon type="trending-up" size={22} />;
const IconBar = <Icon type="bar-chart" size={22} />;

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
