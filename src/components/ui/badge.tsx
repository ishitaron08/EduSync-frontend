import { cn } from "@/lib/utils";

type BadgeTone = "amber" | "blue" | "green" | "muted";

const tones: Record<BadgeTone, string> = {
  amber: "border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  blue: "border border-sky-600/20 bg-sky-600/10 text-sky-700",
  green: "border border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 text-[var(--accent-success)]",
  muted: "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]"
};

export function Badge({
  children,
  tone = "amber",
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
