import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[0_1px_0_oklch(22%_0.035_246_/_0.02)] ring-offset-[var(--bg-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-200 focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12 focus-visible:shadow-[inset_0_1px_2px_oklch(47%_0.100_186_/_0.08)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
