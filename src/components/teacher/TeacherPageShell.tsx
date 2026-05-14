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
    <main className={`mx-auto min-h-full w-full max-w-full ${maxWidth === "wide" ? "lg:max-w-6xl" : "lg:max-w-4xl"} space-y-4 px-3 py-4 sm:px-4 md:px-6`}>
      {actions ? (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>*]:min-w-0">
          {actions}
        </div>
      ) : null}
      {children}
    </main>
  );
}
