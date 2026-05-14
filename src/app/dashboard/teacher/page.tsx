"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, ClipboardCheck, ScanLine } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { hueFromString } from "@/lib/hueFromString";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeacherPageShell } from "@/components/teacher/TeacherPageShell";

type PerfStudent = {
  _id: string;
  name: string;
  email: string;
  rewardPoints?: number;
  section?: {
    sectionCode?: string;
    course?: {
      code?: string;
      name?: string;
    };
  } | null;
};

function sectionLabel(section: PerfStudent["section"]) {
  if (!section) return "Allocated section";
  return [section.course?.code || section.course?.name, section.sectionCode].filter(Boolean).join(" ") || "Allocated section";
}

export default function TeacherDashboardPage() {
  const allowed = useDashboardGuard("teacher");
  const perfQuery = useQuery({
    queryKey: queryKeys.teacher.performance,
    queryFn: async () => {
      const { data } = await api.get<PerfStudent[]>("/teacher/performance");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed
  });
  const perf = perfQuery.data ?? [];
  const loadErr = perfQuery.error ? describeApiError(perfQuery.error) : null;

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <TeacherPageShell
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/teacher/timetable">
              <Calendar className="h-4 w-4" />
              Timetable
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/teacher/attendance">
              <ScanLine className="h-4 w-4" />
              Attendance
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >

      {loadErr && (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 px-3 py-2 text-sm text-[var(--accent-danger)]">
          {loadErr}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-primary)]/10 p-2">
              <Calendar className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Today schedule</p>
              <p className="font-semibold text-[var(--text-primary)]">3 classes</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="mt-auto w-full justify-between text-sm">
            <Link href="/dashboard/teacher/timetable">View Timetable <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-secondary)]/10 p-2">
              <ScanLine className="h-5 w-5 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Attendance</p>
              <p className="font-semibold text-[var(--text-primary)]">Needs action</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="mt-auto w-full justify-between text-sm">
            <Link href="/dashboard/teacher/attendance">Generate QR Code <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-amber)]/10 p-2">
              <ClipboardCheck className="h-5 w-5 text-[var(--accent-amber)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Recent Tests</p>
              <p className="font-semibold text-[var(--text-primary)]">2 active</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="mt-auto w-full justify-between text-sm">
            <Link href="/dashboard/teacher/tests">Manage Tests <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Top performers in your classes</p>
            <span className="text-xs text-[var(--text-muted)]">{perf.length} students</span>
          </div>
          <div className="space-y-3">
            {perf.slice(0, 5).map((student) => {
              const h = hueFromString(student.name);
              const spark = [20, 35, 28, 40, 32, 45, 38];
              return (
                <div key={student._id} className="flex gap-3 border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-[var(--bg-elevated)] font-mono text-xs text-[var(--accent-secondary)]"
                    style={{ borderColor: `hsl(${h} 40% 40%)` }}
                  >
                    {(student.rewardPoints ?? 0) % 100}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--text-primary)]">{student.name}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{student.email}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--accent-primary)]">{sectionLabel(student.section)}</p>
                    <div className="mt-2 flex h-4 items-end gap-1">
                      {spark.map((value, index) => (
                        <div key={index} className="w-1 rounded-sm bg-[var(--accent-secondary)]/70" style={{ height: `${value / 3}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {perf.length === 0 && <p className="text-sm text-[var(--text-muted)]">No students are linked to your allocated sections yet.</p>}
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Today focus</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Review attendance before the next class starts.</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">This keeps student records current and avoids end-of-day reconciliation.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/teacher/attendance">Open attendance</Link>
          </Button>
        </Card>
      </section>
    </TeacherPageShell>
  );
}
