import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className
}: {
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.05)]", className)}>
      <svg className="mb-4 h-16 w-16 text-[var(--accent-secondary)]/40" viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        <path d="M32 12 L38 26 L52 28 L42 38 L44 52 L32 46 L20 52 L22 38 L12 28 L26 26 Z" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      {action &&
        (action.href ? (
          <a href={action.href} className="mt-4">
            <Button variant="filled">{action.label}</Button>
          </a>
        ) : (
          <Button variant="filled" className="mt-4" type="button" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
