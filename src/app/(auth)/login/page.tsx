import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { authCookies } from "@/config/cookies";
import { PageContainer } from "@/components/common/page-container";
import { Typography } from "@/components/ui/typography";
import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookies.accessToken)?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  return (
    <PageContainer className="auth-layout gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-row justify-center">
          <Link className="brand" href="/" aria-label="FinTrack home">
            <Image
              src="/fin_logo.svg"
              alt="FinTrack logo"
              width={120}
              height={120}
            />
          </Link>
        </div>

        <Typography variant="title">Finance Plan</Typography>
        <Typography variant="muted">Personal Finance Goal Tracker</Typography>
      </div>
      <LoginForm />
      
    </PageContainer>
  );
}
