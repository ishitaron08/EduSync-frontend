"use client";

import type { ReactNode } from "react";

type TeacherPageShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "wide" | "compact";
};

export function TeacherPageShell({
  actions,
  children,
  maxWidth = "wide"
}: TeacherPageShellProps) {
  return (
    <main className={`mx-auto w-full ${maxWidth === "wide" ? "max-w-6xl" : "max-w-4xl"} space-y-4 px-3 py-4 md:px-6`}>
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      {children}
    </main>
  );
}
