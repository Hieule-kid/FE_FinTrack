import { PageContainer } from "@/components/common/page-container";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <PageContainer className="flex flex-col items-center pt-5 min-h-screen justify-center">
      <RegisterForm />
    </PageContainer>
  );
}
