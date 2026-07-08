import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section className={cn("max-w-400 mx-auto px-4.5", className)}>{children}</section>
  );
}
