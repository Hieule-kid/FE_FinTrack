"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/features/auth/hooks/use-auth";

interface ResetPasswordFormProps {
  token: string | undefined;
}

// Mirrors backend ResetPasswordRequest / RegisterRequest rules.
const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

function validatePassword(password: string): string {
  if (password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters`;
  }
  if (password.length > MAX_LENGTH) {
    return `Password must be at most ${MAX_LENGTH} characters`;
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one digit";
  }
  return "";
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword, isLoading, error } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validationError, setValidationError] = useState("");
  const [done, setDone] = useState(false);

  // The token is a credential: drop it from the address bar/history once captured.
  useEffect(() => {
    if (token) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [token]);

  if (!token) {
    return (
      <Card className="w-[min(100%,480px)] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Typography variant="h2">Invalid reset link</Typography>
          <Typography variant="muted">
            This link is missing its token or has already been used. Request a
            new one to continue.
          </Typography>
        </div>
        <Link href="/forgot-password" className="text-primary text-sm">
          Request a new reset link
        </Link>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-[min(100%,480px)] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Typography variant="h2">Password updated</Typography>
          <Typography variant="muted">
            Your password has been changed and all other sessions were signed
            out. You can now sign in with your new password.
          </Typography>
        </div>
        <Link href="/login" className="text-primary text-sm">
          Go to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-[min(100%,480px)] flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Choose a new password</Typography>
        <Typography variant="muted">
          Use at least 8 characters, including a number.
        </Typography>
      </div>

      <form
        className="grid gap-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (isLoading) return;

          const problem =
            validatePassword(password) ||
            (password !== confirm ? "Passwords do not match" : "");
          setValidationError(problem);
          if (problem) return;

          if (await resetPassword({ token, newPassword: password })) {
            setDone(true);
          }
        }}
      >
        <Input
          id="new-password"
          type="password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          required
        />

        <Input
          id="confirm-password"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          maxLength={MAX_LENGTH}
          required
        />

        {validationError || error ? (
          <p role="alert" className="m-0 text-[13px] text-[#b12020]">
            {validationError || error}
          </p>
        ) : null}

        {error ? (
          <Link href="/forgot-password" className="text-primary text-sm">
            Request a new reset link
          </Link>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}
