"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const session = await login({ emailOrUsername, password });
    if (session?.authenticated) {
      router.push("/dashboard");
    }
  }

  return (
    <Card className="auth-card flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Welcome back</Typography>
        <Typography variant="muted">Sign in to continue managing your saving plans.</Typography>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <Input
          id="emailOrUsername"
          type="text"
          label="Email or Username"
          placeholder="you@example.com"
          value={emailOrUsername}
          onChange={(event) => setEmailOrUsername(event.target.value)}
          required
        />

        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? (
          <p className="form-message form-message--error">{error}</p>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="text-sm text-muted text-center flex flex-row justify-center gap-1">
        Don't have an account? Sign up
        <Link href="/register" className="text-primary">
          Sign up
        </Link>
      </div>
    </Card>
  );
}
