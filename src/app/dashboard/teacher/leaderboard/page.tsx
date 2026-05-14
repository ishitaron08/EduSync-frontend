"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { TeacherPageShell } from "@/components/teacher/TeacherPageShell";
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
    <TeacherPageShell maxWidth="compact">

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)] text-center">{loadErr}</p>}

      <Card className="p-3 md:p-5">
        <div className="space-y-3">
          {leaders.map((student, idx) => {
            const h = hueFromString(student.name);
            const isTop3 = idx < 3;
            return (
              <div 
                key={student._id} 
                className={`flex items-center gap-4 rounded-lg border p-4 ${isTop3 ? 'border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/8' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'}`}
              >
                <div className="w-8 text-center font-mono font-bold text-[var(--text-muted)]">
                  {idx === 0 ? <Trophy className="mx-auto h-6 w-6 text-[var(--accent-amber)]" /> : 
                   idx === 1 ? <Medal className="mx-auto h-6 w-6 text-[var(--text-muted)]" /> : 
                   idx === 2 ? <Medal className="mx-auto h-6 w-6 text-[var(--accent-secondary)]" /> : 
                   `#${idx + 1}`}
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-medium text-sm"
                  style={{ backgroundColor: `hsl(${h} 40% 90%)`, color: `hsl(${h} 40% 40%)` }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{student.name}</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[var(--accent-amber)] font-semibold">
                  {student.totalPoints} <Star className="h-4 w-4 fill-[var(--accent-amber)]" />
                </div>
              </div>
            );
          })}
          {leaders.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8">No leaderboard data found.</p>
          )}
        </div>
      </Card>
    </TeacherPageShell>
  );
}
