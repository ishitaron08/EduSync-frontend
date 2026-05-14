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
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--shadow-soft)]", className)}>
      <svg className="mb-4 h-14 w-14 text-[var(--accent-secondary)]/45" viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="12" y="14" width="40" height="36" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 26h24M20 34h18M20 42h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
