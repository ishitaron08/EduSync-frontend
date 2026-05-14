"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  MapPin,
  Route,
  Sparkles,
  User
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
  teacher?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  isFreePeriod?: boolean;
  durationMinutes?: number;
};

type TimetableResponse = {
  slots: Slot[];
  hasSection?: boolean;
  sectionInfo?: {
    sectionCode: string;
    course?: {
      code: string;
      name: string;
    };
  };
  message?: string;
  year?: number;
};

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const SHORT_DAYS: Record<(typeof WEEK_DAYS)[number], string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri"
};

function getTodayKey() {
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number]) ? (day as (typeof WEEK_DAYS)[number]) : "monday";
}

function teacherName(slot: Slot) {
  return typeof slot.teacher === "object" && slot.teacher?.name ? slot.teacher.name : null;
}

function durationLabel(minutes?: number) {
  if (!minutes) return "Open";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function DayPill({
  day,
  active,
  slots,
  onClick
}: {
  day: (typeof WEEK_DAYS)[number];
  active: boolean;
  slots: Slot[];
  onClick: () => void;
}) {
  const classes = slots.filter((slot) => !slot.isFreePeriod).length;
  const freeMinutes = slots.reduce((sum, slot) => sum + (slot.isFreePeriod ? slot.durationMinutes ?? 0 : 0), 0);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-[background-color,border-color,box-shadow] ${
        active
          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[var(--shadow-soft)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/35"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{SHORT_DAYS[day]}</span>
        {freeMinutes > 0 ? <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" /> : <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{classes} classes</p>
      <p className="mt-1 text-xs font-medium text-[var(--accent-primary)]">{freeMinutes ? `${durationLabel(freeMinutes)} free` : "Packed day"}</p>
    </button>
  );
}

function TimelineSlot({ slot }: { slot: Slot }) {
  const name = teacherName(slot);
  if (slot.isFreePeriod) {
    return (
      <div className="grid gap-3 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/8 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
        <div className="font-mono text-xs text-[var(--accent-primary)]">
          {slot.startTime} to {slot.endTime}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
            <p className="font-semibold text-[var(--text-primary)]">Free learning period</p>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Use this {durationLabel(slot.durationMinutes).toLowerCase()} window for focused tasks.</p>
        </div>
        <Button asChild size="sm" variant="filled" className="w-full sm:w-auto">
          <Link href={`/dashboard/student/learning?duration=${slot.durationMinutes ?? 60}`}>Get tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-[border-color,box-shadow] hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-soft)] sm:grid-cols-[96px_minmax(0,1fr)]">
      <div className="font-mono text-xs text-[var(--text-muted)]">
        {slot.startTime} to {slot.endTime}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold leading-tight text-[var(--text-primary)]">{slot.subject}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{slot.className || "Class details pending"}</p>
          </div>
          <Badge tone="muted">{slot.room || "Room TBA"}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          {name ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1">
              <User className="h-3.5 w-3.5" />
              {name}
            </span>
          ) : null}
          {slot.room ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1">
              <MapPin className="h-3.5 w-3.5" />
              {slot.room}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StudentTimetablePage() {
  const allowed = useDashboardGuard("student");
  const [selectedDay, setSelectedDay] = useState<(typeof WEEK_DAYS)[number]>(() => getTodayKey());

  const timetableQuery = useQuery({
    queryKey: queryKeys.student.timetable,
    queryFn: async () => {
      const { data } = await api.get<TimetableResponse>("/student/timetable");
      return data;
    },
    enabled: allowed
  });

  const timetableData = timetableQuery.data ?? null;
  const slots = useMemo(() => timetableData?.slots ?? [], [timetableData?.slots]);
  const error = timetableQuery.error ? describeApiError(timetableQuery.error) : null;

  const slotsByDay = useMemo(() => {
    return WEEK_DAYS.reduce<Record<(typeof WEEK_DAYS)[number], Slot[]>>((acc, day) => {
      acc[day] = slots
        .filter((slot) => slot.day?.toLowerCase() === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });
  }, [slots]);

  const selectedSlots = slotsByDay[selectedDay] ?? [];
  const freePeriods = slots.filter((slot) => slot.isFreePeriod);
  const sectionLabel = timetableData?.sectionInfo
    ? [
        timetableData.sectionInfo.course?.code || timetableData.sectionInfo.course?.name,
        timetableData.sectionInfo.sectionCode
      ].filter(Boolean).join(" ")
    : null;

  if (!allowed) {
    return (
      <main className="p-4 md:p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      <section>
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Week density</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Day by day</h2>
              {sectionLabel ? (
                <p className="mt-1 text-sm text-[var(--text-muted)]">Section: {sectionLabel}</p>
              ) : null}
            </div>
            <Route className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div className="grid gap-2">
            {WEEK_DAYS.map((day) => (
              <DayPill key={day} day={day} active={selectedDay === day} slots={slotsByDay[day]} onClick={() => setSelectedDay(day)} />
            ))}
          </div>
        </Card>
      </section>

      {timetableQuery.isLoading ? (
        <div className="nc-skeleton min-h-[320px] w-full rounded-lg" />
      ) : null}

      {error ? (
        <Card className="border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/8 p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--accent-danger)]">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      ) : null}

      {!timetableQuery.isLoading && !error && timetableData?.message ? (
        <Card className="border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/8 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--accent-primary)]" />
            <p className="text-sm text-[var(--text-primary)]">{timetableData.message}</p>
          </div>
        </Card>
      ) : null}

      {!timetableQuery.isLoading && !error ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{selectedDay}</p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Timeline</h2>
              </div>
              <Badge tone={selectedSlots.some((slot) => slot.isFreePeriod) ? "green" : "muted"}>
                {selectedSlots.length ? `${selectedSlots.length} slots` : "Open day"}
              </Badge>
            </div>

            {selectedSlots.length ? (
              <div className="space-y-3">
                {selectedSlots.map((slot, index) => (
                  <TimelineSlot key={`${slot.day}-${slot.startTime}-${slot.subject}-${index}`} slot={slot} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--accent-primary)]" />
                <p className="font-semibold text-[var(--text-primary)]">No classes scheduled</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Use the day for revision, projects, or catching up on goals.</p>
                <Button asChild className="mt-5">
                  <Link href="/dashboard/student/learning?duration=480">Plan study tasks</Link>
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Free periods</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Convert time into tasks</h2>
              </div>
              <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>

            {freePeriods.length ? (
              <div className="space-y-3">
                {freePeriods.slice(0, 4).map((slot, index) => (
                  <Link
                    key={`${slot.day}-${slot.startTime}-${index}`}
                    href={`/dashboard/student/learning?duration=${slot.durationMinutes ?? 60}`}
                    className="group block rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition-[border-color,background-color] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-primary)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">{slot.day}</p>
                        <p className="text-xs text-[var(--text-muted)]">{slot.startTime} to {slot.endTime}</p>
                      </div>
                      <Badge tone="green">{durationLabel(slot.durationMinutes)}</Badge>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)]">
                      Get matching tasks <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 text-sm text-[var(--text-muted)]">
                No free periods are detected yet.
              </div>
            )}
          </Card>
        </section>
      ) : null}
    </main>
  );
}
