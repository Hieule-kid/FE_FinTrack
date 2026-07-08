import { PageContainer } from "./page-container";

export function Footer() {
  return (
    <footer className="border-t border-(--line) bg-[#f6f8ff]">
      <PageContainer className="flex justify-between gap-2 text-muted text-[13px] py-4">
        <p>FinPlan workspace for smarter saving plans.</p>
      </PageContainer>
    </footer>
  );
}
