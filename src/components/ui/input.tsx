import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, label, hint, ...props },
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
        className={cn("ui-input", className)}
        id={id}
        {...props}
      />
      {hint ? (
        <Typography as="span" variant="caption">
          {hint}
        </Typography>
      ) : null}
    </label>
  );
});
