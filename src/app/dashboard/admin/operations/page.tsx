"use client";

import { useDashboardGuard } from "@/lib/authGuard";
import { OperationsTab } from "@/components/admin/dashboard/tabs/OperationsTab";

export default function AdminOperationsPage() {
  const allowed = useDashboardGuard("admin");

  if (!allowed) {
    return (
    <main className="mx-auto w-full max-w-full space-y-4 p-4 sm:p-6 lg:max-w-4xl">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-full px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:max-w-[1600px] lg:px-8">
      <OperationsTab />
    </main>
  );
}
