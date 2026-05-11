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
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!allowed) return;
    // Mock fetching history
    setHistory([
      { date: new Date().toISOString(), subject: "Mathematics", status: "Present" },
      { date: new Date(Date.now() - 86400000).toISOString(), subject: "Physics", status: "Present" }
    ]);
  }, [allowed]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const token = detectedCodes[0].rawValue;
      setScanning(false);
      try {
        await api.post("/student/attendance/scan", { token });
        setSuccess("Attendance Marked Successfully!");
        setError(null);
        // Add to mock history
        setHistory(prev => [{ date: new Date().toISOString(), subject: "Recently Scanned", status: "Present" }, ...prev]);
        
        // Play success sound
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU... (mock sound)");
          audio.play().catch(() => {});
        } catch (e) {}

      } catch (err) {
        setError(describeApiError(err) || "Invalid or Expired QR Code. Please ask teacher to generate new code.");
        setSuccess(null);
      }
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-8">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Scan Attendance</h1>
        <p className="text-sm text-[var(--text-muted)]">Point your camera at the teacher's QR code to mark your presence.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[var(--accent-primary)]" /> QR Scanner
          </h2>

          {success ? (
            <div className="flex flex-col items-center text-center p-8 bg-green-50 rounded-xl w-full border border-green-200">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg text-green-800">Success!</h3>
              <p className="text-sm text-green-600 mt-1">{success}</p>
              <Button onClick={() => setSuccess(null)} variant="outline" className="mt-6 border-green-300 text-green-700 hover:bg-green-100">
                Scan Another
              </Button>
            </div>
          ) : scanning ? (
            <div className="w-full max-w-sm aspect-square bg-black rounded-xl overflow-hidden relative border-4 border-[var(--accent-primary)]/50">
              <Scanner 
                onScan={handleScan}
                components={{
                  audio: false,
                  tracker: true,
                }}
              />
              <Button 
                onClick={() => setScanning(false)} 
                variant="destructive" 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
              >
                Cancel Scan
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center p-12 bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] rounded-xl">
              <Camera className="w-16 h-16 text-[var(--text-muted)] opacity-50 mb-4" />
              <Button onClick={() => { setError(null); setScanning(true); }} variant="filled" className="px-8">
                Open Camera
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
          <Card className="p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">Attendance Stats</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--accent-primary)]">85%</span>
              <span className="text-sm text-[var(--text-muted)] mb-1">Overall</span>
            </div>
            <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-[var(--accent-primary)] h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent History</h3>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {history.map((record, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <div>
                    <p className="font-medium text-sm text-[var(--text-primary)]">{record.subject}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
