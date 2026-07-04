import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "ui-button--primary",
  secondary: "ui-button--secondary",
  ghost: "ui-button--ghost",
};

const sizeClassMap: Record<ButtonSize, string> = {
  md: "ui-button--md",
  sm: "ui-button--sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-button",
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
