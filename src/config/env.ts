export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8088",
  authServiceBaseUrl:
    process.env.AUTH_SERVICE_BASE_URL ?? "http://localhost:8081",
  planningServiceBaseUrl:
    process.env.PLANNING_SERVICE_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8090",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FinTrack",
};
