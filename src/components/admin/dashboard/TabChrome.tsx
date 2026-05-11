"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type TabChromeProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function TabChrome({ eyebrow, title, description, actions, children }: TabChromeProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </Card>

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