"use client";

import Link from "next/link";
import { useDashboardGuard } from "@/lib/authGuard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--text-primary)]">Admin dashboard</h1>
      <p className="text-sm text-[var(--text-muted)]">Manage users and timetables for manual backend checks.</p>

      <Card className="p-4">
        <p className="font-medium text-[var(--text-primary)]">Setup tools</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Use Admin setup to list users (MongoDB ids) and POST a sample timetable for a student.
        </p>
        <Link href="/admin/setup" className={cn(buttonVariants(), "mt-3 inline-flex")}>
          Open Admin setup
        </Link>
      </Card>

      <Card className="p-4">
        <p className="mb-2 font-medium text-[var(--text-primary)]">API routes</p>
        <ul className="list-inside list-disc text-sm text-[var(--text-muted)]">
          <li>GET/POST /api/admin/users</li>
          <li>POST /api/admin/timetable</li>
        </ul>
      </Card>
    </main>
  );
}
