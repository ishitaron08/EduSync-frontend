"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type TabChromeProps = {
  actions?: ReactNode;
  children?: ReactNode;
};

export function TabChrome({ actions, children }: TabChromeProps) {
  return (
    <div className="space-y-4">
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      {children}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminEmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-5 text-sm text-[var(--text-muted)]">
      <p className="text-base font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 max-w-2xl">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
