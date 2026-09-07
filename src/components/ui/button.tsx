import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "logout" | "danger";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "ui-button--primary",
  secondary: "ui-button--secondary",
  ghost: "ui-button--ghost",
  logout: "ui-button--logout",
  danger: "ui-button--danger",
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
  icon,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-button",
        variantClassMap[variant],
        sizeClassMap[size],
        'cursor-pointer',
        className,
      )}
      type={type}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="ui-button__icon">{icon}</span>}
      {children}
    </button>
  );
}
