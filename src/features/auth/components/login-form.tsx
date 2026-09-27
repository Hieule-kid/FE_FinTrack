"use client";

import { useEffect, useState } from "react";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useServiceWarmup } from "@/hooks/use-service-warmup";

const SLOW_NOTICE_DELAY_MS = 8_000;

export function LoginForm() {
  const { login, isLoading, isWakingServer, error } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [slowNoticeElapsed, setSlowNoticeElapsed] = useState(false);

  // Start warming auth-service (login) and planning-service (dashboard) while the user
  // is still typing, so Render's free-tier cold starts overlap instead of stacking.
  useServiceWarmup(["auth", "planning"]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(
      () => setSlowNoticeElapsed(true),
      SLOW_NOTICE_DELAY_MS,
    );
    return () => {
      clearTimeout(timer);
      setSlowNoticeElapsed(false);
    };
  }, [isLoading]);

  // Show the "starting up" notice once we're actively polling for the cold service, or
  // after the request has simply been slow for a while.
  const showSlowNotice = isWakingServer || (isLoading && slowNoticeElapsed);

  return (
    <Card className="w-[min(100%,480px)] flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Welcome back</Typography>
        <Typography variant="muted">
          Sign in to continue managing your saving plans.
        </Typography>
      </div>

      <form
        className="grid gap-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const session = await login({ emailOrUsername, password });
          if (session?.authenticated) {
            // Hard navigation, not router.push(): proxy.ts (middleware) must see the
            // access_token cookie the login response just set. A client-side push can
            // replay a cached RSC/redirect result from before login — e.g. if this tab
            // ever hit /dashboard unauthenticated earlier — bouncing straight back to
            // /login even though the cookie is now present. A full navigation always
            // re-runs the middleware against the browser's current cookie jar.
            window.location.assign("/dashboard");
          }
        }}
      >
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
          <p className="m-0 text-[13px] text-[#b12020]">{error}</p>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isWakingServer
            ? "Waking up server..."
            : isLoading
              ? "Signing in..."
              : "Sign in"}
        </Button>

        {showSlowNotice ? (
          <p className="m-0 text-[13px] text-muted">
            The system is starting up for the first time — this can take a few
            minutes. Please keep this tab open.
          </p>
        ) : null}
      </form>

      <div className="text-sm text-muted text-center flex flex-row justify-center gap-1">
        Don&apos;t have an account?
        <Link href="/register" className="text-primary">
          Sign up
        </Link>
      </div>
    </Card>
  );
}
