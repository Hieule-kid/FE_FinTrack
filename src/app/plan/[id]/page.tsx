import { getPlan } from "@/features/planning/server/planning.facade";
import { PlanDetailLoader } from "./plan-detail-loader";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id).catch(() => null);

  return <PlanDetailLoader id={id} initialPlan={plan} />;
}
