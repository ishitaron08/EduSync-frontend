"use client";

import { useDashboardGuard } from "@/lib/authGuard";
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";

export default function AdminDashboardPage() {
  const allowed = useDashboardGuard("admin");

  if (!allowed) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </main>
    );
  }

  return <AdminDashboard />;
}
