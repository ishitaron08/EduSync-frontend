"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, CheckCircle, Clock } from "lucide-react";

type Assessment = {
  _id: string;
  title: string;
  type: "mcq" | "written";
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

type Attempt = {
  _id: string;
  status: "in_progress" | "submitted" | "graded";
  score: number;
  maxScore: number;
  submittedAt?: string;
  assessment: Assessment;
};

export default function StudentAssessmentsPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      api.get("/student/assessments"),
      api.get("/student/assessments/results")
    ])
      .then(([assessmentRes, resultRes]) => {
        setAssessments(Array.isArray(assessmentRes.data) ? assessmentRes.data : []);
        setAttempts(Array.isArray(resultRes.data) ? resultRes.data : []);
      })
      .catch(err => setError(describeApiError(err)))
      .finally(() => setLoading(false));
  }, [allowed]);

  const completedAttemptByAssessment = useMemo(() => {
    const map = new Map<string, Attempt>();
    attempts.forEach(attempt => {
      if (attempt.status === "submitted" || attempt.status === "graded") {
        map.set(String(attempt.assessment?._id), attempt);
      }
    });
    return map;
  }, [attempts]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const now = new Date();
  const active = assessments.filter(a => new Date(a.startTime) <= now && new Date(a.endTime) >= now && !completedAttemptByAssessment.has(a._id));
  const upcoming = assessments.filter(a => new Date(a.startTime) > now);
  const completed = attempts.filter(a => a.status === "submitted" || a.status === "graded");

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Assessments</h1>
        <p className="text-sm text-[var(--text-muted)]">Take tests, view scores, and track your performance.</p>
      </div>

      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? <Card className="p-8 text-center text-[var(--text-muted)]">Loading tests...</Card> : active.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-[var(--text-muted)]">
              <ClipboardCheck className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No active tests right now.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map(a => (
                <Card key={a._id} className="border-[var(--accent-primary)] p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <span className="mb-2 inline-block rounded bg-[var(--accent-primary)]/10 px-2 py-1 font-mono text-xs text-[var(--accent-primary)]">{a.type.toUpperCase()}</span>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{a.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 rounded bg-[var(--accent-danger)]/10 px-2 py-1 text-sm font-medium text-[var(--accent-danger)]">
                      <Clock className="h-4 w-4" /> {a.durationMinutes}m
                    </div>
                  </div>
                  <p className="mb-5 text-xs text-[var(--text-muted)]">Due: {new Date(a.endTime).toLocaleString()}</p>
                  <Button onClick={() => router.push(`/dashboard/student/assessments/${a._id}`)} className="w-full" variant="filled">
                    Start Test Now
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? <Card className="border-dashed p-8 text-center text-[var(--text-muted)]">No upcoming tests scheduled.</Card> : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map(a => (
                <Card key={a._id} className="border-transparent bg-[var(--bg-elevated)] p-5 opacity-90">
                  <span className="mb-2 inline-block rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">{a.type.toUpperCase()}</span>
                  <h3 className="font-medium text-[var(--text-primary)]">{a.title}</h3>
                  <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Clock className="h-4 w-4" /> Opens: {new Date(a.startTime).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length === 0 ? <Card className="border-dashed p-8 text-center text-[var(--text-muted)]">No completed tests yet.</Card> : (
            <div className="space-y-3">
              {completed.map(attempt => (
                <Card key={attempt._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)]">{attempt.assessment?.title || "Assessment"}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{attempt.status === "submitted" ? "Awaiting grading" : `Submitted ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : ""}`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">Score</p>
                    <p className="font-[family-name:var(--font-fraunces)] text-xl font-bold text-[var(--text-primary)]">
                      {attempt.status === "graded" ? `${attempt.score}/${attempt.maxScore}` : "Awaiting grading"}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
