"use client";

import { useQuery } from "@tanstack/react-query";
import { TabChrome, AdminEmptyState } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

type AttendanceStats = {
  classStats: Array<{ sectionId: string; percentage: number }>;
  atRiskStudents: Array<{ _id: string; name: string; email: string; attendancePercentage: number }>;
  dailyTrends: Array<{ date: string; rate: number }>;
};

export function AttendanceTab() {
  const statsQuery = useQuery({
    queryKey: queryKeys.admin.attendanceStats,
    queryFn: async () => {
      const { data } = await api.get<AttendanceStats>("/admin/attendance/stats");
      return data;
    }
  });
  const stats = statsQuery.data ?? null;
  const status = statsQuery.isLoading ? "loading" : statsQuery.isError ? "error" : "ready";
  const error = statsQuery.error ? describeApiError(statsQuery.error) : null;

  function handleExport() {
    if (!stats) return;
    const csvRows = ["Name,Email,Attendance %"];
    for (const student of stats.atRiskStudents) {
      csvRows.push(`${student.name},${student.email},${student.attendancePercentage.toFixed(2)}`);
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "at_risk_students.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <TabChrome
      actions={
        <Button onClick={handleExport} variant="outline" className="gap-2" disabled={status !== "ready"}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <DataState
        status={status}
        error={error}
        loading="Loading attendance analytics..."
        empty={
          <AdminEmptyState
            title="No Attendance Data"
            description="No attendance records were found to analyze."
          />
        }
      >
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Daily Attendance Trend</p>
              <div className="mt-4 h-[300px] w-full">
                {stats?.dailyTrends && stats.dailyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailyTrends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "8px" }}
                        itemStyle={{ color: "var(--text-primary)" }}
                      />
                      <Line type="monotone" dataKey="rate" name="Attendance %" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--accent-primary)" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No trend data available</div>
                )}
              </div>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Class-wise Overview</p>
              <div className="mt-4 h-[300px] w-full">
                {stats?.classStats && stats.classStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.classStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="sectionId" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(-4)} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "8px" }}
                        itemStyle={{ color: "var(--text-primary)" }}
                      />
                      <Bar dataKey="percentage" name="Attendance %" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No class data available</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">At-Risk Students (&lt; 75%)</p>
            <div className="grid gap-3 md:hidden">
              {stats?.atRiskStudents?.length ? (
                stats.atRiskStudents.map((student) => (
                  <div key={student._id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-[var(--text-primary)]">{student.name}</p>
                        <p className="mt-1 break-all text-xs text-[var(--text-muted)]">{student.email}</p>
                      </div>
                      <Badge tone="amber">At Risk</Badge>
                    </div>
                    <p className="mt-4 font-mono text-sm text-[var(--accent-danger)]">{student.attendancePercentage.toFixed(1)}% attendance</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-muted)]">No at-risk students found.</div>
              )}
            </div>

            <div className="hidden rounded-lg border border-[var(--border-subtle)] md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Attendance %</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.atRiskStudents?.length ? (
                    stats.atRiskStudents.map((student) => (
                      <tr key={student._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{student.name}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{student.email}</td>
                        <td className="px-4 py-3 font-mono text-[var(--accent-danger)]">{student.attendancePercentage.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <Badge tone="amber">At Risk</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)]">No at-risk students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </DataState>
    </TabChrome>
  );
}
