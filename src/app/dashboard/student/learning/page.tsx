"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock3,
  Code,
  History,
  Loader2,
  Lock,
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
  // Syllabus context — present when the recommendation comes from the
  // student's active SyllabusPlan
  topicTitle?: string;
  subtopicTitle?: string;
  topicLevel?: string;
  taskType?: string;
  topicKey?: string;
  subtopicKey?: string;
  taskKey?: string;
  locked?: boolean;
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

type CompletedTask = {
  _id: string;
  title: string;
  category?: string;
  difficulty?: string;
  durationMinutes?: number;
  basePoints?: number;
  pointsAwarded?: number;
  completedAt?: string;
  createdAt?: string;
  studyNote?: string;
  checklistCompleted?: number[];
  source?: "syllabus" | string;
  topicTitle?: string;
  subtopicTitle?: string;
};

type LearningTab = "recommended" | "history";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function iconForGoal(title: string) {
  if (title === "Academic Improvement") return BookOpen;
  if (title === "Placement Preparation") return Briefcase;
  if (title === "Skill Development") return Code;
  return Target;
}

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

function formatRelative(iso: string | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// GoalCard / AddGoalCard — used on the initial goal selection screen
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
// Tab strip
// ---------------------------------------------------------------------------

function TabStrip({
  active,
  onChange
}: {
  active: LearningTab;
  onChange: (tab: LearningTab) => void;
}) {
  const tabs: Array<{ id: LearningTab; label: string; icon: typeof Sparkles }> = [
    { id: "recommended", label: "Recommended", icon: Sparkles },
    { id: "history", label: "History", icon: History }
  ];

  return (
    <div className="flex max-w-full overflow-x-auto border-b border-[var(--border-subtle)] [-webkit-overflow-scrolling:touch]">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-[color,border-color] sm:px-4",
              isActive
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StudentLearningPage() {
  const allowed = useDashboardGuard("student");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedDuration = searchParams.get("duration") || "60";
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LearningTab>("recommended");
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<CompletedTask | null>(null);

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
    enabled: allowed && hasGoal && activeTasks.length === 0 && activeTab === "recommended"
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.student.taskHistory,
    queryFn: async () => {
      const { data } = await api.get<CompletedTask[]>("/student/tasks/history");
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed && hasGoal && activeTab === "history"
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

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
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.taskHistory })
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
    (goalLibraryQuery.error ? describeApiError(goalLibraryQuery.error) : null) ??
    (recommendationsQuery.error ? describeApiError(recommendationsQuery.error) : null) ??
    (historyQuery.error ? describeApiError(historyQuery.error) : null);
  const recommendations = recommendationsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const visibleActiveTasks = activeTasks.slice(0, 5);

  function openSyllabusTask(rec: TaskRecommendation) {
    if (!rec.topicKey || !rec.subtopicKey || !rec.taskKey) return;
    const params = new URLSearchParams({
      topic: rec.topicKey,
      subtopic: rec.subtopicKey,
      task: rec.taskKey
    });
    router.push(`/dashboard/student/learning/task?${params.toString()}`);
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (!allowed || loading) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
          Preparing learning workspace…
        </div>
      </main>
    );
  }

  // ── Goal selection screen ────────────────────────────────────────────────

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

  // ── Main learning workspace ───────────────────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      {error ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
          {error}
        </div>
      ) : null}

      <TabStrip active={activeTab} onChange={setActiveTab} />

      {selectedHistoryTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(20%_0.018_226_/_0.55)] p-4">
          <Card className="max-h-[86vh] w-full max-w-2xl overflow-auto p-0">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Completed task
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{selectedHistoryTask.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  {selectedHistoryTask.topicTitle ? (
                    <span className="rounded-md bg-[var(--accent-primary)]/10 px-2 py-1 text-[var(--accent-primary)]">{selectedHistoryTask.topicTitle}</span>
                  ) : null}
                  {selectedHistoryTask.category ? <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-1">{selectedHistoryTask.category}</span> : null}
                  {selectedHistoryTask.difficulty ? <span className={`rounded-md px-2 py-1 ${difficultyTone(selectedHistoryTask.difficulty)}`}>{selectedHistoryTask.difficulty}</span> : null}
                  <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-1">{selectedHistoryTask.pointsAwarded ?? selectedHistoryTask.basePoints ?? 0} pts</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-[var(--text-muted)] transition-[background-color,color] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                onClick={() => setSelectedHistoryTask(null)}
                aria-label="Close task history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Practice answer or output</p>
                <div className="mt-2 min-h-28 whitespace-pre-wrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 text-sm leading-6 text-[var(--text-primary)]">
                  {selectedHistoryTask.studyNote?.trim() || "No answer or notes were saved for this task."}
                </div>
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Checklist saved</p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">{selectedHistoryTask.checklistCompleted?.length ?? 0} item{(selectedHistoryTask.checklistCompleted?.length ?? 0) === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Completed</p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatRelative(selectedHistoryTask.completedAt ?? selectedHistoryTask.createdAt)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "recommended" ? (
        <>
          {/* Active tasks always shown above recommendations on the recommended tab */}
          {activeTasks.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    In progress
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    Finish these tasks first
                  </h2>
                </div>
                <Badge tone="muted">{Math.min(activeTasks.length, 5)} of {activeTasks.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {visibleActiveTasks.map((task) => (
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
            /* Recommendations grid */
            <section id="recommendations" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Recommended next
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    Pick your next task
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Suggestions are drawn from your active goal&apos;s syllabus plan.
                  </p>
                </div>
                <Badge tone="muted">{recommendations.length} suggested</Badge>
              </div>

              {recommendationsQuery.isLoading ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="nc-skeleton h-56 rounded-lg" />
                  ))}
                </div>
              ) : recommendations.length ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {recommendations.slice(0, 5).map((rec) => {
                    const isSyllabusTask = Boolean(rec.topicKey && rec.subtopicKey && rec.taskKey);
                    const actionPending = acceptMutation.isPending;
                    const locked = Boolean(rec.locked);
                    return (
                    <Card
                      key={rec.taskKey ?? rec.title}
                      className={`flex flex-col p-0 ${isSyllabusTask && !locked ? "cursor-pointer transition-[border-color,box-shadow] hover:border-[var(--accent-primary)]/35 hover:shadow-[var(--shadow-lift)]" : locked ? "opacity-60" : ""}`}
                      role={isSyllabusTask && !locked ? "button" : undefined}
                      tabIndex={isSyllabusTask && !locked ? 0 : undefined}
                      onClick={() => {
                        if (isSyllabusTask && !locked) openSyllabusTask(rec);
                      }}
                      onKeyDown={(event) => {
                        if (!isSyllabusTask || locked) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openSyllabusTask(rec);
                        }
                      }}
                    >
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
                        {locked ? (
                          <div className="mb-3 inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-muted)]">
                            <Lock className="h-3.5 w-3.5" />
                            Complete previous task first
                          </div>
                        ) : null}

                        {/* Syllabus context (topic › subtopic) when present */}
                        {rec.topicTitle && rec.subtopicTitle ? (
                          <p className="mb-2 truncate text-xs uppercase tracking-[0.06em] text-[var(--text-muted)]">
                            {rec.topicTitle} <span className="opacity-60">›</span> {rec.subtopicTitle}
                          </p>
                        ) : null}

                        <h3 className="text-xl font-semibold leading-tight text-[var(--text-primary)]">
                          {rec.title}
                        </h3>
                        {rec.taskType ? (
                          <p className="mt-2 text-sm capitalize text-[var(--text-muted)]">
                            {rec.taskType}
                          </p>
                        ) : null}
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
                          type="button"
                          onClick={() => {
                            if (isSyllabusTask && !locked) openSyllabusTask(rec);
                            else acceptMutation.mutate(rec);
                          }}
                          disabled={actionPending || locked}
                          className="w-full justify-between"
                        >
                          {actionPending ? "Updating..." : locked ? "Locked" : isSyllabusTask ? "Open task" : "Accept task"}
                          {locked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-10 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--accent-primary)]" />
                  <p className="font-semibold text-[var(--text-primary)]">All caught up</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    No pending tasks in your syllabus right now. Visit your syllabus plan to review progress or generate more topics.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        // ── History tab ────────────────────────────────────────────────────
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Completed tasks
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              Your task history
            </h2>
          </div>

          {historyQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="nc-skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : history.length ? (
            <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {history.map((task, idx) => (
                <button
                  type="button"
                  key={task._id}
                  className={[
                    "flex w-full items-center gap-4 p-4 text-left transition-[background-color]",
                    "hover:bg-[var(--bg-elevated)]",
                    idx > 0 ? "border-t border-[var(--border-subtle)]" : ""
                  ].join(" ")}
                  onClick={() => setSelectedHistoryTask(task)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-success)]/12 text-[var(--accent-success)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      {task.category ? (
                        <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5">
                          {task.category}
                        </span>
                      ) : null}
                      {task.source === "syllabus" && task.topicTitle ? (
                        <span className="rounded-md bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[var(--accent-primary)]">
                          {task.topicTitle}
                        </span>
                      ) : null}
                      {task.difficulty ? (
                        <span
                          className={`rounded-md px-2 py-0.5 ${difficultyTone(task.difficulty)}`}
                        >
                          {task.difficulty}
                        </span>
                      ) : null}
                      {task.durationMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {task.durationMinutes} min
                        </span>
                      ) : null}
                      <span>·</span>
                      <span>{formatRelative(task.completedAt ?? task.createdAt)}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-amber)]">
                      <Medal className="h-3.5 w-3.5" />
                      {task.pointsAwarded ?? task.basePoints ?? 0}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">earned</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-10 text-center">
              <History className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="font-semibold text-[var(--text-primary)]">No completed tasks yet</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Finish your first task to start your history.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
