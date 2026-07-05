"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import { Header } from "./header";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return children;
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  );
}
