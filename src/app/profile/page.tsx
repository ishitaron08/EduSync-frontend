"use client";

import { useRef, useState } from "react";
import { KeyRound, Phone, Plus, ShieldCheck, Target, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAuth } from "@/lib/authGuard";
import { changePasswordSchema, profileUpdateSchema } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GoalLibraryEntry = {
  _id: string;
  title: string;
  isDefault: boolean;
  usageCount: number;
};

type StudentProfile = {
  learningGoal?: string | null;
};

export default function ProfilePage() {
  const allowed = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const queryClient = useQueryClient();

  // ── Profile form state ───────────────────────────────────────────────────
  const [profileDraft, setProfileDraft] = useState<{ name: string; phone: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Password form state ──────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Goal custom-input state ──────────────────────────────────────────────
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customGoalValue, setCustomGoalValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  const name = profileDraft?.name ?? user?.name ?? "";
  const phone = profileDraft?.phone ?? user?.phone ?? "";
  const isStudent = user?.role === "student";

  // ── Queries (student-only) ───────────────────────────────────────────────
  const studentProfileQuery = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/student/profile");
      return data;
    },
    enabled: allowed && isStudent
  });

  const goalLibraryQuery = useQuery({
    queryKey: queryKeys.student.goalLibrary,
    queryFn: async () => {
      const { data } = await api.get<GoalLibraryEntry[]>("/student/goal-library");
      return data;
    },
    enabled: allowed && isStudent
  });

  const currentGoal = studentProfileQuery.data?.learningGoal ?? null;
  const goalLibrary = goalLibraryQuery.data ?? [];

  // ── Goal mutation ────────────────────────────────────────────────────────
  const goalMutation = useMutation({
    mutationFn: (title: string) =>
      api.post<GoalLibraryEntry>("/student/goal-library", { title }),
    onSuccess: async () => {
      setShowCustomInput(false);
      setCustomGoalValue("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.student.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.student.goalLibrary })
      ]);
    }
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleShowCustomInput() {
    setShowCustomInput(true);
    setTimeout(() => customInputRef.current?.focus(), 0);
  }

  function handleCancelCustom() {
    setShowCustomInput(false);
    setCustomGoalValue("");
  }

  function handleCustomGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customGoalValue.trim();
    if (trimmed.length < 3) return;
    goalMutation.mutate(trimmed);
  }

  const onProfileSave = async () => {
    setProfileError(null);
    setProfileMessage(null);
    const parsed = profileUpdateSchema.safeParse({ name, phone });
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? "Invalid profile data");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        name: parsed.data.name,
        phone: parsed.data.phone.trim() ? parsed.data.phone.trim() : null
      });
      setProfileDraft(null);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSave = async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword
    });
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password data");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(parsed.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
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
    <main className="mx-auto max-w-5xl px-4 py-4 md:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Profile information */}
          <Card className="space-y-5 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-secondary)]">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile information</h2>
                <p className="text-sm text-[var(--text-muted)]">Name and phone number used by the school workspace.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      name: event.target.value,
                      phone: prev?.phone ?? phone
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      name: prev?.name ?? name,
                      phone: event.target.value
                    }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            {profileError ? <p className="text-sm text-[var(--accent-danger)]">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-[var(--accent-success)]">{profileMessage}</p> : null}
            <div className="flex justify-end">
              <Button onClick={onProfileSave} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </Card>

          {/* Learning goal — students only */}
          {isStudent && (
            <Card className="space-y-5 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
                  <Target className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Learning goal</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Your active goal shapes the tasks the recommendation engine suggests.
                  </p>
                </div>
              </div>

              {/* Current goal badge */}
              {currentGoal ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/8 px-3 py-2">
                  <Target className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                  <span className="text-sm font-medium text-[var(--accent-primary)]">{currentGoal}</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">Active</span>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No goal set yet.</p>
              )}

              {/* Goal library loading skeleton */}
              {goalLibraryQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="nc-skeleton h-10 rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Goal list */}
                  <div className="space-y-2">
                    {goalLibrary.map((goal) => {
                      const isActive = goal.title === currentGoal;
                      return (
                        <button
                          key={goal._id}
                          type="button"
                          disabled={goalMutation.isPending || isActive}
                          onClick={() => goalMutation.mutate(goal.title)}
                          className={[
                            "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-[border-color,background-color] disabled:pointer-events-none",
                            isActive
                              ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/8 text-[var(--accent-primary)] opacity-70 cursor-default"
                              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-elevated)]"
                          ].join(" ")}
                        >
                          <span className="font-medium">{goal.title}</span>
                          <span className="flex items-center gap-2">
                            {!goal.isDefault && goal.usageCount > 1 && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {goal.usageCount} using
                              </span>
                            )}
                            {isActive && (
                              <span className="rounded-full bg-[var(--accent-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
                                Current
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom goal input */}
                  {showCustomInput ? (
                    <form onSubmit={handleCustomGoalSubmit} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          ref={customInputRef}
                          value={customGoalValue}
                          onChange={(e) => setCustomGoalValue(e.target.value)}
                          placeholder="e.g. DSA Interview Prep…"
                          maxLength={80}
                          disabled={goalMutation.isPending}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          variant="filled"
                          size="sm"
                          disabled={goalMutation.isPending || customGoalValue.trim().length < 3}
                        >
                          {goalMutation.isPending ? "Saving…" : "Set"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelCustom}
                          disabled={goalMutation.isPending}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {customGoalValue.trim().length}/80 characters
                      </p>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={handleShowCustomInput}
                      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-2.5 text-sm text-[var(--text-muted)] transition-[border-color,color] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]"
                    >
                      <Plus className="h-4 w-4" />
                      Add a custom goal
                    </button>
                  )}

                  {/* Goal mutation error */}
                  {goalMutation.isError && (
                    <p className="text-sm text-[var(--accent-danger)]">
                      {describeApiError(goalMutation.error)}
                    </p>
                  )}
                </>
              )}
            </Card>
          )}
        </div>

        {/* ── Right column — Password ── */}
        <Card className="space-y-5 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Password</h2>
              <p className="text-sm text-[var(--text-muted)]">Use a password that is not shared with other accounts.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </div>
          {passwordError ? <p className="text-sm text-[var(--accent-danger)]">{passwordError}</p> : null}
          {passwordMessage ? <p className="text-sm text-[var(--accent-success)]">{passwordMessage}</p> : null}
          <Button onClick={onPasswordSave} disabled={passwordSaving} className="w-full">
            <ShieldCheck className="h-4 w-4" />
            {passwordSaving ? "Updating..." : "Change password"}
          </Button>
        </Card>

      </div>
    </main>
  );
}
