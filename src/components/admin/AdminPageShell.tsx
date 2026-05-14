"use client";

import type { ReactNode } from "react";

type AdminPageShellProps = {
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({
  actions,
  children
}: AdminPageShellProps) {
  return (
    <main className="mx-auto min-h-full max-w-[1600px] space-y-4 px-4 py-4 md:px-6 lg:px-8">
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      {children}
    </main>
  );
}
