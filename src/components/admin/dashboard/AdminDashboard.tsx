"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BookOpenCheck, BookOpenText, LayoutDashboard, Monitor, Settings2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdminDashboardTab, useAdminDashboardFilters } from "./hooks/useAdminDashboardFilters";

const tabShell = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)]";

function TabLoadingState({ label }: { label: string }) {
  return <Card className={tabShell}>{label}</Card>;
}

const OverviewTab = dynamic(() => import("./tabs/OverviewTab").then((module) => module.OverviewTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading overview..." />
});

const UsersTab = dynamic(() => import("./tabs/UsersTab").then((module) => module.UsersTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading users..." />
});

const CoursesTab = dynamic(() => import("./tabs/CoursesTab").then((module) => module.CoursesTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading courses..." />
});

const AssessmentsTab = dynamic(() => import("./tabs/AssessmentsTab").then((module) => module.AssessmentsTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading assessments..." />
});

const OperationsTab = dynamic(() => import("./tabs/OperationsTab").then((module) => module.OperationsTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading operations..." />
});

const SettingsTab = dynamic(() => import("./tabs/SettingsTab").then((module) => module.SettingsTab), {
  ssr: false,
  loading: () => <TabLoadingState label="Loading settings..." />
});

const tabs: Array<{ value: AdminDashboardTab; label: string; icon: typeof LayoutDashboard }> = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: UsersRound },
  { value: "courses", label: "Courses", icon: BookOpenText },
  { value: "assessments", label: "Assessments", icon: BookOpenCheck },
  { value: "operations", label: "Operations", icon: Monitor },
  { value: "settings", label: "Settings", icon: Settings2 }
];

export function AdminDashboard() {
  const { activeTab, setActiveTab } = useAdminDashboardFilters();

  return (
    <main className="mx-auto min-h-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
      <div className="space-y-6">
        <Card className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="amber">Admin only</Badge>
                <Badge tone="green">Real data</Badge>
                <Badge tone="blue">URL-synced tabs</Badge>
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
                  Admin dashboard
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
                  One place for user management, course moderation, assessment review, and operational checks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/admin?tab=users" className="inline-flex items-center justify-center rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90">
                Manage users
              </Link>
              <Link href="/dashboard/admin?tab=operations" className="inline-flex items-center justify-center rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]">
                Open operations
              </Link>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminDashboardTab)} className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="shrink-0 gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 data-[state=active]:border-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10 data-[state=active]:text-[var(--accent-primary)]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CoursesTab />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <AssessmentsTab />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <OperationsTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}