"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { hueFromString } from "@/lib/hueFromString";
import { Trophy, Medal, Star } from "lucide-react";

type LeaderboardEntry = { _id: string; name: string; totalPoints: number };

export default function TeacherLeaderboardPage() {
  const allowed = useDashboardGuard("teacher");
  const leadersQuery = useQuery({
    queryKey: queryKeys.teacher.leaderboard,
    queryFn: async () => {
      const { data } = await api.get<{ leaderboard: LeaderboardEntry[] }>("/teacher/leaderboard");
      return data.leaderboard || [];
    },
    enabled: allowed
  });
  const leaders = leadersQuery.data ?? [];
  const loadErr = leadersQuery.error ? describeApiError(leadersQuery.error) : null;

  if (!allowed) return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <div className="mb-6 text-center">
        <Trophy className="mx-auto h-12 w-12 text-[var(--accent-amber)] mb-4" />
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Institution Leaderboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">Recognize the highest performers across the institution.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)] text-center">{loadErr}</p>}

      <Card className="p-2 md:p-6 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-elevated)] border-[var(--accent-amber)]/20 shadow-lg">
        <div className="space-y-3">
          {leaders.map((student, idx) => {
            const h = hueFromString(student.name);
            const isTop3 = idx < 3;
            return (
              <div 
                key={student._id} 
                className={`flex items-center gap-4 p-4 rounded-xl border ${isTop3 ? 'border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/5' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'}`}
              >
                <div className="w-8 text-center font-mono font-bold text-[var(--text-muted)]">
                  {idx === 0 ? <Trophy className="w-6 h-6 text-yellow-500 mx-auto" /> : 
                   idx === 1 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> : 
                   idx === 2 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> : 
                   `#${idx + 1}`}
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-medium text-sm"
                  style={{ backgroundColor: `hsl(${h} 40% 90%)`, color: `hsl(${h} 40% 40%)` }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${isTop3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{student.name}</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[var(--accent-amber)] font-semibold">
                  {student.totalPoints} <Star className="w-4 h-4 fill-[var(--accent-amber)]" />
                </div>
              </div>
            );
          })}
          {leaders.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8">No leaderboard data found.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
