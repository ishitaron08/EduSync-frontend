"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentAssessmentResultPage() {
  const allowed = useDashboardGuard("student");
  const params = useParams<{ id: string }>();
  const assessmentId = String(params.id);
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get("/student/assessments/results")
      .then((res) => {
        const found = Array.isArray(res.data)
          ? res.data.find((entry: any) => String(entry.assessment?._id) === assessmentId)
          : null;
        setAttempt(found ?? null);
      })
      .catch(console.error);
  }, [allowed, assessmentId]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Card className="p-8 text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Submission Received</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{attempt?.assessment?.title ?? "Assessment"}</p>
        <div className="my-8">
          {attempt?.status === "graded" ? (
            <>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Score</p>
              <p className="font-[family-name:var(--font-fraunces)] text-5xl font-bold text-[var(--accent-primary)]">{attempt.score}/{attempt.maxScore}</p>
            </>
          ) : (
            <p className="text-[var(--text-muted)]">Your written response is awaiting grading.</p>
          )}
        </div>
        <Button asChild variant="filled">
          <Link href="/dashboard/student/assessments">Back to Assessments</Link>
        </Button>
      </Card>
    </main>
  );
}
