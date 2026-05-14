"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { useDashboardGuard } from "@/lib/authGuard";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { UsersTab } from "@/components/admin/dashboard/tabs/UsersTab";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
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
            <Link href="/dashboard/admin/sections">
              <ShieldCheck className="h-4 w-4" />
              Sections
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/admin/attendance">
              <UserPlus className="h-4 w-4" />
              Attendance
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <UsersTab />
    </AdminPageShell>
  );
}
