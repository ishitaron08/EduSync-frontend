"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataState } from "../DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const STATUS_OPTIONS: Array<"all" | CourseRow["moderationStatus"]> = ["all", "pending", "approved", "rejected"];

function statusTone(status: CourseRow["moderationStatus"]) {
  if (status === "approved") return "green" as const;
  if (status === "rejected") return "muted" as const;
  return "amber" as const;
}

export function CoursesTab() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CourseRow["moderationStatus"]>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadCourses() {
      setStatus("loading");
      setError(null);
      try {
        const { data } = await api.get<CourseListResponse>("/admin/courses?limit=100");
        if (!alive) return;
        setCourses(Array.isArray(data?.courses) ? data.courses : []);
        setStatus("ready");
      } catch (loadError) {
        if (!alive) return;
        setCourses([]);
        setError(describeApiError(loadError));
        setStatus("error");
      }
    }

    loadCourses();
    return () => {
      alive = false;
    };
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const query = search.trim().toLowerCase();
        const matchesQuery = !query || [course.code, course.name, course.description ?? ""].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || course.moderationStatus === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [courses, search, statusFilter]
  );

  async function updateStatus(courseId: string, nextStatus: CourseRow["moderationStatus"]) {
    const previous = courses;
    setSavingId(courseId);
    setCourses((current) => current.map((course) => (course._id === courseId ? { ...course, moderationStatus: nextStatus } : course)));

    try {
      await api.patch(`/admin/courses/${courseId}/status`, { status: nextStatus });
    } catch (updateError) {
      setCourses(previous);
      setError(describeApiError(updateError));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <DataState status={status} error={error} loading="Loading courses..." empty="No courses were returned by the backend yet.">
      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Courses</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Real moderation data from the backend. Approve or reject inline.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name" className="w-64" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DataState>
  );
}