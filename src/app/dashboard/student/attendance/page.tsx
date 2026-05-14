"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, ScanLine, AlertTriangle, Camera, Calendar, Clock } from "lucide-react";

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
    mutationFn: (token: string) => api.post("/student/attendance/scan", { token }),
    onSuccess: async ({ data }) => {
      setSuccess(data.message || "Attendance marked successfully.");
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.attendanceStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.attendanceHistory(10) })
      ]);
    },
    onError: (err) => {
      setError(describeApiError(err) || "Invalid or Expired QR Code. Please ask teacher to generate new code.");
      setSuccess(null);
    }
  });
  const stats = statsQuery.data ?? null;
  const history = historyQuery.data ?? [];
  const statsLoading = statsQuery.isLoading;
  const historyLoading = historyQuery.isLoading;
  const submitting = scanMutation.isPending;

  if (!allowed) {
    return <main className="p-4 md:p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const handleScan = async (detectedCodes: any[]) => {
    if (!submitting && detectedCodes.length > 0) {
      const token = detectedCodes[0].rawValue;
      setScanning(false);
      scanMutation.mutate(token);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatSlotKey = (slotKey: string) => {
    // slotKey format: "Monday:09:00-10:00"
    const parts = slotKey.split(":");
    if (parts.length >= 3) {
      const day = parts[0];
      const time = parts.slice(1).join(":");
      return `${day} ${time}`;
    }
    return slotKey;
  };

  const percentage = stats?.overall.percentage ?? 0;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)] md:text-3xl">Scan Attendance</h1>
        <p className="text-sm text-[var(--text-muted)]">Point your camera at the teacher&apos;s QR code to mark your presence.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="flex flex-col items-center p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[var(--accent-primary)]" /> QR Scanner
          </h2>

          {success ? (
            <div className="flex w-full flex-col items-center rounded-xl border border-green-200 bg-green-50 p-5 text-center md:p-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg text-green-800">Success!</h3>
              <p className="text-sm text-green-600 mt-1">{success}</p>
              <Button onClick={() => setSuccess(null)} variant="outline" className="mt-6 border-green-300 text-green-700 hover:bg-green-100">
                Scan Another
              </Button>
            </div>
          ) : scanning ? (
            <div className="relative aspect-square w-full max-w-[min(86vw,380px)] overflow-hidden rounded-xl border-4 border-[var(--accent-primary)]/50 bg-black">
              <Scanner
                onScan={handleScan}
              />
              <Button
                onClick={() => setScanning(false)}
                disabled={submitting}
                variant="destructive"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
              >
                Cancel Scan
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 text-center md:p-12">
              <Camera className="w-16 h-16 text-[var(--text-muted)] opacity-50 mb-4" />
              <p className="mb-4 text-sm text-[var(--text-muted)]">Allow camera access when the browser asks.</p>
              <Button onClick={() => { setError(null); setScanning(true); }} disabled={submitting} variant="filled" className="px-8">
                {submitting ? "Marking..." : "Open Camera"}
              </Button>
            </div>
          )}

          {error && !scanning && (
            <div className="mt-6 p-4 w-full bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Attendance Stats Card */}
          <Card className="p-4 md:p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">Attendance Stats</h3>
            {statsLoading ? (
              <div className="space-y-3">
                <div className="nc-skeleton h-10 w-24 rounded-[8px]" />
                <div className="nc-skeleton h-2 w-full rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--accent-primary)]">
                    {percentage}%
                  </span>
                  <span className="text-sm text-[var(--text-muted)] mb-1">Overall</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {stats && (
                  <div className="mt-4 flex gap-4 text-xs text-[var(--text-muted)]">
                    <span>Present: <strong className="text-[var(--text-primary)]">{stats.overall.present}</strong></span>
                    <span>Absent: <strong className="text-[var(--text-primary)]">{stats.overall.absent}</strong></span>
                    <span>Total: <strong className="text-[var(--text-primary)]">{stats.overall.totalRecorded}</strong></span>
                  </div>
                )}

                {/* Per-section breakdown */}
                {stats && stats.perSection.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">By Section</p>
                    {stats.perSection.map((sec) => (
                      <div key={sec.sectionId} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-primary)] truncate max-w-[60%]" title={`${sec.courseCode} - ${sec.courseName}`}>
                          {sec.courseCode || sec.sectionCode}
                        </span>
                        <span className={`font-semibold ${sec.percentage >= 75 ? "text-green-600" : sec.percentage >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {sec.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Recent History Card */}
          <Card className="p-4 md:p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">Recent History</h3>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="nc-skeleton h-12 w-full rounded-[8px]" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No attendance records yet. Scan a QR code to mark your first attendance.
              </p>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {history.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${record.status === "present" ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {record.section?.course?.name || record.section?.sectionCode || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(record.sessionDate)}</span>
                          <Clock className="w-3 h-3 ml-1" />
                          <span>{formatSlotKey(record.slotKey)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      record.status === "present"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
