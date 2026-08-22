"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile, setCachedProfile } from "@/features/auth/hooks/use-profile";
import { authService } from "@/features/auth/service";
import { HttpError } from "@/services/http";
import type { AuthUser } from "@/features/auth/types";
import Image from "next/image";

const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { logout, isLoading } = useAuth();
  const { profile, isLoading: profileLoading, setProfile } = useProfile();

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
    setFullName(profile.fullName ?? "");
    setEmail(profile.email ?? "");
    setCurrency(profile.currency ?? "USD");
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

  return (
    <PageContainer className="grid gap-5">
      <Typography as="h1" variant="h1">
        Settings
      </Typography>

      {/* Profile */}
      <div className="rounded-2xl border border-(--line) bg-white p-6 grid gap-5">
        <div className="flex items-center gap-2.5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2f74ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <Typography as="h2" variant="h2">
            Profile
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="fullName"
            label="Full Name"
            value={fullName}
            disabled={profileLoading || isSaving}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            disabled={profileLoading || isSaving}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Language */}
      <div className="rounded-2xl border border-(--line) bg-white p-6 grid gap-5 w-full lg:w-1/2">
        <div className="flex items-center gap-2.5">
          <Image src="/globe.svg" alt="global Logo" width={20} height={20} />
          <Typography as="h2" variant="h2">
              Language
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Select
            id="currency"
            label="Currency"
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </Button>

        <Button
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          onClick={handleSaveChanges}
          disabled={profileLoading || isSaving || !isProfileDraft}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </PageContainer>
  );
}
