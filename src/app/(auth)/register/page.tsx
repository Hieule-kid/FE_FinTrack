import { PageContainer } from "@/components/common/page-container";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <PageContainer className="auth-layout">
      <RegisterForm />
    </PageContainer>
  );
}
