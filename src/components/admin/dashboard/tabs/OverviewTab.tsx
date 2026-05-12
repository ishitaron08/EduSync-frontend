"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type OverviewMetrics = {
  users: { total: number; admin: number; teacher: number; student: number };
  courses: { total: number; active: number; pending: number; approved: number; rejected: number };
  assessments: { total: number; draft: number; published: number; closed: number };
  auditLogs24h: number;
  generatedAt: string;
};

type AuditLogRow = {
  _id: string;
  action: string;
  resource: string;
  actorRole: "admin" | "teacher" | "student";
  createdAt: string;
};

type LeaderboardResponse = {
  scope: string;
  generatedAt: string;
  rows: Array<{ rank: number; studentId: string; name: string; email: string; rewardPoints: number }>;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function OverviewTab() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadOverview() {
      setStatus("loading");
      setError(null);
      try {
        const [metricsResponse, auditResponse, leaderboardResponse] = await Promise.all([
          api.get<OverviewMetrics>("/admin/metrics/overview"),
          api.get<{ logs?: AuditLogRow[] }>("/admin/audit-logs?limit=10"),
          api.get<LeaderboardResponse>("/admin/leaderboard?scope=all_time")
        ]);

        if (!alive) {
          return;
        }

        setMetrics(metricsResponse.data);
        setAuditLogs(Array.isArray(auditResponse.data?.logs) ? auditResponse.data.logs : []);
        setLeaderboard(leaderboardResponse.data);
        setStatus("ready");
      } catch (loadError) {
        if (!alive) {
          return;
        }
        setMetrics(null);
        setAuditLogs([]);
        setLeaderboard(null);
        setError(describeApiError(loadError));
        setStatus("error");
      }
    }

    loadOverview();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <TabChrome
      eyebrow="Overview"
      title="Command center"
      description="A live snapshot of users, courses, audits, and system health."
    >
      <DataState
        status={status}
        error={error}
        loading="Loading overview metrics..."
        empty={
          <AdminEmptyState
            title="No overview data available"
            description="The backend did not return metrics yet. Once the admin APIs have data, summary cards and recent activity will appear here."
          />
        }
      >
        <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total users</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{metrics ? formatCount(metrics.users.total) : "0"}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Admins, teachers, and students combined</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total courses</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{metrics ? formatCount(metrics.courses.total) : "0"}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Active courses are approved and live</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Audit events</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{metrics ? formatCount(metrics.auditLogs24h) : "0"}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Changes recorded in the last 24 hours</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">System health</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Live</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[var(--accent-success)]" />
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Backend health endpoint responds successfully</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="p-4 md:p-5 xl:col-span-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Recent audit logs</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">The last ten admin actions recorded by the backend.</p>
              </div>
              <Link href="/dashboard/admin?tab=operations" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {auditLogs.map((log) => (
                <div key={log._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] p-4">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{log.action}</p>
                    <p className="text-sm text-[var(--text-muted)]">{log.resource}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Badge tone={log.actorRole === "admin" ? "green" : log.actorRole === "teacher" ? "blue" : "amber"}>{log.actorRole}</Badge>
                    <Clock3 className="h-4 w-4" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6 xl:col-span-4">
            <Card className="p-4 md:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Top students</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Leaderboard snapshot from the backend.</p>
                </div>
                <UsersRound className="h-4 w-4 text-[var(--accent-primary)]" />
              </div>
              <div className="mt-4 space-y-3">
                {(leaderboard?.rows ?? []).slice(0, 5).map((row) => (
                  <div key={row.studentId} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] p-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{row.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{row.email}</p>
                    </div>
                    <Badge tone="green">{row.rewardPoints} pts</Badge>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
        </div>
      </DataState>
    </TabChrome>
  );
}