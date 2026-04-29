"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Assessment = { _id: string; title: string; type: "mcq" | "written"; status?: string };

export default function AssessmentsPage() {
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [rows, setRows] = useState<Assessment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [analytics, setAnalytics] = useState<string | null>(null);

  const endpoint = useMemo(() => (role === "teacher" ? "/teacher/assessments" : "/student/assessments"), [role]);
  const allowed = useMemo(() => {
    return Boolean(isHydrated && (role === "teacher" || role === "student"));
  }, [isHydrated, role]);

  useEffect(() => {
    if (!allowed) return;
    api
      .get<Assessment[]>(endpoint)
      .then(({ data }) => {
        setRows(data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(describeApiError(e));
      });
  }, [allowed, endpoint]);

  const publish = async (assessmentId: string) => {
    try {
      await api.patch(`/teacher/assessments/${assessmentId}/publish`);
      const { data } = await api.get<Assessment[]>("/teacher/assessments");
      setRows(data ?? []);
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  const createAssessment = async () => {
    try {
      await api.post("/teacher/assessments", {
        section,
        title,
        type: "mcq",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        durationMinutes: 60,
        questions: [{ prompt: "Sample question", options: ["A", "B"], correctOptionIndex: 0, marks: 1 }]
      });
      setTitle("");
      const { data } = await api.get<Assessment[]>("/teacher/assessments");
      setRows(data ?? []);
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  const getAnalytics = async (assessmentId: string) => {
    try {
      const { data } = await api.get<{ totalAttempts: number; max: number; min: number; avg: number }>(`/teacher/assessments/${assessmentId}/analytics`);
      setAnalytics(`Attempts: ${data.totalAttempts}, Max: ${data.max}, Min: ${data.min}, Avg: ${data.avg.toFixed(2)}`);
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  const startAttempt = async (assessmentId: string) => {
    try {
      await api.post(`/student/assessments/${assessmentId}/attempts/start`);
      await api.post(`/student/assessments/${assessmentId}/attempts/submit`, { answers: [] });
      const { data } = await api.get<Assessment[]>("/student/assessments");
      setRows(data ?? []);
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-40 rounded-[8px]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Assessments</h1>
      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
      {role === "teacher" && (
        <Card className="space-y-3 p-4">
          <p className="text-sm text-[var(--text-muted)]">Create assessment</p>
          <input className="w-full rounded border p-2" placeholder="Section ObjectId" value={section} onChange={(e) => setSection(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button onClick={createAssessment} disabled={!section || !title}>
            Create
          </Button>
          {analytics && <p className="text-sm text-[var(--text-muted)]">{analytics}</p>}
        </Card>
      )}
      {rows.map((item) => (
        <Card key={item._id} className="p-4">
          <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {item.type} {item.status ? `• ${item.status}` : ""}
          </p>
          {role === "teacher" && item.status === "draft" && (
            <Button className="mt-3" variant="ghost" onClick={() => publish(item._id)}>
              Publish
            </Button>
          )}
          {role === "teacher" && (
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" onClick={() => getAnalytics(item._id)}>
                Analytics
              </Button>
              <a className="inline-flex items-center rounded-md px-3 py-2 text-sm text-[var(--accent-secondary)]" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/teacher/assessments/${item._id}/export`}>
                Export CSV
              </a>
            </div>
          )}
          {role === "student" && (
            <Button className="mt-3" variant="ghost" onClick={() => startAttempt(item._id)}>
              Attempt
            </Button>
          )}
        </Card>
      ))}
    </main>
  );
}
