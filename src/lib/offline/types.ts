export type SyncOperation =
  | "CREATE_PLAN"
  | "UPDATE_PLAN"
  | "DELETE_PLAN"
  | "UPDATE_MILESTONE"
  | "COMPLETE_MILESTONE"
  | "UNDO_MILESTONE";

export type SyncStatus = "idle" | "syncing" | "error" | "conflict" | "auth_required";

export interface PendingMutation {
  id: string;
  operation: SyncOperation;
  entityId: string;
  payload: unknown;
  clientUpdatedAt: string;
  retryCount: number;
}

export interface LocalPlanMeta {
  id: string;
  isLocalOnly: boolean;
  clientUpdatedAt: string;
  serverUpdatedAt?: string;
}

export interface SyncProgress {
  status: SyncStatus;
  total: number;
  completed: number;
  failed: number;
  message: string;
}

export const SYNC_PROGRESS_EVENT = "fintrack:sync-progress";
export const DATA_CHANGED_EVENT = "fintrack:data-changed";

export function emitSyncProgress(progress: SyncProgress) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNC_PROGRESS_EVENT, { detail: progress }));
  }
}

export function emitDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}
