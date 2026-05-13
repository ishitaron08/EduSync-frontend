"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type AssessmentRow = {
  _id: string;
  title: string;
  type: "mcq" | "written";
  status: "draft" | "published" | "closed";
  startTime: string;
  endTime: string;
  attemptsCount?: number;
  questions?: Array<unknown>;
};

export function AssessmentsTab() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadAssessments() {
      setStatus("loading");
      setError(null);
      try {
        const { data } = await api.get<AssessmentRow[]>("/admin/assessments");
        if (!alive) return;
        setAssessments(Array.isArray(data) ? data : []);
        setStatus("ready");
      } catch (loadError) {
        if (!alive) return;
        setAssessments([]);
        setError(describeApiError(loadError));
        setStatus("error");
      }
    }

    loadAssessments();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TabChrome
      eyebrow="Assessments"
      title="Assessment review"
      description="Browse live assessment records and track attempt counts from the backend."
    >
      <DataState
        status={status}
        error={error}
        loading="Loading assessments..."
        empty={
          <AdminEmptyState
            title="No assessments available"
            description="The backend has not returned assessment records yet. When data exists, assessment rows and attempt totals will show here."
          />
        }
      >
        <Card className="p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Assessments</p>
        <div className="mt-4 grid gap-3 md:hidden">
          {assessments.map((assessment) => (
            <div key={assessment._id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-medium text-[var(--text-primary)]">{assessment.title}</p>
                  <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">{assessment.type}</p>
                </div>
                <Badge tone={assessment.status === "published" ? "green" : assessment.status === "closed" ? "blue" : "amber"}>{assessment.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
                <div>
                  <p className="uppercase tracking-[0.08em]">Attempts</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{Number(assessment.attemptsCount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.08em]">Schedule</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{new Date(assessment.startTime).toLocaleDateString()} - {new Date(assessment.endTime).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 hidden rounded-2xl border border-[var(--border-subtle)] md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{assessment.title}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{assessment.type}</td>
                  <td className="px-4 py-3"><Badge tone={assessment.status === "published" ? "green" : assessment.status === "closed" ? "blue" : "amber"}>{assessment.status}</Badge></td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{Number(assessment.attemptsCount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(assessment.startTime).toLocaleDateString()} - {new Date(assessment.endTime).toLocaleDateString()}</td>
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
