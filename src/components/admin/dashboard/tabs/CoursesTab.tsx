"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardFilters } from "../hooks/useAdminDashboardFilters";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataState } from "../DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type CourseRow = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  moderationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

type CourseListResponse = {
  courses?: CourseRow[];
  total?: number;
  page?: number;
  limit?: number;
};

const STATUS_OPTIONS = ["All statuses", "pending", "approved", "rejected"] as const;
const EMPTY_COURSES: CourseRow[] = [];

function statusTone(status: CourseRow["moderationStatus"]) {
  if (status === "approved") return "green" as const;
  if (status === "rejected") return "muted" as const;
  return "amber" as const;
}

export function CoursesTab() {
  const { search, setSearch, statusFilter, setStatusFilter } = useAdminDashboardFilters();
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: queryKeys.admin.courses,
    queryFn: async () => {
      const { data } = await api.get<CourseListResponse>("/admin/courses?limit=100");
      return Array.isArray(data?.courses) ? data.courses : [];
    }
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ courseId, nextStatus }: { courseId: string; nextStatus: CourseRow["moderationStatus"] }) =>
      api.patch(`/admin/courses/${courseId}/status`, { status: nextStatus }),
    onMutate: async ({ courseId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.courses });
      const previous = queryClient.getQueryData<CourseRow[]>(queryKeys.admin.courses) ?? [];
      queryClient.setQueryData<CourseRow[]>(
        queryKeys.admin.courses,
        previous.map((course) => (course._id === courseId ? { ...course, moderationStatus: nextStatus } : course))
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKeys.admin.courses, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics });
    }
  });
  const courses = coursesQuery.data ?? EMPTY_COURSES;
  const status = coursesQuery.isLoading ? "loading" : coursesQuery.isError ? "error" : "ready";
  const error = coursesQuery.error || updateStatusMutation.error ? describeApiError(coursesQuery.error ?? updateStatusMutation.error) : null;
  const savingId = updateStatusMutation.variables?.courseId ?? null;

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const query = search.trim().toLowerCase();
        const matchesQuery = !query || [course.code, course.name, course.description ?? ""].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "All statuses" || course.moderationStatus === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [courses, search, statusFilter]
  );

  async function updateStatus(courseId: string, nextStatus: CourseRow["moderationStatus"]) {
    updateStatusMutation.mutate({ courseId, nextStatus });
  }

  function renderCourseActions(course: CourseRow) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" className="h-8 px-3 text-xs" disabled={savingId === course._id || course.moderationStatus === "approved"} onClick={() => updateStatus(course._id, "approved")}>
          Approve
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-3 text-xs" disabled={savingId === course._id || course.moderationStatus === "rejected"} onClick={() => updateStatus(course._id, "rejected")}>
          Reject
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-3 text-xs" disabled={savingId === course._id || course.moderationStatus === "pending"} onClick={() => updateStatus(course._id, "pending")}>
          Pending
        </Button>
      </div>
    );
  }

  return (
    <TabChrome>
      <DataState
        status={status}
        error={error}
        loading="Loading courses..."
        empty={
          <AdminEmptyState
            title="No courses available"
            description="The backend did not return any courses yet. Once course data exists, moderation actions will appear here."
          />
        }
      >
        <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Courses</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Real moderation data from the backend. Approve or reject inline.</p>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[16rem_auto]">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name" className="w-full" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "All statuses" ? "All statuses" : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:hidden">
          {filteredCourses.map((course) => (
            <div key={course._id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-medium text-[var(--text-primary)]">{course.code} - {course.name}</p>
                  <p className="mt-1 break-words text-xs text-[var(--text-muted)]">{course.description || "No description provided."}</p>
                </div>
                <Badge tone={statusTone(course.moderationStatus)}>{course.moderationStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
                <div>
                  <p className="uppercase tracking-[0.08em]">Active</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{course.isActive ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.08em]">Created</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4">{renderCourseActions(course)}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 hidden rounded-lg border border-[var(--border-subtle)] md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Moderation</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-primary)]">{course.code} - {course.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{course.description || "No description provided."}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(course.moderationStatus)}>{course.moderationStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{course.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(course.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {renderCourseActions(course)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Card>
      </DataState>
    </TabChrome>
  );
}
