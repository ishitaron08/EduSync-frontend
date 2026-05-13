"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function TeacherAnalyticsPage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [analytics, setAnalytics] = useState<TestAnalytics | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get<TestRecord[]>("/teacher/assessments")
      .then((res) => {
        setTests(Array.isArray(res.data) ? res.data : []);
        const urlTest = searchParams.get("test");
        if (urlTest && res.data.some(test => test._id === urlTest)) {
          setSelectedTest(urlTest);
        } else if (res.data.length > 0) {
          setSelectedTest(res.data[0]._id);
        }
      })
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed, searchParams]);

  useEffect(() => {
    if (!selectedTest) return;
    setAnalytics(null);
    api.get<TestAnalytics>(`/teacher/assessments/${selectedTest}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [selectedTest]);

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
    } catch (e) {
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
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Test Analytics</h1>
          <p className="text-sm text-[var(--text-muted)]">View performance trends and question-wise accuracy.</p>
        </div>
        <div className="flex gap-4 items-center">
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
            Export CSV
          </Button>
        </div>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      {!analytics ? (
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
    </main>
  );
}
