import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { Typography } from "@/components/ui/typography";

export default function OfflinePage() {
  return (
    <PageContainer className="grid gap-4 py-16 text-center">
      <Typography as="h1" variant="h1">
        You&apos;re offline
      </Typography>
      <Typography variant="muted" className="max-w-md mx-auto">
        FinTrack is still available. Your goals, dashboard, and savings progress
        are stored on this device. Changes will sync automatically when you
        reconnect.
      </Typography>
      <Link
        href="/dashboard"
        className="inline-flex mx-auto mt-2 px-5 py-2.5 rounded-full bg-(--brand) text-white font-semibold text-sm"
      >
        Go to Dashboard
      </Link>
    </PageContainer>
  );
}
