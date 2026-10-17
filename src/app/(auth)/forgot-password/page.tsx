import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookies } from "@/config/cookies";
import { PageContainer } from "@/components/common/page-container";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const cookieStore = await cookies();
  if (cookieStore.get(authCookies.accessToken)?.value) {
    redirect("/dashboard");
  }

  return (
    <PageContainer className="flex flex-col items-center pt-5 min-h-screen justify-center gap-5">
      <ForgotPasswordForm />
    </PageContainer>
  );
}
