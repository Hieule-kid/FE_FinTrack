import { PageContainer } from "@/components/common/page-container";

export default function DashboardLoading() {
  return (
    <PageContainer className="dashboard-page">
      <div className="loading-block" />
      <div className="loading-grid">
        <div className="loading-block" />
        <div className="loading-block" />
        <div className="loading-block" />
      </div>
      <div className="loading-panel" />
    </PageContainer>
  );
}
