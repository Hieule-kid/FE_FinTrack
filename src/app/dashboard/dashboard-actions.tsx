"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/features/language/hooks/use-language";

const IconStar = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export function DashboardActions() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
      {/* TODO will handle this in future */}
      {/* <Button
        variant="secondary"
        icon={IconStar}
        onClick={() => router.push("/plan/ai-generate")}
      >
        {t("dashboard.buttonGenerateAI")}
      </Button> */}
      <Button icon={<span>+</span>} onClick={() => router.push("/plan/create")}>
        {t("dashboard.newPlan")}
      </Button>
    </div>
  );
}
