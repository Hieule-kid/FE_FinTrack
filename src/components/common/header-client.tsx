"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/features/language/hooks/use-language";
import { PageContainer } from "./page-container";

const navRoutes = [
  { href: "/dashboard", labelKey: "header.dashboard" },
  { href: "/expenses", labelKey: "header.expenses" },
  { href: "/settings", labelKey: "header.settings" },
];

function NavLinks({
  pathname,
  className,
}: {
  pathname: string;
  className: string;
}) {
  const { t } = useLanguage();

  return (
    <nav className={className} aria-label="Main navigation">
      {navRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "px-3.5 py-2 rounded-full text-muted text-sm font-semibold",
            pathname === route.href && "bg-[#ecf2ff] text-brand-strong",
          )}
        >
          {t(route.labelKey)}
        </Link>
      ))}
    </nav>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-(--line) bg-white/72 backdrop-blur">
      <PageContainer className="min-h-18 flex items-center justify-between gap-3.5 relative">
        <Link
          className="inline-flex items-center gap-2.5 font-display text-[23px] font-bold text-[#0f2147]"
          href="/"
        >
          <span
            className="w-3 h-3 rounded-full bg-[linear-gradient(150deg,#2f74ff_0%,#00a2ff_100%)] shadow-[0_0_0_6px_rgba(47,116,255,0.15)]"
            aria-hidden="true"
          />
          FinPlan
        </Link>

        <NavLinks
          pathname={pathname}
          className="hidden md:flex flex-wrap gap-1.5"
        />

        <button
          type="button"
          className="md:hidden relative h-9 w-9 inline-flex items-center justify-center rounded-full"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className={cn(
              "absolute h-0.5 w-5 rounded-full bg-brand-strong transition-all duration-300",
              menuOpen ? "rotate-45" : "-translate-y-1.5",
            )}
          />
          <span
            className={cn(
              "absolute h-0.5 w-5 rounded-full bg-brand-strong transition-all duration-300",
              menuOpen ? "opacity-0" : "opacity-100",
            )}
          />
          <span
            className={cn(
              "absolute h-0.5 w-5 rounded-full bg-brand-strong transition-all duration-300",
              menuOpen ? "-rotate-45" : "translate-y-1.5",
            )}
          />
        </button>
      </PageContainer>
      {menuOpen && (
        <NavLinks
          pathname={pathname}
          className="md:hidden flex flex-col gap-1 border-t border-(--line) px-4.5 py-3 justify-self-end absolute bg-white"
        />
      )}
    </header>
  );
}
