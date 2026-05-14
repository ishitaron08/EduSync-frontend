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
    <main className="mx-auto min-h-full w-full max-w-full space-y-4 px-3 py-4 sm:px-4 md:px-6 lg:max-w-[1600px] lg:px-8">
      {actions ? (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>*]:min-w-0">
          {actions}
        </div>
      ) : null}
      {children}
    </main>
  );
}
