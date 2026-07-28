export async function handleUnauthorized(status: number): Promise<void> {
  if (status === 401) {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }
}
