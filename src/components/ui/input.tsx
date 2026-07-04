import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
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
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input
        ref={ref}
        className={cn("ui-input", className)}
        id={id}
        {...props}
      />
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
});
