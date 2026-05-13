"use client";

// This route (/timetable) is a legacy entry point kept for backward-compat
// with any bookmarks or old links. The canonical timetable page lives at
// /dashboard/student/timetable and has the full feature set (free periods,
// teacher info, section context, proper auth gating).
//
// Previously this page fired the API call before the auth guard resolved,
// causing a 401 that unnecessarily triggered the token-refresh interceptor.
// Now it simply redirects to the correct page after auth is confirmed.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";

export default function TimetableRedirectPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();

  // Only redirect once auth is confirmed — never before.
  // This prevents the 401 race condition the old implementation had.
  useEffect(() => {
    if (allowed) {
      router.replace("/dashboard/student/timetable");
    }
  }, [allowed, router]);

  // Show a skeleton while auth resolves and the redirect fires
  return (
    <main className="p-6">
      <div className="nc-skeleton h-10 w-48 rounded-[8px]" />
    </main>
  );
}
