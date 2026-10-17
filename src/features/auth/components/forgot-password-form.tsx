"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  if (submittedEmail) {
    return (
      <Card className="w-[min(100%,480px)] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Typography variant="h2">Check your email</Typography>
          {/* Deliberately neutral: the backend answers identically for unknown addresses. */}
          <Typography variant="muted">
            If an account exists for {submittedEmail}, we&apos;ve sent a link to
            reset your password. It expires in 30 minutes.
          </Typography>
        </div>
        <Typography variant="muted">
          Didn&apos;t get it? Check your spam folder, or wait a minute and try
          again.
        </Typography>
        <Button type="button" onClick={() => setSubmittedEmail(null)}>
          Try a different email
        </Button>
        <div className="text-sm text-center">
          <Link href="/login" className="text-primary">
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-[min(100%,480px)] flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Forgot your password?</Typography>
        <Typography variant="muted">
          Enter the email you registered with and we&apos;ll send you a reset
          link.
        </Typography>
      </div>

      <form
        className="grid gap-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (isLoading) return;
          const trimmed = email.trim();
          if (await forgotPassword({ email: trimmed })) {
            setSubmittedEmail(trimmed);
          }
        }}
      >
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={100}
          required
        />

        {error ? (
          <p role="alert" className="m-0 text-[13px] text-[#b12020]">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-sm text-center">
        <Link href="/login" className="text-primary">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
