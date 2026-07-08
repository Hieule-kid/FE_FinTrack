import { PageContainer } from "@/components/common/page-container";

export default function DashboardLoading() {
  return (
    <PageContainer className="grid gap-5">
      <div className="h-[86px] rounded-[14px] bg-[linear-gradient(90deg,#e4ebff_0%,#f3f7ff_45%,#e4ebff_100%)] bg-[length:220%_100%] animate-[shimmer_1.2s_linear_infinite]" />
      <div className="grid grid-cols-3 gap-2.5">
        <div className="h-[86px] rounded-[14px] bg-[linear-gradient(90deg,#e4ebff_0%,#f3f7ff_45%,#e4ebff_100%)] bg-[length:220%_100%] animate-[shimmer_1.2s_linear_infinite]" />
        <div className="h-[86px] rounded-[14px] bg-[linear-gradient(90deg,#e4ebff_0%,#f3f7ff_45%,#e4ebff_100%)] bg-[length:220%_100%] animate-[shimmer_1.2s_linear_infinite]" />
        <div className="h-[86px] rounded-[14px] bg-[linear-gradient(90deg,#e4ebff_0%,#f3f7ff_45%,#e4ebff_100%)] bg-[length:220%_100%] animate-[shimmer_1.2s_linear_infinite]" />
      </div>
      <div className="min-h-[260px] mt-3 rounded-[14px] bg-[linear-gradient(90deg,#e4ebff_0%,#f3f7ff_45%,#e4ebff_100%)] bg-[length:220%_100%] animate-[shimmer_1.2s_linear_infinite]" />
    </PageContainer>
  );
}
