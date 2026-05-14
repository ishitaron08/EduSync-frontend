"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { TabChrome, AdminEmptyState } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

type StudentAnalyticsRow = {
  _id: string;
  name: string;
  email: string;
  rewardPoints: number;
  section: {
    sectionCode?: string;
    courseCode?: string;
    courseName?: string;
  } | null;
  activeGoal: {
    goalType?: string;
    title?: string;
    progress?: number;
    targetDate?: string;
  } | null;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  pointsAwarded: number;
  totalDurationMinutes: number;
  lastCompletedAt?: string | null;
  lastTaskAt?: string | null;
  status: "Healthy" | "Watch" | "At Risk" | "No Tasks" | string;
};

type AnalyticsData = {
  goalDistribution: Array<{ name: string; value: number }>;
  completionRate: number;
  decliningStudents: Array<{ _id: string; name: string; email: string; completionRate: number }>;
  studentRows?: StudentAnalyticsRow[];
  summary?: {
    totalStudents: number;
    studentsWithTasks: number;
    atRiskStudents: number;
    noTaskStudents: number;
    averageTasksPerStudent: number;
  };
  completionBuckets?: Array<{ name: string; value: number }>;
};

const PAGE_SIZE = 20;
const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const BUCKET_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#94a3b8"];

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatGoal(value?: string) {
  if (!value) return "No active goal";
  return value.replaceAll("_", " ");
}

function formatSection(section: StudentAnalyticsRow["section"]) {
  if (!section) return "Not enrolled";
  return [section.courseCode || section.courseName, section.sectionCode].filter(Boolean).join(" ") || "Enrolled";
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function completionTone(value: number) {
  if (value < 40) return "bg-[var(--accent-danger)]";
  if (value < 70) return "bg-[var(--accent-primary)]";
  return "bg-[var(--accent-success)]";
}

function statusTone(status: StudentAnalyticsRow["status"]): "green" | "amber" | "destructive" | "muted" {
  if (status === "Healthy") return "green";
  if (status === "Watch") return "amber";
  if (status === "At Risk") return "destructive";
  return "muted";
}

export function AnalyticsTab() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const analyticsQuery = useQuery({
    queryKey: queryKeys.admin.learningAnalytics,
    queryFn: async () => {
      const res = await api.get<AnalyticsData>("/admin/analytics/learning");
      return res.data;
    }
  });
  const data = analyticsQuery.data ?? null;
  const rows: StudentAnalyticsRow[] = data?.studentRows ?? data?.decliningStudents?.map((student) => ({
    ...student,
    rewardPoints: 0,
    section: null,
    activeGoal: null,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    pointsAwarded: 0,
    totalDurationMinutes: 0,
    lastCompletedAt: null,
    lastTaskAt: null,
    status: student.completionRate < 40 ? "At Risk" : "Watch"
  })) ?? [];
  const status = analyticsQuery.isLoading ? "loading" : analyticsQuery.isError ? "error" : "ready";
  const error = analyticsQuery.error ? describeApiError(analyticsQuery.error) : null;

  useEffect(() => {
    const nextSearch = searchInput.trim();
    if (!nextSearch) {
      setSearch("");
      setPage(1);
      return;
    }

    const timeout = window.setTimeout(() => {
      setSearch(nextSearch);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        student.status,
        student.activeGoal?.title,
        student.activeGoal?.goalType,
        student.section?.sectionCode,
        student.section?.courseCode,
        student.section?.courseName
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const summary = data?.summary;

  return (
    <TabChrome>
      <DataState
        status={status}
        error={error}
        loading="Loading analytics..."
        empty={
          <AdminEmptyState
            title="No Analytics Data"
            description="No learning goals or tasks were found to analyze."
          />
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Average Completion</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--accent-primary)]">{formatPercent(data?.completionRate ?? 0)}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Completed tasks across all students</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Students Analysed</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{summary?.totalStudents ?? rows.length}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{summary?.studentsWithTasks ?? 0} with assigned tasks</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">At Risk</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--accent-danger)]">{summary?.atRiskStudents ?? data?.decliningStudents.length ?? 0}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Below 40% task completion</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Avg Tasks / Student</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{(summary?.averageTasksPerStudent ?? 0).toFixed(1)}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{summary?.noTaskStudents ?? 0} students without tasks</p>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Goal Distribution</p>
              <div className="mt-4 h-[220px] w-full">
                {data?.goalDistribution?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.goalDistribution} cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={5} dataKey="value">
                        {data.goalDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No goals found</div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {data?.goalDistribution?.map((goal, index) => (
                  <div key={goal.name} className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="min-w-0 break-words capitalize">{formatGoal(goal.name)} ({goal.value})</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Completion Bands</p>
              <div className="mt-4 h-[260px] w-full">
                {data?.completionBuckets?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.completionBuckets} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "8px" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.completionBuckets.map((entry, index) => (
                          <Cell key={entry.name} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No completion data found</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Student Learning Table</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Showing 20 students at a time with search by student, section, goal, or status.</p>
              </div>
              <div
                className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-xl"
              >
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search student, goal, section, status"
                    className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:hidden">
              {pageRows.map((student) => (
                <div key={student._id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-[var(--text-primary)]">{student.name}</p>
                      <p className="mt-1 break-all text-xs text-[var(--text-muted)]">{student.email}</p>
                    </div>
                    <Badge tone={statusTone(student.status)}>{student.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-[var(--text-muted)]">Completion</span><p className="font-mono text-[var(--text-primary)]">{formatPercent(student.completionRate)}</p></div>
                    <div><span className="text-[var(--text-muted)]">Tasks</span><p className="font-mono text-[var(--text-primary)]">{student.completedTasks}/{student.totalTasks}</p></div>
                    <div><span className="text-[var(--text-muted)]">Reward points</span><p className="font-mono text-[var(--accent-amber)]">{student.rewardPoints}</p></div>
                    <div><span className="text-[var(--text-muted)]">Section</span><p className="truncate text-[var(--text-primary)]">{formatSection(student.section)}</p></div>
                    <div className="col-span-2"><span className="text-[var(--text-muted)]">Goal</span><p className="truncate capitalize text-[var(--text-primary)]">{formatGoal(student.activeGoal?.title || student.activeGoal?.goalType)}</p></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden max-w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)] [-webkit-overflow-scrolling:touch] lg:block">
              <table className="min-w-[1120px] text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  <tr>
                    <th className="w-[22%] px-4 py-3 font-medium">Student</th>
                    <th className="w-[13%] px-4 py-3 font-medium">Section</th>
                    <th className="w-[18%] px-4 py-3 font-medium">Goal</th>
                    <th className="w-[10%] px-4 py-3 font-medium">Tasks</th>
                    <th className="w-[15%] px-4 py-3 font-medium">Completion</th>
                    <th className="w-[9%] px-4 py-3 font-medium">Reward Points</th>
                    <th className="w-[8%] px-4 py-3 font-medium">Task Points</th>
                    <th className="w-[12%] px-4 py-3 font-medium">Last Completed</th>
                    <th className="w-[9%] px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length ? pageRows.map((student) => (
                    <tr key={student._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] align-top">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                        <p className="mt-1 max-w-[220px] truncate text-xs text-[var(--text-muted)]">{student.email}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-[var(--text-muted)]">{formatSection(student.section)}</td>
                      <td className="px-4 py-3 align-top">
                        <p className="max-w-[180px] truncate capitalize text-[var(--text-primary)]">{formatGoal(student.activeGoal?.title || student.activeGoal?.goalType)}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{student.activeGoal ? `${student.activeGoal.progress ?? 0}% goal progress` : "No selected goal"}</p>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-[var(--text-primary)]">
                        {student.completedTasks}/{student.totalTasks}
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{student.pendingTasks} pending</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-[var(--text-primary)]">{formatPercent(student.completionRate)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[var(--bg-elevated)]">
                          <div className={`h-2 rounded-full ${completionTone(student.completionRate)}`} style={{ width: `${Math.min(100, Math.max(0, student.completionRate))}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-mono font-semibold text-[var(--accent-amber)]">{student.rewardPoints}</td>
                      <td className="px-4 py-3 align-top font-mono text-[var(--text-primary)]">{student.pointsAwarded}</td>
                      <td className="px-4 py-3 align-top text-[var(--text-muted)]">{formatDate(student.lastCompletedAt)}</td>
                      <td className="px-4 py-3 align-top"><Badge tone={statusTone(student.status)}>{student.status}</Badge></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        {search ? "No students match your search." : "No student analytics are available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </Button>
                <span className="font-mono text-xs">Page {safePage} / {totalPages}</span>
                <Button type="button" variant="ghost" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DataState>
    </TabChrome>
  );
}
