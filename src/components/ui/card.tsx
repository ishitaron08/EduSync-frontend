import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
