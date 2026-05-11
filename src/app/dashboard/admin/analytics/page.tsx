"use client";

import { useDashboardGuard } from "@/lib/authGuard";
import { AnalyticsTab } from "@/components/admin/dashboard/tabs/AnalyticsTab";

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
    <main className="mx-auto min-h-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
      <AnalyticsTab />
    </main>
  );
}
