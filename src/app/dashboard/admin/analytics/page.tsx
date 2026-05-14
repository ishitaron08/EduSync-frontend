"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck2, TrendingUp } from "lucide-react";
import { useDashboardGuard } from "@/lib/authGuard";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AnalyticsTab } from "@/components/admin/dashboard/tabs/AnalyticsTab";
import { Button } from "@/components/ui/button";

export default function AdminAnalyticsPage() {
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
            <Link href="/dashboard/admin/attendance">
              <CalendarCheck2 className="h-4 w-4" />
              Attendance
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/admin">
              <TrendingUp className="h-4 w-4" />
              Overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <AnalyticsTab />
    </AdminPageShell>
  );
}
