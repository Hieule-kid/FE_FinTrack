import {
  getPlans,
  getPlanSummary,
} from "@/features/planning/server/planning.facade";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Independent requests, so fetch in parallel. A failed summary must not break the plan list:
  // it degrades to `null`, which the summary cards render as "--" with a retry.
  const [plans, summary] = await Promise.all([
    getPlans(),
    getPlanSummary().catch(() => null),
  ]);

  return <DashboardContent plans={plans} summary={summary} />;
}
