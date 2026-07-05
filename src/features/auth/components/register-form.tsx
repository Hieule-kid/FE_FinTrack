"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await register({
      fullName,
      username,
      email,
      password,
      role,
    });

    if (!response) {
      return;
    }

    setSuccessMessage("Account created successfully. Redirecting to login...");
    router.push("/login");
  }

  return (
    <Card className="auth-card">
      <h1>Create your account</h1>
      <p>Start your first saving plan with a few quick details.</p>

      <form className="auth-form" onSubmit={onSubmit}>
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

        <label className="ui-field" htmlFor="register-role">
          <span className="ui-field__label">Role</span>
          <select
            className="ui-input"
            id="register-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        {error ? (
          <p className="form-message form-message--error">{error}</p>
        ) : null}

        {successMessage ? (
          <p className="form-message">{successMessage}</p>
        ) : null}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
