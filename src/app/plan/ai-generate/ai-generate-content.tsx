"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useLanguage } from "@/features/language/hooks/use-language";
import {
  generateAiPlan,
  createPlan,
} from "@/features/planning/server/planning.facade";
import type { AiGenerateResponse, AiGenerateCategoryItem } from "@/features/planning/types";

type Currency = "VND" | "USD";
type Step = "input" | "result";

const CATEGORY_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const PLAN_CATEGORIES = [
  { id: "EMERGENCY", labelKey: "aiPlanGeneration.categories.emergency" },
  { id: "TRAVEL", labelKey: "aiPlanGeneration.categories.travel" },
  { id: "HOUSE", labelKey: "aiPlanGeneration.categories.house" },
  { id: "CAR", labelKey: "aiPlanGeneration.categories.car" },
  { id: "EDUCATION", labelKey: "aiPlanGeneration.categories.education" },
  { id: "WEDDING", labelKey: "aiPlanGeneration.categories.wedding" },
  { id: "RETIREMENT", labelKey: "aiPlanGeneration.categories.retirement" },
  { id: "OTHER", labelKey: "aiPlanGeneration.categories.business" },
];

const PROMPT_SUGGESTIONS = [
  { key: "aiPlanGeneration.suggestedPrompts", label: "I earn 20 million VND per month. I want to save for a vacation in 6 months." },
  { key: "aiPlanGeneration.suggestedPrompts", label: "I earn 15 million VND/month. Help me plan to save for a house down payment over 3 years." },
  { key: "aiPlanGeneration.suggestedPrompts", label: "I want to save 50 million VND for an emergency fund in 12 months. My income is 25 million VND." },
];

function formatDisplay(value: number, currency: Currency): string {
  if (currency === "VND") return Math.round(value).toLocaleString("vi-VN");
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeframeForMonths(months: number): string {
  if (months <= 11) return "SHORT_TERM";
  if (months <= 60) return "MID_TERM";
  return "LONG_TERM";
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number, cy: number, rOuter: number, rInner: number,
  startAngle: number, endAngle: number,
): string {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function DonutChart({
  categories,
  savingsLabel,
}: {
  categories: AiGenerateCategoryItem[];
  savingsLabel: string;
}) {
  const cx = 100, cy = 100, rOuter = 84, rInner = 52;
  const total = categories.reduce((s, c) => s + c.percentage, 0) || 1;
  let angle = 0;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
      {categories.map((cat, i) => {
        const sweep = (cat.percentage / total) * 360;
        const start = angle;
        const end = angle + sweep - 1.5;
        angle += sweep;
        return (
          <path
            key={cat.name}
            d={donutSlicePath(cx, cy, rOuter, rInner, start, end)}
            fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
          />
        );
      })}
      <text x="100" y="93" textAnchor="middle" fontSize="10.5" fill="#64748b" fontFamily="system-ui, sans-serif">
        savings/mo
      </text>
      <text x="100" y="112" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1e293b" fontFamily="system-ui, sans-serif">
        {savingsLabel}
      </text>
    </svg>
  );
}

function Spinner() {
  return (
    <Icon type="spinner" size={16} className="animate-spin" />
  );
}

export function AiGeneratePlanContent() {
  const router = useRouter();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const currency = (profile?.currency ?? "VND") as Currency;

  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiGenerateResponse | null>(null);

  const [goalTitle, setGoalTitle] = useState("");
  const [planCategory, setPlanCategory] = useState("OTHER");
  const [duration, setDuration] = useState(6);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateAiPlan(prompt.trim());
      setAiResult(result);
      const term = (result.term ?? "").toUpperCase();
      setDuration(term === "ANNUALLY" ? 12 : 6);
      setGoalTitle("");
      setPlanCategory("OTHER");
      setStep("result");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCreatePlan() {
    if (!aiResult) return;

    const savingsCat = aiResult.categories.find((c) => /sav|invest/i.test(c.name));
    const requiredPerPeriod = savingsCat?.amount ?? 0;
    const targetAmount = requiredPerPeriod * duration;

    const today = new Date();
    const startDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const payload = {
      goalTitle: goalTitle || undefined,
      targetAmount,
      currency: aiResult.currency || currency,
      planCategory: planCategory || undefined,
      durationInMonths: duration,
      durationInYears: Math.max(1, Math.round(duration / 12)),
      timeframeCategory: timeframeForMonths(duration),
      frequency: (aiResult.term ?? "MONTHLY").toUpperCase(),
      requiredPerPeriod,
      startDate,
      userId: profile?.id,
    };

    setIsCreating(true);
    setCreateError(null);
    try {
      const result = await createPlan(payload);
      if (!result) {
        setCreateError("Failed to create plan. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setCreateError("Failed to create plan. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  if (step === "input") {
    return (
      <PageContainer className="flex flex-col items-center py-10 gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-18 h-18 rounded-[20px] flex items-center justify-center"
            style={{ background: "linear-gradient(145deg, #f0e8ff 0%, #e2d5ff 100%)" }}
          >
            <Icon type="star" size={36} color="#7c3aed" />
          </div>
          <div>
            <Typography as="h1" variant="h1" className="text-[28px]">{t("aiPlanGeneration.title")}</Typography>
            <Typography variant="muted" className="mt-1 text-body">
              {t("aiPlanGeneration.subtitle")}
            </Typography>
          </div>
        </div>

        <Card className="w-full max-w-155 flex flex-col gap-5 p-7">
          {/* Suggestions */}
          <div className="flex flex-col gap-2">
            <Typography as="label" variant="label">{t("aiPlanGeneration.suggestedPrompts")}</Typography>
            <div className="flex flex-col gap-2">
              {PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setPrompt(s.label)}
                  className="text-left text-[13px] text-(--brand) bg-[#eef3ff] hover:bg-[#e0e9ff] border border-[#c8d4f2] rounded-xl px-3.5 py-2.5 transition-colors duration-150 leading-snug"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#e2e8f0]" />
            <Typography variant="caption" className="text-[12px] shrink-0">or write your own</Typography>
            <div className="flex-1 h-px bg-[#e2e8f0]" />
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-1.5">
            <textarea
              rows={4}
              placeholder={t("aiPlanGeneration.promptPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full resize-none rounded-xl border border-[#c8d4f2] bg-white px-4 py-3 text-body placeholder:text-(--text-muted) focus:outline-none focus:border-(--brand) transition-colors"
            />
            <Typography variant="caption" className="text-right">{prompt.length} chars</Typography>
          </div>

          {generateError && (
            <p className="text-[13px] text-red-500 text-center m-0">{generateError}</p>
          )}

          <Button
            type="button"
            variant="primary"
            className="w-full justify-center py-3.5 text-body"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {t("common.loading")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Icon type="star" size={16} />
                {t("aiPlanGeneration.buttonGenerate")}
              </span>
            )}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const savingsCat = aiResult?.categories.find((c) => /sav|invest/i.test(c.name));
  const requiredPerPeriod = savingsCat?.amount ?? 0;
  const targetAmount = requiredPerPeriod * duration;
  const savingsLabel = requiredPerPeriod
    ? formatDisplay(requiredPerPeriod, (aiResult?.currency ?? currency) as Currency)
    : "—";

  return (
    <PageContainer className="flex flex-col items-center py-10 gap-6">
      {/* Back link */}
      <div className="w-full max-w-155">
        <button
          type="button"
          onClick={() => setStep("input")}
          className="flex items-center gap-1.5 text-[14px] text-(--text-muted) hover:text-(--brand) transition-colors"
        >
          <Icon type="chevron-left" size={16} />
          {t("aiPlanGeneration.buttonBack")}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <Typography as="h1" variant="h1" className="text-[24px]">{t("aiPlanGeneration.savingsPlanSummary")}</Typography>
        <Typography variant="muted" className="text-[14px] max-w-120">
          {t("aiPlanGeneration.subtitle", "Review the breakdown, adjust if needed, then create your savings plan.")}
        </Typography>
      </div>

      {/* AI Advice */}
      {aiResult?.aiAdvice && (
        <div
          className="w-full max-w-155 rounded-2xl p-5 border border-[#c4b5fd]"
          style={{ background: "linear-gradient(135deg, #f0e8ff 0%, #e6d9ff 100%)" }}
        >
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <Icon type="star" size={18} color="#7c3aed" />
            </div>
            <p className="text-[14px] text-[#5b21b6] leading-relaxed m-0">{aiResult.aiAdvice}</p>
          </div>
        </div>
      )}

      {/* Budget Breakdown */}
      <Card className="w-full max-w-155 flex flex-col gap-5 p-7">
        <Typography as="h2" variant="h2" className="text-[17px]">Budget Breakdown</Typography>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {aiResult && (
            <div className="shrink-0">
              <DonutChart
                categories={aiResult.categories}
                savingsLabel={savingsLabel}
              />
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-col gap-3.5 flex-1 w-full">
            {aiResult?.categories.map((cat, i) => (
              <div key={cat.name} className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold">{cat.name}</span>
                    <span className="text-[13px] font-bold shrink-0" style={{ color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="text-[13px] text-(--text-muted)">
                    {formatDisplay(cat.amount, (aiResult.currency ?? currency) as Currency)} {aiResult.currency ?? currency}
                  </div>
                  <div className="text-[12px] text-(--text-muted) mt-0.5 leading-snug">{cat.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
          <Typography variant="label" className="text-[14px]">Total Monthly Budget</Typography>
          <span className="text-[16px] font-bold">
            {formatDisplay(aiResult?.totalBudget ?? 0, (aiResult?.currency ?? currency) as Currency)}{" "}
            {aiResult?.currency ?? currency}
          </span>
        </div>
      </Card>

      {/* Plan details — editable */}
      <Card className="w-full max-w-155 flex flex-col gap-5 p-7">
        <Typography as="h2" variant="h2" className="text-[17px]">Plan Details</Typography>

        {/* Savings spotlight */}
        <div
          className="flex items-center justify-between rounded-xl p-4 gap-3"
          style={{ background: "linear-gradient(135deg, #eef3ff 0%, #e6eeff 100%)" }}
        >
          <div>
            <div className="text-[12px] text-(--brand) font-medium uppercase tracking-wide">{t("aiPlanGeneration.savingsPlanSummary")}</div>
            <div className="text-[24px] font-bold text-(--brand) leading-tight">
              {savingsLabel}{" "}
              <span className="text-body font-semibold">{aiResult?.currency ?? currency}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[12px] text-(--text-muted)">over {duration} months</div>
            <div className="text-body font-semibold">
              = {formatDisplay(targetAmount, (aiResult?.currency ?? currency) as Currency)}{" "}
              {aiResult?.currency ?? currency}
            </div>
          </div>
        </div>

        {/* Goal Title */}
        <Input
          id="ai-goal-title"
          label={t("aiPlanGeneration.goalTitleLabel")}
          type="text"
          placeholder="e.g. Vacation Fund"
          maxLength={50}
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
        />

        {/* Goal Category */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">{t("aiPlanGeneration.planCategoryLabel")}</Typography>
          <div className="grid grid-cols-4 gap-2">
            {PLAN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPlanCategory(cat.id)}
                className={cn(
                  "py-2.5 px-2 rounded-xl border text-[12px] font-semibold transition-all duration-150",
                  planCategory === cat.id
                    ? "border-(--brand) bg-[#eef3ff] text-(--brand)"
                    : "border-[#e2e8f0] bg-white text-(--text-muted) hover:border-(--brand) hover:text-(--brand) hover:bg-[#f8f9ff]",
                )}
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1.5">
          <Typography as="label" variant="label">{t("aiPlanGeneration.durationMonthsLabel")}</Typography>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={360}
              value={duration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) setDuration(val);
              }}
              className="w-30"
            />
            <Typography variant="muted" className="text-[13px]">
              Total target: {formatDisplay(targetAmount, (aiResult?.currency ?? currency) as Currency)}{" "}
              {aiResult?.currency ?? currency}
            </Typography>
          </div>
        </div>

        {createError && (
          <p className="text-[13px] text-red-500 text-center m-0">{createError}</p>
        )}

        <Button
          type="button"
          variant="primary"
          className="w-full justify-center py-3.5 text-body"
          onClick={handleCreatePlan}
          disabled={isCreating || requiredPerPeriod <= 0}
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <Spinner />
              {t("common.loading")}
            </span>
          ) : (
            t("aiPlanGeneration.buttonConfirm")
          )}
        </Button>
      </Card>
    </PageContainer>
  );
}
