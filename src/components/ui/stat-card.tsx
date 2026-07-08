import { ReactNode } from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

type StatCardVariant = "blue" | "green" | "amber";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  variant: StatCardVariant;
}

const borderClass: Record<StatCardVariant, string> = {
  blue: "border-[#c3d5ff]",
  green: "border-[#b7e7d0]",
  amber: "border-[#f1ddb6]",
};

const iconClass: Record<StatCardVariant, string> = {
  blue: "bg-[#e8f0ff] text-[var(--brand)]",
  green: "bg-[#e3f7ee] text-[var(--ok)]",
  amber: "bg-[#fef3e0] text-[var(--warn)]",
};

export function StatCard({ label, value, icon, variant }: StatCardProps) {
  return (
    <div className={cn("border rounded-2xl p-4 bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)]", borderClass[variant])}>
      <div className="flex items-center gap-4">
        <span
          className={cn("flex items-center justify-center w-12 h-12 rounded-[14px] shrink-0", iconClass[variant])}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <Typography variant="muted">{label}</Typography>
          <Typography variant="h3" className="mt-1.5 text-[28px] font-bold">{value}</Typography>
        </div>
      </div>
    </div>
  );
}
