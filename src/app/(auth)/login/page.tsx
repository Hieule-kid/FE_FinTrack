import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookies } from "@/config/cookies";
import { PageContainer } from "@/components/common/page-container";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookies.accessToken)?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  return (
    <PageContainer className="flex flex-col items-center pt-5 min-h-screen justify-center gap-5">
      <LoginForm />
    </PageContainer>
  );
}
