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
import { createPlan } from "@/features/planning/server/planning.facade";

type Timeframe = "short" | "mid" | "long";
type Frequency = "daily" | "monthly";
type Currency = "VND" | "USD";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; decimals: number; step: number; defaultAmount: number }> = {
  VND: { symbol: "VND", decimals: 0, step: 1000, defaultAmount: 10_000_000 },
  USD: { symbol: "$", decimals: 2, step: 0.01, defaultAmount: 1000 },
};

function formatDisplay(value: number, currency: Currency): string {
  if (currency === "VND") return Math.round(value).toLocaleString("vi-VN");
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDisplay(raw: string, currency: Currency): number {
  if (currency === "VND") return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
  return parseFloat(raw.replace(/,/g, "")) || 0;
}

function calcMonthsFromToday(dateStr: string): number {
  const [y, m] = dateStr.split("-").map(Number);
  const now = new Date();
  return Math.max(1, (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1)));
}

function timeframeForMonths(months: number): Timeframe {
  if (months <= 11) return "short";
  if (months <= 60) return "mid";
  return "long";
}

function estimatedCompletion(durationMonths: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + durationMonths, 1);
  return target.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const CATEGORY_IDS = [
  { id: "emergency", translationKey: "categoryEmergency", defaultTitleKey: "defaultTitleEmergency", timeframe: "short" as Timeframe, presetIndex: 1 },
  { id: "travel", translationKey: "categoryTravel", defaultTitleKey: "defaultTitleTravel", timeframe: "short" as Timeframe, presetIndex: 2 },
  { id: "house", translationKey: "categoryHouse", defaultTitleKey: "defaultTitleHouse", timeframe: "mid" as Timeframe, presetIndex: 2 },
  { id: "car", translationKey: "categoryCar", defaultTitleKey: "defaultTitleCar", timeframe: "mid" as Timeframe, presetIndex: 1 },
  { id: "education", translationKey: "categoryEducation", defaultTitleKey: "defaultTitleEducation", timeframe: "mid" as Timeframe, presetIndex: 2 },
  { id: "wedding", translationKey: "categoryWedding", defaultTitleKey: "defaultTitleWedding", timeframe: "short" as Timeframe, presetIndex: 2 },
  { id: "retirement", translationKey: "categoryRetirement", defaultTitleKey: "defaultTitleRetirement", timeframe: "long" as Timeframe, presetIndex: 1 },
  { id: "other", translationKey: "categoryBusiness", defaultTitleKey: "", timeframe: "short" as Timeframe, presetIndex: 1 },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  emergency: <Icon type="shield" size={22} />,
  travel: <Icon type="plane" size={22} />,
  house: <Icon type="home" size={22} />,
  car: <Icon type="car" size={22} />,
  education: <Icon type="graduation" size={22} />,
  wedding: <Icon type="heart" size={22} />,
  retirement: <Icon type="bar-chart" size={22} />,
  other: <Icon type="plus-circle" size={22} />,
};

const DURATION_PRESETS: Record<Timeframe, { months: number; label: string }[]> = {
  short: [
    { months: 3, label: "3m" },
    { months: 6, label: "6m" },
    { months: 9, label: "9m" },
    { months: 11, label: "11m" },
  ],
  mid: [
    { months: 12, label: "1y" },
    { months: 24, label: "2y" },
    { months: 36, label: "3y" },
    { months: 60, label: "5y" },
  ],
  long: [
    { months: 72, label: "6y" },
    { months: 120, label: "10y" },
    { months: 180, label: "15y" },
    { months: 240, label: "20y" },
  ],
};

export function CreatePlanContent() {
  const router = useRouter();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const currency = (profile?.currency ?? "VND") as Currency;
  const currencyConfig = CURRENCY_CONFIG[currency];

  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [targetAmountStr, setTargetAmountStr] = useState(formatDisplay(currencyConfig.defaultAmount, currency));
  const [timeframe, setTimeframe] = useState<Timeframe>("short");
  const [duration, setDuration] = useState(6);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [savingsPerPeriod, setSavingsPerPeriod] = useState("");
  const [isSavingsEdited, setIsSavingsEdited] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const targetAmount = parseDisplay(targetAmountStr, currency);

  const durationRange =
    timeframe === "short" ? { min: 1, max: 11 } :
    timeframe === "mid"   ? { min: 12, max: 60 } :
                            { min: 61, max: 360 };

  const errors = {
    duration:
      duration < durationRange.min || duration > durationRange.max
        ? `Must be ${durationRange.min}–${durationRange.max} months for ${timeframe}-term plans`
        : null,
    savings:
      parseDisplay(savingsPerPeriod, currency) <= 0
        ? "Required savings must be greater than 0"
        : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const computedSavings = (() => {
    const divisor = frequency === "monthly" ? duration : duration * 30;
    if (!divisor) return 0;
    return targetAmount / divisor;
  })();

  const timeframeLabel =
    timeframe === "short" ? "< 1 year" : timeframe === "mid" ? "1–5 years" : "> 5 years";

  const minTargetDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const formattedSavings = formatDisplay(computedSavings, currency);
  if (!isSavingsEdited && savingsPerPeriod !== formattedSavings) {
    setSavingsPerPeriod(formattedSavings);
  }

  function handleCategorySelect(catId: string, defaultTitleKey: string, catTimeframe: Timeframe, presetIndex: number) {
    const isDeselect = category === catId;
    setCategory(isDeselect ? null : catId);
    if (!isDeselect) {
      const presets = DURATION_PRESETS[catTimeframe];
      if (defaultTitleKey) {
        setTitle(t(`planCreation.${defaultTitleKey}`));
      }
      setTimeframe(catTimeframe);
      setDuration(presets[presetIndex]?.months ?? presets[0].months);
      setIsCustomDuration(false);
      setTargetDateStr("");
      setIsSavingsEdited(false);
    }
  }

  function handleTimeframeChange(value: Timeframe) {
    setTimeframe(value);
    const presets = DURATION_PRESETS[value];
    setDuration(presets[1]?.months ?? presets[0].months);
    setIsCustomDuration(false);
    setTargetDateStr("");
    setIsSavingsEdited(false);
  }

  function handlePresetSelect(months: number) {
    setDuration(months);
    setIsCustomDuration(false);
    setTargetDateStr("");
    setIsSavingsEdited(false);
  }

  function handleTargetDateChange(dateStr: string) {
    setTargetDateStr(dateStr);
    if (!dateStr) return;
    const months = calcMonthsFromToday(dateStr);
    setDuration(months);
    setIsCustomDuration(false);
    setTimeframe(timeframeForMonths(months));
    setIsSavingsEdited(false);
  }

  function handleSavingsChange(value: string) {
    setSavingsPerPeriod(value);
    setIsSavingsEdited(true);
    const parsed = parseDisplay(value, currency);
    if (parsed > 0) {
      const newTarget = frequency === "monthly"
        ? parsed * duration
        : parsed * duration * 30;
      const factor = Math.pow(10, currencyConfig.decimals);
      setTargetAmountStr(formatDisplay(Math.round(newTarget * factor) / factor, currency));
    }
  }

  function handleRecalculate() {
    setIsSavingsEdited(false);
    setSavingsPerPeriod(formatDisplay(computedSavings, currency));
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (hasErrors) return;

    const TIMEFRAME_MAP: Record<Timeframe, string> = {
      short: "SHORT_TERM",
      mid:   "MID_TERM",
      long:  "LONG_TERM",
    };

    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const payload = {
      goalTitle:         title || undefined,
      targetAmount,
      currency,
      planCategory:      category ? category.toUpperCase() : undefined,
      durationInMonths:  duration,
      durationInYears:   Math.max(1, Math.min(20, Math.round(duration / 12))),
      timeframeCategory: TIMEFRAME_MAP[timeframe],
      frequency:         frequency.toUpperCase(),
      requiredPerPeriod: parseDisplay(savingsPerPeriod, currency),
      startDate,
      userId: profile?.id,
    };

    setIsLoading(true);
    setApiError(null);
    try {
      const plan = await createPlan(payload);
      if (!plan) {
        setApiError("Failed to create plan. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setApiError("Failed to create plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isPresetActive = (months: number) =>
    !isCustomDuration && !targetDateStr && duration === months;

  return (
    <PageContainer className="flex flex-col items-center py-10 gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center"
          style={{ background: "linear-gradient(145deg, #eaf0ff 0%, #dce8ff 100%)" }}
        >
          <Icon type="target" size={36} color="var(--brand)" />
        </div>
        <div>
          <Typography as="h1" variant="h1" className="text-[28px]">{t("plan.createNew")}</Typography>
          <Typography variant="muted" className="mt-1 text-[15px]">
            {t("planCreation.subtitle", "Set your financial goal and we'll break it down for you")}
          </Typography>
        </div>
      </div>

      <Card className="w-full max-w-[620px] flex flex-col gap-6 p-7">

        {/* Goal Category */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">{t("planCreation.category")} <Typography as="span" variant="muted" className="font-normal">{t("planCreation.categoryOptional")}</Typography></Typography>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_IDS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id, cat.defaultTitleKey, cat.timeframe, cat.presetIndex)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-150",
                  category === cat.id
                    ? "border-[var(--brand)] bg-[#eef3ff] text-[var(--brand)]"
                    : "border-[#e2e8f0] bg-white text-(--text-muted) hover:border-(--brand) hover:text-(--brand) hover:bg-[#f8f9ff]",
                )}
              >
                {CATEGORY_ICONS[cat.id]}
                <span className="text-[11px] font-semibold">{t(`planCreation.${cat.translationKey}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Goal Title */}
        <div className="relative">
          <Input
            id="goal-title"
            label={t("planCreation.titleLabel")}
            className="pr-14"
            type="text"
            placeholder={t("planCreation.titlePlaceholder")}
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Typography as="span" variant="caption" className="absolute right-3.5 bottom-3">
            {title.length}{t("planCreation.titleCharCount")}
          </Typography>
        </div>

        {/* Target Amount */}
        <div className="relative">
          <Input
            label={t("planCreation.targetAmountLabel")}
            className={cn("w-full pr-16", currency === "USD" ? "pl-7" : "pl-3.5")}
            type="text"
            inputMode="decimal"
            value={targetAmountStr}
            onChange={(e) => {
              setTargetAmountStr(e.target.value);
              setIsSavingsEdited(false);
            }}
            onFocus={(e) => {
              const raw = parseDisplay(e.target.value, currency);
              setTargetAmountStr(raw ? String(raw) : "");
            }}
            onBlur={(e) => {
              const num = parseDisplay(e.target.value, currency);
              if (num > 0) setTargetAmountStr(formatDisplay(num, currency));
            }}
          />
          {currency === "USD" && (
            <span className="absolute left-3.5 bottom-3 text-(--text-muted) text-body pointer-events-none select-none">$</span>
          )}
          <span className="absolute right-3.5 bottom-3 text-(--text-muted) text-[13px] font-medium pointer-events-none select-none">
            {currency === "VND" ? "VND" : "USD"}
          </span>
        </div>

        {/* Timeframe */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">{t("planCreation.timeframeLabel")}</Typography>
          <div className="relative grid grid-cols-3 border border-[#c8d4f2] rounded-xl bg-white p-1 gap-0">
            <div
              className="absolute top-1 bottom-1 rounded-[10px] bg-brand shadow-sm transition-[left] duration-300 ease-[cubic-bezier(0.34,1.26,0.64,1)]"
              style={{
                width: "calc(33.333% - 8px)",
                left: timeframe === "short" ? "4px" : timeframe === "mid" ? "calc(33.333% + 4px)" : "calc(66.667% + 4px)",
              }}
            />
            {(["short", "mid", "long"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTimeframeChange(tf)}
                className={cn(
                  "relative z-10 py-3 text-[14px] font-semibold transition-colors duration-200",
                  timeframe === tf ? "text-white" : "text-(--text-muted)",
                )}
              >
                {tf === "short" ? t("planCreation.timeframeShort") : tf === "mid" ? t("planCreation.timeframeMid") : t("planCreation.timeframeLong")}
              </button>
            ))}
          </div>
          <Typography as="span" variant="muted" className="text-[13px]">{timeframeLabel}</Typography>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">
            {t("planCreation.durationLabel")}
            <Typography as="span" variant="caption" className="ml-1.5 font-normal">
              {t("planCreation.durationTarget")} {estimatedCompletion(duration)}
            </Typography>
          </Typography>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS[timeframe].map((p) => (
              <button
                key={p.months}
                type="button"
                onClick={() => handlePresetSelect(p.months)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all duration-150",
                  isPresetActive(p.months)
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-(--text-muted) border-[#c8d4f2] hover:border-(--brand) hover:text-(--brand)",
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setIsCustomDuration(true); setTargetDateStr(""); }}
              className={cn(
                "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all duration-150",
                isCustomDuration
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-(--text-muted) border-[#c8d4f2] hover:border-(--brand) hover:text-(--brand)",
              )}
            >
              {t("planCreation.durationCustom")}
            </button>
          </div>

          {/* Custom months input */}
          {isCustomDuration && (
            <div className="flex flex-col gap-1">
              <Input
                className={cn("w-full", submitted && errors.duration && "border-red-500 focus:border-red-500")}
                type="number"
                min={durationRange.min}
                max={durationRange.max}
                placeholder={`${durationRange.min}–${durationRange.max} months`}
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    setDuration(val);
                    setIsSavingsEdited(false);
                  }
                }}
              />
              {submitted && errors.duration && (
                <span className="text-[12px] text-red-500">{errors.duration}</span>
              )}
            </div>
          )}

          {/* Target date picker */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-[#e2e8f0]">
            <Typography as="span" variant="caption" className="font-medium">Or set a target date</Typography>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="month"
                  className="w-full"
                  min={minTargetDate}
                  value={targetDateStr}
                  onChange={(e) => handleTargetDateChange(e.target.value)}
                />
              </div>
              {targetDateStr && (
                <button
                  type="button"
                  onClick={() => setTargetDateStr("")}
                  className="text-(--text-muted) hover:text-red-400 transition-colors shrink-0"
                  title="Clear date"
                >
                  <Icon type="close" size={16} />
                </button>
              )}
            </div>
            {targetDateStr && (
              <span className="text-[12px] text-[var(--brand)]">
                {duration} month{duration !== 1 ? "s" : ""} away · {timeframeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-1.5">
          <Typography as="label" variant="label">{t("planCreation.frequencyLabel")}</Typography>
          <div className="relative grid grid-cols-2 border border-[#c8d4f2] rounded-xl bg-white p-1 h-[52px]">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[10px] bg-brand shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.26,0.64,1)]"
              style={{ transform: frequency === "daily" ? "translateX(8px)" : "translateX(calc(100% + 0px))" }}
            />
            {(["daily", "monthly"] as Frequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFrequency(f);
                  setIsSavingsEdited(false);
                }}
                className={cn(
                  "relative z-10 text-[14px] font-semibold transition-colors duration-200",
                  frequency === f ? "text-white" : "text-(--text-muted)",
                )}
              >
                {f === "daily" ? t("planCreation.frequencyDaily") : t("planCreation.frequencyMonthly")}
              </button>
            ))}
          </div>
        </div>

        {/* Required Savings Per Period */}
        <div
          className="flex flex-col gap-3 rounded-xl p-4"
          style={{ background: "linear-gradient(135deg, #eef3ff 0%, #e6eeff 100%)" }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecalculate}
              className="text-[var(--brand)] hover:opacity-70 transition-opacity"
              title="Recalculate"
            >
              <Icon type="refresh" size={17} />
            </button>
            <span className="text-[15px] font-semibold text-[var(--brand)]">{t("planCreation.savingsAmountLabel")}</span>
          </div>
          <div className="relative flex items-center">
            {currency === "USD" && (
              <span className="absolute left-3.5 text-(--text-muted) text-body pointer-events-none select-none">$</span>
            )}
            <div className="flex-1">
              <Input
                className={cn(
                  "w-full bg-white pr-16",
                  currency === "USD" ? "pl-7" : "pl-3.5",
                  submitted && errors.savings && "border-red-500 focus:border-red-500",
                )}
                type="text"
                inputMode="decimal"
                value={savingsPerPeriod}
                onChange={(e) => handleSavingsChange(e.target.value)}
                onFocus={(e) => {
                  const raw = parseDisplay(e.target.value, currency);
                  setSavingsPerPeriod(raw ? String(raw) : "");
                }}
                onBlur={(e) => {
                  const num = parseDisplay(e.target.value, currency);
                  if (num > 0) setSavingsPerPeriod(formatDisplay(num, currency));
                }}
              />
            </div>
            <span className="absolute right-3.5 text-(--text-muted) text-[13px] font-medium pointer-events-none select-none">
              {currency === "VND" ? "VND" : "USD"}
            </span>
          </div>
          <p className="text-[13px] text-[var(--brand)] m-0">
            {t("planCreation.subtitle", "Edit to recalculate your target amount")} · {duration} total {frequency === "monthly" ? "months" : "days"}
          </p>
          {submitted && errors.savings && (
            <span className="text-[12px] text-red-500">{errors.savings}</span>
          )}
        </div>

        {/* Submit */}
        {apiError && (
          <p className="text-[13px] text-red-500 text-center">{apiError}</p>
        )}
        <Button
          type="button"
          variant="primary"
          className="w-full justify-center py-3.5 text-body"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? t("common.loading") : t("planCreation.buttonCreate")}
        </Button>
      </Card>
    </PageContainer>
  );
}
