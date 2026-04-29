"use client";

import { useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { recommendationSchema, recommendationV2Schema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardGuard } from "@/lib/authGuard";

type RecommendationV2Response = {
  recommendation: string;
  confidence: number;
  suggestedTasks: Array<{ title: string; durationMinutes: number; reason: string }>;
  roadmap: Array<{ order: number; recommendation: string }>;
  explanations: string[];
};

export default function RecommendationsPage() {
  const allowed = useDashboardGuard("student");
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Array<{ title: string; durationMinutes: number; reason: string }>>([]);
  const [roadmap, setRoadmap] = useState<Array<{ order: number; recommendation: string }>>([]);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async () => {
    setError(null);
    setLoading(true);
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
      const freeMinutes = Math.max(15, freeSlots.reduce((acc, slot) => acc + Number(slot.duration ?? 0), 0));

      const payloadV2 = recommendationV2Schema.parse({
        studentContext: { academicYear: 3 },
        goalContext: {
          goalType: goals[0]?.goalType ?? "placement",
          difficultyPreference: goals[0]?.difficultyPreference ?? "medium"
        },
        availabilityContext: {
          freeMinutesToday: freeMinutes,
          freeSlotCountToday: freeSlots.length
        },
        progressContext: {
          completionRate: tasks.length ? completed / tasks.length : 0.5,
          completedTasks: completed,
          totalTasks: tasks.length
        }
      });

      try {
        const { data } = await api.post<RecommendationV2Response>("/ml/predict-v2", payloadV2);
        setPrediction(data.recommendation);
        setConfidence(data.confidence);
        setTasks(data.suggestedTasks ?? []);
        setRoadmap(data.roadmap ?? []);
        setExplanations(data.explanations ?? []);
      } catch {
        const payload = recommendationSchema.parse({
          student_year: 3,
          goal_type: goals[0]?.goalType ?? "placement",
          free_time_duration: freeMinutes,
          completion_rate: tasks.length ? completed / tasks.length : 0.5,
          difficulty_preference: goals[0]?.difficultyPreference ?? "medium"
        });
        const { data } = await api.post("/ml/predict", payload);
        setPrediction(data.recommended_task_category ?? JSON.stringify(data));
        setConfidence(null);
        setTasks([]);
        setRoadmap([]);
        setExplanations([]);
      }
    } catch (err) {
      setPrediction("");
      setConfidence(null);
      setTasks([]);
      setRoadmap([]);
      setExplanations([]);
      setError(describeApiError(err));
    } finally {
      setLoading(false);
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
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--text-primary)]">
        Task Recommendations
      </h1>
      <p className="text-sm text-[var(--text-muted)]">Requires a logged-in user (any role with a valid JWT).</p>
      <Button variant="filled" onClick={fetchRecommendation} disabled={loading}>
        {loading ? "Loading..." : "Get Recommendation"}
      </Button>
      {error && (
        <p
          className="rounded-md border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-3 py-2 text-sm text-[var(--text-primary)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <Card>
        <p className="font-medium text-[var(--text-primary)]">Predicted Task Category</p>
        <p className="mt-2 text-[var(--text-muted)]">{prediction || "No recommendation yet"}</p>
        {typeof confidence === "number" && <p className="mt-2 text-sm text-[var(--text-muted)]">Confidence: {(confidence * 100).toFixed(0)}%</p>}
      </Card>
      <Card>
        <p className="font-medium text-[var(--text-primary)]">Suggested tasks</p>
        <div className="mt-2 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-[var(--text-muted)]">No task suggestions yet.</p>
          ) : (
            tasks.map((task, index) => (
              <div key={index} className="rounded border border-[var(--border-subtle)] p-2">
                <p className="text-sm text-[var(--text-primary)]">{task.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {task.durationMinutes} min • {task.reason}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
      <Card>
        <p className="font-medium text-[var(--text-primary)]">Roadmap</p>
        <div className="mt-2 space-y-2">
          {roadmap.length === 0 ? (
            <p className="text-[var(--text-muted)]">No roadmap available yet.</p>
          ) : (
            roadmap.map((step) => (
              <p key={step.order} className="text-sm text-[var(--text-muted)]">
                {step.order}. {step.recommendation}
              </p>
            ))
          )}
        </div>
      </Card>
      <Card>
        <p className="font-medium text-[var(--text-primary)]">Explanations</p>
        <div className="mt-2 space-y-2">
          {explanations.length === 0 ? (
            <p className="text-[var(--text-muted)]">No explanation returned.</p>
          ) : (
            explanations.map((item, index) => (
              <p key={index} className="text-sm text-[var(--text-muted)]">
                {item}
              </p>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
