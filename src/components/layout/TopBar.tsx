"use client";

import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

const titles: Record<string, string> = {
  "/": "Home",
  "/auth": "Access",
  "/dashboard/student": "Mission Control",
  "/dashboard/teacher": "Teaching Hub",
  "/dashboard/admin": "Administration",
  "/timetable": "Timetable",
  "/goals": "Goals",
  "/profile": "Profile",
  "/recommendations": "Your Navigator",
  "/rewards": "Rewards",
  "/admin/setup": "System Setup"
};

export function TopBar({
  expanded,
  onToggleSidebar,
  onOpenCommand
}: {
  expanded: boolean;
  onToggleSidebar: () => void;
  onOpenCommand: () => void;
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
        <Button
          type="button"
          variant="ghost"
          className="hidden gap-2 sm:inline-flex"
          onClick={onOpenCommand}
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
          <span className="font-mono text-xs text-[var(--text-muted)]">Search</span>
          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            Ctrl K
          </kbd>
        </Button>
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

export function CommandPaletteStub({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
        className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 pt-[15vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[0_20px_44px_rgba(15,23,42,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-sm text-[var(--text-muted)]">Command palette (coming soon)</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-sm text-[var(--text-primary)]">
          Navigate and search across EduSync
        </p>
      </div>
    </div>
  );
}
