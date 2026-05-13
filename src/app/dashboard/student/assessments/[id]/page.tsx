"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Question = {
  prompt: string;
  options?: string[];
  marks?: number;
};

type Assessment = {
  _id: string;
  title: string;
  type: "mcq" | "written";
  durationMinutes: number;
  endTime: string;
  fileUrl?: string;
  rubric?: string;
  questions: Question[];
};

type TakePayload = {
  assessment: Assessment;
  attempt: {
    id: string;
    startedAt: string;
    endsAt: string;
    timeRemainingSeconds: number;
  };
};

export default function StudentTakeAssessmentPage() {
  const allowed = useDashboardGuard("student");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assessmentId = String(params.id);
  const [payload, setPayload] = useState<TakePayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    async function start() {
      try {
        await api.post(`/student/assessments/${assessmentId}/attempts/start`);
        const { data } = await api.get<TakePayload>(`/student/assessments/${assessmentId}/take`);
        if (!alive) return;
        setPayload(data);
        setTimeLeft(data.attempt.timeRemainingSeconds);
      } catch (e) {
        if (alive) setError(describeApiError(e));
      }
    }
    start();
    return () => {
      alive = false;
    };
  }, [allowed, assessmentId]);

  const answers = useMemo(() => {
    if (!payload) return [];
    if (payload.assessment.type === "mcq") {
      return Object.entries(selectedAnswers).map(([questionIndex, selectedOptionIndex]) => ({
        questionIndex: Number(questionIndex),
        selectedOptionIndex
      }));
    }
    return [{ questionIndex: 0, textAnswer: writtenAnswer }];
  }, [payload, selectedAnswers, writtenAnswer]);

  async function submit() {
    try {
      setSubmitting(true);
      setError(null);
      await api.post(`/student/assessments/${assessmentId}/attempts/submit`, { answers });
      router.replace(`/dashboard/student/assessments/${assessmentId}/result`);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!payload) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(payload.attempt.endsAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        void submit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [payload, answers]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6">
      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
      {!payload ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">Loading test...</Card>
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">{payload.assessment.title}</h1>
              <p className="text-sm text-[var(--text-muted)]">{payload.assessment.type.toUpperCase()} · {payload.assessment.durationMinutes} minutes</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-lg text-[var(--accent-danger)]">
              {minutes}:{seconds}
            </div>
          </header>

          {payload.assessment.type === "mcq" ? (
            <div className="space-y-4">
              {payload.assessment.questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="font-medium text-[var(--text-primary)]">Q{questionIndex + 1}. {question.prompt}</h2>
                    <span className="text-xs text-[var(--text-muted)]">{question.marks ?? 1} marks</span>
                  </div>
                  <div className="space-y-2">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <label key={optionIndex} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] p-3 hover:bg-[var(--bg-elevated)]">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={selectedAnswers[questionIndex] === optionIndex}
                          onChange={() => setSelectedAnswers(current => ({ ...current, [questionIndex]: optionIndex }))}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5">
              {payload.assessment.fileUrl && (
                <a href={payload.assessment.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent-primary)] hover:underline">
                  Open question paper
                </a>
              )}
              <textarea
                className="mt-4 min-h-[260px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm"
                value={writtenAnswer}
                onChange={event => setWrittenAnswer(event.target.value)}
                placeholder="Write your answer here..."
              />
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting} variant="filled">
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
