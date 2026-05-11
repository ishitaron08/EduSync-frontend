"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdminDashboardTab, useAdminDashboardFilters } from "./hooks/useAdminDashboardFilters";

const tabShell = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)] min-h-[200px]";

function TabLoadingState({ label }: { label: string }) {
  return (
    <Card className={tabShell}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
    </Card>
  );
}

// Memoized tab components - only created once
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

const tabComponents: Record<AdminDashboardTab, React.ComponentType> = {
  overview: OverviewTab,
  users: UsersTab,
  courses: CoursesTab,
  assessments: AssessmentsTab,
  operations: OperationsTab,
  settings: SettingsTab,
};

const tabs: Array<{ value: AdminDashboardTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "courses", label: "Courses" },
  { value: "assessments", label: "Assessments" },
  { value: "operations", label: "Operations" },
  { value: "settings", label: "Settings" }
];

export function AdminDashboard() {
  const { activeTab: urlTab, setActiveTab: setUrlTab } = useAdminDashboardFilters();

  // Handle tab change - update URL in background via startTransition (in hook)
  const handleTabChange = useCallback((value: string) => {
    setUrlTab(value as AdminDashboardTab);
  }, [setUrlTab]);

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

        <Tabs value={urlTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="h-auto w-max min-w-full justify-start gap-1 border-0 bg-transparent p-0">
              {tabs.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="min-w-max px-4 py-2 text-sm data-[state=active]:shadow-sm"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map(({ value }) => {
            const TabComponent = tabComponents[value];
            return (
              <TabsContent key={value} value={value} className="space-y-6 animate-in fade-in-50 duration-200">
                {TabComponent ? <TabComponent /> : null}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </main>
  );
}
