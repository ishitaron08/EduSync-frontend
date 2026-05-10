"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";

export function SettingsTab() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Card className="p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Settings</p>
          <div className="mt-4 space-y-4 text-sm text-[var(--text-muted)]">
            <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
              <p className="font-medium text-[var(--text-primary)]">Current admin profile</p>
              <div className="mt-3 space-y-1">
                <p>{user?.name ?? "Profile not loaded yet"}</p>
                <p>{user?.email ?? "Email unavailable"}</p>
                <Badge tone="amber" className="mt-2 inline-flex">
                  {role ?? "admin"}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
              <p className="font-medium text-[var(--text-primary)]">Permissions</p>
              <p className="mt-1">Admin access covers user management, moderation, audit review, and operations.</p>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
              <p className="font-medium text-[var(--text-primary)]">Preferences</p>
              <p className="mt-1">Notification and theme toggles stay at the application level until they are persisted end-to-end.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <Card className="p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Role visibility</p>
          <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            <p>Admin: full access to admin tools</p>
            <p>Teacher: content and assessment workflows</p>
            <p>Student: learning and self-service only</p>
          </div>
        </Card>
      </div>
    </div>
  );
}