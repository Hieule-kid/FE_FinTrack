"use server";

import type { LoginPayload } from "@/features/auth/types";

export async function loginAction(payload: LoginPayload) {
  return {
    ok: true,
    payload,
    message: "Use this action after wiring backend endpoint.",
  };
}

export async function registerAction() {
  return { ok: true, message: "Register API is not wired yet." };
}
