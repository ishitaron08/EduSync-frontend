"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { describeApiError } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PortalRole = "student" | "teacher" | "admin";

const roleCopy: Record<PortalRole, { title: string; detail: string }> = {
  student: {
    title: "Student workspace",
    detail: "Timetable, attendance, learning tasks, goals, assessments, and progress."
  },
  teacher: {
    title: "Teacher workspace",
    detail: "Schedules, QR attendance, tests, class progress, and leaderboard review."
  },
  admin: {
    title: "Admin workspace",
    detail: "Users, sections, timetables, analytics, operations, and system settings."
  }
};

export default function AuthPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const currentRole = useAuthStore((s) => s.role);

  const [portalRole, setPortalRole] = useState<PortalRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (token && currentRole) {
      router.replace(`/dashboard/${currentRole}`);
    }
  }, [currentRole, isHydrated, router, token]);

  const currentCopy = useMemo(() => roleCopy[portalRole], [portalRole]);

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, portalRole);
      const nextRole = useAuthStore.getState().role;
      if (!nextRole) {
        setError("Unable to identify account role.");
        return;
      }
      router.replace(`/dashboard/${nextRole}`);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[var(--bg-primary)] px-4 py-8">
      <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.75fr)]">
        <section className="flex min-h-[520px] flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div>
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-[var(--text-inverse)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)]">EduSync access</p>
            <h1 className="mt-2 max-w-xl text-4xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">
              Sign in to the workspace built for your role.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
              Choose the portal first so EduSync can route you to the right dashboard and validate the account role.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border-subtle)] p-4">
              <UserRound className="mb-4 h-5 w-5 text-[var(--accent-primary)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Role-based</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">One sign-in, separate workspaces.</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] p-4">
              <BookOpenCheck className="mb-4 h-5 w-5 text-[var(--accent-secondary)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Task-ready</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Dashboards open into work, not marketing.</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] p-4">
              <ShieldCheck className="mb-4 h-5 w-5 text-[var(--accent-success)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Protected</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Session state stays client-scoped.</p>
            </div>
          </div>
        </section>

        <Card className="p-6 md:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{currentCopy.title}</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{currentCopy.detail}</p>
          </div>

          <Tabs value={portalRole} onValueChange={(value) => setPortalRole(value as PortalRole)}>
            <TabsList variant="grid">
              <TabsTrigger value="student" variant="grid">Student</TabsTrigger>
              <TabsTrigger value="teacher" variant="grid">Teacher</TabsTrigger>
              <TabsTrigger value="admin" variant="grid">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@institution.edu"
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 px-3 py-2 text-sm text-[var(--accent-danger)]">
                {error}
              </div>
            ) : null}

            <Button className="w-full justify-center" disabled={loading || !email || !password} type="submit">
              {loading ? "Signing in..." : `Sign in as ${portalRole}`}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
