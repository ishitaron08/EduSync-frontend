import { cn } from "@/lib/utils";

type BadgeTone = "amber" | "blue" | "green" | "muted" | "destructive" | "outline";

const tones: Record<BadgeTone, string> = {
  amber: "border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  blue: "border border-sky-600/20 bg-sky-600/10 text-sky-700",
  green: "border border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 text-[var(--accent-success)]",
  muted: "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]",
  destructive: "border border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]",
  outline: "border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)]"
};

export function Badge({
  children,
  tone = "amber",
  variant,
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  variant?: BadgeTone;
  className?: string;
}) {
  const effectiveTone = variant || tone;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[effectiveTone],
        className
      )}
    >
      {children}
    </span>
  );
}
