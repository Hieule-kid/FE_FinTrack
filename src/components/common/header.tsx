"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageContainer } from "./page-container";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-(--line) bg-white/72 backdrop-blur">
      <PageContainer className="min-h-18 flex items-center justify-between gap-3.5">
        <Link className="inline-flex items-center gap-2.5 font-display text-[23px] font-bold text-[#0f2147]" href="/">
          <span
            className="w-3 h-3 rounded-full bg-[linear-gradient(150deg,#2f74ff_0%,#00a2ff_100%)] shadow-[0_0_0_6px_rgba(47,116,255,0.15)]"
            aria-hidden="true"
          />
          FinPlan
        </Link>

        <nav className="flex flex-wrap gap-1.5" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3.5 py-2 rounded-full text-muted text-sm font-semibold",
                pathname === item.href && "bg-[#ecf2ff] text-brand-strong",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PageContainer>
    </header>
  );
}
