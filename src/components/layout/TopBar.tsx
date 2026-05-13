"use client";

import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

const titles: Record<string, string> = {
  "/": "Home",
  "/auth": "Access",
  "/dashboard/student": "Mission Control",
  "/dashboard/teacher": "Teaching Hub",
  "/dashboard/teacher/timetable": "My Schedule",
  "/dashboard/admin": "Admin dashboard",
  "/timetable": "Timetable",
  "/goals": "Goals",
  "/profile": "Profile",
  "/recommendations": "Your Navigator",
  "/rewards": "Rewards"
};

export function TopBar({
  expanded,
  onToggleSidebar
}: {
  expanded: boolean;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);

  let title = titles[pathname] ?? "EduSync";
  if (pathname.startsWith("/dashboard") && !titles[pathname]) {
    title = "Dashboard";
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          className="hidden h-9 w-9 shrink-0 p-0 md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
        <h1 className="truncate font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-tight text-[var(--text-primary)] md:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {role ? (
          <>
            <Badge tone="amber">{role}</Badge>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--accent-secondary)]"
              aria-hidden
            >
              {(role[0] ?? "?").toUpperCase()}
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
