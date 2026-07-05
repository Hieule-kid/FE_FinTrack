"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
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
    <Card className="auth-card">
      <h1>Welcome back</h1>
      <p>Sign in to continue managing your saving plans.</p>

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
    </Card>
  );
}
