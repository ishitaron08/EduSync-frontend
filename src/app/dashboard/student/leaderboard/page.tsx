"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { hueFromString } from "@/lib/hueFromString";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Flame, Medal, Target, TrendingUp } from "lucide-react";

type LeaderboardEntry = {
  studentId: string;
  name: string;
  rewardPoints: number;
};

type StudentProfile = {
  _id?: string;
  learningGoal?: string;
  rewardPoints?: number;
  streak?: number;
};

const validScopes = ["weekly", "monthly", "all_time"] as const;
type Scope = (typeof validScopes)[number];

function getScope(value: string | null): Scope {
  return validScopes.includes(value as Scope) ? (value as Scope) : "all_time";
}

function displayName(entry: LeaderboardEntry, isMe: boolean) {
  if (isMe) return `${entry.name} (You)`;
  return `${entry.name.split(" ").map((part) => part[0]).join(".")}.`;
}

export default function StudentLeaderboardPage() {
  const allowed = useDashboardGuard("student");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = getScope(searchParams.get("scope"));

  const leaderboardQuery = useQuery({
    queryKey: queryKeys.student.leaderboard(scope),
    queryFn: async () => {
      const { data } = await api.get(`/student/leaderboard?scope=${scope}`);
      return (data.rows || []) as LeaderboardEntry[];
    },
    enabled: allowed
  });
  const profileQuery = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/student/profile");
      return data;
    },
    enabled: allowed
  });

  const leaderboard = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);
  const profile = profileQuery.data ?? null;
  const loading = leaderboardQuery.isLoading || profileQuery.isLoading;
  const topThree = leaderboard.slice(0, 3);

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  function handleScopeChange(nextScope: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", nextScope);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      <Tabs value={scope} onValueChange={handleScopeChange}>
        <TabsList variant="grid" className="max-w-md">
          <TabsTrigger value="weekly" variant="grid">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" variant="grid">Monthly</TabsTrigger>
          <TabsTrigger value="all_time" variant="grid">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile score</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"><Target className="h-4 w-4" /> Goal</span>
                <span className="text-right text-sm font-medium text-[var(--text-primary)]">{profile?.learningGoal || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"><Award className="h-4 w-4" /> Points</span>
                <span className="font-semibold text-[var(--text-primary)]">{profile?.rewardPoints || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"><Flame className="h-4 w-4" /> Streak</span>
                <span className="font-semibold text-[var(--accent-amber)]">{profile?.streak || 0} days</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <TrendingUp className="mb-4 h-5 w-5 text-[var(--accent-primary)]" />
            <p className="font-semibold text-[var(--text-primary)]">Next move</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Complete AI learning tasks and assessments to add points. Streaks help keep the climb steady.</p>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Top students</h2>
            <span className="text-xs text-[var(--text-muted)]">{leaderboard.length} ranked</span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => <div key={item} className="nc-skeleton h-16 rounded-lg" />)}
            </div>
          ) : leaderboard.length ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isMe = entry.studentId === profile?._id;
                const h = hueFromString(entry.name);
                const isPodium = rank <= 3;
                return (
                  <div key={entry.studentId} className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 p-4 ${isMe ? "bg-[var(--accent-primary)]/8" : ""}`}>
                    <div className="flex justify-center">
                      {isPodium ? <Medal className={`h-6 w-6 ${rank === 1 ? "text-[var(--accent-amber)]" : rank === 2 ? "text-[var(--text-muted)]" : "text-[var(--accent-secondary)]"}`} /> : <span className="font-mono text-sm text-[var(--text-muted)]">#{rank}</span>}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold text-[var(--text-inverse)]" style={{ backgroundColor: `hsl(${h} 45% 42%)` }}>
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate font-semibold ${isMe ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>{displayName(entry, isMe)}</p>
                        {topThree.some((top) => top.studentId === entry.studentId) ? <p className="text-xs text-[var(--text-muted)]">Podium rank</p> : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">{entry.rewardPoints}</p>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">No leaderboard data available yet.</div>
          )}
        </Card>
      </section>
    </main>
  );
}
