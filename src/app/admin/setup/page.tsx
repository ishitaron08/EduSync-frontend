"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";

export default function AdminSetupPage() {
  const router = useRouter();
  const allowed = useDashboardGuard("admin");

  useEffect(() => {
    if (allowed) {
      router.replace("/dashboard/admin?tab=users");
    }
  }, [allowed, router]);

  return <main className="mx-auto max-w-2xl space-y-4 p-6 text-sm text-[var(--text-muted)]">Loading admin dashboard...</main>;
}