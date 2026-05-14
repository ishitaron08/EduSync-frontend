"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeacherPageShell } from "@/components/teacher/TeacherPageShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ResponsiveTable } from "@/components/ui/responsive-table";

type TestRecord = { _id: string; title: string; type: string };
type StudentResult = {
  studentId: string;
  name: string;
  email: string;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  score: number;
  maxScore: number;
  percent: number;
  submittedAt: string | null;
  questionBreakdown: Array<{
    questionIndex: number;
    prompt: string;
    marksAwarded: number;
    maxMarks: number;
  }>;
};

type TestAverage = {
  assessmentId: string;
  title: string;
  type: string;
  startTime: string;
  attempts: number;
  avgScore: number;
  avgMaxScore: number;
  avgPercent: number;
};

type TestAnalytics = {
  totalAttempts: number;
  max: number;
  min: number;
  avg: number;
  avgPercent: number;
  attemptsMaxScore: number;
  stdDev: number;
  questionAccuracy: { questionIndex: number; prompt: string; accuracy: number }[];
  studentResults: StudentResult[];
  testAverages: TestAverage[];
};

const EMPTY_TESTS: TestRecord[] = [];

export default function TeacherAnalyticsPage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const testsQuery = useQuery({
    queryKey: queryKeys.teacher.assessments,
    queryFn: async () => {
      const { data } = await api.get<TestRecord[]>("/teacher/assessments");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed
  });
  const analyticsQuery = useQuery({
    queryKey: queryKeys.teacher.assessmentAnalytics(selectedTest),
    queryFn: async () => {
      const { data } = await api.get<TestAnalytics>(`/teacher/assessments/${selectedTest}/analytics`);
      return data;
    },
    enabled: allowed && Boolean(selectedTest)
  });
  const tests = testsQuery.data ?? EMPTY_TESTS;
  const analytics = analyticsQuery.data ?? null;
  const filteredStudentResults = useMemo(() => {
    const rows = analytics?.studentResults ?? [];
    const needle = studentSearch.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(needle));
  }, [analytics?.studentResults, studentSearch]);
  const averageTrend = useMemo(
    () => (analytics?.testAverages ?? []).map((item) => ({
      name: item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title,
      fullTitle: item.title,
      average: Number(item.avgPercent.toFixed(1)),
      attempts: item.attempts
    })),
    [analytics?.testAverages]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urlTest = searchParams.get("test");
    if (urlTest && tests.some(test => test._id === urlTest)) {
      setSelectedTest(urlTest);
    } else if (!selectedTest && tests.length > 0) {
      setSelectedTest(tests[0]._id);
    }
  }, [searchParams, selectedTest, tests]);

  useEffect(() => {
    const queryError = testsQuery.error ?? analyticsQuery.error;
    if (queryError) setLoadErr(describeApiError(queryError));
  }, [analyticsQuery.error, testsQuery.error]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!allowed) return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;

  const handleExport = async () => {
    try {
      const { data } = await api.get(`/teacher/assessments/${selectedTest}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `test_results_${selectedTest}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setLoadErr("Failed to export data");
    }
  };

  function handleSelectTest(testId: string) {
    setSelectedTest(testId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("test", testId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <TeacherPageShell
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedTest} onValueChange={handleSelectTest}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select a test" />
            </SelectTrigger>
            <SelectContent>
              {tests.map(t => (
                <SelectItem key={t._id} value={t._id}>{t.title} ({t.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={!selectedTest} variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      }
    >

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      {analyticsQuery.isLoading ? (
        <Card className="p-6 text-center text-[var(--text-muted)]">Loading analytics...</Card>
      ) : !analytics ? (
        <Card className="p-6 text-center text-[var(--text-muted)]">Select a test to view analytics...</Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Total Attempts</p>
              <p className="text-2xl font-semibold mt-1">{analytics.totalAttempts}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Class Average</p>
              <p className="text-2xl font-semibold mt-1">{analytics.avgPercent.toFixed(1)}%</p>
              <p className="text-xs text-[var(--text-muted)]">{analytics.avg.toFixed(1)} / {analytics.attemptsMaxScore.toFixed(1)} raw</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Highest / Lowest</p>
              <p className="text-2xl font-semibold mt-1">{analytics.max} / {analytics.min}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Std. Deviation</p>
              <p className="text-2xl font-semibold mt-1">{analytics.stdDev.toFixed(2)}</p>
            </Card>
          </div>

          {analytics.questionAccuracy && analytics.questionAccuracy.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">Question-wise Accuracy</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.questionAccuracy.map(q => ({ name: `Q${q.questionIndex + 1}`, accuracy: q.accuracy, prompt: q.prompt }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "var(--bg-elevated)" }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                    <Bar dataKey="accuracy" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Average Performance Across Tests</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Compares class average percentage across all tests you created.</p>
              </div>
              <Badge tone="muted">{averageTrend.length} tests</Badge>
            </div>
            {averageTrend.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={averageTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      cursor={{ stroke: "var(--accent-primary)", strokeDasharray: "3 3" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid var(--border-subtle)" }}
                      formatter={(value, name) => name === "average" ? [`${value}%`, "Class average"] : [value, name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ""}
                    />
                    <Line type="monotone" dataKey="average" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No graded or submitted attempts are available yet.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Student Marks</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">All students in this test section, including missing attempts.</p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search student"
                  className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
                />
              </div>
            </div>
            <ResponsiveTable
              items={filteredStudentResults}
              getKey={(row) => row.studentId}
              empty={<p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">No students found for this test section.</p>}
              table={
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">Percent</th>
                      <th className="px-4 py-3">Question Marks</th>
                      <th className="px-4 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredStudentResults.map((row) => (
                      <tr key={row.studentId}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--text-primary)]">{row.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
                        </td>
                        <td className="px-4 py-3"><Badge tone={row.status === "graded" ? "green" : row.status === "submitted" ? "blue" : "muted"}>{row.status.replace("_", " ")}</Badge></td>
                        <td className="px-4 py-3 font-mono">{row.score.toFixed(1)} / {row.maxScore.toFixed(1)}</td>
                        <td className="px-4 py-3 font-mono">{row.percent.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.questionBreakdown.map((q) => (
                              <span key={q.questionIndex} className="rounded-md bg-[var(--bg-elevated)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                                Q{q.questionIndex + 1}: {q.marksAwarded}/{q.maxMarks}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "Not submitted"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
              renderCard={(row) => (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">{row.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{row.email}</p>
                    </div>
                    <Badge tone={row.status === "graded" ? "green" : row.status === "submitted" ? "blue" : "muted"}>{row.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Marks</p>
                      <p className="font-mono font-medium">{row.score.toFixed(1)} / {row.maxScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Percent</p>
                      <p className="font-mono font-medium">{row.percent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {row.questionBreakdown.map((q) => (
                      <span key={q.questionIndex} className="rounded-md bg-[var(--bg-elevated)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                        Q{q.questionIndex + 1}: {q.marksAwarded}/{q.maxMarks}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            />
          </Card>
        </div>
      )}
    </TeacherPageShell>
  );
}
