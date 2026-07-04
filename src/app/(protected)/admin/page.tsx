import { PageContainer } from "@/components/common/page-container";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <PageContainer>
      <Card>
        <h1>Admin Workspace</h1>
        <p>Permission-protected area for account and policy management.</p>
      </Card>
    </PageContainer>
  );
}
