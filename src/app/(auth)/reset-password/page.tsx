import type { Metadata } from "next";
import { PageContainer } from "@/components/common/page-container";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

// The reset token travels in the query string; never leak it via the Referer header.
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return (
    <PageContainer className="flex flex-col items-center pt-5 min-h-screen justify-center gap-5">
      <ResetPasswordForm token={value || undefined} />
    </PageContainer>
  );
}
