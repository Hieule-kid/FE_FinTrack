/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const API_GET_TIMEOUT_MS = 3000;

const staticAssetCache: RuntimeCaching = {
  matcher({ request }) {
    return (
      request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "worker" ||
      request.destination === "font"
    );
  },
  handler: new StaleWhileRevalidate({
    cacheName: "fintrack-static-assets",
  }),
};

const imageCache: RuntimeCaching = {
  matcher({ request }) {
    return request.destination === "image";
  },
  handler: new CacheFirst({
    cacheName: "fintrack-images",
    matchOptions: { ignoreVary: true },
  }),
};

// NetworkFirst for user-profile reads (/api/users/profile, etc.).
// Responses are stored in the SW cache so the profile is readable offline
// even after a hard reload. The sessionStorage copy in use-profile.ts covers
// single-session reads; the SW cache covers cross-session offline reads.
const userApiGetCache: RuntimeCaching = {
  matcher({ url, request }) {
    return request.method === "GET" && url.pathname.startsWith("/api/users/");
  },
  handler: new NetworkFirst({
    cacheName: "fintrack-user-api",
    networkTimeoutSeconds: API_GET_TIMEOUT_MS / 1000,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response?.ok ? response : null,
      },
    ],
  }),
};

// Planning GET requests are NOT cached at the SW level. fetchPlansOfflineFirst
// already handles offline via IDB. SW-level caching here caused stale data: on
// slow networks (>3s timeout) the SW served an old empty response which then
// overwrote the IDB cache, making plans disappear.
const planningGetCache: RuntimeCaching = {
  matcher({ url, request }) {
    return (
      request.method === "GET" &&
      url.pathname.startsWith("/api/planning/") &&
      !url.pathname.includes("/auth/")
    );
  },
  handler: new NetworkOnly(),
};

const authAndMutationsCache: RuntimeCaching = {
  matcher({ url, request }) {
    const isAuth = url.pathname.startsWith("/api/auth/");
    const isMutation =
      request.method !== "GET" && url.pathname.startsWith("/api/planning/");
    return isAuth || isMutation;
  },
  handler: new NetworkOnly(),
};

// Cache full-page HTML for hard reloads / initial loads while offline.
// RSC payloads (_rsc requests) are intentionally NOT cached here — they carry
// a state diff keyed to next-router-state-tree, so replaying a cached diff
// against a different tree causes React to render duplicate content.
const navigationCache: RuntimeCaching = {
  matcher({ request, url }) {
    return (
      request.mode === "navigate" &&
      !url.pathname.startsWith("/api/") &&
      url.pathname !== "/login" &&
      url.pathname !== "/register"
    );
  },
  handler: new NetworkFirst({
    cacheName: "fintrack-pages",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response?.ok ? response : null,
      },
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    authAndMutationsCache,
    navigationCache,
    userApiGetCache,
    planningGetCache,
    staticAssetCache,
    imageCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ─── Background Sync ──────────────────────────────────────────────────────────
// Khi thiết bị mất mạng rồi có mạng trở lại, trình duyệt tự động kích hoạt
// sự kiện 'sync' này — kể cả khi người dùng đã đóng tab FinTrack.
// SW sẽ postMessage tới tất cả tab đang mở để trang kích hoạt sync-manager.
// Nếu không có tab nào mở, trình duyệt sẽ retry sự kiện này sau.
self.addEventListener("sync", (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "fintrack-sync-mutations") {
    syncEvent.waitUntil(triggerSyncInClients());
  }
});

// Always run headless sync so waitUntil holds a real promise — the browser will
// retry the Background Sync event if the promise rejects, but postMessage is
// fire-and-forget and resolves waitUntil immediately without waiting for the
// tab-side sync to complete.  Once runHeadlessSync() finishes the queue is
// empty, so any tab that receives the postMessage finds nothing to replay.
async function triggerSyncInClients(): Promise<void> {
  await runHeadlessSync();

  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windowClients) {
    client.postMessage({ type: "FINTRACK_TRIGGER_SYNC" });
  }
}

// ─── Headless sync (chạy trong SW khi không có tab nào mở) ───────────────────
const DB_NAME = "fintrack-offline";
const DB_VERSION = 2; // must match lib/offline/db.ts
const PLANS_PATH = "/api/planning/api/v1/plans";

// Mở IndexedDB từ trong SW context (không dùng thư viện idb, dùng raw API).
// onupgradeneeded must mirror the schema in lib/offline/db.ts exactly so that
// a headless sync that fires before any tab has opened (fresh install or cleared
// site data) creates the object stores before getPendingRaw tries to use them.
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
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
        store.createIndex("by-created", "clientUpdatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

interface RawMutation {
  id: string;
  operation: string;
  entityId: string;
  payload: unknown;
  clientUpdatedAt: string;
  retryCount: number;
}

// Đọc tất cả bản ghi chưa sync từ object store "mutations", ordered by index.
// Using the "by-created" IDB index (keyed on clientUpdatedAt) keeps the ordering
// consistent with lib/offline/db.ts and avoids JS-level sort divergence.
function getPendingRaw(db: IDBDatabase): Promise<RawMutation[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations", "readonly");
    const req = tx.objectStore("mutations").index("by-created").getAll();
    req.onsuccess = () => resolve(req.result as RawMutation[]);
    req.onerror = () => reject(req.error);
  });
}

interface RawPlan {
  id: string;
  [key: string]: unknown;
}

// Persist a server-assigned plan into the plans + planMeta stores.
function savePlanRaw(db: IDBDatabase, plan: RawPlan): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const tx = db.transaction(["plans", "planMeta"], "readwrite");
    tx.objectStore("plans").put(plan);
    tx.objectStore("planMeta").put({
      id: plan.id,
      isLocalOnly: false,
      clientUpdatedAt: now,
      serverUpdatedAt: now,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Remove a local-* placeholder from all three plan stores.
function deletePlanRaw(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["plans", "planDetails", "planMeta"], "readwrite");
    tx.objectStore("plans").delete(id);
    tx.objectStore("planDetails").delete(id);
    tx.objectStore("planMeta").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Xóa mutation đã sync thành công khỏi hàng đợi
function deleteMutationRaw(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations", "readwrite");
    const req = tx.objectStore("mutations").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Áp dụng một mutation lên backend (gọi BFF proxy; cookie tự động đi kèm)
async function applyHeadlessMutation(mutation: RawMutation, db: IDBDatabase): Promise<boolean> {
  const { operation, entityId, payload } = mutation;
  const headers = { "Content-Type": "application/json" };
  const opts = (method: string, body?: unknown): RequestInit => ({
    method,
    credentials: "include", // gửi kèm HttpOnly cookie access_token
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  try {
    switch (operation) {
      case "CREATE_PLAN": {
        const { localId, ...body } = payload as Record<string, unknown>;
        const res = await fetch(PLANS_PATH, opts("POST", body));
        if (!res.ok) return false;
        // Reconcile: remove the local-* placeholder and save the server-assigned plan.
        try {
          const json = await res.json() as { data?: RawPlan };
          const plan = json.data;
          if (plan?.id) {
            if (typeof localId === "string" && localId.startsWith("local-")) {
              await deletePlanRaw(db, localId);
            }
            await savePlanRaw(db, plan);
          }
        } catch {
          // JSON parse failed — plan is on the server; UI will reconcile on next fetch.
        }
        return true;
      }
      case "UPDATE_PLAN": {
        if (entityId.startsWith("local-")) return true;
        const res = await fetch(`${PLANS_PATH}/${entityId}`, opts("PUT", payload));
        return res.ok;
      }
      case "DELETE_PLAN": {
        if (entityId.startsWith("local-")) return true;
        const res = await fetch(`${PLANS_PATH}/${entityId}`, opts("DELETE"));
        return res.ok;
      }
      case "UPDATE_MILESTONE": {
        if (entityId.startsWith("local-")) return true;
        const { milestoneId, actualSaved } = payload as { milestoneId: string; actualSaved: number };
        const res = await fetch(
          `${PLANS_PATH}/${entityId}/milestones/${milestoneId}`,
          opts("PATCH", { actualSaved }),
        );
        return res.ok;
      }
      case "COMPLETE_MILESTONE": {
        if (entityId.startsWith("local-")) return true;
        const { milestoneId } = payload as { milestoneId: string };
        const res = await fetch(
          `${PLANS_PATH}/${entityId}/milestones/${milestoneId}/complete`,
          opts("POST"),
        );
        return res.ok;
      }
      case "UNDO_MILESTONE": {
        if (entityId.startsWith("local-")) return true;
        const { milestoneId } = payload as { milestoneId: string };
        const res = await fetch(
          `${PLANS_PATH}/${entityId}/milestones/${milestoneId}/undo`,
          opts("POST"),
        );
        return res.ok;
      }
      default:
        return false;
    }
  } catch {
    // Mạng không ổn định — sẽ retry ở lần sync sau
    return false;
  }
}

// Hàm sync headless: đọc queue → gọi API → xóa bản ghi đã sync
async function runHeadlessSync(): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openIDB();
  } catch {
    return; // IndexedDB chưa có dữ liệu — bỏ qua
  }

  const mutations = await getPendingRaw(db);
  for (const mutation of mutations) {
    const ok = await applyHeadlessMutation(mutation, db);
    if (ok) {
      await deleteMutationRaw(db, mutation.id);
    }
  }

  db.close();
}
