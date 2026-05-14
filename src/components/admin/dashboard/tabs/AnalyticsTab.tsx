"use client";

import { useQuery } from "@tanstack/react-query";
import { TabChrome, AdminEmptyState } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type AnalyticsData = {
  goalDistribution: Array<{ name: string; value: number }>;
  completionRate: number;
  decliningStudents: Array<{ _id: string; name: string; email: string; completionRate: number }>;
};

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function AnalyticsTab() {
  const analyticsQuery = useQuery({
    queryKey: queryKeys.admin.learningAnalytics,
    queryFn: async () => {
      const res = await api.get<AnalyticsData>("/admin/analytics/learning");
      return res.data;
    }
  });
  const data = analyticsQuery.data ?? null;
  const status = analyticsQuery.isLoading ? "loading" : analyticsQuery.isError ? "error" : "ready";
  const error = analyticsQuery.error ? describeApiError(analyticsQuery.error) : null;

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
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Average Completion Rate</p>
              <div className="mt-4 flex items-center justify-center">
                <span className="text-4xl font-bold text-[var(--accent-primary)] sm:text-6xl">
                  {data?.completionRate.toFixed(1)}%
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Tasks successfully completed by students</p>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] text-center">Goal Distribution</p>
              <div className="mt-4 h-[200px] w-full">
                {data?.goalDistribution && data.goalDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.goalDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.goalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "8px" }}
                        itemStyle={{ color: "var(--text-primary)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No goals found</div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {data?.goalDistribution?.map((g, idx) => (
                  <div key={g.name} className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="min-w-0 break-words capitalize">{g.name} ({g.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">Students Needing Intervention (Completion &lt; 40%)</p>
            <div className="grid gap-3 md:hidden">
              {data?.decliningStudents?.length ? (
                data.decliningStudents.map((student) => (
                  <div key={student._id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-[var(--text-primary)]">{student.name}</p>
                        <p className="mt-1 break-all text-xs text-[var(--text-muted)]">{student.email}</p>
                      </div>
                      <Badge tone="amber">Declining</Badge>
                    </div>
                    <p className="mt-4 font-mono text-sm text-[var(--accent-danger)]">{student.completionRate.toFixed(1)}% task completion</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-muted)]">No students currently need intervention.</div>
              )}
            </div>

            <div className="hidden rounded-lg border border-[var(--border-subtle)] md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Task Completion %</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.decliningStudents?.length ? (
                    data.decliningStudents.map((student) => (
                      <tr key={student._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{student.name}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{student.email}</td>
                        <td className="px-4 py-3 font-mono text-[var(--accent-danger)]">{student.completionRate.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <Badge tone="amber">Declining</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)]">No students currently need intervention.</td>
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
