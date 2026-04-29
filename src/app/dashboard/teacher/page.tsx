"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hueFromString } from "@/lib/hueFromString";

type PerfStudent = { _id: string; name: string; email: string; rewardPoints?: number };

export default function TeacherDashboardPage() {
  const allowed = useDashboardGuard("teacher");
  const [timetables, setTimetables] = useState<unknown[] | null>(null);
  const [perf, setPerf] = useState<PerfStudent[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [attendanceToken, setAttendanceToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [slotKey, setSlotKey] = useState("SLOT-1");

  useEffect(() => {
    if (!allowed) return;
    let c = false;
    Promise.all([
      api.get("/teacher/timetable").catch(() => ({ data: [] })),
      api.get<PerfStudent[]>("/teacher/performance").catch(() => ({ data: [] }))
    ])
      .then(([tt, p]) => {
        if (c) return;
        setTimetables(Array.isArray(tt.data) ? tt.data : []);
        setPerf(Array.isArray(p.data) ? p.data : []);
        setLoadErr(null);
      })
      .catch((e) => {
        if (!c) setLoadErr(describeApiError(e));
      });
    return () => {
      c = true;
    };
  }, [allowed]);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-[8px]" />
      </main>
    );
  }

  const generateToken = async () => {
    try {
      const { data } = await api.post<{ token: string }>("/teacher/attendance/token", {
        student: studentId.trim(),
        section: sectionId.trim(),
        slotKey,
        sessionDate: new Date().toISOString()
      });
      setAttendanceToken(data.token);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  };

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Teaching hub</h1>
          <p className="text-sm text-[var(--text-muted)]">Schedule intelligence and class overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={attendanceMode ? "filled" : "ghost"} type="button" onClick={() => setAttendanceMode((a) => !a)}>
            Attendance mode
          </Button>
          <Button variant="ghost" type="button" onClick={() => setSheetOpen(true)}>
            Extra session
          </Button>
        </div>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-8">
          <Card className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Schedule records</p>
            <p className="mt-2 text-[var(--text-muted)]">
              {timetables === null ? "Loading..." : `${timetables.length} timetable document(s)`}
            </p>
            {attendanceMode && (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="studentObjectId">Student ObjectId</Label>
                  <Input
                    id="studentObjectId"
                    className="font-mono text-xs"
                    placeholder="Student ObjectId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sectionObjectId">Section ObjectId</Label>
                  <Input
                    id="sectionObjectId"
                    className="font-mono text-xs"
                    placeholder="Section ObjectId"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slotKey">Slot key</Label>
                  <Input id="slotKey" className="font-mono text-xs" value={slotKey} onChange={(e) => setSlotKey(e.target.value)} />
                </div>
                <Button variant="ghost" onClick={generateToken} disabled={!studentId || !sectionId || !slotKey}>
                  Generate 5-minute attendance token
                </Button>
                {attendanceToken && <p className="break-all font-mono text-xs text-[var(--accent-secondary)]">{attendanceToken}</p>}
              </div>
            )}
          </Card>
        </section>

        <aside className="space-y-4 lg:col-span-4">
          <Card className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Class intelligence</p>
            <div className="mt-4 space-y-4">
              {perf.slice(0, 8).map((s) => {
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
                      <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">7-day mock trend</p>
                    </div>
                  </div>
                );
              })}
              {perf.length === 0 && <p className="text-sm text-[var(--text-muted)]">No performance rows yet.</p>}
            </div>
          </Card>
        </aside>
      </div>

      <button
        type="button"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)] text-2xl font-light text-white shadow-[var(--glow-amber)] transition-all duration-200 hover:-translate-y-px hover:bg-[var(--accent-secondary)]"
        aria-label="Schedule session"
        onClick={() => setSheetOpen(true)}
      >
        +
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm md:items-center" onClick={() => setSheetOpen(false)}>
          <div className="w-full max-w-lg md:mb-8" onClick={(e) => e.stopPropagation()}>
            <Card className="mb-0 rounded-b-none border-[var(--border-subtle)] p-6 md:rounded-[8px]">
              <p className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--text-primary)]">Schedule extra session</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Add extra session support via `/api/teacher/extra-session` with timetable id and slot payload.
              </p>
              <Button type="button" variant="filled" className="mt-6 w-full" onClick={() => setSheetOpen(false)}>
                Close
              </Button>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
