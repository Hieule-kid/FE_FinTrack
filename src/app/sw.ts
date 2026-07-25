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

const planningGetCache: RuntimeCaching = {
  matcher({ url, request }) {
    return (
      request.method === "GET" &&
      url.pathname.startsWith("/api/planning/") &&
      !url.pathname.includes("/auth/")
    );
  },
  handler: new NetworkFirst({
    cacheName: "fintrack-planning-get",
    networkTimeoutSeconds: API_GET_TIMEOUT_MS / 1000,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response?.ok ? response : null,
      },
    ],
  }),
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

// Gửi tín hiệu "hãy sync đi" tới tất cả tab FinTrack đang mở.
// Tab nhận message sẽ gọi syncPendingMutations() (có đủ auth cookie).
async function triggerSyncInClients(): Promise<void> {
  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  if (windowClients.length > 0) {
    // Có ít nhất một tab mở → báo cho tab đó tự sync
    for (const client of windowClients) {
      client.postMessage({ type: "FINTRACK_TRIGGER_SYNC" });
    }
    return;
  }

  // Không có tab nào mở → SW tự gọi BFF proxy trực tiếp.
  // Cookie HttpOnly vẫn được gửi kèm vì cùng origin.
  await runHeadlessSync();
}

// ─── Headless sync (chạy trong SW khi không có tab nào mở) ───────────────────
const DB_NAME = "fintrack-offline";
const DB_VERSION = 1;
const PLANS_PATH = "/api/planning/api/v1/plans";

// Mở IndexedDB từ trong SW context (không dùng thư viện idb, dùng raw API)
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
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

// Đọc tất cả bản ghi chưa sync từ object store "mutations"
function getPendingRaw(db: IDBDatabase): Promise<RawMutation[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations", "readonly");
    const req = tx.objectStore("mutations").getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as RawMutation[]).sort((a, b) =>
          a.clientUpdatedAt.localeCompare(b.clientUpdatedAt),
        ),
      );
    req.onerror = () => reject(req.error);
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
async function applyHeadlessMutation(mutation: RawMutation): Promise<boolean> {
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
        void localId;
        const res = await fetch(PLANS_PATH, opts("POST", body));
        return res.ok;
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
    const ok = await applyHeadlessMutation(mutation);
    if (ok) {
      await deleteMutationRaw(db, mutation.id);
    }
  }

  db.close();
}
