import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { className, id, label, hint, error, options, ...props },
    ref,
  ) {
    return (
      <label className="ui-field" htmlFor={id}>
        {label ? (
          <Typography as="span" variant="label">
            {label}
          </Typography>
        ) : null}
        <select
          ref={ref}
          className={cn("ui-input", error && "ui-input--error", className)}
          id={id}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
  },
);
