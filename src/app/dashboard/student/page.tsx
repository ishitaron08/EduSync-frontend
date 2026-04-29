"use client";

import Link from "next/link";
import { useState } from "react";
import {
  hasCompletedStudentOnboarding,
  StudentOnboardingWizard
} from "@/components/onboarding/StudentOnboardingWizard";
import { IntelligenceBrief } from "@/components/student/IntelligenceBrief";
import { NavigatorPanel } from "@/components/student/NavigatorPanel";
import { WeeklyTimetableGrid } from "@/components/student/WeeklyTimetableGrid";
import { useDashboardGuard } from "@/lib/authGuard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const allowed = useDashboardGuard("student");
  const [, refreshOnboarding] = useState(0);
  const onboardingComplete = typeof window === "undefined" ? true : hasCompletedStudentOnboarding();
  const showOnboarding = allowed && !onboardingComplete;

  if (!allowed) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="nc-skeleton h-12 w-48 rounded-[8px]" />
      </main>
    );
  }

  return (
    <>
      {showOnboarding && (
        <StudentOnboardingWizard
          onDone={() => {
            refreshOnboarding((n) => n + 1);
          }}
        />
      )}
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--text-primary)]">
              Mission control
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Today&apos;s intelligence brief and weekly chart.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/goals" className={cn(buttonVariants({ variant: "ghost" }))}>
              Goals
            </Link>
            <Link href="/rewards" className={cn(buttonVariants({ variant: "ghost" }))}>
              Rewards
            </Link>
          </div>
        </header>

        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Today&apos;s intelligence brief</p>
          <IntelligenceBrief />
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          <section className="space-y-4 lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Weekly chart</p>
            <WeeklyTimetableGrid />
          </section>
          <aside className="lg:col-span-4">
            <NavigatorPanel />
          </aside>
        </div>
      </main>
    </>
  );
}
