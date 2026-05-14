"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { TeacherPageShell } from "@/components/teacher/TeacherPageShell";
import { hueFromString } from "@/lib/hueFromString";
import { Trophy, Medal, Star, Search, UsersRound } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  studentId: string;
  name: string;
  email?: string;
  rewardPoints: number;
};

type LeaderboardPayload = {
  rows: LeaderboardEntry[];
  generatedAt: string;
};

export default function TeacherLeaderboardPage() {
  const allowed = useDashboardGuard("teacher");
  const [search, setSearch] = useState("");
  const leadersQuery = useQuery({
    queryKey: queryKeys.teacher.leaderboard,
    queryFn: async () => {
      const { data } = await api.get<LeaderboardPayload>("/teacher/leaderboard?limit=1000");
      return data;
    },
    enabled: allowed
  });
  const leaders = leadersQuery.data?.rows ?? [];
  const filteredLeaders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return leaders;
    return leaders.filter((student) => `${student.name} ${student.email ?? ""}`.toLowerCase().includes(needle));
  }, [leaders, search]);
  const loadErr = leadersQuery.error ? describeApiError(leadersQuery.error) : null;

  if (!allowed) return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;

  return (
    <TeacherPageShell>
      <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Student rewards</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Leaderboard</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Review all ranked students and search by name or email.</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm">
              <span className="font-semibold text-[var(--text-primary)]">{filteredLeaders.length}</span>
              <span className="ml-1 text-[var(--text-muted)]">shown</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <UsersRound className="mt-0.5 h-5 w-5 text-[var(--accent-primary)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{leaders.length} students loaded</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {leadersQuery.data?.generatedAt ? `Updated ${new Date(leadersQuery.data.generatedAt).toLocaleString()}` : "Loading latest ranks"}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)] text-center">{loadErr}</p>}

      <Card className="p-3 md:p-5">
        <div className="mb-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student by name or email"
              className="h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
            />
          </label>
        </div>
        <div className="space-y-3">
          {leadersQuery.isLoading ? (
            <div className="space-y-3">
              <div className="nc-skeleton h-16 rounded-lg" />
              <div className="nc-skeleton h-16 rounded-lg" />
              <div className="nc-skeleton h-16 rounded-lg" />
            </div>
          ) : filteredLeaders.map((student) => {
            const h = hueFromString(student.name);
            const isTop3 = student.rank <= 3;
            return (
              <div 
                key={student.studentId} 
                className={`flex items-center gap-4 rounded-lg border p-4 ${isTop3 ? 'border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/8' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'}`}
              >
                <div className="w-8 text-center font-mono font-bold text-[var(--text-muted)]">
                  {student.rank === 1 ? <Trophy className="mx-auto h-6 w-6 text-[var(--accent-amber)]" /> : 
                   student.rank === 2 ? <Medal className="mx-auto h-6 w-6 text-[var(--text-muted)]" /> : 
                   student.rank === 3 ? <Medal className="mx-auto h-6 w-6 text-[var(--accent-secondary)]" /> : 
                   `#${student.rank}`}
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-medium text-sm"
                  style={{ backgroundColor: `hsl(${h} 40% 90%)`, color: `hsl(${h} 40% 40%)` }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{student.name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{student.email ?? "No email"}</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[var(--accent-amber)] font-semibold">
                  {student.rewardPoints} <Star className="h-4 w-4 fill-[var(--accent-amber)]" />
                </div>
              </div>
            );
          })}
          {!leadersQuery.isLoading && filteredLeaders.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8">
              {search ? "No students match your search." : "No leaderboard data found."}
            </p>
          )}
        </div>
      </Card>
    </TeacherPageShell>
  );
}
