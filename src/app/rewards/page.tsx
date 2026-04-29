"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function levelFromPoints(p: number): { level: number; name: string } {
  const level = Math.min(99, Math.floor(p / 50) + 1);
  const names = ["Explorer", "Scholar I", "Scholar II", "Scholar III", "Archivist", "Navigator"];
  return { level, name: names[Math.min(names.length - 1, Math.floor(level / 15))] };
}

export default function RewardsPage() {
  const allowed = useDashboardGuard("student");
  const [points, setPoints] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Array<{ title?: string; pointsAwarded?: number; status?: string }>>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let c = false;
    Promise.all([
      api.get<{ rewardPoints?: number }>("/student/reward-points"),
      api.get<Array<{ title: string; pointsAwarded?: number; status: string }>>("/student/tasks")
    ])
      .then(([rp, ts]) => {
        if (c) return;
        setPoints(rp.data.rewardPoints ?? 0);
        setTasks(ts.data.filter((t) => t.status === "completed"));
      })
      .catch((e) => {
        if (!c) setErr(describeApiError(e));
      });
    return () => {
      c = true;
    };
  }, [allowed]);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-40 rounded-[8px]" />
      </main>
    );
  }

  const { level, name } = levelFromPoints(points ?? 0);
  const needle = Math.min(88, ((points ?? 0) % 50) / 50 * 88);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 md:px-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Rewards</h1>
      {err && <p className="text-sm text-[var(--accent-danger)]">{err}</p>}

      <Card className="relative overflow-hidden p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Experience fuel</p>
        <div className="mt-4 flex flex-wrap items-end gap-8">
          <div className="relative h-36 w-56">
            <div className="absolute inset-x-4 bottom-4 top-8 rounded-full border-[12px] border-[var(--bg-elevated)]" />
            <div
              className="absolute bottom-10 left-1/2 h-16 w-1 origin-bottom rounded-full bg-[var(--accent-primary)] transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${-44 + needle * 0.9}deg)` }}
            />
            <div className="absolute bottom-4 left-3 right-3 flex justify-between font-mono text-[10px] text-[var(--text-muted)]">
              <span>0</span>
              <span>MAX</span>
            </div>
          </div>
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-6xl font-semibold text-[var(--text-primary)]">{level}</p>
            <p className="text-lg text-[var(--accent-primary)]">{name}</p>
            <p className="mt-2 font-mono text-sm text-[var(--accent-secondary)]">{points ?? 0} XP banked</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--text-primary)]">Recent gains</h2>
        <div className="mt-4 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Complete tasks to populate your XP timeline.</p>
          ) : (
            tasks.slice(0, 8).map((t, i) => (
              <div
                key={i}
                className="nc-page-enter flex items-center justify-between border-b border-[var(--border-subtle)] py-3"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-success)]" />
                  <span className="text-[var(--text-primary)]">{t.title}</span>
                </div>
                <Badge tone="green">+{t.pointsAwarded ?? 10} XP</Badge>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--text-primary)]">Badge matrix</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-[1/1.15] items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            >
              <span className="text-xs text-[var(--text-muted)]">{i < 3 ? "OK" : ""}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Demo hex grid. Wire badges when backend ships.</p>
      </section>
    </main>
  );
}
