import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Typography } from "@/components/ui/typography";
import { getPlan } from "@/features/planning/server/planning.facade";
import { PlanDetailClient } from "./plan-detail-client";

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

const IconRefresh = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();

  return (
    <PageContainer className="grid gap-6">
      {/* Header */}
      <section className="grid gap-1">
        <Link
          href="/dashboard"
          className="text-sm text-(--brand) font-semibold w-fit"
        >
          ← Back to Dashboard
        </Link>
        <Typography as="h1" variant="h1" className="mt-2">
          {plan.goalTitle}
        </Typography>
        <Typography variant="muted">
          {formatLabel(plan.frequency)} · {plan.durationInMonths} months ·
          Started {formatDate(plan.startDate)}
        </Typography>
      </section>

      <PlanDetailClient plan={plan} />

      {/* Recalculate toggle */}
      <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-(--muted) shrink-0">{IconRefresh}</span>
          <div>
            <Typography variant="label">
              Recalculate remaining schedule on missed deadlines
            </Typography>
            <Typography variant="caption" className="mt-0.5">
              Distribute overdue amounts equally across future milestones
            </Typography>
          </div>
        </div>
        <Toggle enabled={plan.recalculateOnMissedDeadline} />
      </div>
    </PageContainer>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${enabled ? "bg-(--brand)" : "bg-[#d1d5db]"}`}
      aria-label={enabled ? "On" : "Off"}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  );
}
