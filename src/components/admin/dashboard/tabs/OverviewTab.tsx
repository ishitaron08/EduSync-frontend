"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UsersRound,
  BookOpenText,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  Search
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type DashboardMetrics = {
  users: {
    total: number;
    admin: number;
    teacher: number;
    student: number;
    activeThisWeek: number;
  };
  courses: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
  };
  engagement: {
    taskCompletionRate: number;
    averageAttendanceRate: number;
    activeGoals: number;
    studentsWithGoals: number;
  };
  actionable: {
    pendingCourses: Array<{ _id: string; code: string; name: string; createdAt: string }>;
    atRiskStudents: Array<{ _id: string; name: string; email: string; attendancePercentage: number }>;
    upcomingAssessments: Array<{ _id: string; title: string; startTime: string; sectionName: string }>;
  };
  leaderboard: Array<{ studentId: string; name: string; email: string; rewardPoints: number }>;
  generatedAt: string;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatPercentage(value: number) {
  return `${value}%`;
}

export function OverviewTab() {
  const [leaderboardSearchInput, setLeaderboardSearchInput] = useState("");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: async () => {
      const { data } = await api.get<DashboardMetrics>("/admin/metrics/dashboard");
      return data;
    }
  });
  const metrics = metricsQuery.data ?? null;
  const status = metricsQuery.isLoading ? "loading" : metricsQuery.isError ? "error" : "ready";
  const error = metricsQuery.error ? describeApiError(metricsQuery.error) : null;
  useEffect(() => {
    const nextSearch = leaderboardSearchInput.trim();
    if (!nextSearch) {
      setLeaderboardSearch("");
      return;
    }

    const timeout = window.setTimeout(() => {
      setLeaderboardSearch(nextSearch);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [leaderboardSearchInput]);

  const filteredLeaderboard = useMemo(() => {
    const rows = metrics?.leaderboard ?? [];
    const needle = leaderboardSearch.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(needle));
  }, [leaderboardSearch, metrics?.leaderboard]);

  return (
    <TabChrome>
      <DataState
        status={status}
        error={error}
        loading="Loading dashboard metrics..."
        empty={
          <AdminEmptyState
            title="No dashboard data available"
            description="The backend did not return metrics yet. Once the admin APIs have data, insights will appear here."
          />
        }
      >
        <div className="space-y-6">
          {/* Row 1: Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total Users</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatCount(metrics.users.total) : "0"}
                  </p>
                </div>
                <UsersRound className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <div className="mt-3 flex gap-3 text-xs text-[var(--text-muted)]">
                <span><Badge tone="green">{metrics?.users.admin ?? 0}</Badge> admin</span>
                <span><Badge tone="blue">{metrics?.users.teacher ?? 0}</Badge> teacher</span>
                <span><Badge tone="amber">{metrics?.users.student ?? 0}</Badge> student</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total Courses</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatCount(metrics.courses.total) : "0"}
                  </p>
                </div>
                <BookOpenText className="h-5 w-5 text-[var(--accent-secondary)]" />
              </div>
              <div className="mt-3 flex gap-3 text-xs text-[var(--text-muted)]">
                <span>{metrics?.courses.active ?? 0} active</span>
                <span className="text-[var(--accent-warning)]">{metrics?.courses.pending ?? 0} pending</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Pending Approvals</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatCount(metrics.courses.pending) : "0"}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-[var(--accent-warning)]" />
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Courses awaiting moderation
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Active This Week</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatCount(metrics.users.activeThisWeek) : "0"}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-[var(--accent-success)]" />
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Users with recent activity
              </p>
            </Card>
          </div>

          {/* Row 2: Engagement & Leaderboard */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Left: Engagement Overview */}
            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Engagement Overview</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Key performance indicators for student engagement.</p>
              
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--border-subtle)] p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent-success)]" />
                    <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Task Completion</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatPercentage(metrics.engagement.taskCompletionRate) : "0%"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">This week</p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <UsersRound className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Attendance</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatPercentage(metrics.engagement.averageAttendanceRate) : "0%"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Average rate</p>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4 text-[var(--accent-secondary)]" />
                    <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Active Goals</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {metrics ? formatCount(metrics.engagement.activeGoals) : "0"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {metrics?.engagement.studentsWithGoals ?? 0} students
                  </p>
                </div>
              </div>
            </Card>

            {/* Right: Top Students */}
            <Card className="p-4 md:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Top Students</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Leaderboard by reward points.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <UsersRound className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>{filteredLeaderboard.length}/{metrics?.leaderboard.length ?? 0} students</span>
                </div>
              </div>

              <div
                className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={leaderboardSearchInput}
                    onChange={(event) => setLeaderboardSearchInput(event.target.value)}
                    placeholder="Search student"
                    className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
                  />
                </label>
                <Button type="button" size="sm" className="h-10" onClick={() => setLeaderboardSearch(leaderboardSearchInput.trim())}>
                  Search
                </Button>
              </div>

              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                {filteredLeaderboard.length ? (
                  filteredLeaderboard.map((row) => {
                    const rank = (metrics?.leaderboard ?? []).findIndex((student) => student.studentId === row.studentId) + 1;
                    return (
                      <div
                        key={row.studentId}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-medium text-[var(--accent-primary)]">
                              {rank}
                            </span>
                            <p className="truncate font-medium text-[var(--text-primary)]">{row.name}</p>
                          </div>
                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{row.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-sm font-semibold text-[var(--accent-amber)]">{row.rewardPoints}</p>
                          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">points</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-[var(--border-subtle)] p-4 text-center text-sm text-[var(--text-muted)]">
                    {leaderboardSearch ? "No students match your search." : "No leaderboard data available"}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </DataState>
    </TabChrome>
  );
}
