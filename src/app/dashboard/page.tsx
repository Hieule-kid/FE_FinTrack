"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { PlanCard, PlanCardRow } from "@/components/ui/plan-card";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import { fetchPlansOfflineFirst } from "@/features/planning/offline/planning-client";
import type { Plan } from "@/features/planning/types";
import { DATA_CHANGED_EVENT } from "@/lib/offline/types";

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

export default function DashboardPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchPlansOfflineFirst();
        setPlans(data);
      } finally {
        setIsLoading(false);
      }
    }

    void load();

    function onDataChanged() {
      void load();
    }

    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, []);

  const activePlans = plans.filter((p) => !isCompleted(p));
  const completedPlans = plans.filter(isCompleted);
  const totalTarget = plans.reduce((sum, p) => sum + (p.targetAmount ?? 0), 0);

  const stats = [
    {
      label: "Total Target",
      value: new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(totalTarget),
      variant: "blue" as const,
      icon: statIcons.target,
    },
    {
      label: "Active Plans",
      value: String(activePlans.length),
      variant: "green" as const,
      icon: statIcons.active,
    },
    {
      label: "Plans Completed",
      value: String(completedPlans.length),
      variant: "amber" as const,
      icon: statIcons.completed,
    },
  ];

  return (
    <PageContainer className="grid gap-5">
      <section className="flex justify-between gap-3 items-end">
        <div>
          <Typography as="h1" variant="h1">
            Dashboard
          </Typography>
          <Typography variant="muted" className="mt-1">
            Overview of all your savings plans
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
            onClick={() => router.push("/plan/ai-generate")}
          >
            AI Generate
          </Button>
          <Button
            icon={<span>+</span>}
            onClick={() => router.push("/plan/create")}
          >
            New Plan
          </Button>
        </div>
      </section>

      {isLoading ? (
        <Typography variant="muted">Loading plans…</Typography>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3.5">
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
              Your Plans
            </Typography>
            <div className="grid gap-3">
              {activePlans.length === 0 ? (
                <Typography variant="muted">No active plans yet.</Typography>
              ) : (
                activePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
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
                Completed Plans
              </Typography>
              <Link href="#" className="text-brand text-sm font-semibold">
                View all →
              </Link>
            </div>
            <div className="grid gap-3">
              {completedPlans.map((plan) => (
                <PlanCardRow
                  key={plan.id}
                  name={plan.goalTitle}
                  status="completed"
                  frequency={plan.frequency}
                  duration={plan.timeframeCategory}
                  amount={plan.targetAmount}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </PageContainer>
  );
}
