"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AdminDashboardTab =
  | "overview"
  | "users"
  | "courses"
  | "assessments"
  | "operations"
  | "settings"
  | "sections"
  | "timetable";

export type AdminDashboardFilters = {
  activeTab: AdminDashboardTab;
  search: string;
  roleFilter: string;
  statusFilter: string;
  courseFilter: string;
  supportFilter: string;
  exportFormat: string;
};

const DEFAULT_FILTERS: AdminDashboardFilters = {
  activeTab: "overview",
  search: "",
  roleFilter: "All roles",
  statusFilter: "All statuses",
  courseFilter: "All categories",
  supportFilter: "All tickets",
  exportFormat: "PDF"
};

const ADMIN_TABS = new Set<AdminDashboardTab>([
  "overview",
  "users",
  "courses",
  "assessments",
  "operations",
  "settings",
  "sections",
  "timetable"
]);

const LEGACY_TAB_ALIASES: Record<string, AdminDashboardTab> = {
  exams: "assessments",
  monitoring: "operations",
  students: "users",
  instructors: "users",
  revenue: "overview",
  support: "operations"
};

type SearchParamsLike = ReturnType<typeof useSearchParams>;

function readTab(value: string | null): AdminDashboardTab {
  if (!value) {
    return DEFAULT_FILTERS.activeTab;
  }

  const normalized = LEGACY_TAB_ALIASES[value] ?? value;
  return ADMIN_TABS.has(normalized as AdminDashboardTab) ? (normalized as AdminDashboardTab) : DEFAULT_FILTERS.activeTab;
}

function readText(value: string | null, fallback: string) {
  return value?.trim() ? value : fallback;
}

function parseFilters(searchParams: SearchParamsLike): AdminDashboardFilters {
  return {
    activeTab: readTab(searchParams.get("tab")),
    search: readText(searchParams.get("q"), DEFAULT_FILTERS.search),
    roleFilter: readText(searchParams.get("role"), DEFAULT_FILTERS.roleFilter),
    statusFilter: readText(searchParams.get("status"), DEFAULT_FILTERS.statusFilter),
    courseFilter: readText(searchParams.get("course"), DEFAULT_FILTERS.courseFilter),
    supportFilter: readText(searchParams.get("support"), DEFAULT_FILTERS.supportFilter),
    exportFormat: readText(searchParams.get("export"), DEFAULT_FILTERS.exportFormat)
  };
}

function serializeFilters(filters: AdminDashboardFilters) {
  const params = new URLSearchParams();

  if (filters.activeTab !== DEFAULT_FILTERS.activeTab) {
    params.set("tab", filters.activeTab);
  }
  if (filters.search.trim()) {
    params.set("q", filters.search.trim());
  }
  if (filters.roleFilter !== DEFAULT_FILTERS.roleFilter) {
    params.set("role", filters.roleFilter);
  }
  if (filters.statusFilter !== DEFAULT_FILTERS.statusFilter) {
    params.set("status", filters.statusFilter);
  }
  if (filters.courseFilter !== DEFAULT_FILTERS.courseFilter) {
    params.set("course", filters.courseFilter);
  }
  if (filters.supportFilter !== DEFAULT_FILTERS.supportFilter) {
    params.set("support", filters.supportFilter);
  }
  if (filters.exportFormat !== DEFAULT_FILTERS.exportFormat) {
    params.set("export", filters.exportFormat);
  }

  return params;
}

export function useAdminDashboardFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  function updateFilters(nextFilters: AdminDashboardFilters, options: { history?: "push" | "replace" } = {}) {
    const nextParams = serializeFilters(nextFilters).toString();
    const currentParams = searchParams.toString();

    if (nextParams === currentParams) {
      return;
    }

    startTransition(() => {
      const href = nextParams ? `${pathname}?${nextParams}` : pathname;
      if (options.history === "push") {
        router.push(href, { scroll: false });
      } else {
        router.replace(href, { scroll: false });
      }
    });
  }

  return {
    ...filters,
    isPending,
    setActiveTab: (activeTab: AdminDashboardTab) => updateFilters({ ...filters, activeTab }, { history: "push" }),
    setSearch: (search: string) => updateFilters({ ...filters, search }),
    setRoleFilter: (roleFilter: string) => updateFilters({ ...filters, roleFilter }),
    setStatusFilter: (statusFilter: string) => updateFilters({ ...filters, statusFilter }),
    setCourseFilter: (courseFilter: string) => updateFilters({ ...filters, courseFilter }),
    setSupportFilter: (supportFilter: string) => updateFilters({ ...filters, supportFilter }),
    setExportFormat: (exportFormat: string) => updateFilters({ ...filters, exportFormat })
  };
}
