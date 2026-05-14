"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeacherPageShell } from "@/components/teacher/TeacherPageShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type TestRecord = { _id: string; title: string; type: string };
type TestAnalytics = {
  totalAttempts: number;
  max: number;
  min: number;
  avg: number;
  avgPercent: number;
  attemptsMaxScore: number;
  stdDev: number;
  questionAccuracy: { questionIndex: number; prompt: string; accuracy: number }[];
};

const EMPTY_TESTS: TestRecord[] = [];

export default function TeacherAnalyticsPage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [loadErr, setLoadErr] = useState<string | null>(null);
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
        </div>
      )}
    </TeacherPageShell>
  );
}
