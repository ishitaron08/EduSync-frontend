"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  UsersRound,
  BookOpenText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export function OverviewTab() {
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

          {/* Row 2: Engagement & Actionable Items */}
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

            {/* Right: Actionable Items */}
            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Action Required</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Items needing your attention.</p>

              <div className="mt-4 space-y-3">
                {/* Pending Courses */}
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-[var(--accent-warning)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Pending Courses
                      </span>
                    </div>
                    <Badge tone="amber">{metrics?.actionable.pendingCourses.length ?? 0}</Badge>
                  </div>
                  {metrics?.actionable.pendingCourses.length ? (
                    <div className="mt-2 space-y-1">
                      {metrics.actionable.pendingCourses.slice(0, 3).map((course) => (
                        <div key={course._id} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-primary)]">{course.code} - {course.name}</span>
                          <span className="text-[var(--text-muted)]">{formatDate(course.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">No pending approvals</p>
                  )}
                  <Link
                    href="/dashboard/admin?tab=courses"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* At-Risk Students */}
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[var(--accent-danger)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        At-Risk Students
                      </span>
                    </div>
                    <Badge tone="destructive">{metrics?.actionable.atRiskStudents.length ?? 0}</Badge>
                  </div>
                  {metrics?.actionable.atRiskStudents.length ? (
                    <div className="mt-2 space-y-1">
                      {metrics.actionable.atRiskStudents.slice(0, 3).map((student) => (
                        <div key={student._id} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-primary)]">{student.name}</span>
                          <span className="text-[var(--accent-danger)]">
                            {student.attendancePercentage}% attendance
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">No at-risk students detected</p>
                  )}
                  <Link
                    href="/dashboard/admin?tab=operations"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    View details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Upcoming Assessments */}
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Upcoming Assessments
                      </span>
                    </div>
                    <Badge tone="blue">{metrics?.actionable.upcomingAssessments.length ?? 0}</Badge>
                  </div>
                  {metrics?.actionable.upcomingAssessments.length ? (
                    <div className="mt-2 space-y-1">
                      {metrics.actionable.upcomingAssessments.slice(0, 3).map((assessment) => (
                        <div key={assessment._id} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-primary)]">{assessment.title}</span>
                          <span className="text-[var(--text-muted)]">
                            {formatDate(assessment.startTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">No assessments this week</p>
                  )}
                  <Link
                    href="/dashboard/admin?tab=assessments"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Row 3: Leaderboard */}
          <Card className="p-4 md:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Top Students</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Leaderboard by reward points.</p>
              </div>
              <UsersRound className="h-4 w-4 text-[var(--accent-primary)]" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {metrics?.leaderboard.length ? (
                metrics.leaderboard.map((row, index) => (
                  <div
                    key={row.studentId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-medium text-[var(--accent-primary)]">
                          {index + 1}
                        </span>
                        <p className="truncate font-medium text-[var(--text-primary)]">{row.name}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{row.email}</p>
                    </div>
                    <Badge tone="green">{row.rewardPoints} pts</Badge>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-[var(--border-subtle)] p-4 text-center text-sm text-[var(--text-muted)]">
                  No leaderboard data available
                </div>
              )}
            </div>
          </Card>
        </div>
      </DataState>
    </TabChrome>
  );
}
