"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { hueFromString } from "@/lib/hueFromString";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
  isFreeSlot?: boolean;
  durationMinutes?: number;
};

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const STANDARD_HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export default function StudentTimetablePage() {
  const allowed = useDashboardGuard("student");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let c = false;
    api
      .get<{ slots?: Slot[] }>("/student/timetable")
      .then((res) => {
        if (!c) {
          setSlots(res.data.slots ?? []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!c) {
          setSlots([]);
          setError(describeApiError(e));
        }
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [allowed]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  // Calculate free slots dynamically
  const getProcessedSlots = (day: string) => {
    const daySlots = slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const processed: Slot[] = [];
    
    // Simple logic to fill gaps between 08:00 and 16:00
    let currentTime = "08:00";
    
    for (const slot of daySlots) {
      if (currentTime < slot.startTime) {
        // Gap detected
        const duration = (parseInt(slot.startTime.split(':')[0]) - parseInt(currentTime.split(':')[0])) * 60;
        if (duration > 0) {
          processed.push({
            day,
            startTime: currentTime,
            endTime: slot.startTime,
            subject: "FREE SLOT DETECTED",
            className: "",
            room: "",
            isFreeSlot: true,
            durationMinutes: duration
          });
        }
      }
      processed.push(slot);
      currentTime = slot.endTime;
    }
    
    // Check end gap
    if (currentTime < "16:00") {
      const duration = (16 - parseInt(currentTime.split(':')[0])) * 60;
      if (duration > 0) {
        processed.push({
          day,
          startTime: currentTime,
          endTime: "16:00",
          subject: "FREE SLOT DETECTED",
          className: "",
          room: "",
          isFreeSlot: true,
          durationMinutes: duration
        });
      }
    }
    
    return processed;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">My Timetable</h1>
        <p className="text-sm text-[var(--text-muted)]">Weekly schedule with AI-detected free learning slots.</p>
      </div>

      {loading && <div className="nc-skeleton min-h-[280px] w-full rounded-[8px]" />}
      {error && <div className="text-[var(--accent-danger)] text-sm mb-4">{error}</div>}

      {!loading && !error && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="flex flex-col gap-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] text-center border-b border-[var(--border-subtle)] pb-2">{day}</p>
                <div className="flex flex-col gap-3">
                  {getProcessedSlots(day).map((s, i) => {
                    if (s.isFreeSlot) {
                      return (
                        <div key={`free-${i}`} className="group relative flex flex-col justify-between rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 p-3 hover:bg-[var(--accent-primary)]/20 transition-colors">
                          <div>
                            <div className="flex items-center gap-1.5 text-[var(--accent-primary)] mb-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase">Free Slot</span>
                            </div>
                            <p className="font-mono text-[11px] text-[var(--text-muted)]">
                              {s.startTime} - {s.endTime} ({s.durationMinutes}m)
                            </p>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="mt-3 w-full border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white">
                            <Link href={`/dashboard/student/learning?duration=${s.durationMinutes}`}>
                              Get Tasks
                            </Link>
                          </Button>
                        </div>
                      );
                    }
                    
                    const h = hueFromString(s.subject);
                    return (
                      <div
                        key={`${s.subject}-${i}`}
                        className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm"
                        style={{ borderLeftWidth: 4, borderLeftColor: `hsl(${h} 55% 52%)` }}
                      >
                        <div>
                          <p className="font-[family-name:var(--font-fraunces)] font-medium text-[var(--text-primary)] leading-tight mb-1">
                            {s.subject}
                          </p>
                          <p className="font-mono text-[11px] text-[var(--text-muted)]">
                            {s.startTime} - {s.endTime}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          <span className="inline-block bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)]">
                            {s.className}
                          </span>
                          <span className="inline-block bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)]">
                            {s.room}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
