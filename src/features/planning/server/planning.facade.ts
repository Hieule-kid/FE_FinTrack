"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authCookies } from "@/config/cookies";
import type {
  Plan,
  PlanDetail,
  CreatePlanPayload,
  UpdatePlanPayload,
  AiGenerateResponse,
} from "@/features/planning/types";
import * as planningService from "./planning.service";

async function getToken(): Promise<string> {
  const jar = await cookies();
  return jar.get(authCookies.accessToken)?.value ?? "";
}

export async function getPlans(): Promise<Plan[]> {
  return planningService.getPlans(await getToken());
}

export async function getPlan(id: string): Promise<PlanDetail | null> {
  return planningService.getPlan(id, await getToken());
}

export async function createPlan(
  payload: CreatePlanPayload,
): Promise<Plan | null> {
  const plan = await planningService.createPlan(payload, await getToken());
  if (plan) revalidatePath("/dashboard");
  return plan;
}

export async function updatePlan(
  id: string,
  payload: UpdatePlanPayload,
): Promise<Plan | null> {
  return planningService.updatePlan(id, payload, await getToken());
}

export async function deletePlan(id: string): Promise<boolean> {
  const ok = await planningService.deletePlan(id, await getToken());
  if (ok) revalidatePath("/dashboard");
  return ok;
}

export async function updateMilestone(
  planId: string,
  milestoneId: string,
  actualSaved: number,
): Promise<PlanDetail | null> {
  return planningService.updateMilestone(
    planId,
    milestoneId,
    actualSaved,
    await getToken(),
  );
}

export async function completeMilestone(
  planId: string,
  milestoneId: string,
): Promise<PlanDetail | null> {
  return planningService.completeMilestone(planId, milestoneId, await getToken());
}

export async function generateAiPlan(prompt: string): Promise<AiGenerateResponse> {
  return planningService.generateAiPlan(prompt, await getToken());
}
