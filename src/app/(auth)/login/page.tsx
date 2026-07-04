import { PageContainer } from "@/components/common/page-container";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <PageContainer className="auth-layout">
      <LoginForm />
    </PageContainer>
  );
}
