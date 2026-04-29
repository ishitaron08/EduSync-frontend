"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/useAuthStore";
import { useRequireAuth } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";

type LeaderboardRow = { rank: number; name: string; rewardPoints: number };

export default function LeaderboardPage() {
  const allowed = useRequireAuth();
  const role = useAuthStore((s) => s.role);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed || !role) return;
    const base = role === "teacher" ? "/teacher" : role === "admin" ? "/admin" : "/student";
    api
      .get<{ rows: LeaderboardRow[] }>(`${base}/leaderboard`)
      .then(({ data }) => {
        setRows(data.rows ?? []);
        setError(null);
      })
      .catch((e) => setError(describeApiError(e)));
  }, [allowed, role]);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-40 rounded-[8px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Leaderboard</h1>
      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
      {rows.map((row) => (
        <Card key={row.rank} className="flex items-center justify-between p-4">
          <p className="text-[var(--text-primary)]">
            #{row.rank} {row.name}
          </p>
          <p className="font-mono text-[var(--accent-secondary)]">{row.rewardPoints} pts</p>
        </Card>
      ))}
    </main>
  );
}
