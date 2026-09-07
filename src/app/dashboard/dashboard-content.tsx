"use client";

import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { Icon } from "@/components/ui/icon";
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
  target: <Icon type="target" size={22} />,
  active: <Icon type="folder" size={22} />,
  completed: <Icon type="check-circle" size={22} />,
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
