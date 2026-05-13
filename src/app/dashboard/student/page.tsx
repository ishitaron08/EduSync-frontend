"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Sparkles, ClipboardCheck, Flame, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import api from "@/lib/api";

export default function StudentDashboardPage() {
  const allowed = useDashboardGuard("student");
  const [profile, setProfile] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<{ percentage: number; present: number; total: number } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get("/student/profile").then(res => setProfile(res.data)).catch(console.error);
    api.get("/student/attendance/stats")
      .then(res => {
        const { overall } = res.data;
        setAttendanceStats({
          percentage: overall.percentage,
          present: overall.present,
          total: overall.totalRecorded
        });
      })
      .catch(() => {});
  }, [allowed]);

  if (!allowed) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="nc-skeleton h-12 w-48 rounded-[8px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--text-primary)]">
            Welcome back, {profile?.name?.split(' ')[0] || "Student"}!
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Here&apos;s your daily overview and recommended actions.</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 border-[var(--accent-amber)]/30 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-amber)]/5">
          <div className="bg-[var(--accent-amber)]/10 p-3 rounded-full">
            <Flame className="w-8 h-8 text-[var(--accent-amber)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Current Streak</p>
            <p className="font-semibold text-2xl text-[var(--text-primary)]">{profile?.streak || 0} Days 🔥</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total Points</p>
          <p className="font-semibold text-3xl text-[var(--accent-primary)]">{profile?.rewardPoints || 0}</p>
        </Card>

        <Card className="p-5 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Leaderboard Rank</p>
          <p className="font-semibold text-3xl text-[var(--text-primary)]">#{profile?.rank || "--"}</p>
          <Link href="/dashboard/student/leaderboard" className="text-xs text-[var(--accent-primary)] hover:underline">View Standings</Link>
        </Card>

        <Card className="p-5 flex flex-col items-center justify-center text-center gap-2 border-[var(--accent-secondary)]/30 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-secondary)]/5">
          <div className="bg-[var(--accent-secondary)]/10 p-3 rounded-full">
            <TrendingUp className="w-8 h-8 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Attendance</p>
            <p className={`font-semibold text-2xl ${
              (attendanceStats?.percentage ?? 0) >= 75 ? "text-green-600" :
              (attendanceStats?.percentage ?? 0) >= 50 ? "text-yellow-600" : "text-red-600"
            }`}>
              {attendanceStats ? `${attendanceStats.percentage}%` : "--"}
            </p>
          </div>
          <Link href="/dashboard/student/attendance" className="text-xs text-[var(--accent-secondary)] hover:underline">View Details</Link>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-secondary)]/10 p-2 rounded-lg">
              <ScanLine className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Attendance</p>
              <p className="text-xs text-[var(--text-muted)]">Mark your presence</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm mt-auto border-[var(--accent-secondary)]/30 hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]">
            <Link href="/dashboard/student/attendance">Scan QR Code &rarr;</Link>
          </Button>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-primary)]/10 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">AI Learning</p>
              <p className="text-xs text-[var(--text-muted)]">Complete pending tasks</p>
            </div>
          </div>
          <Button asChild variant="filled" className="w-full justify-start text-sm mt-auto">
            <Link href="/dashboard/student/learning">Start Learning &rarr;</Link>
          </Button>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-amber)]/10 p-2 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-[var(--accent-amber)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Assessments</p>
              <p className="text-xs text-[var(--text-muted)]">Upcoming tests</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm mt-auto">
            <Link href="/dashboard/student/assessments">View Tests &rarr;</Link>
          </Button>
        </Card>
      </div>

      <section className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Today&apos;s Schedule</p>
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--bg-elevated)] p-3 rounded-full">
              <CalendarIcon className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Next Class: Mathematics</p>
              <p className="text-sm text-[var(--text-muted)]">11:00 AM - 12:00 PM • Room 204</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/student/timetable">Full Timetable</Link>
          </Button>
        </Card>
      </section>

    </main>
  );
}
