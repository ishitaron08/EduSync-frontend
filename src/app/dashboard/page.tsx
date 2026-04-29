"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardIndexPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token || !role) {
      router.replace("/auth");
      return;
    }
    router.replace(`/dashboard/${role}`);
  }, [isHydrated, role, router, token]);

  return (
    <main className="p-6">
      <p className="text-slate-600">Redirecting...</p>
    </main>
  );
}
