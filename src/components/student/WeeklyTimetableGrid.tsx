"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { hueFromString } from "@/lib/hueFromString";

// Slot type kept in sync with what the backend returns from /student/timetable.
// isFreePeriod, durationMinutes, and teacher were previously missing, causing
// free periods to render as regular class cards and teacher info to be lost.
export type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
  isFreePeriod?: boolean;
  durationMinutes?: number;
  teacher?: { _id: string; name: string; email: string } | string;
};

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

export function WeeklyTimetableGrid() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ slots?: Slot[] }>("/student/timetable")
      .then((res) => {
        if (!cancelled) {
          setSlots(res.data.slots ?? []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setSlots([]);
          setError(describeApiError(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = (day: string) =>
    slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return <div className="nc-skeleton min-h-[280px] w-full rounded-[8px]" />;
  }

  if (error) {
    return (
      <div className="rounded-[8px] border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 p-4 text-sm text-[var(--accent-danger)]">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{day}</p>
          <div className="flex min-h-[200px] flex-col gap-2 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
            {byDay(day).length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 py-8 text-center">
                <span className="text-[var(--text-muted)]">Open</span>
              </div>
            ) : (
              byDay(day).map((s, i) => {
                // Free periods get a distinct teal card with a "Get Tasks" CTA
                if (s.isFreePeriod) {
                  return (
                    <div
                      key={`free-${i}`}
                      className="flex flex-col gap-1.5 rounded-[8px] border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/8 px-2 py-2"
                    >
                      <div className="flex items-center gap-1 text-[var(--accent-primary)]">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Free Period</span>
                      </div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)]">
                        {s.startTime}–{s.endTime}
                        {s.durationMinutes ? ` (${s.durationMinutes}m)` : ""}
                      </p>
                      <Link
                        href={`/dashboard/student/learning?duration=${s.durationMinutes ?? 60}`}
                        className="mt-1 rounded-md border border-[var(--accent-primary)]/30 px-2 py-1 text-center text-[10px] font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                      >
                        Get Tasks
                      </Link>
                    </div>
                  );
                }

                // Regular class card
                const h = hueFromString(s.subject);
                const teacherName =
                  typeof s.teacher === "object" && s.teacher?.name
                    ? s.teacher.name
                    : null;

                return (
                  <div
                    key={`${s.subject}-${i}`}
                    className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-2"
                    style={{ borderLeftWidth: 4, borderLeftColor: `hsl(${h} 55% 52%)` }}
                  >
                    <p className="font-[family-name:var(--font-fraunces)] text-sm font-medium text-[var(--text-primary)]">
                      {s.subject}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--accent-secondary)]">
                      {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {s.className}
                      {s.room ? ` | ${s.room}` : ""}
                    </p>
                    {teacherName && (
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{teacherName}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
