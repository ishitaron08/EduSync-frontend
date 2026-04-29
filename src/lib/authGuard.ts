"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export type AppRole = "admin" | "teacher" | "student";

export function useDashboardGuard(expected: AppRole): boolean {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    const isAuthenticated = Boolean(token && role);
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (role !== expected) {
      router.replace(`/dashboard/${role}`);
    }
  }, [expected, isHydrated, role, router, token]);

  return Boolean(isHydrated && token && role === expected);
}

export function useRequireAuth(): boolean {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    const isAuthenticated = Boolean(token && role);
    if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [isHydrated, role, router, token]);

  return Boolean(isHydrated && token && role);
}
