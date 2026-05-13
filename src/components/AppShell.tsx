"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const bootstrapAuth = useAuthStore((s) => s.bootstrapAuth);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  const isAuthFullBleed = pathname === "/auth";
  const isAuthenticated = Boolean(token && role);

  useEffect(() => {
    if (isAuthFullBleed || !isHydrated) return;
    if (!isAuthenticated) router.replace("/auth");
  }, [isAuthFullBleed, isAuthenticated, isHydrated, router]);

  if (isAuthFullBleed) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
      </TooltipProvider>
    );
  }

  if (!isAuthFullBleed && (!isHydrated || !isAuthenticated)) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="relative flex min-h-full flex-1 flex-col bg-[var(--bg-primary)] p-6">
          <div className="nc-skeleton h-10 w-44 rounded-[8px]" />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="relative flex min-h-full flex-1 bg-[var(--bg-primary)]">
      <AppSidebar expanded={expanded} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 md:hidden">
          <Button type="button" variant="ghost" className="h-9 px-2" onClick={() => setExpanded((e) => !e)} aria-label="Toggle sidebar">
            {expanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-sm font-semibold text-[var(--text-primary)]">
            EduSync
          </Link>
        </div>
        <TopBar expanded={expanded} onToggleSidebar={() => setExpanded((e) => !e)} />
        <div className="nc-page-enter flex flex-1 flex-col overflow-auto bg-[var(--bg-primary)]">{children}</div>
      </div>
    </div>
    </TooltipProvider>
  );
}
