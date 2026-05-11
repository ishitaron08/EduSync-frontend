"use client";

import { useEffect, useState } from "react";
import { TabChrome, AdminEmptyState } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type AnalyticsData = {
  goalDistribution: Array<{ name: string; value: number }>;
  completionRate: number;
  decliningStudents: Array<{ _id: string; name: string; email: string; completionRate: number }>;
};

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadData() {
      try {
        const res = await api.get<AnalyticsData>("/admin/analytics/learning");
        if (alive) {
          setData(res.data);
          setStatus("ready");
        }
      } catch (err) {
        if (alive) {
          setError(describeApiError(err));
          setStatus("error");
        }
      }
    }
    loadData();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TabChrome
      eyebrow="Learning Analytics"
      title="AI & Goal Metrics"
      description="Monitor AI learning module usage, task completion rates, and identify at-risk students."
    >
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
                <span className="text-6xl font-bold text-[var(--accent-primary)]">
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
                  <div key={g.name} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="capitalize">{g.name} ({g.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">Students Needing Intervention (Completion &lt; 40%)</p>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
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
