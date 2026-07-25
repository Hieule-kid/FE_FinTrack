"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile } from "@/features/auth/hooks/use-profile";

const themeOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { logout, isLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("USD");

  async function handleSignOut() {
    await logout();
    router.push("/login");
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
            value={profileLoading ? "" : (profile?.fullName ?? "")}
            readOnly
            disabled={profileLoading}
            className="bg-gray-50"
            onChange={() => {}}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={profileLoading ? "" : (profile?.email ?? "")}
            readOnly
            disabled={profileLoading}
            className="bg-gray-50"
            onChange={() => {}}
          />
        </div>

        <p className="text-sm text-[#2f74ff]">
          Profile details are managed by your account administrator.
        </p>
      </div>

      {/* Display Preferences */}
      <div className="rounded-2xl border border-(--line) bg-white p-6 grid gap-5">
        <div className="flex items-center gap-2.5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <Typography as="h2" variant="h2">
            Display Preferences
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="theme"
            label="Theme"
            options={themeOptions}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <Select
            id="currency"
            label="Currency"
            options={currencyOptions}
            value={profile?.currency ?? currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
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
        </button>

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
          onClick={() => {}}
        >
          Save Changes
        </Button>
      </div>
    </PageContainer>
  );
}
