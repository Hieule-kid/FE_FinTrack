"use client";

import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { PlanCard, PlanCardRow } from "@/components/ui/plan-card";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import { useLanguage } from "@/features/language/hooks/use-language";
import type { Plan } from "@/features/planning/types";
import { DashboardActions } from "./dashboard-actions";

interface DashboardContentProps {
  plans: Plan[];
}

const statIcons = {
  target: (
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
  ),
  active: (
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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  completed: (
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

function isCompleted(plan: Plan) {
  return plan.progressPercent >= 100;
}

export function DashboardContent({ plans }: DashboardContentProps) {
  const { t } = useLanguage();

  const activePlans = plans.filter((p) => !isCompleted(p));
  const completedPlans = plans.filter(isCompleted);
  const totalTarget = plans.reduce(
    (sum: number, p: Plan) => sum + (p.targetAmount ?? 0),
    0,
  );

  const stats = [
    {
      label: t("dashboard.totalTarget"),
      value: new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(totalTarget),
      variant: "blue" as const,
      icon: statIcons.target,
    },
    {
      label: t("dashboard.activePlans"),
      value: String(activePlans.length),
      variant: "green" as const,
      icon: statIcons.active,
    },
    {
      label: t("dashboard.plansCompleted"),
      value: String(completedPlans.length),
      variant: "amber" as const,
      icon: statIcons.completed,
    },
  ];

  return (
    <PageContainer className="grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography as="h1" variant="h1">
            {t("dashboard.title")}
          </Typography>
          <Typography variant="muted" className="mt-1">
            {t("dashboard.subtitle")}
          </Typography>
        </div>
        <DashboardActions />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            variant={s.variant}
          />
        ))}
      </div>

      <section className="grid gap-3.5">
        <Typography as="h2" variant="h2">
          {t("dashboard.yourPlans")}
        </Typography>
        <div className="grid gap-3">
          {activePlans.length === 0 ? (
            <Typography variant="muted">{t("dashboard.noActivePlans")}</Typography>
          ) : (
            activePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                planId={plan.id}
                name={plan.goalTitle}
                frequency={plan.frequency}
                duration={plan.timeframeCategory}
                saved={plan.totalSaved}
                target={plan.targetAmount}
                href={`/plan/${plan.id}`}
              />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-3.5">
        <div className="flex justify-between items-center">
          <Typography as="h2" variant="h2">
            {t("dashboard.completedPlans")}
          </Typography>
          <Link href="#" className="text-brand text-sm font-semibold">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        <div className="grid gap-3">
          {completedPlans.map((plan) => (
            <PlanCardRow
              key={plan.id}
              planId={plan.id}
              name={plan.goalTitle}
              status="completed"
              frequency={plan.frequency}
              duration={plan.timeframeCategory}
              amount={plan.targetAmount}
            />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
