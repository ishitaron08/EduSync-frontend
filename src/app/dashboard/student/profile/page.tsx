"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, User, Key, Target, Activity, Loader2 } from "lucide-react";

export default function StudentProfilePage() {
  const allowed = useDashboardGuard("student");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    fetchProfile();
  }, [allowed]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/student/profile");
      setProfile(data);
      setName(data.name || "");
      setGoal(data.learningGoal || "");
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!allowed || loading) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      const payload: any = { name, learningGoal: goal };
      if (password) {
        payload.password = password;
      }

      await api.patch("/student/profile", payload);
      setSuccess("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      await fetchProfile();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const isGoalChanged = goal !== profile?.learningGoal;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-8">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Profile & Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your account and customize your learning experience.</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
                  <User className="w-5 h-5 text-[var(--accent-primary)]" /> Personal Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase text-[var(--text-muted)] tracking-wider">Full Name</label>
                    <Input className="mt-1" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-[var(--text-muted)] tracking-wider">Email (Read Only)</label>
                    <Input className="mt-1 bg-[var(--bg-elevated)]" value={profile?.email} readOnly disabled />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
                  <Target className="w-5 h-5 text-[var(--accent-amber)]" /> Learning Goal
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase text-[var(--text-muted)] tracking-wider">Current Goal</label>
                    <Select value={goal} onValueChange={setGoal}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Academic Improvement">Academic Improvement</SelectItem>
                        <SelectItem value="Placement Preparation">Placement Preparation</SelectItem>
                        <SelectItem value="Skill Development">Skill Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isGoalChanged && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p><strong>Warning:</strong> Changing your learning goal will reset your currently active AI Task recommendations. Your earned points will remain unaffected.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
                  <Key className="w-5 h-5 text-[var(--accent-secondary)]" /> Security
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase text-[var(--text-muted)] tracking-wider">New Password</label>
                    <Input type="password" placeholder="Leave blank to keep current" className="mt-1" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  {password && (
                    <div>
                      <label className="text-xs uppercase text-[var(--text-muted)] tracking-wider">Confirm Password</label>
                      <Input type="password" placeholder="Confirm new password" className="mt-1" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={saving} variant="filled" className="px-8">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
              <Activity className="w-5 h-5 text-[var(--text-muted)]" /> Statistics
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Points</p>
                <p className="text-3xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--accent-primary)]">{profile?.rewardPoints || 0}</p>
              </div>
              
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Current Streak</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-500">{profile?.streak || 0}</span>
                  <span className="text-xl">🔥</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Points Breakdown</p>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">AI Tasks</span>
                    <span className="font-medium">{profile?.pointsBreakdown?.aiTasks || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Assessments</span>
                    <span className="font-medium">{profile?.pointsBreakdown?.tests || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Streak Bonuses</span>
                    <span className="font-medium">{profile?.pointsBreakdown?.streakBonuses || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  Account created: {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
