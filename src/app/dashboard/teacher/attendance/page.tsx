"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { ScanLine } from "lucide-react";

type TeacherSection = {
  _id: string;
  sectionCode: string;
  course?: { code?: string; name?: string };
};

export default function TeacherAttendancePage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sectionId, setSectionId] = useState("");
  const [slotKey, setSlotKey] = useState("SLOT-1");
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<TeacherSection[]>([]);

  useEffect(() => {
    if (!allowed) return;
    api.get<TeacherSection[]>("/teacher/sections")
      .then((res) => {
        const fetched = Array.isArray(res.data) ? res.data : [];
        setSections(fetched);
        const urlSection = searchParams.get("section");
        if (urlSection && fetched.some(section => section._id === urlSection)) {
          setSectionId(urlSection);
        } else if (!sectionId && fetched.length > 0) {
          setSectionId(fetched[0]._id);
        }
      })
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed, sectionId, searchParams]);

  useEffect(() => {
    const urlSlot = searchParams.get("slot");
    if (urlSlot) {
      setSlotKey(urlSlot);
    }
  }, [searchParams]);

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
    if (!token) return;
    let alive = true;
    const poll = setInterval(async () => {
      try {
        const { data } = await api.get(`/teacher/attendance/live-status?sectionId=${sectionId}&slotKey=${slotKey}&sessionDate=${new Date().toISOString()}`);
        if (alive) setScannedStudents(data.scannedStudents || []);
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

  const generateToken = async () => {
    try {
      const { data } = await api.post("/teacher/attendance/generate", {
        sectionId: sectionId.trim(),
        slotKey
      });
      setToken(data.token);
      setExpiresAt(new Date(data.expiresAt));
      setLoadErr(null);
      setScannedStudents([]);
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  function updateAttendanceUrl(nextSectionId = sectionId, nextSlotKey = slotKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSectionId) params.set("section", nextSectionId);
    if (nextSlotKey) params.set("slot", nextSlotKey);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Class Attendance</h1>
        <p className="text-sm text-[var(--text-muted)]">Generate dynamic QR codes for instant attendance tracking.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Start Session</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Section</label>
              <select
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                value={sectionId} 
                onChange={(e) => {
                  setSectionId(e.target.value);
                  updateAttendanceUrl(e.target.value, slotKey);
                }} 
                disabled={!!token}
              >
                <option value="" disabled>Select section...</option>
                {sections.map(section => (
                  <option key={section._id} value={section._id}>
                    {section.course?.code ? `${section.course.code} - ` : ""}{section.course?.name || "Course"} ({section.sectionCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Time Slot</label>
              <Select value={slotKey} onValueChange={(value) => {
                setSlotKey(value);
                updateAttendanceUrl(sectionId, value);
              }} disabled={!!token}>
                <SelectTrigger className="mt-1 w-full bg-[var(--bg-surface)]">
                  <SelectValue placeholder="Select a slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SLOT-1">Morning (8-10 AM)</SelectItem>
                  <SelectItem value="SLOT-2">Midday (10-12 PM)</SelectItem>
                  <SelectItem value="SLOT-3">Afternoon (1-3 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!token ? (
              <Button onClick={generateToken} disabled={!sectionId} className="w-full" variant="filled">
                Generate 5-Minute QR Code
              </Button>
            ) : (
              <Button onClick={() => setToken(null)} className="w-full" variant="outline">
                End Session Early
              </Button>
            )}
          </div>
        </Card>

        {token ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center border-[var(--accent-primary)]">
            <p className="text-sm text-[var(--text-muted)] mb-4">Project this on screen for students to scan</p>
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 inline-block">
              <QRCodeSVG value={token} size={250} />
            </div>
            <p className="font-mono text-2xl font-semibold text-[var(--accent-primary)]">
              {formatTime(timeLeft)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Code expires automatically</p>
          </Card>
        ) : (
          <Card className="p-6 flex flex-col items-center justify-center text-center opacity-50">
            <ScanLine className="w-16 h-16 text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-muted)]">Select a section and click generate to display the QR code here.</p>
          </Card>
        )}
      </div>

      {token && (
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center justify-between">
            <span>Live Scan Status</span>
            <span className="text-sm font-normal text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-1 rounded-full">
              {scannedStudents.length} Present
            </span>
          </h2>
          <div className="space-y-3">
            {scannedStudents.length > 0 ? (
              scannedStudents.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Scanned at {new Date(s.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-[var(--text-muted)] py-4">Waiting for students to scan...</p>
            )}
          </div>
        </Card>
      )}
    </main>
  );
}
