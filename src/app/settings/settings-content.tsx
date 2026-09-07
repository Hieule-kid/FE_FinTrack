"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile, setCachedProfile } from "@/features/auth/hooks/use-profile";
import { useLanguage } from "@/features/language/hooks/use-language";
import { authService } from "@/features/auth/service";
import { HttpError } from "@/services/http";
import type { AuthUser } from "@/features/auth/types";
import type { Language } from "@/services/locale";
import Image from "next/image";

const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
];

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Tiếng Việt", value: "vi" },
];

export function SettingsContent() {
  const router = useRouter();
  const { logout, isLoading } = useAuth();
  const { profile, isLoading: profileLoading, setProfile } = useProfile();
  const { language, setLanguage, t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isCurrencySaving, setIsCurrencySaving] = useState(false);
  const [currencyError, setCurrencyError] = useState("");
  const [syncedProfile, setSyncedProfile] = useState<AuthUser | null>(null);

  if (profile && profile !== syncedProfile) {
    setSyncedProfile(profile);
    const newFullName = profile.fullName ?? "";
    if (fullName !== newFullName) setFullName(newFullName);
    const newEmail = profile.email ?? "";
    if (email !== newEmail) setEmail(newEmail);
    const newCurrency = profile.currency ?? "USD";
    if (currency !== newCurrency) setCurrency(newCurrency);
  }

  const isProfileDraft =
    fullName !== (syncedProfile?.fullName ?? "") ||
    email !== (syncedProfile?.email ?? "");

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  async function handleSaveChanges() {
    setIsSaving(true);
    setSaveError("");

    try {
      const result = await authService.updateProfile({
        fullName,
        email,
        currency,
      });
      const updated = result.data;
      if (updated) {
        setCachedProfile(updated);
        setProfile(updated);
      }
    } catch (err) {
      const message =
        err instanceof HttpError && (err.data as { message?: string })?.message;
      setSaveError(message || "Unable to save changes right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCurrencyChange(nextCurrency: string) {
    const previousCurrency = currency;
    setCurrency(nextCurrency);
    setCurrencyError("");
    setIsCurrencySaving(true);

    try {
      const result = await authService.updateCurrency({
        currency: nextCurrency,
      });
      const updated = result.data;
      if (updated) {
        setCachedProfile(updated);
        setProfile(updated);
      }
    } catch (err) {
      setCurrency(previousCurrency);
      const message =
        err instanceof HttpError && (err.data as { message?: string })?.message;
      setCurrencyError(message || "Unable to update currency right now.");
    } finally {
      setIsCurrencySaving(false);
    }
  }

  function handleLanguageChange(nextLanguage: string) {
    setLanguage(nextLanguage as Language);
  }

  return (
    <PageContainer className="grid gap-5">
      <Typography as="h1" variant="h1">
        {t("settings.title")}
      </Typography>

      {/* Profile */}
      <div className="rounded-2xl border border-(--line) bg-white p-6 grid gap-5">
        <div className="flex items-center gap-2.5">
          <Icon type="user" size={20} color="#2f74ff" />
          <Typography as="h2" variant="h2">
            {t("settings.profile.title")}
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="fullName"
            label={t("settings.profile.fullName")}
            value={fullName}
            disabled={profileLoading || isSaving}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            id="email"
            label={t("settings.profile.email")}
            type="email"
            value={email}
            disabled={profileLoading || isSaving}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Language */}
      <div className="rounded-2xl border border-(--line) bg-white p-6 grid gap-5 w-full">
        <div className="flex items-center gap-2.5">
          <Image src="/globe.svg" alt="global Logo" width={20} height={20} />
          <Typography as="h2" variant="h2">
            {t("settings.language.title")}
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="language"
            label={t("settings.language.language")}
            options={languageOptions}
            value={language}
            disabled={profileLoading}
            onChange={(e) => handleLanguageChange(e.target.value)}
          />
          <Select
            id="currency"
            label={t("settings.language.currency")}
            options={currencyOptions}
            value={currency}
            disabled={profileLoading || isCurrencySaving}
            onChange={(e) => handleCurrencyChange(e.target.value)}
          />
        </div>
      </div>

      {currencyError ? (
        <Typography as="p" variant="body" className="text-red-500">
          {currencyError}
        </Typography>
      ) : null}

      {saveError ? (
        <Typography as="p" variant="body" className="text-red-500">
          {saveError}
        </Typography>
      ) : null}

      {/* Actions */}
      <div className="flex justify-between items-center pt-1">
        <Button
          type="button"
          variant="logout"
          onClick={handleSignOut}
          disabled={isLoading}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          <Icon type="logout" size={16} />
          {t("common.logout")}
        </Button>

        <Button
          icon={<Icon type="save" size={16} />}
          onClick={handleSaveChanges}
          disabled={profileLoading || isSaving || !isProfileDraft}
        >
          {isSaving ? t("settings.profile.saving") : t("settings.profile.saveChanges")}
        </Button>
      </div>
    </PageContainer>
  );
}
