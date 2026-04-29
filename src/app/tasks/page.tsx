"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentTask = {
  _id: string;
  title: string;
  category: string;
  durationMinutes: number;
  status: "pending" | "in_progress" | "completed";
  goal: string;
};

type Goal = { _id: string; goalType: string };

export default function TasksPage() {
  const allowed = useDashboardGuard("student");
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [goalsRes, tasksRes] = await Promise.all([api.get<Goal[]>("/student/goals"), api.get<StudentTask[]>("/student/tasks")]);
      setGoals(goalsRes.data ?? []);
      setTasks(tasksRes.data ?? []);
      setGoalId((prev) => prev || goalsRes.data?.[0]?._id || "");
      setError(null);
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    Promise.all([api.get<Goal[]>("/student/goals"), api.get<StudentTask[]>("/student/tasks")])
      .then(([goalsRes, tasksRes]) => {
        if (cancelled) return;
        setGoals(goalsRes.data ?? []);
        setTasks(tasksRes.data ?? []);
        setGoalId((prev) => prev || goalsRes.data?.[0]?._id || "");
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(describeApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const createTask = async () => {
    try {
      await api.post("/student/tasks", {
        goal: goalId,
        title,
        category: "self_planned",
        durationMinutes: 45
      });
      setTitle("");
      await refresh();
    } catch (e) {
      setError(describeApiError(e));
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await api.patch(`/student/tasks/${taskId}/complete`);
      await refresh();
    } catch (e) {
      setError(describeApiError(e));
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
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Tasks</h1>
      {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
      <Card className="p-4">
        <p className="mb-2 text-sm text-[var(--text-muted)]">Create task</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="goalId">Goal</Label>
            <select
              id="goalId"
              className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              {goals.map((goal) => (
                <option key={goal._id} value={goal._id}>
                  {goal.goalType}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="taskTitle">Task title</Label>
            <Input id="taskTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
        </div>
        <Button className="mt-3" onClick={createTask} disabled={!goalId || !title.trim()}>
          Add task
        </Button>
      </Card>
      {tasks.map((task) => (
        <Card key={task._id} className="p-4">
          <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {task.category} • {task.durationMinutes} min • {task.status}
          </p>
          {task.status !== "completed" && (
            <Button className="mt-3" variant="ghost" onClick={() => completeTask(task._id)}>
              Mark complete
            </Button>
          )}
        </Card>
      ))}
    </main>
  );
}
