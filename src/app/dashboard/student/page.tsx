"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Route,
  ScanLine,
  Sparkles,
  Target,
  UserCheck
} from "lucide-react";
import api from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StudentProfile = {
  _id?: string;
  name?: string;
  rank?: number;
  rewardPoints?: number;
  streak?: number;
  learningGoal?: string;
  section?: {
    sectionCode?: string;
    term?: string;
    year?: number;
    course?: {
      code?: string;
      name?: string;
    };
  } | null;
};

type StudentTask = {
  _id: string;
  title: string;
  category?: string;
  status: string;
  durationMinutes?: number;
  basePoints?: number;
};

type Assessment = {
  _id: string;
  title: string;
  type: "mcq" | "written";
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

type TimetableSlot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room?: string;
  isFreePeriod?: boolean;
};

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export default function StudentDashboardPage() {
  const allowed = useDashboardGuard("student");

  const profileQuery = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/student/profile");
      return data;
    },
    enabled: allowed
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.student.tasks,
    queryFn: async () => {
      const { data } = await api.get("/student/tasks");
      return Array.isArray(data) ? (data as StudentTask[]) : [];
    },
    enabled: allowed
  });

  const assessmentsQuery = useQuery({
    queryKey: queryKeys.student.assessments,
    queryFn: async () => {
      const { data } = await api.get("/student/assessments");
      return Array.isArray(data) ? (data as Assessment[]) : [];
    },
    enabled: allowed
  });

  const timetableQuery = useQuery({
    queryKey: queryKeys.student.timetable,
    queryFn: async () => {
      const { data } = await api.get<{ slots?: TimetableSlot[] }>("/student/timetable");
      return Array.isArray(data?.slots) ? data.slots : [];
    },
    enabled: allowed
  });

  const profile = profileQuery.data ?? null;
  const sectionLabel = profile?.section
    ? [
        profile.section.course?.code || profile.section.course?.name,
        profile.section.sectionCode
      ].filter(Boolean).join(" ")
    : "Not assigned";
  const activeTasks = useMemo(() => (tasksQuery.data ?? []).filter((task) => task.status !== "completed"), [tasksQuery.data]);
  const completedTasks = useMemo(() => (tasksQuery.data ?? []).filter((task) => task.status === "completed"), [tasksQuery.data]);
  const nextTask = activeTasks[0] ?? null;

  const assessmentSummary = useMemo(() => {
    const now = new Date();
    const assessments = assessmentsQuery.data ?? [];
    return {
      active: assessments.filter((assessment) => new Date(assessment.startTime) <= now && new Date(assessment.endTime) >= now),
      upcoming: assessments.filter((assessment) => new Date(assessment.startTime) > now)
    };
  }, [assessmentsQuery.data]);

  const nextClass = useMemo(() => {
    const slots = timetableQuery.data ?? [];
    const today = dayNames[new Date().getDay()];
    const nowTime = new Date().toTimeString().slice(0, 5);
    const todaySlots = slots
      .filter((slot) => slot.day?.toLowerCase() === today && !slot.isFreePeriod)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return todaySlots.find((slot) => slot.startTime >= nowTime) ?? todaySlots[0] ?? null;
  }, [timetableQuery.data]);

  const focusPlan = [
    {
      title: nextTask?.title ?? "Start a focused learning block",
      detail: nextTask ? `${nextTask.category ?? "Learning"}${nextTask.durationMinutes ? `, ${nextTask.durationMinutes} min` : ""}` : "Pick a recommendation and build momentum.",
      href: "/dashboard/student/learning",
      icon: Sparkles,
      cta: nextTask ? "Continue task" : "Find task"
    },
    {
      title: assessmentSummary.active[0]?.title ?? assessmentSummary.upcoming[0]?.title ?? "Review upcoming assessments",
      detail: assessmentSummary.active.length ? "Active now" : assessmentSummary.upcoming.length ? "Scheduled soon" : "No active tests at the moment.",
      href: "/dashboard/student/assessments",
      icon: ClipboardCheck,
      cta: assessmentSummary.active.length ? "Take test" : "View tests"
    },
    {
      title: nextClass ? `Prepare for ${nextClass.subject}` : "Check today&apos;s timetable",
      detail: nextClass ? `${nextClass.startTime} to ${nextClass.endTime}${nextClass.room ? `, ${nextClass.room}` : ""}` : "No remaining class found for today.",
      href: "/dashboard/student/timetable",
      icon: CalendarDays,
      cta: "Open timetable"
    }
  ];

  if (!allowed) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="nc-skeleton h-12 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      <section>
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Focus queue</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Do these next</h2>
            </div>
            <Target className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>

          <div className="space-y-3">
            {focusPlan.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition-[border-color,background-color] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-primary)]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    {index === 0 ? <Icon className="h-4 w-4" /> : <span className="font-mono text-xs font-semibold">{index + 1}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{item.detail}</p>
                  </div>
                  <span className="hidden text-xs font-medium text-[var(--accent-primary)] sm:inline">{item.cta}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Today&apos;s lane</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Schedule and study rhythm</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/student/timetable">Full timetable</Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-[var(--text-inverse)]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Next class</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{nextClass?.subject ?? "No class queued"}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Time</p>
                  <p className="font-medium text-[var(--text-primary)]">{nextClass ? `${nextClass.startTime} to ${nextClass.endTime}` : "Clear"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Room</p>
                  <p className="font-medium text-[var(--text-primary)]">{nextClass?.room ?? "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Section</p>
                  <p className="truncate font-medium text-[var(--text-primary)]" title={sectionLabel}>{sectionLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Prep</p>
                  <p className="font-medium text-[var(--text-primary)]">{activeTasks.length ? `${activeTasks.length} open tasks` : "No open tasks"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <Route className="mb-4 h-5 w-5 text-[var(--accent-secondary)]" />
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Learning goal</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{profile?.learningGoal ?? "Choose a goal"}</p>
              <Button asChild variant="ghost" size="sm" className="mt-5 w-full justify-between">
                <Link href="/dashboard/student/learning">Tune goal <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Momentum</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">This week</h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[var(--accent-success)]" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Tasks completed</span>
                <span className="font-medium text-[var(--text-primary)]">{completedTasks.length}/{Math.max(tasksQuery.data?.length ?? 0, 1)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent-success)]"
                  style={{ width: `${clamp((completedTasks.length / Math.max(tasksQuery.data?.length ?? 1, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                <BookOpenCheck className="mb-3 h-4 w-4 text-[var(--accent-primary)]" />
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{activeTasks.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Open tasks</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                <ClipboardCheck className="mb-3 h-4 w-4 text-[var(--accent-amber)]" />
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{assessmentSummary.active.length + assessmentSummary.upcoming.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Tests queued</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/student/attendance" className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] transition-[border-color,background-color] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-primary)]">
          <ScanLine className="mb-6 h-5 w-5 text-[var(--accent-secondary)]" />
          <p className="font-semibold text-[var(--text-primary)]">Scan attendance</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Open the QR scanner before class closes.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">Open scanner <ArrowRight className="h-4 w-4" /></span>
        </Link>

        <Link href="/dashboard/student/learning" className="group rounded-lg border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/8 p-5 shadow-[var(--shadow-soft)] transition-[border-color,background-color] hover:border-[var(--accent-primary)]/45 hover:bg-[var(--accent-primary)]/10">
          <Sparkles className="mb-6 h-5 w-5 text-[var(--accent-primary)]" />
          <p className="font-semibold text-[var(--text-primary)]">Continue learning</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Use recommendations matched to your goal.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">Open plan <ArrowRight className="h-4 w-4" /></span>
        </Link>

        <Link href="/dashboard/student/profile" className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)] transition-[border-color,background-color] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-primary)]">
          <UserCheck className="mb-6 h-5 w-5 text-[var(--accent-success)]" />
          <p className="font-semibold text-[var(--text-primary)]">Update profile</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Keep personal details and goal preferences current.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">Review profile <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </section>
    </main>
  );
}
