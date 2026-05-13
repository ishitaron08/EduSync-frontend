"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, ScanLine, AlertTriangle, Camera } from "lucide-react";

export default function StudentAttendancePage() {
  const allowed = useDashboardGuard("student");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!allowed) {
    return <main className="p-4 md:p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const handleScan = async (detectedCodes: any[]) => {
    if (!submitting && detectedCodes.length > 0) {
      const token = detectedCodes[0].rawValue;
      setScanning(false);
      setSubmitting(true);
      try {
        const { data } = await api.post("/student/attendance/scan", { token });
        setSuccess(data.message || "Attendance marked successfully.");
        setError(null);
        
        // Play success sound
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU... (mock sound)");
          audio.play().catch(() => {});
        } catch (e) {}

      } catch (err) {
        setError(describeApiError(err) || "Invalid or Expired QR Code. Please ask teacher to generate new code.");
        setSuccess(null);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)] md:text-3xl">Scan Attendance</h1>
        <p className="text-sm text-[var(--text-muted)]">Point your camera at the teacher's QR code to mark your presence.</p>
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
          <Card className="p-4 md:p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">Attendance Stats</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--accent-primary)]">85%</span>
              <span className="text-sm text-[var(--text-muted)] mb-1">Overall</span>
            </div>
            <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-[var(--accent-primary)] h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">Recent History</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Attendance history will appear here when the backend history endpoint is connected. Scans are still recorded immediately after a valid QR code is accepted.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
