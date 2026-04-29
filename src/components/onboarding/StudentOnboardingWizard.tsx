"use client";

import { useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const STUDENT_ONBOARDING_KEY = "edusync_student_onboarding_done";

type GoalChoice = "exam" | "placement" | "skill_development";

const MISSIONS: { goalType: GoalChoice; title: string; subtitle: string; border: string }[] = [
  {
    goalType: "exam",
    title: "Academic Excellence",
    subtitle: "Exams and coursework depth",
    border: "border-t-[var(--accent-secondary)]"
  },
  {
    goalType: "placement",
    title: "Placement Ready",
    subtitle: "Interview and internship prep",
    border: "border-t-[var(--accent-primary)]"
  },
  {
    goalType: "skill_development",
    title: "Skill Builder",
    subtitle: "Hands-on practice tracks",
    border: "border-t-[var(--accent-success)]"
  },
  {
    goalType: "skill_development",
    title: "Research Track",
    subtitle: "Labs and deep focus blocks",
    border: "border-t-[var(--accent-secondary)]"
  }
];

export function StudentOnboardingWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [missionIdx, setMissionIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [pulse, setPulse] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const goal = MISSIONS[missionIdx].goalType;

  const runPulse = () => {
    setPulse(0);
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => setPulse(i), i * 400);
    }
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/student/goals", {
        goalType: goal,
        targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
        difficultyPreference: difficulty
      });
      localStorage.setItem(STUDENT_ONBOARDING_KEY, "1");
      onDone();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-[var(--border-subtle)] p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">What&apos;s your mission?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {MISSIONS.map((c, idx) => (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => setMissionIdx(idx)}
                  className={`rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left ${c.border} border-t-4 ${
                    missionIdx === idx ? "ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]" : ""
                  }`}
                >
                  <p className="font-medium text-[var(--text-primary)]">{c.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{c.subtitle}</p>
                </button>
              ))}
            </div>
            <Button type="button" variant="filled" className="w-full" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Difficulty preference</h2>
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDifficulty(v === 0 ? "easy" : v === 1 ? "medium" : "hard");
                }}
                className="h-3 w-full appearance-none rounded-full bg-[var(--bg-elevated)] accent-[var(--accent-primary)]"
              />
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <span>Steady</span>
                <span>Balanced</span>
                <span>Intense</span>
              </div>
            </div>
            <Button
              type="button"
              variant="filled"
              className="w-full"
              onClick={() => {
                setStep(3);
                runPulse();
              }}
            >
              Generate roadmap
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Your roadmap is forming</h2>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-3 w-3 rounded-full transition-all duration-500 ${
                    pulse >= n ? "scale-110 bg-[var(--accent-secondary)] shadow-[var(--glow-blue)]" : "bg-[var(--bg-elevated)]"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)]">The navigator is aligning tasks to your goals.</p>
            {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
            <Button type="button" variant="filled" className="w-full" disabled={saving || pulse < 5} onClick={finish}>
              {saving ? "Saving..." : "Enter mission control"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function hasCompletedStudentOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STUDENT_ONBOARDING_KEY) === "1";
}
