"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardGuard } from "@/lib/authGuard";

interface Goal {
  _id: string;
  goalType: string;
  difficultyPreference: string;
  progress?: number;
}

export default function GoalsPage() {
  const allowed = useDashboardGuard("student");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/student/goals");
      setGoals(data);
    } catch (err) {
      setGoals([]);
      setError(describeApiError(err));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/student/goals")
      .then(({ data }) => {
        if (mounted) {
          setGoals(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setGoals([]);
          setError(describeApiError(err));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const createSampleGoal = async () => {
    setActionError(null);
    try {
      await api.post("/student/goals", {
        goalType: "placement",
        targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
        difficultyPreference: "medium"
      });
      await refresh();
    } catch (err) {
      setActionError(describeApiError(err));
    }
  };

  const updateProgress = async (goalId: string, progress: number) => {
    setActionError(null);
    try {
      await api.patch(`/student/goals/${goalId}`, { progress });
      await refresh();
    } catch (err) {
      setActionError(describeApiError(err));
    }
  };

  const deleteOwnedGoal = async (goalId: string) => {
    setActionError(null);
    try {
      await api.delete(`/student/goals/${goalId}`);
      await refresh();
    } catch (err) {
      setActionError(describeApiError(err));
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
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--text-primary)]">Goals</h1>
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
      {!loading && error && (
        <p
          className="rounded-md border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-3 py-2 text-sm text-[var(--text-primary)]"
          role="alert"
        >
          {error}
        </p>
      )}
      {actionError && (
        <p
          className="rounded-md border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 px-3 py-2 text-sm text-[var(--accent-danger)]"
          role="alert"
        >
          {actionError}
        </p>
      )}
      <Button variant="filled" onClick={createSampleGoal} disabled={loading}>
        Create Sample Goal
      </Button>
      {!loading &&
        !error &&
        goals.map((goal) => (
          <Card key={goal._id}>
            <p className="font-medium text-[var(--text-primary)]">{goal.goalType}</p>
            <p className="text-sm text-[var(--text-muted)]">Difficulty: {goal.difficultyPreference}</p>
            <p className="text-sm text-[var(--text-muted)]">Progress: {goal.progress ?? 0}%</p>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => updateProgress(goal._id, Math.min(100, (goal.progress ?? 0) + 10))}>
                +10% progress
              </Button>
              <Button variant="ghost" onClick={() => deleteOwnedGoal(goal._id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      {!loading && !error && goals.length === 0 && (
        <EmptyState
          title="No goals yet"
          description="Create a sample goal to track placement prep and difficulty preferences (requires student login)."
          action={{ label: "Create sample goal", onClick: createSampleGoal }}
        />
      )}
    </main>
  );
}
