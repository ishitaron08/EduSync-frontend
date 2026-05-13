"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, QrCode, ScanLine, UserCheck } from "lucide-react";

type AttendanceMode = "qr" | "manual";
type AttendanceStatus = "present" | "absent" | "late" | "excused";

type AttendanceSlot = {
  key: string;
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
  className?: string;
  room?: string;
};

type TeacherSection = {
  _id: string;
  sectionCode: string;
  course?: { code?: string; name?: string };
  attendanceSlots?: AttendanceSlot[];
};

type AttendanceStudent = {
  _id: string;
  name: string;
  email?: string;
};

type AttendanceRecord = AttendanceStudent & {
  status?: AttendanceStatus;
  timestamp?: string;
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused"
};

function sectionLabel(section: TeacherSection) {
  return `${section.course?.code ? `${section.course.code} - ` : ""}${section.course?.name || "Course"} (${section.sectionCode})`;
}

function slotLabel(slot: AttendanceSlot) {
  const day = slot.day.charAt(0).toUpperCase() + slot.day.slice(1);
  const subject = slot.subject || slot.className || "Class";
  return `${day} ${slot.startTime}-${slot.endTime} · ${subject}${slot.room ? ` · ${slot.room}` : ""}`;
}

export default function TeacherAttendancePage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sectionId, setSectionId] = useState("");
  const [slotKey, setSlotKey] = useState("");
  const [mode, setMode] = useState<AttendanceMode>("qr");
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  const selectedSection = useMemo(
    () => sections.find(section => section._id === sectionId),
    [sections, sectionId]
  );
  const slots = selectedSection?.attendanceSlots ?? [];
  const selectedSlot = slots.find(slot => slot.key === slotKey);

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "qr" || urlMode === "manual") {
      setMode(urlMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!allowed) return;
    api.get<TeacherSection[]>("/teacher/sections")
      .then((res) => {
        const fetched = Array.isArray(res.data) ? res.data : [];
        setSections(fetched);
        const urlSection = searchParams.get("section");
        const nextSection = fetched.find(section => section._id === urlSection) ?? fetched[0];
        setSectionId(nextSection?._id ?? "");
        const urlSlot = searchParams.get("slot");
        const sectionSlots = nextSection?.attendanceSlots ?? [];
        const nextSlot = sectionSlots.find(slot => slot.key === urlSlot) ?? sectionSlots[0];
        setSlotKey(nextSlot?.key ?? "");
      })
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed, searchParams]);

  useEffect(() => {
    if (!sectionId || !slotKey) {
      setStudents([]);
      setRecords([]);
      return;
    }

    let alive = true;
    Promise.all([
      api.get(`/teacher/attendance/students?sectionId=${sectionId}&slotKey=${encodeURIComponent(slotKey)}`),
      api.get(`/teacher/attendance/live-status?sectionId=${sectionId}&slotKey=${encodeURIComponent(slotKey)}&sessionDate=${new Date().toISOString()}`)
    ])
      .then(([studentsRes, recordsRes]) => {
        if (!alive) return;
        setStudents(studentsRes.data.students || []);
        setRecords(recordsRes.data.records || recordsRes.data.scannedStudents || []);
        setLoadErr(null);
      })
      .catch((e) => {
        if (alive) setLoadErr(describeApiError(e));
      });

    return () => {
      alive = false;
    };
  }, [sectionId, slotKey]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setToken(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!token || !sectionId || !slotKey) return;
    let alive = true;
    const poll = setInterval(async () => {
      try {
        const { data } = await api.get(`/teacher/attendance/live-status?sectionId=${sectionId}&slotKey=${encodeURIComponent(slotKey)}&sessionDate=${new Date().toISOString()}`);
        if (alive) setRecords(data.records || data.scannedStudents || []);
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [token, sectionId, slotKey]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  function updateAttendanceUrl(next: { section?: string; slot?: string; mode?: AttendanceMode }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextSection = next.section ?? sectionId;
    const nextSlot = next.slot ?? slotKey;
    const nextMode = next.mode ?? mode;
    if (nextSection) params.set("section", nextSection);
    if (nextSlot) params.set("slot", nextSlot);
    params.set("mode", nextMode);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSectionChange(nextSectionId: string) {
    const nextSection = sections.find(section => section._id === nextSectionId);
    const nextSlot = nextSection?.attendanceSlots?.[0]?.key ?? "";
    setSectionId(nextSectionId);
    setSlotKey(nextSlot);
    setToken(null);
    updateAttendanceUrl({ section: nextSectionId, slot: nextSlot });
  }

  function handleSlotChange(nextSlotKey: string) {
    setSlotKey(nextSlotKey);
    setToken(null);
    updateAttendanceUrl({ slot: nextSlotKey });
  }

  const generateToken = async () => {
    try {
      const { data } = await api.post("/teacher/attendance/generate", {
        sectionId: sectionId.trim(),
        slotKey
      });
      setToken(data.token);
      setExpiresAt(new Date(data.expiresAt));
      setLoadErr(null);
      setMessage("QR attendance session started.");
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  };

  async function markManual(studentId: string, status: AttendanceStatus) {
    try {
      setSavingStudentId(studentId);
      const { data } = await api.post("/teacher/attendance", {
        student: studentId,
        section: sectionId,
        slotKey,
        sessionDate: new Date().toISOString(),
        className: selectedSlot?.className,
        subject: selectedSlot?.subject,
        status
      });
      setRecords((current) => {
        const withoutStudent = current.filter(record => record._id !== studentId);
        const student = students.find(entry => entry._id === studentId);
        return [
          ...withoutStudent,
          {
            _id: studentId,
            name: student?.name ?? data.student?.name ?? "Student",
            email: student?.email,
            status,
            timestamp: data.updatedAt || data.createdAt || new Date().toISOString()
          }
        ];
      });
      setMessage(`${students.find(student => student._id === studentId)?.name ?? "Student"} marked ${statusLabels[status].toLowerCase()}.`);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(describeApiError(e));
    } finally {
      setSavingStudentId(null);
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const recordByStudentId = new Map(records.map(record => [record._id, record]));
  const presentCount = records.filter(record => record.status === "present" || !record.status).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Class Attendance</h1>
          <p className="text-sm text-[var(--text-muted)]">Use QR scanning or mark students manually for your own timetable slots.</p>
        </div>
        <div className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
          <Button type="button" variant={mode === "qr" ? "filled" : "ghost"} size="sm" onClick={() => { setMode("qr"); updateAttendanceUrl({ mode: "qr" }); }}>
            <QrCode className="mr-2 h-4 w-4" /> QR
          </Button>
          <Button type="button" variant={mode === "manual" ? "filled" : "ghost"} size="sm" onClick={() => { setMode("manual"); updateAttendanceUrl({ mode: "manual" }); }}>
            <UserCheck className="mr-2 h-4 w-4" /> Manual
          </Button>
        </div>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}
      {message && <p className="mb-4 text-sm text-[var(--accent-primary)]">{message}</p>}

      <Card className="mb-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Section</label>
            <select
              className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
              value={sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!!token}
            >
              <option value="" disabled>Select section...</option>
              {sections.map(section => (
                <option key={section._id} value={section._id}>{sectionLabel(section)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Timetable Slot</label>
            <Select value={slotKey} onValueChange={handleSlotChange} disabled={!!token || slots.length === 0}>
              <SelectTrigger className="mt-1 w-full bg-[var(--bg-surface)]">
                <SelectValue placeholder="Select your class slot" />
              </SelectTrigger>
              <SelectContent>
                {slots.map(slot => (
                  <SelectItem key={slot.key} value={slot.key}>{slotLabel(slot)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {sections.length === 0 && (
          <p className="mt-4 text-sm text-[var(--text-muted)]">No timetable slots are assigned to you yet.</p>
        )}
        {selectedSection && slots.length === 0 && (
          <p className="mt-4 text-sm text-[var(--text-muted)]">This section has no attendance-ready slots assigned to you.</p>
        )}
      </Card>

      {mode === "qr" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">QR Attendance</h2>
            {!token ? (
              <Button onClick={generateToken} disabled={!sectionId || !slotKey} className="w-full" variant="filled">
                <QrCode className="mr-2 h-4 w-4" /> Generate 5-Minute QR Code
              </Button>
            ) : (
              <Button onClick={() => setToken(null)} className="w-full" variant="outline">
                End Session Early
              </Button>
            )}
          </Card>

          {token ? (
            <Card className="flex flex-col items-center justify-center border-[var(--accent-primary)] p-8 text-center">
              <p className="mb-4 text-sm text-[var(--text-muted)]">Project this on screen for students to scan</p>
              <div className="mb-4 inline-block rounded-xl bg-white p-4 shadow-sm">
                <QRCodeSVG value={token} size={250} />
              </div>
              <p className="font-mono text-2xl font-semibold text-[var(--accent-primary)]">{formatTime(timeLeft)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Code expires automatically</p>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-6 text-center opacity-70">
              <ScanLine className="mb-4 h-16 w-16 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)]">Select one of your timetable slots and generate the QR code.</p>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manual Attendance</h2>
            <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-muted)]">
              {students.length} Students
            </span>
          </div>
          <div className="space-y-3">
            {students.map(student => {
              const record = recordByStudentId.get(student._id);
              return (
                <div key={student._id} className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{student.email || "No email"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {record?.status && (
                      <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-primary)]">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-[var(--accent-primary)]" />
                        {statusLabels[record.status]}
                      </span>
                    )}
                    {(Object.keys(statusLabels) as AttendanceStatus[]).map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={record?.status === status ? "filled" : "ghost"}
                        disabled={savingStudentId === student._id}
                        onClick={() => markManual(student._id, status)}
                      >
                        {statusLabels[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
            {students.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No students are enrolled in this section.</p>
            )}
          </div>
        </Card>
      )}

      {(token || records.length > 0) && (
        <Card className="mt-8 p-6">
          <h2 className="mb-4 flex items-center justify-between text-lg font-semibold text-[var(--text-primary)]">
            <span>Today&apos;s Attendance</span>
            <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm font-normal text-[var(--text-muted)]">
              {presentCount} Present
            </span>
          </h2>
          <div className="space-y-3">
            {records.length > 0 ? (
              records.map((record) => (
                <div key={record._id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                  <span className="font-medium text-[var(--text-primary)]">{record.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {record.status ? statusLabels[record.status] : "Present"}
                    {record.timestamp ? ` · ${new Date(record.timestamp).toLocaleTimeString()}` : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-[var(--text-muted)]">Waiting for attendance records...</p>
            )}
          </div>
        </Card>
      )}
    </main>
  );
}
