import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { authCookies } from "@/config/cookies";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookies.accessToken)?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  return (
    <PageContainer className="auth-layout">
      <LoginForm />
    </PageContainer>
  );
}
