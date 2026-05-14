"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Award, Check, ChevronDown, Flame, KeyRound, Loader2, Mail, Target, UserRound } from "lucide-react";

type StudentProfile = {
  name?: string;
  email?: string;
  learningGoal?: string;
  rewardPoints?: number;
  streak?: number;
  createdAt?: string;
  pointsBreakdown?: {
    aiTasks?: number;
    tests?: number;
    streakBonuses?: number;
  };
};

type GoalLibraryEntry = {
  _id: string;
  title: string;
  isDefault: boolean;
  usageCount: number;
};

export default function StudentProfilePage() {
  const allowed = useDashboardGuard("student");
  const queryClient = useQueryClient();
  const [name, setName] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

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

  const profile = profileQuery.data ?? null;
  const goalLibrary = goalLibraryQuery.data ?? [];
  const currentName = name ?? profile?.name ?? "";
  const currentGoal = goal ?? profile?.learningGoal ?? "";
  const normalizedCurrentGoal = currentGoal.trim().toLowerCase();
  const matchingGoal = goalLibrary.find((item) => item.title.toLowerCase() === normalizedCurrentGoal);
  const savedGoal = profile?.learningGoal ?? "";
  const isGoalChanged = currentGoal !== savedGoal;
  const suggestedGoals = useMemo(() => {
    const needle = currentGoal.trim().toLowerCase();
    const matches = needle
      ? goalLibrary.filter((item) => item.title.toLowerCase().includes(needle))
      : goalLibrary;
    return matches.slice(0, 8);
  }, [currentGoal, goalLibrary]);

  if (!allowed || profileQuery.isLoading) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      const trimmedGoal = currentGoal.trim();
      if (trimmedGoal.length < 3) {
        setError("Learning goal must be at least 3 characters.");
        return;
      }
      if (trimmedGoal.length > 80) {
        setError("Learning goal must be 80 characters or fewer.");
        return;
      }

      const payload: { name: string; learningGoal: string; password?: string } = { name: currentName, learningGoal: trimmedGoal };
      if (password) payload.password = password;
      await api.patch("/student/profile", payload);
      setSuccess("Profile updated successfully.");
      setPassword("");
      setConfirmPassword("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.student.profile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.student.goalLibrary });
      await queryClient.invalidateQueries({ queryKey: queryKeys.student.syllabusGoals });
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6 lg:px-8">
      {(error || profileQuery.error) ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">{error || describeApiError(profileQuery.error)}</div>
      ) : null}
      {success ? <div className="rounded-lg border border-[var(--accent-success)]/25 bg-[var(--accent-success)]/10 p-3 text-sm text-[var(--accent-success)]">{success}</div> : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <form onSubmit={handleSave} className="space-y-7">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[var(--accent-primary)]" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Personal information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Full name</span>
                  <Input value={currentName} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <Input className="bg-[var(--bg-elevated)] pl-9" value={profile?.email || ""} readOnly disabled />
                  </div>
                </label>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--accent-amber)]" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Learning goal</h2>
              </div>
              <div className="space-y-3">
                <div
                  className="relative"
                  onBlur={() => {
                    window.setTimeout(() => setGoalDropdownOpen(false), 120);
                  }}
                >
                  <div className="flex">
                    <Input
                      value={currentGoal}
                      onFocus={() => setGoalDropdownOpen(true)}
                      onChange={(event) => {
                        setGoal(event.target.value);
                        setGoalDropdownOpen(true);
                      }}
                      placeholder="Type or choose a goal"
                      maxLength={80}
                      className="rounded-r-none"
                    />
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-r-lg border border-l-0 border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] transition-[background-color,color] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setGoalDropdownOpen((open) => !open)}
                      aria-label="Show learning goal options"
                      aria-expanded={goalDropdownOpen}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {goalDropdownOpen ? (
                    <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-lift)]">
                      {goalLibraryQuery.isLoading ? (
                        <div className="space-y-1 p-2">
                          <div className="nc-skeleton h-8 rounded-md" />
                          <div className="nc-skeleton h-8 rounded-md" />
                        </div>
                      ) : suggestedGoals.length ? (
                        suggestedGoals.map((item) => {
                          const selected = item.title === currentGoal;
                          return (
                            <button
                              key={item._id}
                              type="button"
                              className={[
                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-[background-color,color]",
                                selected
                                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                  : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                              ].join(" ")}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setGoal(item.title);
                                setGoalDropdownOpen(false);
                              }}
                            >
                              <span className="flex-1 font-medium">{item.title}</span>
                              {selected ? <Check className="h-4 w-4" /> : null}
                            </button>
                          );
                        })
                      ) : currentGoal.trim().length >= 3 ? (
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setGoalDropdownOpen(false)}
                        >
                          <span>Create "{currentGoal.trim()}"</span>
                          <span className="text-xs text-[var(--text-muted)]">on save</span>
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-sm text-[var(--text-muted)]">Type at least 3 characters to create a new goal.</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {isGoalChanged && currentGoal.trim().length >= 3 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    {matchingGoal ? "Saving will set this existing goal as active." : "Saving will create this goal and set it as active."}
                  </p>
                ) : null}
              </div>
              {isGoalChanged ? (
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 p-3 text-sm text-[var(--text-primary)]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]" />
                  <p>Changing your learning goal updates future recommendations. Earned points stay untouched.</p>
                </div>
              ) : null}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[var(--accent-secondary)]" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Security</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input type="password" placeholder="New password, optional" value={password} onChange={(event) => setPassword(event.target.value)} />
                <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!password} />
              </div>
            </section>

            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-5">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Student stats</p>
          <div className="mt-5 space-y-5">
            <div className="rounded-lg border border-[var(--border-subtle)] p-4">
              <Award className="mb-4 h-5 w-5 text-[var(--accent-primary)]" />
              <p className="text-3xl font-semibold text-[var(--text-primary)]">{profile?.rewardPoints || 0}</p>
              <p className="text-sm text-[var(--text-muted)]">Total points</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] p-4">
              <Flame className="mb-4 h-5 w-5 text-[var(--accent-amber)]" />
              <p className="text-3xl font-semibold text-[var(--text-primary)]">{profile?.streak || 0} days</p>
              <p className="text-sm text-[var(--text-muted)]">Current streak</p>
            </div>
            <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Points breakdown</p>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">AI Tasks</span><span>{profile?.pointsBreakdown?.aiTasks || 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Assessments</span><span>{profile?.pointsBreakdown?.tests || 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Streak bonuses</span><span>{profile?.pointsBreakdown?.streakBonuses || 0}</span></div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
