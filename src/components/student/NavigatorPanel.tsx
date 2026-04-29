"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { recommendationSchema, recommendationV2Schema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PredictV2Response = {
  recommendation: string;
  confidence: number;
  suggestedTasks: Array<{ title: string; durationMinutes: number }>;
  explanations: string[];
};

export function NavigatorPanel() {
  const [category, setCategory] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [nextTask, setNextTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(0);

  const fetchNav = async () => {
    setError(null);
    setLoading(true);
    setVisible(0);
    try {
      const [goalsRes, freeSlotsRes, tasksRes] = await Promise.all([
        api.get<Array<{ goalType: string; difficultyPreference: "easy" | "medium" | "hard" }>>("/student/goals"),
        api.get<Array<{ duration: number }>>("/student/free-slots"),
        api.get<Array<{ status: string }>>("/student/tasks")
      ]);
      const goals = goalsRes.data ?? [];
      const freeSlots = freeSlotsRes.data ?? [];
      const tasks = tasksRes.data ?? [];
      const completed = tasks.filter((task) => task.status === "completed").length;
      const completionRate = tasks.length > 0 ? completed / tasks.length : 0.5;
      const totalFreeMinutes = freeSlots.reduce((acc, slot) => acc + Number(slot.duration ?? 0), 0);
      const activeGoal = goals[0];

      const payloadV2 = recommendationV2Schema.parse({
        studentContext: { academicYear: 3 },
        goalContext: {
          goalType: activeGoal?.goalType ?? "placement",
          difficultyPreference: activeGoal?.difficultyPreference ?? "medium"
        },
        availabilityContext: {
          freeMinutesToday: Math.max(15, totalFreeMinutes),
          freeSlotCountToday: freeSlots.length
        },
        progressContext: {
          completionRate: Math.max(0, Math.min(1, completionRate)),
          completedTasks: completed,
          totalTasks: tasks.length
        }
      });

      let cat = "general_study";
      let conf: number | null = null;
      let explain: string | null = null;
      let firstTask: string | null = null;
      try {
        const { data } = await api.post<PredictV2Response>("/ml/predict-v2", payloadV2);
        cat = data.recommendation;
        conf = data.confidence;
        explain = data.explanations?.[0] ?? null;
        firstTask = data.suggestedTasks?.[0]?.title ?? null;
      } catch {
        const payload = recommendationSchema.parse({
          student_year: 3,
          goal_type: activeGoal?.goalType ?? "placement",
          free_time_duration: Math.max(15, totalFreeMinutes),
          completion_rate: Math.max(0, Math.min(1, completionRate)),
          difficulty_preference: activeGoal?.difficultyPreference ?? "medium"
        });
        const { data } = await api.post("/ml/predict", payload);
        cat = (data.recommended_task_category as string) ?? JSON.stringify(data);
      }
      setCategory(cat);
      setConfidence(conf);
      setExplanation(explain);
      setNextTask(firstTask);
      setVisible(1);
    } catch (e) {
      setCategory(null);
      setConfidence(null);
      setExplanation(null);
      setNextTask(null);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!category || visible >= 5) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 80);
    return () => clearTimeout(t);
  }, [category, visible]);

  return (
    <div className="sticky top-4 rounded-[8px] border-l-4 border-[var(--accent-secondary)] bg-[var(--bg-surface)] p-4 shadow-[var(--glow-blue)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent-secondary)]/40 bg-[var(--bg-elevated)] text-xs">
          AI
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--text-primary)]">
            Your Navigator
          </h2>
          <p className="text-xs text-[var(--text-muted)]">ML-guided next step</p>
        </div>
      </div>

      <Button type="button" variant="filled" className="mt-4 w-full" onClick={fetchNav} disabled={loading}>
        {loading ? "Consulting..." : "Refresh insight"}
      </Button>

      {error && (
        <p className="mt-3 text-sm text-[var(--accent-danger)]" role="alert">
          {error}
        </p>
      )}

      {category && (
        <Card key={category} className="nc-card-swap mt-4 border-[var(--accent-secondary)]/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Suggested focus</p>
          <p
            className="mt-2 font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--accent-secondary)] transition-all duration-300"
            style={{ opacity: visible >= 2 ? 1 : 0, transform: visible >= 2 ? "translateY(0)" : "translateY(12px)" }}
          >
            {category}
          </p>
          <div className="mt-3 font-mono text-xs text-[var(--text-muted)]">
            Based on your goals, availability, and completion patterns.
          </div>
          {typeof confidence === "number" && <p className="mt-2 text-xs text-[var(--text-muted)]">Confidence: {(confidence * 100).toFixed(0)}%</p>}
          {explanation && <p className="mt-2 text-xs text-[var(--text-muted)]">{explanation}</p>}
          {nextTask && <p className="mt-2 text-xs text-[var(--text-muted)]">Next task: {nextTask}</p>}
        </Card>
      )}
    </div>
  );
}
