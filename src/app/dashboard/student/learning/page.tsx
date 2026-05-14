"use client";

import { useMemo, useState } from "react";
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
  Sparkles,
  WandSparkles
} from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StudentProfile = {
  learningGoal?: string | null;
  rewardPoints?: number;
  streak?: number;
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

const goalOptions = [
  {
    title: "Academic Improvement",
    detail: "Strengthen current subjects with targeted practice.",
    icon: BookOpen,
    tone: "primary"
  },
  {
    title: "Placement Preparation",
    detail: "Build aptitude, interview, and readiness habits.",
    icon: Briefcase,
    tone: "amber"
  },
  {
    title: "Skill Development",
    detail: "Learn technologies, frameworks, and project skills.",
    icon: Code,
    tone: "secondary"
  }
] as const;

function difficultyTone(difficulty: TaskRecommendation["difficulty"] | string | undefined) {
  if (difficulty === "Easy") return "bg-[var(--accent-success)]/12 text-[var(--accent-success)]";
  if (difficulty === "Medium") return "bg-[var(--accent-amber)]/12 text-[var(--accent-amber)]";
  return "bg-[var(--accent-danger)]/12 text-[var(--accent-danger)]";
}

function GoalCard({
  title,
  detail,
  icon: Icon,
  tone,
  onSelect,
  disabled
}: {
  title: string;
  detail: string;
  icon: typeof BookOpen;
  tone: "primary" | "amber" | "secondary";
  onSelect: () => void;
  disabled: boolean;
}) {
  const toneClass =
    tone === "amber"
      ? "bg-[var(--accent-amber)]/12 text-[var(--accent-amber)]"
      : tone === "secondary"
        ? "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]"
        : "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]";

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
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{detail}</p>
      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">
        Select goal <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}

export default function StudentLearningPage() {
  const allowed = useDashboardGuard("student");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedDuration = searchParams.get("duration") || "60";
  const [localError, setLocalError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/student/profile");
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
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== "completed"), [tasks]);
  const hasGoal = Boolean(profile?.learningGoal);

  const recommendationsQuery = useQuery({
    queryKey: ["student", "tasks", "recommendations", requestedDuration],
    queryFn: async () => {
      const { data } = await api.get<TaskRecommendation[]>(`/student/tasks/recommendations?duration=${requestedDuration}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: allowed && hasGoal && activeTasks.length === 0
  });

  const goalMutation = useMutation({
    mutationFn: (goal: string) => api.patch("/student/profile", { learningGoal: goal }),
    onSuccess: async () => {
      setLocalError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.student.profile });
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
        queryClient.invalidateQueries({ queryKey: ["student", "tasks", "recommendations", requestedDuration] })
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

  const loading = profileQuery.isLoading || tasksQuery.isLoading;
  const error = localError ?? (profileQuery.error ? describeApiError(profileQuery.error) : null) ?? (tasksQuery.error ? describeApiError(tasksQuery.error) : null) ?? (recommendationsQuery.error ? describeApiError(recommendationsQuery.error) : null);
  const recommendations = recommendationsQuery.data ?? [];

  if (!allowed || loading) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
          Preparing learning workspace...
        </div>
      </main>
    );
  }

  if (!hasGoal) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">{error}</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {goalOptions.map((goal) => (
            <GoalCard
              key={goal.title}
              title={goal.title}
              detail={goal.detail}
              icon={goal.icon}
              tone={goal.tone}
              onSelect={() => goalMutation.mutate(goal.title)}
              disabled={goalMutation.isPending}
            />
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      <section>
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Current goal</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{profile?.learningGoal}</h2>
            </div>
            <WandSparkles className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Change the goal anytime by selecting a new direction below. The recommendation engine will adjust the next task set.
          </p>
          <div className="mt-5 grid gap-2">
            {goalOptions.map((goal) => (
              <Button
                key={goal.title}
                type="button"
                variant={profile?.learningGoal === goal.title ? "filled" : "ghost"}
                disabled={goalMutation.isPending}
                onClick={() => goalMutation.mutate(goal.title)}
                className="justify-start"
              >
                <goal.icon className="h-4 w-4" />
                {goal.title}
              </Button>
            ))}
          </div>
        </Card>
      </section>

      {error ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">{error}</div>
      ) : null}

      {activeTasks.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">In progress</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Finish these tasks first</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTasks.map((task) => (
              <Card key={task._id} className="p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="green">In progress</Badge>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--text-primary)]">{task.title}</h3>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{task.category ?? "Learning task"}</p>
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
                  {task.basePoints ? <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-1">{task.basePoints} pts</span> : null}
                </div>
                <Button
                  onClick={() => completeMutation.mutate(task._id)}
                  disabled={completeMutation.isPending}
                  className="w-full justify-between"
                >
                  {completeMutation.isPending ? "Completing..." : "Mark complete"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section id="recommendations" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Recommended next</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Pick a task for this slot</h2>
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyTone(rec.difficulty)}`}>{rec.difficulty}</span>
                      <span className="rounded-full bg-[var(--accent-primary)]/10 px-2.5 py-1 font-mono text-xs text-[var(--accent-primary)]">
                        {(rec.probability * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold leading-tight text-[var(--text-primary)]">{rec.title}</h3>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{rec.category}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <Clock3 className="mb-2 h-4 w-4 text-[var(--accent-primary)]" />
                        <p className="font-semibold text-[var(--text-primary)]">{rec.durationMinutes} min</p>
                        <p className="text-xs text-[var(--text-muted)]">Estimate</p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                        <Medal className="mb-2 h-4 w-4 text-[var(--accent-amber)]" />
                        <p className="font-semibold text-[var(--text-primary)]">{rec.basePoints} pts</p>
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
                      {acceptMutation.isPending ? "Accepting..." : "Accept task"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)] p-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--accent-primary)]" />
              <p className="font-semibold text-[var(--text-primary)]">No recommendations for this slot</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Try a longer free window from your timetable.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
