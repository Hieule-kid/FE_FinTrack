import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { PlanOverview } from "@/features/dashboard/plan-overview";

export default function DashboardPage() {
  return (
    <PageContainer className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Overview of all your savings plans</h1>
        </div>
        <Button>+ New Plan</Button>
      </section>

    </PageContainer>
  );
}
