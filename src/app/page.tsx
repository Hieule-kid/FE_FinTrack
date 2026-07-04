import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookies } from "@/config/cookies";

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookies.accessToken)?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  redirect("/login");
}
