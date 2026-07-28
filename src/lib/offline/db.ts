import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Plan, PlanDetail } from "@/features/planning/types";
import type { LocalPlanMeta, PendingMutation } from "./types";

interface FinTrackDB extends DBSchema {
  plans: {
    key: string;
    value: Plan;
  };
  planDetails: {
    key: string;
    value: PlanDetail;
  };
  planMeta: {
    key: string;
    value: LocalPlanMeta;
  };
  mutations: {
    key: string;
    value: PendingMutation;
    indexes: { "by-created": string };
  };
}

const DB_NAME = "fintrack-offline";
// Bumped to 2: ensures planMeta and planDetails stores are created for users
// who have a v1 IDB from the initial PWA deployment that lacked those stores.
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<FinTrackDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FinTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("plans")) {
          db.createObjectStore("plans", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("planDetails")) {
          db.createObjectStore("planDetails", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("planMeta")) {
          db.createObjectStore("planMeta", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("mutations")) {
          const store = db.createObjectStore("mutations", { keyPath: "id" });
          store.createIndex("by-created", "clientUpdatedAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllPlansLocal(): Promise<Plan[]> {
  const db = await getDb();
  return db.getAll("plans");
}

export async function getPlanLocal(id: string): Promise<Plan | undefined> {
  const db = await getDb();
  return db.get("plans", id);
}

export async function getPlanDetailLocal(id: string): Promise<PlanDetail | undefined> {
  const db = await getDb();
  return db.get("planDetails", id);
}

export async function savePlansLocal(plans: Plan[], markSynced = true): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["plans", "planMeta"], "readwrite");
  const now = new Date().toISOString();

  await Promise.all([
    ...plans.map((plan) => tx.objectStore("plans").put(plan)),
    ...plans.map((plan) =>
      tx.objectStore("planMeta").put({
        id: plan.id,
        isLocalOnly: false,
        clientUpdatedAt: now,
        serverUpdatedAt: now,
      }),
    ),
    tx.done,
  ]);

  if (!markSynced) return;
}

export async function savePlanLocal(plan: Plan, isLocalOnly = false): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const tx = db.transaction(["plans", "planMeta"], "readwrite");

  await Promise.all([
    tx.objectStore("plans").put(plan),
    tx.objectStore("planMeta").put({
      id: plan.id,
      isLocalOnly,
      clientUpdatedAt: now,
      serverUpdatedAt: isLocalOnly ? undefined : now,
    }),
    tx.done,
  ]);
}

export async function savePlanDetailLocal(detail: PlanDetail): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const tx = db.transaction(["planDetails", "plans", "planMeta"], "readwrite");

  const summary: Plan = {
    id: detail.id,
    goalTitle: detail.goalTitle,
    targetAmount: detail.targetAmount,
    currency: detail.currency,
    planCategory: detail.planCategory,
    timeframeCategory: detail.timeframeCategory,
    frequency: detail.frequency,
    startDate: detail.startDate,
    recalculateOnMissedDeadline: detail.recalculateOnMissedDeadline,
    totalSaved: detail.totalSaved,
    remaining: detail.remaining,
    progressPercent: detail.progressPercent,
  };

  await Promise.all([
    tx.objectStore("planDetails").put(detail),
    tx.objectStore("plans").put(summary),
    tx.objectStore("planMeta").put({
      id: detail.id,
      isLocalOnly: false,
      clientUpdatedAt: now,
      serverUpdatedAt: now,
    }),
    tx.done,
  ]);
}

export async function removePlanLocal(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["plans", "planDetails", "planMeta"], "readwrite");
  await Promise.all([
    tx.objectStore("plans").delete(id),
    tx.objectStore("planDetails").delete(id),
    tx.objectStore("planMeta").delete(id),
    tx.done,
  ]);
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  const db = await getDb();
  const mutations = await db.getAllFromIndex("mutations", "by-created");
  return mutations.sort((a, b) => a.clientUpdatedAt.localeCompare(b.clientUpdatedAt));
}

export async function addPendingMutation(mutation: PendingMutation): Promise<void> {
  const db = await getDb();
  await db.put("mutations", mutation);
}

export async function removePendingMutation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("mutations", id);
}

export async function updatePendingMutation(mutation: PendingMutation): Promise<void> {
  const db = await getDb();
  await db.put("mutations", mutation);
}

export async function getPlanMeta(id: string): Promise<LocalPlanMeta | undefined> {
  const db = await getDb();
  return db.get("planMeta", id);
}

export function createLocalId(): string {
  return `local-${crypto.randomUUID()}`;
}

export function createMutationId(): string {
  return `mutation-${crypto.randomUUID()}`;
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["plans", "planDetails", "planMeta", "mutations"], "readwrite");
  await Promise.all([
    tx.objectStore("plans").clear(),
    tx.objectStore("planDetails").clear(),
    tx.objectStore("planMeta").clear(),
    tx.objectStore("mutations").clear(),
    tx.done,
  ]);
}
