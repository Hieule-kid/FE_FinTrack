"use client";

import { http, HttpError } from "@/services/http";
import type {
  CreatePlanPayload,
  Plan,
  PlanDetail,
  ResponsePlanning,
  UpdatePlanPayload,
} from "@/features/planning/types";
import {
  addPendingMutation,
  createLocalId,
  createMutationId,
  getAllPlansLocal,
  getPlanDetailLocal,
  getPlanLocal,
  removePlanLocal,
  savePlanDetailLocal,
  savePlanLocal,
  savePlansLocal,
} from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/network";
import type { PendingMutation } from "@/lib/offline/types";
import { emitDataChanged } from "@/lib/offline/types";
import { syncPendingMutations } from "@/lib/offline/sync-manager";

const PLANS_PATH = "/api/planning/api/v1/plans";

function buildLocalPlan(payload: CreatePlanPayload, id: string): Plan {
  const months = payload.durationInMonths;
  const timeframeCategory =
    payload.timeframeCategory ||
    (months <= 11 ? "SHORT_TERM" : months <= 60 ? "MID_TERM" : "LONG_TERM");

  return {
    id,
    goalTitle: payload.goalTitle ?? "New Goal",
    targetAmount: payload.targetAmount,
    currency: payload.currency,
    planCategory: payload.planCategory ?? "GENERAL",
    timeframeCategory,
    frequency: payload.frequency,
    startDate: payload.startDate,
    recalculateOnMissedDeadline: true,
    totalSaved: 0,
    remaining: payload.targetAmount,
    progressPercent: 0,
  };
}

function buildLocalPlanDetail(plan: Plan, payload: CreatePlanPayload): PlanDetail {
  const now = new Date().toISOString();
  return {
    ...plan,
    durationInMonths: payload.durationInMonths,
    durationInYears: payload.durationInYears,
    requiredPerPeriod: payload.requiredPerPeriod,
    milestones: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function queueMutation(
  operation: PendingMutation["operation"],
  entityId: string,
  payload: unknown,
): Promise<void> {
  await addPendingMutation({
    id: createMutationId(),
    operation,
    entityId,
    payload,
    clientUpdatedAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function fetchPlansOfflineFirst(): Promise<Plan[]> {
  if (isOnline()) {
    try {
      const res = await http.get<ResponsePlanning<Plan[]>>(PLANS_PATH, { useBaseUrl: false });
      const plans = res.data ?? [];
      await savePlansLocal(plans);
      return plans;
    } catch {
      // fall through to local cache
    }
  }

  return getAllPlansLocal();
}

export async function fetchPlanDetailOfflineFirst(id: string): Promise<PlanDetail | null> {
  if (isOnline()) {
    try {
      const res = await http.get<ResponsePlanning<PlanDetail>>(`${PLANS_PATH}/${id}`, {
        useBaseUrl: false,
      });
      if (res.data) {
        await savePlanDetailLocal(res.data);
        return res.data;
      }
    } catch (err) {
      if (!(err instanceof HttpError) || err.status !== 404) {
        // use local cache for network failures
      } else {
        return null;
      }
    }
  }

  const detail = await getPlanDetailLocal(id);
  if (detail) return detail;

  const summary = await getPlanLocal(id);
  if (!summary) return null;

  return {
    ...summary,
    durationInMonths: 0,
    durationInYears: 0,
    requiredPerPeriod: 0,
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function createPlanOfflineFirst(payload: CreatePlanPayload): Promise<Plan | null> {
  if (isOnline()) {
    try {
      const res = await http.post<ResponsePlanning<Plan>>(PLANS_PATH, payload, {
        useBaseUrl: false,
      });
      const plan = res.data ?? null;
      if (plan) {
        await savePlanLocal(plan, false);
        emitDataChanged();
      }
      return plan;
    } catch {
      // queue offline if network fails mid-request
    }
  }

  const localId = createLocalId();
  const plan = buildLocalPlan(payload, localId);
  const detail = buildLocalPlanDetail(plan, payload);

  await savePlanLocal(plan, true);
  await savePlanDetailLocal(detail);
  await queueMutation("CREATE_PLAN", localId, { ...payload, localId });
  emitDataChanged();

  if (isOnline()) {
    void syncPendingMutations();
  }

  return plan;
}

export async function updatePlanOfflineFirst(
  id: string,
  payload: UpdatePlanPayload,
): Promise<Plan | null> {
  if (isOnline()) {
    try {
      const res = await http.put<ResponsePlanning<Plan>>(`${PLANS_PATH}/${id}`, payload, {
        useBaseUrl: false,
      });
      const plan = res.data ?? null;
      if (plan) {
        await savePlanLocal(plan, false);
        emitDataChanged();
      }
      return plan;
    } catch {
      // fall through
    }
  }

  const existing = await getPlanLocal(id);
  if (!existing) return null;

  const updated: Plan = { ...existing, ...payload };
  await savePlanLocal(updated, id.startsWith("local-"));
  await queueMutation("UPDATE_PLAN", id, payload);
  emitDataChanged();

  if (isOnline()) {
    void syncPendingMutations();
  }

  return updated;
}

export async function deletePlanOfflineFirst(id: string): Promise<boolean> {
  if (isOnline() && !id.startsWith("local-")) {
    try {
      await http.delete<ResponsePlanning<null>>(`${PLANS_PATH}/${id}`, { useBaseUrl: false });
      await removePlanLocal(id);
      emitDataChanged();
      return true;
    } catch {
      // fall through
    }
  }

  await removePlanLocal(id);
  await queueMutation("DELETE_PLAN", id, {});
  emitDataChanged();

  if (isOnline()) {
    void syncPendingMutations();
  }

  return true;
}

export async function updateMilestoneOfflineFirst(
  planId: string,
  milestoneId: string,
  actualSaved: number,
): Promise<PlanDetail | null> {
  if (isOnline()) {
    try {
      const res = await http.patch<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${planId}/milestones/${milestoneId}`,
        { actualSaved },
        { useBaseUrl: false },
      );
      if (res.data) {
        await savePlanDetailLocal(res.data);
        emitDataChanged();
        return res.data;
      }
    } catch {
      // fall through
    }
  }

  const detail = await getPlanDetailLocal(planId);
  if (!detail) return null;

  const milestones = detail.milestones.map((m) =>
    m.id === milestoneId ? { ...m, actualSaved } : m,
  );
  const totalSaved = milestones.reduce((sum, m) => sum + m.actualSaved, 0);
  const remaining = Math.max(detail.targetAmount - totalSaved, 0);
  const progressPercent = detail.targetAmount
    ? Math.min(Math.round((totalSaved / detail.targetAmount) * 100), 100)
    : 0;

  const updated: PlanDetail = {
    ...detail,
    milestones,
    totalSaved,
    remaining,
    progressPercent,
    updatedAt: new Date().toISOString(),
  };

  await savePlanDetailLocal(updated);
  await queueMutation("UPDATE_MILESTONE", planId, { milestoneId, actualSaved });
  emitDataChanged();

  if (isOnline()) {
    void syncPendingMutations();
  }

  return updated;
}

export async function completeMilestoneOfflineFirst(
  planId: string,
  milestoneId: string,
): Promise<PlanDetail | null> {
  if (isOnline()) {
    try {
      const res = await http.post<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${planId}/milestones/${milestoneId}/complete`,
        undefined,
        { useBaseUrl: false },
      );
      if (res.data) {
        await savePlanDetailLocal(res.data);
        emitDataChanged();
        return res.data;
      }
    } catch {
      // fall through
    }
  }

  const detail = await getPlanDetailLocal(planId);
  if (!detail) return null;

  const milestones = detail.milestones.map((m) =>
    m.id === milestoneId ? { ...m, status: "COMPLETED" as const } : m,
  );

  const updated: PlanDetail = {
    ...detail,
    milestones,
    updatedAt: new Date().toISOString(),
  };

  await savePlanDetailLocal(updated);
  await queueMutation("COMPLETE_MILESTONE", planId, { milestoneId });
  emitDataChanged();

  if (isOnline()) {
    void syncPendingMutations();
  }

  return updated;
}
