"use client";

import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { PlanCard, PlanCardRow } from "@/components/ui/plan-card";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";

const stats = [
  {
    label: "Total Target",
    value: "$6,000.00",
    variant: "blue" as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    label: "Active Plans",
    value: "1",
    variant: "green" as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Plans Completed",
    value: "1",
    variant: "amber" as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

const activePlans = [
  {
    id: 1,
    name: "Vacation Fund",
    frequency: "monthly",
    duration: "6 months",
    saved: 0,
    target: 6000,
  },
];

const completedPlans = [
  {
    id: 1,
    name: "Emergency Fund",
    frequency: "monthly",
    duration: "2 years",
    amount: 12000,
  },
];

export default function DashboardPage() {
  return (
    <PageContainer className="grid gap-5">
      <section className="flex justify-between gap-3 items-end">
        <div>
          <Typography as="h1" variant="h1">Dashboard</Typography>
          <Typography variant="muted" className="mt-1">Overview of all your savings plans</Typography>
        </div>
        <Button icon={<span>+</span>}>New Plan</Button>
      </section>

      <div className="grid grid-cols-3 gap-3.5">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} variant={s.variant} />
        ))}
      </div>

      <section className="grid gap-3.5">
        <Typography as="h2" variant="h2">Your Plans</Typography>
        <div className="grid gap-3">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              frequency={plan.frequency}
              duration={plan.duration}
              saved={plan.saved}
              target={plan.target}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3.5">
        <div className="flex justify-between items-center">
          <Typography as="h2" variant="h2">Completed Plans</Typography>
          <Link href="#" className="text-brand text-sm font-semibold">View all →</Link>
        </div>
        <div className="grid gap-3">
          {completedPlans.map((plan) => (
            <PlanCardRow
              key={plan.id}
              name={plan.name}
              status="completed"
              frequency={plan.frequency}
              duration={plan.duration}
              amount={plan.amount}
            />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
