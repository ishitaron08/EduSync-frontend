"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock3,
  Code,
  Loader2,
  Medal,
  Plus,
  Sparkles,
  Target,
  X
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StudentProfile = {
  learningGoal?: string | null;
  rewardPoints?: number;
  streak?: number;
};

type GoalLibraryEntry = {
  _id: string;
  title: string;
  isDefault: boolean;
  usageCount: number;
};

type TaskRecommendation = {
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number;
  basePoints: number;
  probability: number;
};

type ActiveTask = {
  _id: string;
  title: string;
  category?: string;
  difficulty?: string;
  status: string;
  durationMinutes?: number;
  basePoints?: number;
  pointsAwarded?: number;
};

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
};

type SyllabusGoalsPayload = {
  syllabusPlan: {
    status: "generating" | "ready" | "failed";
    topics: Array<{
      key: string;
      title: string;
      subtopics: Array<{
        key: string;
        title: string;
        description?: string;
        progressPercent: number;
        bonusAwarded?: boolean;
        tasks: SyllabusTask[];
      }>;
    }>;
  } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps well-known default goal titles to a lucide icon component. */
function iconForGoal(title: string) {
  if (title === "Academic Improvement") return BookOpen;
  if (title === "Placement Preparation") return Briefcase;
  if (title === "Skill Development") return Code;
  return Target;
}

/** Maps well-known default goal titles to a colour tone class. */
function toneClassForGoal(title: string) {
  if (title === "Placement Preparation")
    return "bg-[var(--accent-amber)]/12 text-[var(--accent-amber)]";
  if (title === "Skill Development")
    return "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]";
  return "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]";
}

function difficultyTone(difficulty: string | undefined) {
  if (difficulty === "Easy") return "bg-[var(--accent-success)]/12 text-[var(--accent-success)]";
  if (difficulty === "Medium") return "bg-[var(--accent-amber)]/12 text-[var(--accent-amber)]";
  return "bg-[var(--accent-danger)]/12 text-[var(--accent-danger)]";
}

function syllabusTaskTypeLabel(type?: string) {
  if (type === "read") return "Read";
  if (type === "build") return "Build";
  if (type === "revise") return "Revise";
  if (type === "assess") return "Assess";
  return "Practice";
}

// ---------------------------------------------------------------------------
// GoalCard — renders a single selectable goal from the library
// ---------------------------------------------------------------------------

function GoalCard({
  goal,
  onSelect,
  disabled
}: {
  goal: GoalLibraryEntry;
  onSelect: () => void;
  disabled: boolean;
}) {
  const Icon = iconForGoal(goal.title);
  const toneClass = toneClassForGoal(goal.title);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] hover:border-[var(--accent-primary)]/35 hover:shadow-[var(--shadow-lift)] disabled:pointer-events-none disabled:opacity-55"
    >
      <div className={`mb-8 flex h-11 w-11 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{goal.title}</h2>
      {!goal.isDefault && goal.usageCount > 1 && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {goal.usageCount} students using this goal
        </p>
      )}
      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">
        Select goal <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// AddGoalCard — inline form for submitting a custom goal
// ---------------------------------------------------------------------------

function AddGoalCard({
  onSubmit,
  isPending
}: {
  onSubmit: (title: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleExpand() {
    setExpanded(true);
    // Focus the input after the DOM updates
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCancel() {
    setExpanded(false);
    setValue("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 3) return;
    onSubmit(trimmed);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-center shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-lift)]"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--bg-elevated)]">
          <Plus className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Add your own goal</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Don&apos;t see what you need? Create a custom goal.
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Name your goal</p>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          placeholder="e.g. DSA Interview Prep, Research Paper Writing…"
          maxLength={80}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--text-muted)]">{value.trim().length}/80</span>
          <Button
            type="submit"
            variant="filled"
            size="sm"
            disabled={isPending || value.trim().length < 3}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Set goal
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GoalSelectionSkeleton — shown while the library is loading
// ---------------------------------------------------------------------------

function GoalSelectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="nc-skeleton h-48 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StudentLearningPage() {
  const allowed = useDashboardGuard("student");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedDuration = searchParams.get("duration") || "60";
  const selectedTopicKey = searchParams.get("topic");
  const selectedSubtopicKey = searchParams.get("subtopic");
  const selectedTaskKey = searchParams.get("task");
  const hasSyllabusSelection = Boolean(selectedTopicKey && selectedSubtopicKey);
  const [localError, setLocalError] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const profileQuery = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/student/profile");
      return data;
    },
    enabled: allowed
  });

  const goalLibraryQuery = useQuery({
    queryKey: queryKeys.student.goalLibrary,
    queryFn: async () => {
      const { data } = await api.get<GoalLibraryEntry[]>("/student/goal-library");
      return data;
    },
    enabled: allowed
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.student.tasks,
    queryFn: async () => {
      const { data } = await api.get<ActiveTask[]>("/student/tasks");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed
  });

  const syllabusQuery = useQuery({
    queryKey: queryKeys.student.syllabusGoals,
    queryFn: async () => {
      const { data } = await api.get<SyllabusGoalsPayload>("/student/syllabus-goals");
      return data;
    },
    enabled: allowed && hasSyllabusSelection,
    staleTime: 60 * 1000
  });

  const profile = profileQuery.data ?? null;
  const goalLibrary = goalLibraryQuery.data ?? [];
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "completed"), [tasks]);
  const hasGoal = Boolean(profile?.learningGoal);

  const recommendationsQuery = useQuery({
    queryKey: ["student", "tasks", "recommendations", requestedDuration],
    queryFn: async () => {
      const { data } = await api.get<TaskRecommendation[]>(
        `/student/tasks/recommendations?duration=${requestedDuration}`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed && hasGoal && activeTasks.length === 0 && !hasSyllabusSelection
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Single mutation for both selecting an existing goal and creating a new one.
   * POST /student/goal-library handles the upsert + profile update atomically.
   */
  const goalMutation = useMutation({
    mutationFn: (title: string) =>
      api.post<GoalLibraryEntry>("/student/goal-library", { title }),
    onSuccess: async () => {
      setLocalError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.goalLibrary })
      ]);
    },
    onError: (err) => setLocalError(describeApiError(err))
  });

  const acceptMutation = useMutation({
    mutationFn: (rec: TaskRecommendation) =>
      api.post("/student/tasks", {
        title: rec.title,
        category: rec.category,
        difficulty: rec.difficulty,
        durationMinutes: rec.durationMinutes,
        basePoints: rec.basePoints
      }),
    onSuccess: async () => {
      setLocalError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.tasks }),
        queryClient.invalidateQueries({
          queryKey: ["student", "tasks", "recommendations", requestedDuration]
        })
      ]);
    },
    onError: (err) => setLocalError(describeApiError(err))
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => api.patch(`/student/tasks/${taskId}/complete`),
    onSuccess: async () => {
      setLocalError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.tasks }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile })
      ]);
    },
    onError: (err) => setLocalError(describeApiError(err))
  });

  const completeSyllabusMutation = useMutation({
    mutationFn: (taskKey: string) =>
      api.patch("/student/syllabus-goals/task/complete", {
        topicKey: selectedTopicKey,
        subtopicKey: selectedSubtopicKey,
        taskKey
      }),
    onSuccess: async () => {
      setLocalError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.syllabusGoals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.rewardPoints })
      ]);
    },
    onError: (err) => setLocalError(describeApiError(err))
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const loading = profileQuery.isLoading || tasksQuery.isLoading;
  const error =
    localError ??
    (profileQuery.error ? describeApiError(profileQuery.error) : null) ??
    (tasksQuery.error ? describeApiError(tasksQuery.error) : null) ??
    (syllabusQuery.error ? describeApiError(syllabusQuery.error) : null) ??
    (goalLibraryQuery.error ? describeApiError(goalLibraryQuery.error) : null) ??
    (recommendationsQuery.error ? describeApiError(recommendationsQuery.error) : null);
  const recommendations = recommendationsQuery.data ?? [];
  const selectedSyllabusTopic = syllabusQuery.data?.syllabusPlan?.topics.find((topic) => topic.key === selectedTopicKey) ?? null;
  const selectedSyllabusSubtopic = selectedSyllabusTopic?.subtopics.find((subtopic) => subtopic.key === selectedSubtopicKey) ?? null;
  const pendingSyllabusTasks = useMemo(() => {
    const pending = selectedSyllabusSubtopic?.tasks.filter((task) => !task.completed) ?? [];
    if (!selectedTaskKey) return pending.slice(0, 5);
    return [...pending].sort((a, b) => Number(b.key === selectedTaskKey) - Number(a.key === selectedTaskKey)).slice(0, 5);
  }, [selectedSyllabusSubtopic, selectedTaskKey]);
  const completedSyllabusTasks = useMemo(
    () => selectedSyllabusSubtopic?.tasks.filter((task) => task.completed) ?? [],
    [selectedSyllabusSubtopic]
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (!allowed || loading || (hasSyllabusSelection && syllabusQuery.isLoading)) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
          Preparing learning workspace…
        </div>
      </main>
    );
  }

  if (hasSyllabusSelection) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
            {error}
          </div>
        ) : null}

        {!selectedSyllabusSubtopic ? (
          <Card className="p-6">
            <p className="font-semibold text-[var(--text-primary)]">Syllabus task not found</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Open a task again from Syllabus Goals.</p>
          </Card>
        ) : (
          <>
            <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{selectedSyllabusTopic?.title ?? "Syllabus"}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{selectedSyllabusSubtopic.title}</h1>
                  {selectedSyllabusSubtopic.description ? (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedSyllabusSubtopic.description}</p>
                  ) : null}
                </div>
                <div className="min-w-56">
                  <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Progress</span>
                    <span>{selectedSyllabusSubtopic.progressPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${selectedSyllabusSubtopic.progressPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    10 points per task{selectedSyllabusSubtopic.bonusAwarded ? "; bonus earned" : "; 20 bonus on subtopic completion"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Next tasks</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Top 5 to finish now</h2>
                </div>
                <Badge tone="muted">{pendingSyllabusTasks.length} active</Badge>
              </div>

              {pendingSyllabusTasks.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pendingSyllabusTasks.map((task) => (
                    <Card key={task.key} className="p-5">
                      <div className="mb-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        <span>{syllabusTaskTypeLabel(task.type)}</span>
                        {task.estimatedMinutes ? <span>{task.estimatedMinutes} min</span> : null}
                        <span>10 pts</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{task.title}</h3>
                      {task.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{task.description}</p> : null}
                      {task.resourceHint ? <p className="mt-3 text-sm text-[var(--accent-primary)]">{task.resourceHint}</p> : null}
                      <Button
                        className="mt-5 w-full justify-between"
                        disabled={completeSyllabusMutation.isPending}
                        onClick={() => completeSyllabusMutation.mutate(task.key)}
                      >
                        {completeSyllabusMutation.isPending ? "Completing..." : "Mark as complete"}
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <p className="font-semibold text-[var(--text-primary)]">This subtopic is complete</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Completed tasks are kept in history below.</p>
                </Card>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">History</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Completed tasks</h2>
              </div>
              {completedSyllabusTasks.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {completedSyllabusTasks.map((task) => (
                    <div key={task.key} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--accent-success)]">
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </div>
                      <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{task.pointsAwarded ?? 10} points earned</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-sm text-[var(--text-muted)]">
                  Completed syllabus tasks will appear here.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    );
  }

  // ── Goal selection screen (no goal set yet) ───────────────────────────────

  if (!hasGoal) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
            {error}
          </div>
        ) : null}

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Get started
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            What are you working towards?
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Pick a goal below or create your own. The recommendation engine will tailor tasks to it.
          </p>
        </div>

        {goalLibraryQuery.isLoading ? (
          <GoalSelectionSkeleton />
        ) : (
          <section className="grid gap-4 md:grid-cols-3">
            {goalLibrary.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onSelect={() => goalMutation.mutate(goal.title)}
                disabled={goalMutation.isPending}
              />
            ))}
            <AddGoalCard
              onSubmit={(title) => goalMutation.mutate(title)}
              isPending={goalMutation.isPending}
            />
          </section>
        )}
      </main>
    );
  }

  // ── Main learning workspace (goal is set) ─────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      {error ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
          {error}
        </div>
      ) : null}

      {/* ── Active tasks ── */}
      {activeTasks.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              In progress
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              Finish these tasks first
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTasks.map((task) => (
              <Card key={task._id} className="p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="green">In progress</Badge>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
                      {task.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {task.category ?? "Learning task"}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
                </div>
                <div className="mb-5 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  {task.durationMinutes ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {task.durationMinutes} min
                    </span>
                  ) : null}
                  {task.basePoints ? (
                    <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-1">
                      {task.basePoints} pts
                    </span>
                  ) : null}
                </div>
                <Button
                  onClick={() => completeMutation.mutate(task._id)}
                  disabled={completeMutation.isPending}
                  className="w-full justify-between"
                >
                  {completeMutation.isPending ? "Completing…" : "Mark complete"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        /* ── Recommendations ── */
        <section id="recommendations" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Recommended next
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                Pick a task for this slot
              </h2>
            </div>
            <Badge tone="muted">{requestedDuration} minute slot</Badge>
          </div>

          {recommendationsQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="nc-skeleton h-56 rounded-lg" />
              ))}
            </div>
          ) : recommendations.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <Card key={rec.title} className="flex flex-col p-0">
                  <div className="flex-1 p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyTone(rec.difficulty)}`}
                      >
                        {rec.difficulty}
                      </span>
                      <span className="rounded-full bg-[var(--accent-primary)]/10 px-2.5 py-1 font-mono text-xs text-[var(--accent-primary)]">
                        {(rec.probability * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold leading-tight text-[var(--text-primary)]">
                      {rec.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{rec.category}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <Clock3 className="mb-2 h-4 w-4 text-[var(--accent-primary)]" />
                        <p className="font-semibold text-[var(--text-primary)]">
                          {rec.durationMinutes} min
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">Estimate</p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <Medal className="mb-2 h-4 w-4 text-[var(--accent-amber)]" />
                        <p className="font-semibold text-[var(--text-primary)]">
                          {rec.basePoints} pts
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">Reward</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <Button
                      onClick={() => acceptMutation.mutate(rec)}
                      disabled={acceptMutation.isPending}
                      className="w-full justify-between"
                    >
                      {acceptMutation.isPending ? "Accepting…" : "Accept task"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--accent-primary)]" />
              <p className="font-semibold text-[var(--text-primary)]">
                No recommendations for this slot
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Try a longer free window from your timetable.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
