import { getPlans } from "@/features/planning/server/planning.facade";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const plans = await getPlans();

  return <DashboardContent plans={plans} />;
}
