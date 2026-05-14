"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, Timer } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function AssessmentCard({
  assessment,
  tone,
  onStart
}: {
  assessment: Assessment;
  tone: "active" | "upcoming";
  onStart?: () => void;
}) {
  const active = tone === "active";
  return (
    <Card className={`p-5 ${active ? "border-[var(--accent-primary)]/35 bg-[var(--accent-primary)]/8" : "bg-[var(--bg-surface)]"}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <Badge tone={active ? "green" : "muted"}>{assessment.type.toUpperCase()}</Badge>
          <h3 className="mt-3 text-xl font-semibold leading-tight text-[var(--text-primary)]">{assessment.title}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
          {active ? <Timer className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
        </div>
      </div>
      <div className="grid gap-2 text-sm text-[var(--text-muted)] sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {assessment.durationMinutes} min
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          {active ? `Due ${formatDateTime(assessment.endTime)}` : `Opens ${formatDateTime(assessment.startTime)}`}
        </span>
      </div>
      {active && onStart ? (
        <Button onClick={onStart} className="mt-6 w-full justify-between">
          Start assessment <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </Card>
  );
}

export default function StudentAssessmentsPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();
  const assessmentsQuery = useQuery({
    queryKey: queryKeys.student.assessments,
    queryFn: async () => {
      const { data } = await api.get<Assessment[]>("/student/assessments");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed
  });
  const attemptsQuery = useQuery({
    queryKey: queryKeys.student.assessmentResults,
    queryFn: async () => {
      const { data } = await api.get<Attempt[]>("/student/assessments/results");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed
  });

  const assessments = useMemo(() => assessmentsQuery.data ?? [], [assessmentsQuery.data]);
  const attempts = useMemo(() => attemptsQuery.data ?? [], [attemptsQuery.data]);
  const loading = assessmentsQuery.isLoading || attemptsQuery.isLoading;
  const queryError = assessmentsQuery.error ?? attemptsQuery.error;
  const error = queryError ? describeApiError(queryError) : null;

  const completedAttemptByAssessment = useMemo(() => {
    const map = new Map<string, Attempt>();
    attempts.forEach((attempt) => {
      if (attempt.status === "submitted" || attempt.status === "graded") {
        map.set(String(attempt.assessment?._id), attempt);
      }
    });
    return map;
  }, [attempts]);

  const { active, upcoming, completed } = useMemo(() => {
    const now = new Date();
    return {
      active: assessments.filter((assessment) => new Date(assessment.startTime) <= now && new Date(assessment.endTime) >= now && !completedAttemptByAssessment.has(assessment._id)),
      upcoming: assessments.filter((assessment) => new Date(assessment.startTime) > now),
      completed: attempts.filter((attempt) => attempt.status === "submitted" || attempt.status === "graded")
    };
  }, [assessments, attempts, completedAttemptByAssessment]);


  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      {error ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">{error}</div>
      ) : null}

      <Tabs defaultValue="active" className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto" variant="pills">
          <TabsTrigger value="active" variant="pills">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="upcoming" variant="pills">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed" variant="pills">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="nc-skeleton h-48 rounded-lg" />
          ) : active.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((assessment) => (
                <AssessmentCard key={assessment._id} assessment={assessment} tone="active" onStart={() => router.push(`/dashboard/student/assessments/${assessment._id}`)} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-10 text-center">
              <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="font-semibold text-[var(--text-primary)]">No active tests right now</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Use the upcoming tab to prepare ahead.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcoming.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((assessment) => (
                <AssessmentCard key={assessment._id} assessment={assessment} tone="upcoming" />
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-10 text-center text-sm text-[var(--text-muted)]">No upcoming tests scheduled.</Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completed.length ? (
            <div className="space-y-3">
              {completed.map((attempt) => (
                <Card key={attempt._id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[var(--accent-success)]" />
                      <h3 className="truncate font-semibold text-[var(--text-primary)]">{attempt.assessment?.title || "Assessment"}</h3>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {attempt.status === "submitted" ? "Awaiting grading" : `Submitted ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("en-IN") : ""}`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Score</p>
                    <p className="text-xl font-semibold text-[var(--text-primary)]">
                      {attempt.status === "graded" ? `${attempt.score}/${attempt.maxScore}` : "Pending"}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-10 text-center text-sm text-[var(--text-muted)]">No completed tests yet.</Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
