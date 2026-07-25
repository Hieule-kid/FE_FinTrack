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
  getPendingMutations,
  removePendingMutation,
  removePlanLocal,
  savePlanDetailLocal,
  savePlanLocal,
  updatePendingMutation,
} from "@/lib/offline/db";
import { isOnline, subscribeOnlineStatus } from "@/lib/offline/network";
import type { PendingMutation, SyncProgress } from "@/lib/offline/types";
import { emitDataChanged, emitSyncProgress } from "@/lib/offline/types";

const PLANS_PATH = "/api/planning/api/v1/plans";

let syncInFlight = false;
let unsubscribeOnline: (() => void) | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function setProgress(progress: SyncProgress) {
  emitSyncProgress(progress);
}

async function applyMutation(mutation: PendingMutation): Promise<boolean> {
  const { operation, entityId, payload } = mutation;

  switch (operation) {
    case "CREATE_PLAN": {
      const body = payload as CreatePlanPayload & { localId: string };
      const { localId, ...createPayload } = body;
      const res = await http.post<ResponsePlanning<Plan>>(PLANS_PATH, createPayload, {
        useBaseUrl: false,
        skipUnauthorized: true,
      });
      const plan = res.data;
      if (!plan) return false;

      if (localId.startsWith("local-")) {
        await removePlanLocal(localId);
      }
      await savePlanLocal(plan, false);
      return true;
    }
    case "UPDATE_PLAN": {
      if (entityId.startsWith("local-")) return true;
      const res = await http.put<ResponsePlanning<Plan>>(
        `${PLANS_PATH}/${entityId}`,
        payload as UpdatePlanPayload,
        { useBaseUrl: false, skipUnauthorized: true },
      );
      if (res.data) await savePlanLocal(res.data, false);
      return Boolean(res.data);
    }
    case "DELETE_PLAN": {
      if (entityId.startsWith("local-")) return true;
      await http.delete<ResponsePlanning<null>>(`${PLANS_PATH}/${entityId}`, {
        useBaseUrl: false,
        skipUnauthorized: true,
      });
      return true;
    }
    case "UPDATE_MILESTONE": {
      if (entityId.startsWith("local-")) return true;
      const { milestoneId, actualSaved } = payload as {
        milestoneId: string;
        actualSaved: number;
      };
      const res = await http.patch<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${entityId}/milestones/${milestoneId}`,
        { actualSaved },
        { useBaseUrl: false, skipUnauthorized: true },
      );
      if (res.data) await savePlanDetailLocal(res.data);
      return Boolean(res.data);
    }
    case "COMPLETE_MILESTONE": {
      if (entityId.startsWith("local-")) return true;
      const { milestoneId } = payload as { milestoneId: string };
      const res = await http.post<ResponsePlanning<PlanDetail>>(
        `${PLANS_PATH}/${entityId}/milestones/${milestoneId}/complete`,
        undefined,
        { useBaseUrl: false, skipUnauthorized: true },
      );
      if (res.data) await savePlanDetailLocal(res.data);
      return Boolean(res.data);
    }
    default:
      return false;
  }
}

export async function syncPendingMutations(): Promise<SyncProgress> {
  if (syncInFlight || !isOnline()) {
    return { status: "idle", total: 0, completed: 0, failed: 0, message: "" };
  }

  syncInFlight = true;
  const pending = await getPendingMutations();
  const total = pending.length;

  if (total === 0) {
    syncInFlight = false;
    const idle: SyncProgress = {
      status: "idle",
      total: 0,
      completed: 0,
      failed: 0,
      message: "All changes synced",
    };
    setProgress(idle);
    return idle;
  }

  setProgress({
    status: "syncing",
    total,
    completed: 0,
    failed: 0,
    message: `Syncing ${total} offline change${total === 1 ? "" : "s"}…`,
  });

  let completed = 0;
  let failed = 0;

  for (const mutation of pending) {
    try {
      const ok = await applyMutation(mutation);
      if (ok) {
        await removePendingMutation(mutation.id);
        completed += 1;
      } else {
        failed += 1;
        await updatePendingMutation({
          ...mutation,
          retryCount: mutation.retryCount + 1,
        });
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        failed += 1;
        setProgress({
          status: "conflict",
          total,
          completed,
          failed,
          message: "Some changes conflict with server data. Local copies were kept.",
        });
        await updatePendingMutation({
          ...mutation,
          retryCount: mutation.retryCount + 1,
        });
        continue;
      }

      failed += 1;
      await updatePendingMutation({
        ...mutation,
        retryCount: mutation.retryCount + 1,
      });
    }

    setProgress({
      status: failed > 0 ? "error" : "syncing",
      total,
      completed,
      failed,
      message: `Synced ${completed} of ${total} changes`,
    });
  }

  emitDataChanged();

  const finalProgress: SyncProgress = {
    status: failed > 0 ? "error" : "idle",
    total,
    completed,
    failed,
    message:
      failed > 0
        ? `${failed} change${failed === 1 ? "" : "s"} could not sync yet`
        : "All offline changes synced",
  };

  setProgress(finalProgress);
  syncInFlight = false;


  // error (e.g. backend not yet reachable right after WiFi reconnects) doesn't
  // leave the queue stuck until the next online/offline cycle.
  if (failed > 0 && isOnline()) {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (isOnline()) void syncPendingMutations();
    }, 5000);
  }

  return finalProgress;
}

export function startAutoSync(): () => void {
  if (typeof window === "undefined") return () => {};

  if (!unsubscribeOnline) {
    unsubscribeOnline = subscribeOnlineStatus((online) => {
      if (online) {
        void syncPendingMutations();
      }
    });

    if (isOnline()) {
      void syncPendingMutations();
    }
  }

  // Lắng nghe tín hiệu từ Service Worker (Background Sync API).
  // Khi SW nhận được 'sync' event và không có tab nào mở, nó sẽ tự sync headless.
  // Khi có tab mở, SW gửi message này để tab kích hoạt sync với đủ context.
  function onSwMessage(event: MessageEvent) {
    if (event.data?.type === "FINTRACK_TRIGGER_SYNC") {
      void syncPendingMutations();
    }
  }

  navigator.serviceWorker.addEventListener("message", onSwMessage);

  return () => {
    unsubscribeOnline?.();
    unsubscribeOnline = null;
    navigator.serviceWorker.removeEventListener("message", onSwMessage);
  };
}

// Đăng ký Background Sync tag với SW — cho phép SW tự sync kể cả khi tab đóng.
// Gọi hàm này mỗi khi thêm một mutation vào hàng đợi khi offline.
export async function registerBackgroundSync(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    // Kiểm tra trình duyệt hỗ trợ Background Sync API
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(
        "fintrack-sync-mutations",
      );
    }
  } catch {
    // Background Sync không được hỗ trợ (Firefox, Safari) — không sao,
    // online event listener phía trên đã đủ để sync khi tab mở.
  }
}
