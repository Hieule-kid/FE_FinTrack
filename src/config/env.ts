export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  serverApiBaseUrl:
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FinTrack",
};
