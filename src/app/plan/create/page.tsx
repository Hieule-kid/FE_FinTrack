"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { useProfile } from "@/features/auth/hooks/use-profile";
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

const CATEGORIES = [
  {
    id: "emergency",
    label: "Emergency",
    defaultTitle: "Emergency Fund",
    timeframe: "short" as Timeframe,
    presetIndex: 1,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "travel",
    label: "Travel",
    defaultTitle: "Travel Fund",
    timeframe: "short" as Timeframe,
    presetIndex: 2,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.52-.13-1.07.03-1.44.4l-.9.9 7 3.5-2.7 2.7-1.5-.5-.9.9 3 1.5 1.5 3 .9-.9-.5-1.5 2.7-2.7 3.5 7 .9-.9c.37-.37.53-.92.4-1.4z" />
      </svg>
    ),
  },
  {
    id: "house",
    label: "House",
    defaultTitle: "House Down Payment",
    timeframe: "mid" as Timeframe,
    presetIndex: 2,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "car",
    label: "Car",
    defaultTitle: "Car Purchase Fund",
    timeframe: "mid" as Timeframe,
    presetIndex: 1,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <polyline points="14 3 14 8 19 8" />
      </svg>
    ),
  },
  {
    id: "education",
    label: "Education",
    defaultTitle: "Education Fund",
    timeframe: "mid" as Timeframe,
    presetIndex: 2,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    id: "wedding",
    label: "Wedding",
    defaultTitle: "Wedding Fund",
    timeframe: "short" as Timeframe,
    presetIndex: 2,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "retirement",
    label: "Retirement",
    defaultTitle: "Retirement Fund",
    timeframe: "long" as Timeframe,
    presetIndex: 1,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other",
    defaultTitle: "",
    timeframe: "short" as Timeframe,
    presetIndex: 1,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

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

export default function CreatePlanPage() {
  const router = useRouter();
  const { profile } = useProfile();
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

  useEffect(() => {
    if (!isSavingsEdited) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavingsPerPeriod(formatDisplay(computedSavings, currency));
    }
  }, [targetAmount, duration, frequency, isSavingsEdited, computedSavings, currency]);

  function handleCategorySelect(cat: typeof CATEGORIES[number]) {
    const isDeselect = category === cat.id;
    setCategory(isDeselect ? null : cat.id);
    if (!isDeselect) {
      // auto-fill title if blank or still showing another category's default
      const isCategoryTitle = CATEGORIES.some(c => c.defaultTitle && c.defaultTitle === title);
      if (!title || isCategoryTitle) setTitle(cat.defaultTitle);
      // suggest timeframe + duration for this goal type
      setTimeframe(cat.timeframe);
      const presets = DURATION_PRESETS[cat.timeframe];
      setDuration(presets[cat.presetIndex]?.months ?? presets[0].months);
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2158d8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div>
          <Typography as="h1" variant="h1" className="text-[28px]">Create Savings Plan</Typography>
          <Typography variant="muted" className="mt-1 text-[15px]">
            Set your financial goal and we&apos;ll break it down for you
          </Typography>
        </div>
      </div>

      <Card className="w-full max-w-[620px] flex flex-col gap-6 p-7">

        {/* Goal Category */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">Goal Category <Typography as="span" variant="muted" className="font-normal">(optional)</Typography></Typography>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-150",
                  category === cat.id
                    ? "border-[var(--brand)] bg-[#eef3ff] text-[var(--brand)]"
                    : "border-[#e2e8f0] bg-white text-(--text-muted) hover:border-(--brand) hover:text-(--brand) hover:bg-[#f8f9ff]",
                )}
              >
                {cat.icon}
                <span className="text-[11px] font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Goal Title */}
        <div className="relative">
          <Input
            id="goal-title"
            label="Goal Title"
            className="pr-14"
            type="text"
            placeholder="e.g. Emergency Fund"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Typography as="span" variant="caption" className="absolute right-3.5 bottom-3">
            {title.length}/50
          </Typography>
        </div>

        {/* Target Amount */}
        <div className="relative">
          <Input
            label="Target Amount"
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
          <Typography as="label" variant="label">Timeframe</Typography>
          <div className="relative grid grid-cols-3 border border-[#c8d4f2] rounded-xl bg-white p-1 gap-0">
            <div
              className="absolute top-1 bottom-1 rounded-[10px] bg-brand shadow-sm transition-[left] duration-300 ease-[cubic-bezier(0.34,1.26,0.64,1)]"
              style={{
                width: "calc(33.333% - 8px)",
                left: timeframe === "short" ? "4px" : timeframe === "mid" ? "calc(33.333% + 4px)" : "calc(66.667% + 4px)",
              }}
            />
            {(["short", "mid", "long"] as Timeframe[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTimeframeChange(t)}
                className={cn(
                  "relative z-10 py-3 text-[14px] font-semibold transition-colors duration-200",
                  timeframe === t ? "text-white" : "text-(--text-muted)",
                )}
              >
                {t === "short" ? "Short-term" : t === "mid" ? "Mid-term" : "Long-term"}
              </button>
            ))}
          </div>
          <Typography as="span" variant="muted" className="text-[13px]">{timeframeLabel}</Typography>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-2">
          <Typography as="label" variant="label">
            Duration
            <Typography as="span" variant="caption" className="ml-1.5 font-normal">
              · target {estimatedCompletion(duration)}
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
              Custom
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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
          <Typography as="label" variant="label">Savings Frequency</Typography>
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
                {f.charAt(0).toUpperCase() + f.slice(1)}
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold text-[var(--brand)]">Required Savings Per Period</span>
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
            Edit to recalculate your target amount · {duration} total {frequency === "monthly" ? "months" : "days"}
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
          {isLoading ? "Creating…" : "Create Savings Plan"}
        </Button>
      </Card>
    </PageContainer>
  );
}
