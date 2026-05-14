"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck } from "lucide-react";
import { useDashboardGuard } from "@/lib/authGuard";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsTab } from "@/components/admin/dashboard/tabs/SettingsTab";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const allowed = useDashboardGuard("admin");

  if (!allowed) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <AdminPageShell
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/admin/analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/admin">
              <ShieldCheck className="h-4 w-4" />
              Overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <SettingsTab />
    </AdminPageShell>
  );
}
