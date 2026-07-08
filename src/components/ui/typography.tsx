import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "body"
  | "body-sm"
  | "muted"
  | "caption"
  | "eyebrow"
  | "label";

const variantClassMap: Record<TypographyVariant, string> = {
  h1: "font-display text-h1 leading-tight",
  h2: "font-display text-h2",
  h3: "font-display text-h3",
  title: "text-lg font-bold",
  body: "text-body leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  muted: "text-sm text-muted",
  caption: "text-xs text-muted",
  eyebrow: "m-0 mb-2 text-brand-strong uppercase tracking-[0.08em] text-xs font-bold",
  label: "text-sm font-semibold",
};

function isHeadingVariant(
  variant: TypographyVariant,
): variant is "h1" | "h2" | "h3" {
  return variant === "h1" || variant === "h2" || variant === "h3";
}

type TypographyOwnProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
  children?: ReactNode;
  className?: string;
};

export type TypographyProps<T extends ElementType = "p"> = TypographyOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TypographyOwnProps<T>>;

export function Typography<T extends ElementType = "p">({
  as,
  variant = "body",
  className,
  children,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? (isHeadingVariant(variant) ? variant : "p");

  return (
    <Component
      className={cn("m-0", variantClassMap[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
