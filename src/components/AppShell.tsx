"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  const isAuthFullBleed = pathname === "/auth";
  const isAuthenticated = Boolean(token && role);

  useEffect(() => {
    if (isAuthFullBleed || !isHydrated) return;
    if (!isAuthenticated) router.replace("/auth");
  }, [isAuthFullBleed, isAuthenticated, isHydrated, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

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
    {/* Full-viewport row. overflow-hidden here prevents the wrapper itself from scrolling. */}
    <div className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar: fixed height = viewport, never scrolls with content */}
      <AppSidebar expanded={expanded} className="hidden md:flex" />
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <AppSidebar
            expanded
            mobile
            className="absolute left-0 top-0 shadow-2xl"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      )}
      {/* Content column: this is the ONLY thing that scrolls */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 md:hidden">
          <Button type="button" variant="ghost" className="h-10 w-10 p-0" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-sm font-semibold text-[var(--text-primary)]">
            EduSync
          </Link>
        </div>
        <TopBar expanded={expanded} onToggleSidebar={() => setExpanded((e) => !e)} />
        {/* Page content scrolls here — sidebar stays put */}
        <div className="nc-page-enter flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--bg-primary)]">{children}</div>
      </div>
    </div>
    </TooltipProvider>
  );
}
