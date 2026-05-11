"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { hueFromString } from "@/lib/hueFromString";
import { Calendar, ScanLine, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PerfStudent = { _id: string; name: string; email: string; rewardPoints?: number };

export default function TeacherDashboardPage() {
  const allowed = useDashboardGuard("teacher");
  const [perf, setPerf] = useState<PerfStudent[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let c = false;
    api.get<PerfStudent[]>("/teacher/performance")
      .then((p) => {
        if (c) return;
        setPerf(Array.isArray(p.data) ? p.data : []);
      })
      .catch((e) => {
        if (!c) setLoadErr(describeApiError(e));
      });
    return () => { c = true; };
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
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Teacher Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">Today's agenda, quick actions, and student performance overview.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-primary)]/10 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Today's Schedule</p>
              <p className="font-semibold text-[var(--text-primary)]">3 Classes</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm mt-auto">
            <Link href="/dashboard/teacher/timetable">View Timetable &rarr;</Link>
          </Button>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-secondary)]/10 p-2 rounded-lg">
              <ScanLine className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Attendance</p>
              <p className="font-semibold text-[var(--text-primary)]">Needs action</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm mt-auto">
            <Link href="/dashboard/teacher/attendance">Generate QR Code &rarr;</Link>
          </Button>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent-amber)]/10 p-2 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-[var(--accent-amber)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Recent Tests</p>
              <p className="font-semibold text-[var(--text-primary)]">2 Active</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm mt-auto">
            <Link href="/dashboard/teacher/tests">Manage Tests &rarr;</Link>
          </Button>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">Top Performers in Your Classes</p>
            <div className="space-y-4">
              {perf.slice(0, 5).map((s) => {
                const h = hueFromString(s.name);
                const spark = [20, 35, 28, 40, 32, 45, 38];
                return (
                  <div key={s._id} className="flex gap-3 border-b border-[var(--border-subtle)] pb-3 last:border-0">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] font-mono text-xs text-[var(--accent-secondary)]"
                      style={{ borderColor: `hsl(${h} 40% 40%)` }}
                    >
                      {(s.rewardPoints ?? 0) % 100}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--text-primary)]">{s.name}</p>
                      <div className="mt-1 flex items-end gap-1">
                        {spark.map((v, i) => (
                          <div key={i} className="w-1 rounded-sm bg-[var(--accent-secondary)]" style={{ height: `${v / 3}px` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {perf.length === 0 && <p className="text-sm text-[var(--text-muted)]">No performance data yet.</p>}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
