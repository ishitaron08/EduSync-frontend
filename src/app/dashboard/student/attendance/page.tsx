"use client";

import { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  History,
  QrCode,
  ScanLine,
  ShieldCheck
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AttendanceStats {
  overall: {
    totalRecorded: number;
    present: number;
    absent: number;
    percentage: number;
    totalExpectedPerWeek: number | null;
  };
  perSection: {
    sectionId: string;
    sectionCode: string;
    courseName: string;
    courseCode: string;
    total: number;
    present: number;
    percentage: number;
  }[];
  weeklyTrend: {
    weekStart: string;
    weekEnd: string;
    total: number;
    present: number;
    percentage: number;
  }[];
}

interface AttendanceRecord {
  _id: string;
  sessionDate: string;
  slotKey: string;
  status: string;
  section: {
    _id: string;
    sectionCode: string;
    course: { name: string; code: string } | null;
  } | null;
  teacher: { name: string } | null;
  createdAt: string;
}

type DetectedCode = { rawValue?: string };

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatSlotKey(slotKey: string) {
  const parts = slotKey.split(":");
  if (parts.length >= 3) {
    const day = parts[0];
    const time = parts.slice(1).join(":");
    return `${day} ${time}`;
  }
  return slotKey;
}

function statusTone(status: string) {
  return status === "present"
    ? "bg-[var(--accent-success)]/12 text-[var(--accent-success)]"
    : "bg-[var(--accent-danger)]/12 text-[var(--accent-danger)]";
}

export default function StudentAttendancePage() {
  const allowed = useDashboardGuard("student");
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: queryKeys.student.attendanceStats,
    queryFn: async () => {
      const { data } = await api.get<AttendanceStats>("/student/attendance/stats");
      return data;
    },
    enabled: allowed
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.student.attendanceHistory(10),
    queryFn: async () => {
      const { data } = await api.get<{ records?: AttendanceRecord[] }>("/student/attendance/history", { params: { limit: 10 } });
      return data.records || [];
    },
    enabled: allowed
  });

  const scanMutation = useMutation({
    mutationFn: (token: string) => api.post<{ message?: string }>("/student/attendance/scan", { token }),
    onSuccess: async ({ data }) => {
      setSuccess(data.message || "Attendance marked successfully.");
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.attendanceStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.attendanceHistory(10) })
      ]);
    },
    onError: (err) => {
      setError(describeApiError(err) || "Invalid or expired QR code. Ask your teacher to generate a new code.");
      setSuccess(null);
    }
  });

  const stats = statsQuery.data ?? null;
  const history = historyQuery.data ?? [];
  const submitting = scanMutation.isPending;

  const bestSection = useMemo(() => {
    const sections = stats?.perSection ?? [];
    return sections.slice().sort((a, b) => b.percentage - a.percentage)[0] ?? null;
  }, [stats?.perSection]);

  if (!allowed) {
    return (
      <main className="p-4 md:p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  const handleScan = (detectedCodes: DetectedCode[]) => {
    const token = detectedCodes[0]?.rawValue;
    if (!submitting && token) {
      setScanning(false);
      scanMutation.mutate(token);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      <section>
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Live scanner</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Mark attendance</h2>
            </div>
            <QrCode className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>

          {success ? (
            <div className="rounded-lg border border-[var(--accent-success)]/25 bg-[var(--accent-success)]/10 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[var(--accent-success)]" />
              <p className="text-lg font-semibold text-[var(--text-primary)]">Marked successfully</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{success}</p>
              <Button onClick={() => setSuccess(null)} variant="ghost" className="mt-5 w-full">
                Scan another code
              </Button>
            </div>
          ) : scanning ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--accent-primary)]/35 bg-[oklch(22%_0.035_246)]">
              <Scanner onScan={handleScan} />
              <div className="pointer-events-none absolute inset-6 rounded-lg border border-[var(--text-inverse)]/70" />
              <Button
                onClick={() => setScanning(false)}
                disabled={submitting}
                variant="destructive"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
              >
                Cancel scan
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6 text-center">
              <Camera className="mx-auto mb-4 h-14 w-14 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">Open the camera when the QR code is visible on the teacher screen.</p>
              <Button onClick={() => { setError(null); setScanning(true); }} disabled={submitting} className="mt-5 w-full">
                {submitting ? "Marking..." : "Open camera"}
              </Button>
            </div>
          )}

          {error && !scanning ? (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-danger)]" />
              <p className="text-sm text-[var(--accent-danger)]">{error}</p>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Recent records</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Last scans</h2>
            </div>
            <History className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>

          {historyQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="nc-skeleton h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-8 text-center">
              <ScanLine className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="font-semibold text-[var(--text-primary)]">No records yet</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Your scans will appear here after attendance starts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record._id} className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {record.section?.course?.name || record.section?.sectionCode || "Unknown section"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(record.sessionDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatSlotKey(record.slotKey)}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusTone(record.status)}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">By section</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Course health</h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--accent-success)]" />
          </div>

          {statsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="nc-skeleton h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : stats?.perSection.length ? (
            <div className="space-y-4">
              {stats.perSection.map((section) => (
                <div key={section.sectionId}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-[var(--text-primary)]" title={`${section.courseCode} ${section.courseName}`}>
                      {section.courseCode || section.sectionCode}
                    </span>
                    <span className={section.percentage >= 75 ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"}>{section.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className={`h-2 rounded-full ${section.percentage >= 75 ? "bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"}`}
                      style={{ width: `${clamp(section.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
              {bestSection ? (
                <Button asChild variant="ghost" className="mt-2 w-full justify-between">
                  <a href="#top">Best: {bestSection.courseCode || bestSection.sectionCode} <ArrowRight className="h-4 w-4" /></a>
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 text-sm text-[var(--text-muted)]">
              Section-level attendance appears after records are synced.
            </p>
          )}
        </Card>
      </section>
    </main>
  );
}
