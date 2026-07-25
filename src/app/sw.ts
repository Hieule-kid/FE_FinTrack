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

const AUTH_PATHS = new Set(["/login", "/register"]);

function isAppPage(url: URL): boolean {
  return !url.pathname.startsWith("/api/") && !AUTH_PATHS.has(url.pathname);
}

// Cache full-page HTML (initial load / hard reload).
const navigationCache: RuntimeCaching = {
  matcher({ request, url }) {
    return request.mode === "navigate" && isAppPage(url);
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

// Cache RSC payloads (Next.js client-side navigation).
// _rsc is a random nonce — strip it from the cache key so the same path
// always maps to the same cache entry regardless of nonce value.
const rscCache: RuntimeCaching = {
  matcher({ request, url }) {
    return (
      request.method === "GET" &&
      isAppPage(url) &&
      (url.searchParams.has("_rsc") || request.headers.get("rsc") === "1")
    );
  },
  handler: new NetworkFirst({
    cacheName: "fintrack-rsc",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          const u = new URL(request.url);
          u.searchParams.delete("_rsc");
          return u.toString();
        },
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
    rscCache,
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
