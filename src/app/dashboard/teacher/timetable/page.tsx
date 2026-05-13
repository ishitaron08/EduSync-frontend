"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { hueFromString } from "@/lib/hueFromString";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, MapPin, Coffee } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleSlot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
  isFreePeriod: boolean;
  durationMinutes?: number;
};

type Schedule = {
  timetableId: string;
  sectionCode: string;
  courseName: string;
  term: string;
  year: number;
  slots: ScheduleSlot[];
};

type ScheduleResponse = {
  schedules: Schedule[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function FreePeriodCell({ slot }: { slot: ScheduleSlot }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-3 text-center min-h-[72px]">
      <Coffee className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Available
      </span>
      <span className="font-mono text-[10px] text-[var(--text-muted)]">
        {slot.startTime}–{slot.endTime}
      </span>
    </div>
  );
}

function ClassCell({ slot }: { slot: ScheduleSlot }) {
  const hue = hueFromString(slot.subject);
  return (
    <div
      className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm min-h-[72px]"
      style={{ borderLeftWidth: 4, borderLeftColor: `hsl(${hue} 55% 52%)` }}
    >
      <p
        className="font-[family-name:var(--font-fraunces)] font-semibold leading-tight text-[var(--text-primary)]"
        style={{ fontSize: "0.8rem" }}
      >
        {slot.subject}
      </p>
      <p className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">
        {slot.startTime}–{slot.endTime}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {slot.room && (
          <span className="inline-flex items-center gap-0.5 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            <MapPin className="h-2.5 w-2.5" />
            {slot.room}
          </span>
        )}
        {slot.className && (
          <span className="inline-flex items-center gap-0.5 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            <BookOpen className="h-2.5 w-2.5" />
            {slot.className}
          </span>
        )}
      </div>
    </div>
  );
}

function WeekGrid({ slots }: { slots: ScheduleSlot[] }) {
  // Group by day, sorted by startTime
  const byDay = (day: string) =>
    slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hasAnySlot = WEEK_DAYS.some((d) => byDay(d).length > 0);

  if (!hasAnySlot) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-muted)]">
        No slots assigned for this section.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="flex flex-col gap-2">
          {/* Day header */}
          <p className="border-b border-[var(--border-subtle)] pb-1.5 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            {day.slice(0, 3)}
          </p>

          {/* Slots */}
          {byDay(day).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-center min-h-[72px]">
              <Coffee className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="mt-1 text-[10px] text-[var(--text-muted)]">Free day</span>
            </div>
          ) : (
            byDay(day).map((slot, i) =>
              slot.isFreePeriod ? (
                <FreePeriodCell key={i} slot={slot} />
              ) : (
                <ClassCell key={i} slot={slot} />
              )
            )
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function ScheduleStats({ slots }: { slots: ScheduleSlot[] }) {
  const classes   = slots.filter((s) => !s.isFreePeriod);
  const freeMins  = slots
    .filter((s) => s.isFreePeriod)
    .reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
  const freeHours = Math.round(freeMins / 60);

  // Unique days that have at least one class
  const activeDays = new Set(classes.map((s) => s.day)).size;

  return (
    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
      <span className="flex items-center gap-1.5">
        <BookOpen className="h-4 w-4" />
        <strong className="text-[var(--text-primary)]">{classes.length}</strong> classes/week
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <strong className="text-[var(--text-primary)]">{activeDays}</strong> active days
      </span>
      <span className="flex items-center gap-1.5">
        <Coffee className="h-4 w-4" />
        <strong className="text-[var(--text-primary)]">{freeHours}h</strong> free/week
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherTimetablePage() {
  const allowed = useDashboardGuard("teacher");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    api
      .get<ScheduleResponse>("/teacher/timetable")
      .then((res) => {
        if (!cancelled) {
          setSchedules(res.data?.schedules ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(describeApiError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [allowed]);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-[8px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">
          My Schedule
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Weekly view of your assigned classes. Available slots are shown as free periods.
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="nc-skeleton h-40 w-full rounded-2xl" />
          <div className="nc-skeleton h-40 w-full rounded-2xl" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[var(--accent-danger)]">{error}</p>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && schedules.length === 0 && (
        <Card className="p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-primary)]">No schedule assigned yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Ask your administrator to assign you to a section timetable.
          </p>
        </Card>
      )}

      {/* One card per section timetable */}
      {!loading && !error && schedules.length > 0 && (
        <div className="space-y-8">
          {schedules.map((schedule) => (
            <Card key={schedule.timetableId} className="overflow-hidden">
              {/* Card header */}
              <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--text-primary)]">
                      {schedule.courseName}
                    </h2>
                    <Badge tone="blue">{schedule.sectionCode}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm capitalize text-[var(--text-muted)]">
                    {schedule.term} {schedule.year}
                  </p>
                </div>
                <ScheduleStats slots={schedule.slots} />
              </div>

              {/* Weekly grid */}
              <div className="overflow-x-auto p-5">
                <WeekGrid slots={schedule.slots} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
