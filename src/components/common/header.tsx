"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageContainer } from "./page-container";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <PageContainer className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__dot" aria-hidden="true" />
          FinPlan
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "site-nav__link",
                pathname === item.href && "is-active",
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
