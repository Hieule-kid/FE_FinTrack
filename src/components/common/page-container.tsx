import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section className={cn("page-container", className)}>{children}</section>
  );
}
