"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import { useDashboardGuard } from "@/lib/authGuard";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OverviewTab } from "@/components/admin/dashboard/tabs/OverviewTab";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
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
            <Link href="/dashboard/admin/users">
              <UsersRound className="h-4 w-4" />
              Users
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/admin/timetable">
              <CalendarDays className="h-4 w-4" />
              Timetable
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <OverviewTab />
    </AdminPageShell>
  );
}
