"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hueFromString } from "@/lib/hueFromString";
import { Mail, AlertTriangle } from "lucide-react";

type StudentProgress = {
  _id: string;
  name: string;
  email: string;
  rewardPoints: number;
  attendancePercent: number;
  taskCompletionRate: number;
  atRisk: boolean;
};

export default function TeacherStudentsPage() {
  const allowed = useDashboardGuard("teacher");
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get<StudentProgress[]>("/teacher/students/progress")
      .then((res) => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed]);

  if (!allowed) return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Student Progress</h1>
        <p className="text-sm text-[var(--text-muted)]">Monitor class performance, attendance, and identify at-risk students.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Student</th>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Attendance</th>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Task Completion</th>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Points</th>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {students.map((s) => {
                const h = hueFromString(s.name);
                return (
                  <tr key={s._id} className="hover:bg-[var(--bg-surface)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-medium text-xs"
                          style={{ backgroundColor: `hsl(${h} 40% 90%)`, color: `hsl(${h} 40% 40%)` }}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{s.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={s.attendancePercent < 75 ? "text-[var(--accent-danger)] font-medium" : ""}>
                        {s.attendancePercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--accent-primary)]" 
                            style={{ width: `${s.taskCompletionRate}%` }} 
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{s.taskCompletionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--accent-secondary)]">{s.rewardPoints}</td>
                    <td className="px-4 py-3">
                      {s.atRisk ? (
                        <Badge variant="destructive" className="flex w-max items-center gap-1 text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> At Risk
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-[var(--accent-primary)] border-[var(--accent-primary)]/30">
                          On Track
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Message Student">
                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-muted)]">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
