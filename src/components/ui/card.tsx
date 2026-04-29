import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-shadow duration-300",
        "border-t border-t-[var(--border-highlight)]/75 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}
