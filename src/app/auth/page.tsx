"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { describeApiError } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PortalRole = "student" | "teacher" | "admin";

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

  const tabSubtitle = useMemo(() => {
    if (portalRole === "admin") return "Administrative access only";
    if (portalRole === "teacher") return "Teacher portal sign-in";
    return "Student portal sign-in";
  }, [portalRole]);

  const handleLogin = async () => {
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
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
      <Card className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
        <div className="mb-5 text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">EduSync Login</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{tabSubtitle}</p>
        </div>

        <Tabs value={portalRole} onValueChange={(value) => setPortalRole(value as PortalRole)}>
          <TabsList variant="grid">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-[var(--accent-danger)]">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading || !email || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
