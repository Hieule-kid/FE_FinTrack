import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { DeletePlanButton } from "@/features/planning/components/delete-plan-button";

type PlanStatus = "active" | "completed" | "paused";

interface PlanCardProps {
  planId: string;
  name: string;
  frequency: string;
  duration: string;
  saved: number;
  target: number;
  href?: string;
}

interface PlanCardRowProps {
  planId: string;
  name: string;
  status: PlanStatus;
  frequency: string;
  duration: string;
  amount: number;
  href?: string;
}

function formatLabel(value: string) {
  return value.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

const statusConfig: Record<PlanStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-[#e4ebff] text-(--brand-strong)" },
  completed: { label: "Completed", className: "bg-[#d6f3e6] text-[#006b3f]" },
  paused:    { label: "Paused",    className: "bg-[#fef3d6] text-[#8a5c00]" },
};

export function PlanCardRow({ planId, name, status, frequency, duration, amount, href = "#" }: PlanCardRowProps) {
  const { label, className: badgeClass } = statusConfig[status];

  return (
    <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] flex flex-col gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 sm:gap-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Typography as="h3" variant="title" className="truncate">{name}</Typography>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
            {label}
          </span>
        </div>
        <Typography variant="muted" className="mt-1">{formatLabel(frequency)} · {formatLabel(duration)}</Typography>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6 shrink-0">
        <Typography as="p" variant="body" className="text-(--ok) text-[22px] font-bold">
          {formatCurrency(amount)}
        </Typography>
        <div className="flex items-center gap-2">
          <DeletePlanButton planId={planId} planName={name} />
          <Link href={href} className="text-(--brand) text-sm font-semibold whitespace-nowrap">
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PlanCard({ planId, name, frequency, duration, saved, target, href = "#" }: PlanCardProps) {
  const pct = target > 0 ? Math.round((saved / target) * 100) : 0;

  return (
    <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] grid gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <div>
        <Typography as="h3" variant="title">{name}</Typography>
        <Typography variant="muted" className="mt-1">{formatLabel(frequency)} · {formatLabel(duration)}</Typography>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <Typography variant="caption">Saved</Typography>
          <Typography as="p" variant="body" className="mt-1 text-(--ok) text-[22px] font-bold">{formatCurrency(saved)}</Typography>
        </div>
        <div className="text-right">
          <Typography variant="caption">Target</Typography>
          <Typography as="p" variant="body" className="mt-1 text-[22px] font-bold">{formatCurrency(target)}</Typography>
        </div>
      </div>
      <div className="h-1.5 bg-[#e4ebff] rounded-full overflow-hidden">
        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between items-center">
        <Typography variant="caption">{pct}% complete</Typography>
        <div className="flex items-center gap-3">
          <DeletePlanButton planId={planId} planName={name} />
          <Link href={href} className="text-brand text-sm font-semibold">View details →</Link>
        </div>
      </div>
    </div>
  );
}
