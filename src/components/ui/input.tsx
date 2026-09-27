import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, label, hint, error, ...props },
  ref,
) {
  return (
    <label className="ui-field" htmlFor={id}>
      {label ? (
        <Typography as="span" variant="label">
          {label}
        </Typography>
      ) : null}
      <input
        ref={ref}
        className={cn("ui-input", error && "ui-input--error", className)}
        id={id}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <Typography as="span" variant="caption" className="ui-field__error">
          {error}
        </Typography>
      ) : hint ? (
        <Typography as="span" variant="caption">
          {hint}
        </Typography>
      ) : null}
    </label>
  );
});
