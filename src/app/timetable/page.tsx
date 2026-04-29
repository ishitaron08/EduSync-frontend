"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardGuard } from "@/lib/authGuard";

interface Timetable {
  slots: Array<{ day: string; startTime: string; endTime: string; subject: string; className: string; room: string }>;
}

export default function TimetablePage() {
  const allowed = useDashboardGuard("student");
  const [data, setData] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/student/timetable")
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(describeApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-40 rounded-[8px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--text-primary)]">
        Personalized Timetable
      </h1>
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {!loading && error && (
        <p
          className="rounded-md border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-3 py-2 text-sm text-[var(--text-primary)]"
          role="alert"
        >
          {error}
        </p>
      )}
      {!loading &&
        !error &&
        data?.slots?.map((slot, index) => (
          <Card key={`${slot.day}-${index}`}>
            <p className="font-medium text-[var(--text-primary)]">{slot.subject}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {slot.day} {slot.startTime}-{slot.endTime} | {slot.className} | Room {slot.room}
            </p>
          </Card>
        ))}
      {!loading && !error && (!data?.slots || data.slots.length === 0) && (
        <EmptyState
          title="No sessions scheduled"
          description="Your timetable has no slots yet, or you may need to sign in as a student."
          action={{ label: "Go to dashboard", href: "/dashboard/student" }}
        />
      )}
    </main>
  );
}
