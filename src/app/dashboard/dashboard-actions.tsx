"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/features/language/hooks/use-language";

export function DashboardActions() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
      {/* TODO will handle this in future */}
      {/* <Button
        variant="secondary"
        icon={<Icon type="star" size={15} />}
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
