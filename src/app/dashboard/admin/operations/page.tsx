"use client";

import { useDashboardGuard } from "@/lib/authGuard";
import { OperationsTab } from "@/components/admin/dashboard/tabs/OperationsTab";

export default function AdminOperationsPage() {
  const allowed = useDashboardGuard("admin");

  if (!allowed) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
      <OperationsTab />
    </main>
  );
}
