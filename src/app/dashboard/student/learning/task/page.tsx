"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, CheckCircle2, Clock3, Code2, Lightbulb, ListChecks, Loader2, Lock, Medal, NotebookPen, Target } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SyllabusTask = {
  key: string;
  title: string;
  description?: string;
  type?: "read" | "practice" | "build" | "revise" | "assess";
  estimatedMinutes?: number;
  resourceHint?: string;
  completed?: boolean;
  completedAt?: string;
  pointsAwarded?: number;
  checklistCompleted?: number[];
  studyNote?: string;
};

type SyllabusGoalsPayload = {
  syllabusPlan: {
    status: "generating" | "ready" | "failed";
    topics: Array<{
      key: string;
      title: string;
      level?: "basic" | "intermediate" | "advanced";
      order?: number;
      subtopics: Array<{
        key: string;
        title: string;
        description?: string;
        order?: number;
        progressPercent: number;
        bonusAwarded?: boolean;
        tasks: SyllabusTask[];
      }>;
    }>;
  } | null;
};

function taskTypeLabel(type?: string) {
  if (type === "read") return "Study notes";
  if (type === "build") return "Practical build";
  if (type === "revise") return "Revision";
  if (type === "assess") return "Self assessment";
  return "Practice";
}

function isPractical(type?: string) {
  return type === "practice" || type === "build";
}

function taskDifficulty(type?: string, level?: string): "Easy" | "Medium" | "Hard" {
  if (type === "build") return "Hard";
  if (level === "advanced" && (type === "practice" || type === "assess")) return "Hard";
  if (type === "practice" || type === "assess" || level === "intermediate") return "Medium";
  return "Easy";
}

function taskPoints(type?: string, level?: string) {
  const difficulty = taskDifficulty(type, level);
  if (difficulty === "Hard") return 20;
  if (difficulty === "Medium") return 15;
  return 10;
}

function firstIncompleteTask(plan: SyllabusGoalsPayload["syllabusPlan"]) {
  const topics = [...(plan?.topics ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const topic of topics) {
    const subtopics = [...topic.subtopics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const subtopic of subtopics) {
      for (const task of subtopic.tasks) {
        if (!task.completed) return { topicKey: topic.key, subtopicKey: subtopic.key, taskKey: task.key };
      }
    }
  }
  return null;
}

function studyNotes(task: SyllabusTask, subtopicTitle: string) {
  const title = task.title.trim();
  return [
    `Start with the purpose of ${subtopicTitle}: what problem it solves and when it is used.`,
    task.description || `Break "${title}" into definitions, rules, and one simple example.`,
    "Write a short explanation in your own words before moving to practice.",
    task.resourceHint ? `Use this reference: ${task.resourceHint}.` : "Use class notes, a trusted textbook section, or official documentation as your reference."
  ];
}

function practiceSteps(task: SyllabusTask, subtopicTitle: string) {
  const action = task.type === "build" ? "Build" : "Solve";
  return [
    `${action} one small example focused only on ${subtopicTitle}.`,
    "Check your answer against notes, examples, or test cases.",
    "Repeat with one variation that changes the numbers, inputs, scenario, or constraint.",
    "Write down the mistake pattern you noticed and the correction."
  ];
}

export default function StudentLearningTaskPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const topicKey = searchParams.get("topic") ?? "";
  const subtopicKey = searchParams.get("subtopic") ?? "";
  const taskKey = searchParams.get("task") ?? "";
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const syllabusQuery = useQuery({
    queryKey: queryKeys.student.syllabusGoals,
    queryFn: async () => {
      const { data } = await api.get<SyllabusGoalsPayload>("/student/syllabus-goals");
      return data;
    },
    enabled: allowed,
    staleTime: 60 * 1000
  });

  const selection = useMemo(() => {
    const topic = syllabusQuery.data?.syllabusPlan?.topics.find((item) => item.key === topicKey) ?? null;
    const subtopic = topic?.subtopics.find((item) => item.key === subtopicKey) ?? null;
    const task = subtopic?.tasks.find((item) => item.key === taskKey) ?? null;
    const unlockedTask = firstIncompleteTask(syllabusQuery.data?.syllabusPlan ?? null);
    return { topic, subtopic, task, unlockedTask };
  }, [syllabusQuery.data, subtopicKey, taskKey, topicKey]);

  const completeMutation = useMutation({
    mutationFn: () =>
      api.patch("/student/syllabus-goals/task/complete", {
        topicKey,
        subtopicKey,
        taskKey,
        checklistCompleted: checkedIndexes(),
        studyNote: draft
      }),
    onSuccess: async ({ data }: { data: { nextTask?: { topicKey: string; subtopicKey: string; taskKey: string } | null } }) => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.syllabusGoals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.taskHistory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.rewardPoints })
      ]);
      if (data.nextTask) {
        const params = new URLSearchParams({
          topic: data.nextTask.topicKey,
          subtopic: data.nextTask.subtopicKey,
          task: data.nextTask.taskKey
        });
        router.replace(`/dashboard/student/learning/task?${params.toString()}`);
      } else {
        router.replace("/dashboard/student/learning");
      }
    },
    onError: (err) => setError(describeApiError(err))
  });

  const studyMutation = useMutation({
    mutationFn: (payload: { checklistCompleted: number[]; studyNote: string }) =>
      api.patch("/student/syllabus-goals/task/study", {
        topicKey,
        subtopicKey,
        taskKey,
        ...payload
      }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(queryKeys.student.syllabusGoals, (current: SyllabusGoalsPayload | undefined) =>
        current ? { ...current, syllabusPlan: data } : current
      );
    },
    onError: (err) => setError(describeApiError(err))
  });

  useEffect(() => {
    const task = selection.task;
    if (!task) return;
    setDraft(task.studyNote ?? "");
    const nextChecked: Record<number, boolean> = {};
    for (const index of task.checklistCompleted ?? []) {
      nextChecked[index] = true;
    }
    setChecked(nextChecked);
  }, [selection.task?.key]);

  if (!allowed || syllabusQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
          Loading task workspace...
        </div>
      </main>
    );
  }

  const { topic, subtopic, task, unlockedTask } = selection;
  const pageError = error ?? (syllabusQuery.error ? describeApiError(syllabusQuery.error) : null);

  if (!topic || !subtopic || !task) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 md:px-6 lg:px-8">
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/student/learning")}>
          <ArrowLeft className="h-4 w-4" />
          Back to AI Learning
        </Button>
        <Card className="p-6">
          <p className="font-semibold text-[var(--text-primary)]">Task not found</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Open the task again from AI Learning or Syllabus Goals.</p>
        </Card>
      </main>
    );
  }

  const practical = isPractical(task.type);
  const guidance = practical ? practiceSteps(task, subtopic.title) : studyNotes(task, subtopic.title);
  const completedSteps = Object.values(checked).filter(Boolean).length;
  const allChecklistDone = completedSteps >= guidance.length;
  const locked =
    !task.completed &&
    Boolean(unlockedTask) &&
    !(
      unlockedTask?.topicKey === topic.key &&
      unlockedTask?.subtopicKey === subtopic.key &&
      unlockedTask?.taskKey === task.key
    );
  const difficulty = taskDifficulty(task.type, topic.level);
  const points = task.pointsAwarded || taskPoints(task.type, topic.level);

  function checkedIndexes(nextChecked = checked) {
    return Object.entries(nextChecked)
      .filter(([, value]) => value)
      .map(([key]) => Number(key))
      .sort((a, b) => a - b);
  }

  function saveStudy(nextChecked = checked, nextDraft = draft) {
    studyMutation.mutate({
      checklistCompleted: checkedIndexes(nextChecked),
      studyNote: nextDraft
    });
  }

  if (locked) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 md:px-6 lg:px-8">
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/student/learning")}>
          <ArrowLeft className="h-4 w-4" />
          Back to AI Learning
        </Button>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Task locked</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Complete the previous syllabus task first. The roadmap opens one task at a time so progress and leaderboard points stay fair.
              </p>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/student/learning")}>
          <ArrowLeft className="h-4 w-4" />
          Back to AI Learning
        </Button>
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{taskTypeLabel(task.type)}</Badge>
          {task.estimatedMinutes ? <Badge tone="muted">{task.estimatedMinutes} min</Badge> : null}
          <Badge tone="muted">{difficulty}</Badge>
          <Badge tone={task.completed ? "green" : "amber"}>{task.completed ? `${points} pts earned` : `${points} pts`}</Badge>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
              {practical ? <Code2 className="h-5 w-5" /> : <BookOpenText className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{topic.title} / {subtopic.title}</p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{task.title}</h1>
              {task.description ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{task.description}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {practical ? <ListChecks className="h-4 w-4 text-[var(--accent-primary)]" /> : <NotebookPen className="h-4 w-4 text-[var(--accent-primary)]" />}
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{practical ? "Practice steps" : "Study notes"}</h2>
            </div>
            <div className="space-y-2">
              {guidance.map((item, index) => (
                <label key={item} className="flex gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[index])}
                    onChange={(event) => {
                      const nextChecked = { ...checked, [index]: event.target.checked };
                      setChecked(nextChecked);
                      saveStudy(nextChecked, draft);
                    }}
                    className="mt-1 accent-[var(--accent-primary)]"
                  />
                  <span className="leading-6 text-[var(--text-primary)]">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Lightbulb className="h-4 w-4 text-[var(--accent-amber)]" />
              {practical ? "Practice answer or output" : "Your notes"}
            </label>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => saveStudy(checked, draft)}
              placeholder={practical ? "Write your solution approach, answer, code idea, or result here." : "Summarize the concept in your own words."}
              className="min-h-40 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/12"
            />
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--accent-primary)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Task progress</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Checklist</span>
                <span className="font-medium text-[var(--text-primary)]">{completedSteps}/{guidance.length}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${Math.round((completedSteps / guidance.length) * 100)}%` }} />
              </div>
              {task.resourceHint ? (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Resource</p>
                  <p className="mt-1 text-[var(--text-primary)]">{task.resourceHint}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Medal className="h-4 w-4 text-[var(--accent-amber)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Complete task</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Complete all checklist items before marking this task complete. Your checklist and notes are saved to this syllabus task.
            </p>
            {!allChecklistDone && !task.completed ? (
              <p className="mt-3 rounded-lg bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
                Finish {guidance.length - completedSteps} more checklist item{guidance.length - completedSteps === 1 ? "" : "s"} to unlock completion.
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-4 w-full justify-between"
              disabled={task.completed || completeMutation.isPending || locked || !allChecklistDone}
              onClick={() => completeMutation.mutate()}
            >
              {task.completed ? "Already complete" : completeMutation.isPending ? "Completing..." : "Mark complete"}
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </Card>
        </aside>
      </section>
    </main>
  );
}
