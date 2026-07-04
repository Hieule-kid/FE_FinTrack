"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/login");
  }

  return (
    <Card className="auth-card">
      <h1>Create your account</h1>
      <p>Start your first saving plan with a few quick details.</p>

      <form className="auth-form" onSubmit={onSubmit}>
        <Input
          id="name"
          label="Full name"
          placeholder="Your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          required
        />

        <Button type="submit">Create account</Button>
      </form>
    </Card>
  );
}
