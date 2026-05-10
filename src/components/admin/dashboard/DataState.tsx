"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataStateStatus = "loading" | "empty" | "error" | "ready";

type DataStateProps = {
  status: DataStateStatus;
  children: ReactNode;
  loading?: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  className?: string;
};

const fallbackShell = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)]";

export function DataState({ status, children, loading, empty, error, className }: DataStateProps) {
  if (status === "loading") {
    return <div className={cn(fallbackShell, className)}>{loading ?? "Loading..."}</div>;
  }

  if (status === "empty") {
    return <div className={cn(fallbackShell, className)}>{empty ?? "No data available."}</div>;
  }

  if (status === "error") {
    return <div className={cn(fallbackShell, "border-[var(--accent-danger)]/30 text-[var(--accent-danger)]", className)}>{error ?? "Unable to load data."}</div>;
  }

  return <>{children}</>;
}