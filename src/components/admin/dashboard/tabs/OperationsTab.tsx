"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimetableBuilderStub } from "@/components/admin/TimetableBuilderStub";

type AuditLogRow = {
  _id: string;
  action: string;
  resource: string;
  actorRole: "admin" | "teacher" | "student";
  createdAt: string;
};

export function OperationsTab() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadLogs() {
      setStatus("loading");
      setError(null);
      try {
        const { data } = await api.get<{ logs?: AuditLogRow[] }>("/admin/audit-logs?limit=25");
        if (!alive) return;
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setStatus("ready");
      } catch (loadError) {
        if (!alive) return;
        setLogs([]);
        setError(describeApiError(loadError));
        setStatus("error");
      }
    }

    loadLogs();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Operations</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Audit logs, timetable creation, and system health all live here.</p>
      </Card>

      <TimetableBuilderStub />
      <SystemHealth />

      <DataState status={status} error={error} loading="Loading audit logs..." empty="No audit logs were returned yet.">
        <Card className="p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Audit log feed</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{log.action}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{log.resource}</td>
                    <td className="px-4 py-3"><Badge tone={log.actorRole === "admin" ? "green" : log.actorRole === "teacher" ? "blue" : "amber"}>{log.actorRole}</Badge></td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </DataState>
    </div>
  );
}