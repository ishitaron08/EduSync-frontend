"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, CheckCircle2, ChevronDown, ChevronRight, Clock3, ListChecks, Loader2, RefreshCw, Target } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PresetGoal = {
  key: string;
  title: string;
  description: string;
};

type StudentGoal = {
  _id: string;
  title: string;
  description?: string;
  isCustom: boolean;
  isSelected: boolean;
};

type SyllabusPlan = {
  _id: string;
  status: "generating" | "ready" | "failed";
  errorMessage?: string;
  model?: string;
  geminiModel?: string;
  generatedAt?: string;
  topics: Array<{
    key: string;
    title: string;
    description?: string;
    level?: "basic" | "intermediate" | "advanced";
    order?: number;
    subtopics: Array<{
      key: string;
      title: string;
      description?: string;
      order?: number;
      estimatedHours?: number;
      progressPercent: number;
      tasks: Array<{
        key: string;
        title: string;
        description?: string;
        type?: "read" | "practice" | "build" | "revise" | "assess";
        estimatedMinutes?: number;
        resourceHint?: string;
        completed?: boolean;
        completedAt?: string;
        pointsAwarded?: number;
      }>;
      bonusAwarded?: boolean;
    }>;
  }>;
};

type SyllabusGoalsPayload = {
  presetGoals: PresetGoal[];
  selectedGoal: StudentGoal | null;
  customGoals: StudentGoal[];
  syllabusPlan: SyllabusPlan | null;
};

function formatSyllabusError(message?: string) {
  if (!message) return "Please check AI provider configuration and retry.";

  const isQuotaError =
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota") ||
    message.includes("\"code\":429") ||
    message.includes("429");

  if (!isQuotaError) return message;

  const retryInfoMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  const retryTextMatch = message.match(/retry in\s+([\d.]+)s/i);
  const seconds = retryInfoMatch?.[1] ?? (retryTextMatch?.[1] ? String(Math.ceil(Number(retryTextMatch[1]))) : null);
  const provider = message.toLowerCase().includes("openrouter") ? "OpenRouter" : "Gemini";
  return `${provider} quota is exhausted for the current API key${seconds ? `. Try again after about ${seconds} seconds` : ""}. If it keeps failing, use an API key or project with available quota.`;
}

function levelLabel(level?: string) {
  if (level === "advanced") return "Advanced";
  if (level === "intermediate") return "Intermediate";
  return "Basic";
}

function taskTypeLabel(type?: string) {
  if (type === "read") return "Read";
  if (type === "build") return "Build";
  if (type === "revise") return "Revise";
  if (type === "assess") return "Assess";
  return "Practice";
}

export default function StudentSyllabusGoalsPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const syllabusQuery = useQuery({
    queryKey: queryKeys.student.syllabusGoals,
    queryFn: async () => {
      const { data } = await api.get<SyllabusGoalsPayload>("/student/syllabus-goals");
      return data;
    },
    enabled: allowed,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.student.syllabusGoals }),
      queryClient.invalidateQueries({ queryKey: queryKeys.student.profile })
    ]);

  const selectGoalMutation = useMutation({
    mutationFn: (payload: { presetKey?: string; customGoalId?: string }) => api.post("/student/syllabus-goals/select", payload),
    onSuccess: () => invalidate(),
    onError: (err) => setError(describeApiError(err))
  });

  const createCustomMutation = useMutation({
    mutationFn: () =>
      api.post("/student/syllabus-goals/custom", {
        title: customTitle,
        description: customDescription,
        select: true
      }),
    onSuccess: async () => {
      setCustomTitle("");
      setCustomDescription("");
      await invalidate();
    },
    onError: (err) => setError(describeApiError(err))
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post("/student/syllabus-goals/regenerate"),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: queryKeys.student.syllabusGoals });
      const previous = queryClient.getQueryData<SyllabusGoalsPayload>(queryKeys.student.syllabusGoals);
      if (previous?.syllabusPlan) {
        queryClient.setQueryData<SyllabusGoalsPayload>(queryKeys.student.syllabusGoals, {
          ...previous,
          syllabusPlan: {
            ...previous.syllabusPlan,
            status: "generating",
            errorMessage: "",
            topics: []
          }
        });
      }
      return { previous };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.student.syllabusGoals }),
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.student.syllabusGoals, context.previous);
      }
      setError(describeApiError(err));
    }
  });

  const data = syllabusQuery.data;
  const selectedGoal = data?.selectedGoal ?? null;
  const syllabusPlan = data?.syllabusPlan ?? null;
  const isBusy = selectGoalMutation.isPending || createCustomMutation.isPending || regenerateMutation.isPending;

  const averageProgress = useMemo(() => {
    const subtopics = syllabusPlan?.topics.flatMap((topic) => topic.subtopics) ?? [];
    if (subtopics.length === 0) return 0;
    return Math.round(subtopics.reduce((sum, subtopic) => sum + subtopic.progressPercent, 0) / subtopics.length);
  }, [syllabusPlan]);

  const roadmapTotals = useMemo(() => {
    const topics = syllabusPlan?.topics ?? [];
    const subtopics = topics.flatMap((topic) => topic.subtopics);
    const tasks = subtopics.flatMap((subtopic) => subtopic.tasks);
    return {
      topics: topics.length,
      subtopics: subtopics.length,
      tasks: tasks.length
    };
  }, [syllabusPlan]);

  if (!allowed) {
    return <main className="p-4 md:p-6"><div className="nc-skeleton h-10 w-48 rounded-lg" /></main>;
  }

  function toggleTopic(topicKey: string) {
    setExpandedTopics((current) => {
      const next = new Set(current);
      if (next.has(topicKey)) next.delete(topicKey);
      else next.add(topicKey);
      return next;
    });
  }

  function toggleSubtopic(subtopicKey: string) {
    setExpandedSubtopics((current) => {
      const next = new Set(current);
      if (next.has(subtopicKey)) next.delete(subtopicKey);
      else next.add(subtopicKey);
      return next;
    });
  }

  function openTask(topicKey: string, subtopicKey: string, taskKey: string) {
    const params = new URLSearchParams({ topic: topicKey, subtopic: subtopicKey, task: taskKey });
    router.push(`/dashboard/student/learning?${params.toString()}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      {(error || syllabusQuery.error) && (
        <Card className="border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-4 text-sm text-[var(--accent-danger)]">
          {error || describeApiError(syllabusQuery.error)}
        </Card>
      )}

      {syllabusQuery.isLoading ? (
        <Card className="p-6 text-[var(--text-muted)]">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading syllabus goals...
        </Card>
      ) : !selectedGoal ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-4 md:grid-cols-3">
            {data?.presetGoals.map((goal) => (
              <Card key={goal.key} className="flex flex-col p-5">
                <Target className="h-7 w-7 text-[var(--accent-primary)]" />
                <h2 className="mt-8 text-xl font-semibold text-[var(--text-primary)]">{goal.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">{goal.description}</p>
                <Button className="mt-6 justify-between" disabled={isBusy} onClick={() => selectGoalMutation.mutate({ presetKey: goal.key })}>
                  {selectGoalMutation.isPending ? "Generating..." : "Select Goal"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </section>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Custom goal</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">If your goal is not listed, add it here. This will become your selected goal and can only be changed later from Profile.</p>
            <div className="mt-4 space-y-3">
              <Input placeholder="Goal title" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
              <textarea
                className="min-h-24 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm"
                placeholder="Goal description"
                value={customDescription}
                onChange={(event) => setCustomDescription(event.target.value)}
              />
              <Button className="w-full" disabled={!customTitle.trim() || createCustomMutation.isPending} onClick={() => createCustomMutation.mutate()}>
                {createCustomMutation.isPending ? "Saving..." : "Create and Select Goal"}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <Card className="border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/8 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Selected goal is locked here</p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{selectedGoal.title}</h2>
                {selectedGoal.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedGoal.description}</p>}
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Progress</p>
                <p className="text-2xl font-semibold text-[var(--accent-primary)]">{averageProgress}%</p>
              </div>
            </div>
          </Card>

          {syllabusPlan?.status === "failed" && (
            <Card className="border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-5">
              <p className="font-medium text-[var(--accent-danger)]">Syllabus generation failed</p>
              {(syllabusPlan.geminiModel || syllabusPlan.model) && (
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Last attempted provider: {syllabusPlan.geminiModel || syllabusPlan.model}
                </p>
              )}
              <p className="mt-1 text-sm text-[var(--text-muted)]">{formatSyllabusError(syllabusPlan.errorMessage)}</p>
              <Button className="mt-4 gap-2" disabled={regenerateMutation.isPending} onClick={() => regenerateMutation.mutate()}>
                <RefreshCw className="h-4 w-4" /> Retry Generation
              </Button>
            </Card>
          )}

          {syllabusPlan?.status === "generating" && (
            <Card className="p-6 text-[var(--text-muted)]">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Generating your syllabus...
            </Card>
          )}

          {syllabusPlan?.status === "ready" && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  <span className="rounded-md bg-[var(--bg-elevated)] px-2.5 py-1">{roadmapTotals.topics} topics</span>
                  <span className="rounded-md bg-[var(--bg-elevated)] px-2.5 py-1">{roadmapTotals.subtopics} subtopics</span>
                  <span className="rounded-md bg-[var(--bg-elevated)] px-2.5 py-1">{roadmapTotals.tasks} tasks</span>
                  <span className="rounded-md bg-[var(--bg-elevated)] px-2.5 py-1">{averageProgress}% complete</span>
                </div>
                <Button type="button" variant="ghost" size="sm" disabled={regenerateMutation.isPending} onClick={() => regenerateMutation.mutate()}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
              {syllabusPlan.topics.map((topic) => {
                const open = expandedTopics.has(topic.key);
                return (
                  <Card key={topic.key} className="overflow-hidden p-0">
                    <button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={() => toggleTopic(topic.key)}>
                      <div className="flex items-start gap-3">
                        <BookOpenCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[var(--accent-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
                              {levelLabel(topic.level)}
                            </span>
                            <h2 className="font-semibold text-[var(--text-primary)]">
                              {topic.order ? `${topic.order}. ` : ""}{topic.title}
                            </h2>
                          </div>
                          {topic.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{topic.description}</p>}
                        </div>
                      </div>
                      {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    {open && (
                      <div className="space-y-3 border-t border-[var(--border-subtle)] p-4">
                        {topic.subtopics.map((subtopic) => {
                          const subtopicOpen = expandedSubtopics.has(subtopic.key);
                          const completedTasks = subtopic.tasks.filter((task) => task.completed).length;
                          return (
                            <div key={subtopic.key} className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                              <button type="button" className="flex w-full flex-col gap-3 p-4 text-left md:flex-row md:items-start md:justify-between" onClick={() => toggleSubtopic(subtopic.key)}>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-[var(--text-primary)]">
                                      {subtopic.order ? `${subtopic.order}. ` : ""}{subtopic.title}
                                    </p>
                                    {subtopic.bonusAwarded ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-success)]/10 px-2 py-0.5 text-xs text-[var(--accent-success)]">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Bonus earned
                                      </span>
                                    ) : null}
                                  </div>
                                  {subtopic.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtopic.description}</p>}
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                                    {subtopic.estimatedHours ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {subtopic.estimatedHours}h
                                      </span>
                                    ) : null}
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1">
                                      <ListChecks className="h-3.5 w-3.5" />
                                      {completedTasks}/{subtopic.tasks.length} tasks
                                    </span>
                                  </div>
                                </div>
                                <div className="flex w-full items-center gap-3 md:w-56">
                                  <div className="h-2 flex-1 rounded-full bg-[var(--bg-elevated)]">
                                    <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${subtopic.progressPercent}%` }} />
                                  </div>
                                  <span className="w-10 text-right text-xs text-[var(--text-muted)]">{subtopic.progressPercent}%</span>
                                  {subtopicOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                </div>
                              </button>
                              {subtopicOpen && (
                                <ul className="grid gap-2 border-t border-[var(--border-subtle)] p-3 md:grid-cols-2 xl:grid-cols-3">
                                  {subtopic.tasks.map((task, index) => (
                                    <li key={task.key || `${subtopic.key}-${index}`}>
                                      <button
                                        type="button"
                                        className="h-full w-full rounded-lg bg-[var(--bg-elevated)] p-3 text-left text-sm transition-[background-color] hover:bg-[var(--accent-primary)]/8"
                                        onClick={() => openTask(topic.key, subtopic.key, task.key)}
                                      >
                                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                          <span>{taskTypeLabel(task.type)}</span>
                                          {task.estimatedMinutes ? <span>{task.estimatedMinutes} min</span> : null}
                                          <span>{task.completed ? "Complete" : "10 pts"}</span>
                                        </div>
                                        <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                                        {task.description && <p className="mt-1 text-xs text-[var(--text-muted)]">{task.description}</p>}
                                        {task.resourceHint ? <p className="mt-2 text-xs text-[var(--accent-primary)]">{task.resourceHint}</p> : null}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}
