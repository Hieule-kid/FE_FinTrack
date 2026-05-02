import { clearAccessToken } from "./token";

export function handleUnauthorized(status: number): void {
  if (status === 401) {
    clearAccessToken();
  }
}
