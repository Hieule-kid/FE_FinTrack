"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <Card className="w-[min(100%,480px)] flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Create your account</Typography>
        <Typography variant="muted">Start your first saving plan with a few quick details.</Typography>
      </div>

      <form
        className="grid gap-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const response = await register({ fullName, username, email, password, role });
          if (!response) return;
          setSuccessMessage("Account created successfully. Redirecting to login...");
          router.push("/login");
        }}
      >
        <Input
          id="full-name"
          label="Full name"
          placeholder="Your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          minLength={2}
          maxLength={100}
          required
        />

        <Input
          id="register-username"
          type="text"
          label="Username"
          placeholder="letters, numbers, underscores"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={3}
          maxLength={30}
          pattern="^[a-zA-Z0-9_]+$"
          required
        />

        <Input
          id="register-email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          id="register-password"
          type="password"
          label="Password"
          placeholder="Choose a secure password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          hint="At least 8 characters and one number"
          required
        />

        <Select
          id="register-role"
          label="Role"
          options={[
            { value: "USER", label: "USER" },
            { value: "ADMIN", label: "ADMIN" },
          ]}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />

        {error ? (
          <p className="m-0 text-[13px] text-[#b12020]">{error}</p>
        ) : null}

        {successMessage ? (
          <p className="m-0 text-[13px] text-(--ok)">{successMessage}</p>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="text-sm text-muted text-center flex flex-row justify-center gap-1">
        Already have an account?
        <Link href="/login" className="text-primary">
          Sign in
        </Link>
      </div>
    </Card>
  );
}
