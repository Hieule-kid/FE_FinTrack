"use server";

export async function loginAction(): Promise<never> {
  throw new Error("loginAction is not implemented — use authService.login via useAuth instead.");
}

export async function registerAction(): Promise<never> {
  throw new Error("registerAction is not implemented — use authService.register via useAuth instead.");
}
