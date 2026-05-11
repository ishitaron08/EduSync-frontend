"use client";

import { useEffect, useState } from "react";
import { useDashboardGuard } from "@/lib/authGuard";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, CheckCircle, Clock } from "lucide-react";

export default function StudentAssessmentsPage() {
  const allowed = useDashboardGuard("student");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get("/student/assessments")
      .then(res => setAssessments(res.data))
      .catch(err => setError(describeApiError(err)))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  // Group assessments
  const active = assessments.filter(a => new Date(a.startTime) <= new Date() && new Date(a.endTime) >= new Date() && a.status !== "completed");
  const upcoming = assessments.filter(a => new Date(a.startTime) > new Date());
  const completed = assessments.filter(a => a.status === "completed" || new Date(a.endTime) < new Date());

  const handleTakeTest = (id: string, type: string) => {
    // In a full implementation, this would route to a dedicated test-taking interface `/dashboard/student/assessments/[id]`
    alert(`Mock: Navigating to ${type.toUpperCase()} test interface for ID: ${id}. The test view will have a timer and questions.`);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 space-y-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Assessments</h1>
        <p className="text-sm text-[var(--text-muted)]">Take tests, view scores, and track your performance.</p>
      </div>

      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-[var(--bg-elevated)] p-1 rounded-lg">
          <TabsTrigger value="active" className="data-[state=active]:bg-[var(--bg-surface)]">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-[var(--bg-surface)]">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[var(--bg-surface)]">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {active.length === 0 ? (
            <Card className="p-8 text-center text-[var(--text-muted)] border-dashed">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active tests right now. You're all caught up!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map(a => (
                <Card key={a._id} className="p-5 border-[var(--accent-primary)] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-1 rounded mb-2 inline-block">
                        {a.type === 'mcq' ? 'MCQ Quiz' : 'Written Exam'}
                      </span>
                      <h3 className="font-semibold text-lg text-[var(--text-primary)]">{a.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--accent-danger)] text-sm font-medium bg-[var(--accent-danger)]/10 px-2 py-1 rounded">
                      <Clock className="w-4 h-4" /> {a.durationMinutes}m
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-5">
                    Due: {new Date(a.endTime).toLocaleString()}
                  </p>
                  <Button onClick={() => handleTakeTest(a._id, a.type)} className="w-full" variant="filled">
                    START TEST NOW
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card className="p-8 text-center text-[var(--text-muted)] border-dashed">
              <p>No upcoming tests scheduled.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map(a => (
                <Card key={a._id} className="p-5 bg-[var(--bg-elevated)] border-transparent opacity-80">
                  <span className="text-xs font-mono bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-1 rounded border border-[var(--border-subtle)] mb-2 inline-block">
                    {a.type.toUpperCase()}
                  </span>
                  <h3 className="font-medium text-[var(--text-primary)]">{a.title}</h3>
                  <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Clock className="w-4 h-4" /> Opens: {new Date(a.startTime).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length === 0 ? (
            <Card className="p-8 text-center text-[var(--text-muted)] border-dashed">
              <p>No completed tests yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {completed.map(a => (
                <Card key={a._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)]">{a.title}</h4>
                      <p className="text-xs text-[var(--text-muted)]">Taken on {new Date(a.endTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Score</p>
                    <p className="font-[family-name:var(--font-fraunces)] text-xl font-bold text-[var(--text-primary)]">
                      {a.score ? `${a.score}/${a.maxScore}` : "Pending"}
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
