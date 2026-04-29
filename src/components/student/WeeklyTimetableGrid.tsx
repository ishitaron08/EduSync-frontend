"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { hueFromString } from "@/lib/hueFromString";

export type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
};

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

export function WeeklyTimetableGrid() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    api
      .get<{ slots?: Slot[] }>("/student/timetable")
      .then((res) => {
        if (!c) {
          setSlots(res.data.slots ?? []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!c) {
          setSlots([]);
          setError(describeApiError(e));
        }
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const byDay = (day: string) => slots.filter((s) => s.day === day);

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
                const h = hueFromString(s.subject);
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
                      {s.startTime}-{s.endTime}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{s.className} | {s.room}</p>
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
