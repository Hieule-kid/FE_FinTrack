import { env } from "@/config/env";
import type {
  Plan,
  PlanDetail,
  ResponsePlanning,
  CreatePlanPayload,
  UpdatePlanPayload,
  AiGenerateResponse,
} from "@/features/planning/types";

type BackendMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface BackendRequestOptions {
  method: BackendMethod;
  path: string;
  body?: unknown;
  accessToken: string;
}

export interface BackendApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

const PLANS_PATH = "/api/v1/plans";

async function requestPlanningBackend<T>(
  options: BackendRequestOptions,
): Promise<BackendApiResponse<T>> {
  if (!env.planningServiceBaseUrl) {
    return {
      ok: false,
      status: 500,
      data: { message: "Missing PLANNING_SERVICE_BASE_URL configuration" } as T,
    };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };

  try {
    const response = await fetch(
      `${env.planningServiceBaseUrl}${options.path}`,
      {
        method: options.method,
        headers,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      },
    );

    let data: T | null = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      data: { message: "Cannot reach planning service" } as T,
    };
  }
}

export async function getPlans(accessToken: string): Promise<Plan[]> {
  const result = await requestPlanningBackend<ResponsePlanning<Plan[]>>({
    method: "GET",
    path: PLANS_PATH,
    accessToken,
  });
  return result.data?.data ?? [];
}

export async function getPlan(
  id: string,
  accessToken: string,
): Promise<PlanDetail | null> {
  const result = await requestPlanningBackend<ResponsePlanning<PlanDetail>>({
    method: "GET",
    path: `${PLANS_PATH}/${id}`,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function createPlan(
  payload: CreatePlanPayload,
  accessToken: string,
): Promise<Plan | null> {
  const result = await requestPlanningBackend<ResponsePlanning<Plan>>({
    method: "POST",
    path: PLANS_PATH,
    body: payload,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function updatePlan(
  id: string,
  payload: UpdatePlanPayload,
  accessToken: string,
): Promise<Plan | null> {
  const result = await requestPlanningBackend<ResponsePlanning<Plan>>({
    method: "PUT",
    path: `${PLANS_PATH}/${id}`,
    body: payload,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function deletePlan(
  id: string,
  accessToken: string,
): Promise<boolean> {
  const result = await requestPlanningBackend<ResponsePlanning<null>>({
    method: "DELETE",
    path: `${PLANS_PATH}/${id}`,
    accessToken,
  });
  return result.ok;
}

export async function updateMilestone(
  planId: string,
  milestoneId: string,
  actualSaved: number,
  accessToken: string,
): Promise<PlanDetail | null> {
  const result = await requestPlanningBackend<ResponsePlanning<PlanDetail>>({
    method: "PATCH",
    path: `${PLANS_PATH}/${planId}/milestones/${milestoneId}`,
    body: { actualSaved },
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function completeMilestone(
  planId: string,
  milestoneId: string,
  accessToken: string,
): Promise<PlanDetail | null> {
  const result = await requestPlanningBackend<ResponsePlanning<PlanDetail>>({
    method: "POST",
    path: `${PLANS_PATH}/${planId}/milestones/${milestoneId}/complete`,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function generateAiPlan(
  prompt: string,
  accessToken: string,
): Promise<AiGenerateResponse> {
  const result = await requestPlanningBackend<ResponsePlanning<AiGenerateResponse>>({
    method: "POST",
    path: `${PLANS_PATH}/ai/generate`,
    body: { prompt },
    accessToken,
  });
  if (!result.ok || !result.data?.data) {
    const backendMessage = result.data?.message;
    throw new Error(backendMessage ?? `Request failed with status ${result.status}`);
  }
  return result.data.data;
}
