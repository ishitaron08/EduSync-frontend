"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Card } from "@/components/ui/card";

type Slot = { day: string; startTime: string; endTime: string; subject: string; className: string; room: string };

function nextSlot(slots: Slot[]): Slot | null {
  if (!slots.length) return null;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const todayName = days[todayIdx];
  const todaySlots = slots.filter((s) => s.day === todayName).sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (const s of todaySlots) {
    const [hh, mm] = s.startTime.split(":").map(Number);
    const slotStart = new Date(now);
    slotStart.setHours(hh, mm, 0, 0);
    if (slotStart > now) return s;
  }
  return todaySlots[0] ?? slots[0];
}

function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, target.getTime() - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return (
    <span className="font-mono text-lg tabular-nums text-[var(--accent-secondary)]">
      {h.toString().padStart(2, "0")}:{m.toString().padStart(2, "0")}:{sec.toString().padStart(2, "0")}
    </span>
  );
}

export function IntelligenceBrief() {
  const briefQuery = useQuery({
    queryKey: ["student", "intelligence-brief"],
    queryFn: async () => {
      const [tt, fs, gs] = await Promise.all([
        api.get<{ slots?: Slot[] }>("/student/timetable").catch(() => ({ data: { slots: [] as Slot[] } })),
        api.get<Array<{ day: string; duration: number }>>("/student/free-slots").catch(() => ({ data: [] })),
        api.get<Array<{ progress?: number }>>("/student/goals").catch(() => ({ data: [] }))
      ]);
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      return {
        slots: tt.data.slots ?? [],
        freeToday: (fs.data as { day: string; duration: number }[])?.filter((x) => x.day === today) ?? [],
        goals: gs.data ?? []
      };
    }
  });
  const slots = briefQuery.data?.slots ?? [];
  const freeToday = briefQuery.data?.freeToday ?? [];
  const goals = briefQuery.data?.goals ?? [];
  const loading = briefQuery.isLoading;
  const err = briefQuery.error ? describeApiError(briefQuery.error) : null;

  const next = useMemo(() => nextSlot(slots), [slots]);
  const nextStart = useMemo(() => {
    if (!next) return null;
    const [hh, mm] = next.startTime.split(":").map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return d;
  }, [next]);

  const avgProgress =
    goals.length > 0 ? goals.reduce((a, g) => a + (typeof g.progress === "number" ? g.progress : 0), 0) / goals.length : 0;
  const pct = Math.min(100, Math.round(avgProgress));

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="nc-skeleton h-36 rounded-[8px]" />
        ))}
      </div>
    );
  }

  if (err) {
    return <p className="text-sm text-[var(--accent-danger)]">{err}</p>;
  }

  const freeHours = freeToday.reduce((a, x) => a + x.duration / 60, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Next class</p>
        {next ? (
          <>
            <p className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--text-primary)]">
              {next.subject}
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
              {next.className} | Room {next.room}
            </p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">Starts in</p>
            {nextStart && <Countdown target={nextStart} />}
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No upcoming slot found.</p>
        )}
      </Card>

      <Card className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Free time today</p>
        <p className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--accent-secondary)]">
          {freeHours.toFixed(1)}h
        </p>
        <div className="mt-3 flex h-2 gap-0.5 rounded-full bg-[var(--bg-elevated)]">
          {freeToday.slice(0, 12).map((_, i) => (
            <div key={i} className="h-full flex-1 rounded-sm bg-[var(--accent-secondary)]/60" />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Goal momentum</p>
        <div className="mt-2 flex items-center gap-4">
          <div
            className="h-20 w-20 shrink-0 rounded-full p-1"
            style={{
              background: `conic-gradient(from -90deg, var(--accent-secondary) 0%, var(--accent-primary) ${pct}%, var(--bg-elevated) ${pct}%)`
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[var(--text-primary)]">
                {pct}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Across active goals</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
