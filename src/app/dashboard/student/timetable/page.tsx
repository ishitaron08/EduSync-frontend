"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { hueFromString } from "@/lib/hueFromString";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Sparkles, User, MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function StudentTimetablePage() {
  const allowed = useDashboardGuard("student");
  const [timetableData, setTimetableData] = useState<TimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let c = false;
    api
      .get<TimetableResponse>("/student/timetable")
      .then((res) => {
        if (!c) {
          setTimetableData(res.data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!c) {
          setTimetableData(null);
          setError(describeApiError(e));
        }
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [allowed]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const slots = timetableData?.slots ?? [];

  // Group slots by day
  const getSlotsByDay = (day: string) => {
    return slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Get teacher name from slot
  const getTeacherName = (slot: Slot) => {
    if (typeof slot.teacher === "object" && slot.teacher?.name) {
      return slot.teacher.name;
    }
    return null;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">My Timetable</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {timetableData?.sectionInfo 
            ? `${timetableData.sectionInfo.course?.name || 'Course'} - Section ${timetableData.sectionInfo.sectionCode}`
            : 'Weekly schedule with AI-detected free learning slots.'}
        </p>
      </div>

      {loading && <div className="nc-skeleton min-h-[280px] w-full rounded-[8px]" />}
      {error && <div className="text-[var(--accent-danger)] text-sm mb-4">{error}</div>}

      {!loading && !error && timetableData?.message && (
        <Card className="p-4 mb-4 border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--accent-primary)]" />
            <p className="text-sm text-[var(--text-primary)]">{timetableData.message}</p>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="flex flex-col gap-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] text-center border-b border-[var(--border-subtle)] pb-2">{day}</p>
                <div className="flex flex-col gap-3">
                  {getSlotsByDay(day).length === 0 ? (
                    <div className="rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 p-3">
                      <div className="flex items-center gap-1.5 text-[var(--accent-primary)] mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase">Free Day</span>
                      </div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)]">
                        08:00 - 16:00 (8h)
                      </p>
                      <Button asChild variant="ghost" size="sm" className="mt-3 w-full border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white">
                        <Link href="/dashboard/student/learning?duration=480">
                          Get Tasks
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    getSlotsByDay(day).map((s, i) => {
                      if (s.isFreePeriod) {
                        return (
                          <div key={`free-${i}`} className="group relative flex flex-col justify-between rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 p-3 hover:bg-[var(--accent-primary)]/20 transition-colors">
                            <div>
                              <div className="flex items-center gap-1.5 text-[var(--accent-primary)] mb-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase">Free Period</span>
                              </div>
                              <p className="font-mono text-[11px] text-[var(--text-muted)]">
                                {s.startTime} - {s.endTime} ({s.durationMinutes}m)
                              </p>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="mt-3 w-full border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white">
                              <Link href={`/dashboard/student/learning?duration=${s.durationMinutes}`}>
                                Get Tasks
                              </Link>
                            </Button>
                          </div>
                        );
                      }
                      
                      const h = hueFromString(s.subject);
                      const teacherName = getTeacherName(s);
                      
                      return (
                        <div
                          key={`${s.subject}-${i}`}
                          className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm"
                          style={{ borderLeftWidth: 4, borderLeftColor: `hsl(${h} 55% 52%)` }}
                        >
                          <div>
                            <p className="font-[family-name:var(--font-fraunces)] font-medium text-[var(--text-primary)] leading-tight mb-1">
                              {s.subject}
                            </p>
                            <p className="font-mono text-[11px] text-[var(--text-muted)]">
                              {s.startTime} - {s.endTime}
                            </p>
                          </div>
                          
                          {/* Teacher info */}
                          {teacherName && (
                            <div className="mt-2 flex items-center gap-1 text-[var(--text-muted)]">
                              <User className="h-3 w-3" />
                              <span className="text-xs">{teacherName}</span>
                            </div>
                          )}
                          
                          {/* Room and Class info */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {s.room && (
                              <span className="inline-flex items-center gap-1 bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)]">
                                <MapPin className="h-2.5 w-2.5" />
                                {s.room}
                              </span>
                            )}
                            {s.className && (
                              <span className="inline-block bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)]">
                                {s.className}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
