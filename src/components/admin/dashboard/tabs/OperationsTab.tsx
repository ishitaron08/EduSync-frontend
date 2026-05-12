"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Clock3, User, Shield } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { DataState } from "../DataState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimetableBuilderStub } from "@/components/admin/TimetableBuilderStub";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type AuditLogRow = {
  _id: string;
  action: string;
  resource: string;
  actorRole: "admin" | "teacher" | "student";
  actor: {
    _id: string;
    name: string;
    email: string;
  } | null;
  metadata: {
    targetUserId?: string;
    targetUserName?: string;
    targetUserEmail?: string;
    targetUserRole?: string;
    actorName?: string;
    studentId?: string;
    studentName?: string;
    year?: string | number;
    changes?: string[];
    count?: number;
    createdUserNames?: string[];
    courseId?: string;
    status?: string;
    [key: string]: unknown;
  };
  createdAt: string;
};

function formatAction(action: string): { label: string; tone: "green" | "blue" | "amber" | "destructive" | "muted" } {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("create") || actionLower.includes("add")) {
    return { label: action, tone: "green" };
  }
  if (actionLower.includes("update") || actionLower.includes("modify")) {
    return { label: action, tone: "blue" };
  }
  if (actionLower.includes("delete") || actionLower.includes("remove")) {
    return { label: action, tone: "destructive" };
  }
  if (actionLower.includes("login") || actionLower.includes("auth")) {
    return { label: action, tone: "amber" };
  }
  return { label: action, tone: "muted" };
}

function ActionDetails({ log }: { log: AuditLogRow }) {
  const [expanded, setExpanded] = useState(false);
  const { metadata, resource, actor } = log;
  
  // Check if this is a user-related action
  const isUserAction = resource === "User" && (metadata.targetUserName || metadata.targetUserEmail);
  
  // Get actor name from populated actor field or metadata fallback
  const actorName = actor?.name || metadata.actorName || "System";
  const actorEmail = actor?.email || "";
  
  return (
    <div className="space-y-2">
      {/* Show who performed the action */}
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
        <span className="text-[var(--text-muted)]">By:</span>
        <span className="font-medium text-[var(--text-primary)]">{actorName}</span>
        {actorEmail && <span className="text-xs text-[var(--text-muted)]">({actorEmail})</span>}
      </div>
      
      {/* Show target user details for user actions */}
      {isUserAction && (
        <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <User className="h-4 w-4 text-[var(--accent-secondary)]" />
            Target User
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {metadata.targetUserName && (
              <div className="flex gap-2">
                <span className="text-[var(--text-muted)]">Name:</span>
                <span className="text-[var(--text-primary)]">{metadata.targetUserName}</span>
              </div>
            )}
            {metadata.targetUserEmail && (
              <div className="flex gap-2">
                <span className="text-[var(--text-muted)]">Email:</span>
                <span className="text-[var(--text-primary)]">{metadata.targetUserEmail}</span>
              </div>
            )}
            {metadata.targetUserRole && (
              <div className="flex gap-2">
                <span className="text-[var(--text-muted)]">Role:</span>
                <Badge tone={metadata.targetUserRole === "admin" ? "green" : metadata.targetUserRole === "teacher" ? "blue" : "amber"}>
                  {metadata.targetUserRole}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Show bulk upload count */}
      {metadata.count !== undefined && (
        <div className="text-sm">
          <span className="text-[var(--text-muted)]">Users created:</span>
          <span className="ml-2 font-medium text-[var(--text-primary)]">{metadata.count}</span>
        </div>
      )}
      
      {/* Show changes if available */}
      {metadata.changes && metadata.changes.length > 0 && (
        <div className="text-sm">
          <span className="text-[var(--text-muted)]">Fields updated:</span>
          <span className="ml-2 text-[var(--text-primary)]">{metadata.changes.join(", ")}</span>
        </div>
      )}
      
      {/* Show other metadata */}
      {(metadata.courseId || metadata.status) && !isUserAction && (
        <div className="text-sm space-y-1">
          {metadata.courseId && (
            <div className="flex gap-2">
              <span className="text-[var(--text-muted)]">Course ID:</span>
              <span className="text-[var(--text-primary)]">{metadata.courseId}</span>
            </div>
          )}
          {metadata.status && (
            <div className="flex gap-2">
              <span className="text-[var(--text-muted)]">Status:</span>
              <Badge tone="blue">{metadata.status}</Badge>
            </div>
          )}
        </div>
      )}
      
      {/* Show student timetable info */}
      {metadata.studentName && (
        <div className="text-sm space-y-1">
          <div className="flex gap-2">
            <span className="text-[var(--text-muted)]">Student:</span>
            <span className="text-[var(--text-primary)]">{metadata.studentName}</span>
          </div>
          {metadata.year && (
            <div className="flex gap-2">
              <span className="text-[var(--text-muted)]">Year:</span>
              <span className="text-[var(--text-primary)]">{metadata.year}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Expandable for additional metadata */}
      {Object.keys(metadata).filter(key => 
        !['targetUserId', 'targetUserName', 'targetUserEmail', 'targetUserRole', 'actorId', 'actorName', 'userId', 'student', 'studentId', 'studentName', 'year', 'changes', 'count', 'courseId', 'status', 'createdUserNames'].includes(key)
      ).length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
          >
            {expanded ? "Hide" : "Show"} additional details
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1 rounded-md bg-[var(--bg-elevated)] p-2 text-xs">
              {Object.entries(metadata)
                .filter(([key]) => !['targetUserId', 'targetUserName', 'targetUserEmail', 'targetUserRole', 'actorId', 'actorName', 'userId', 'student', 'studentId', 'studentName', 'year', 'changes', 'count', 'courseId', 'status', 'createdUserNames'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium text-[var(--text-muted)]">{key}:</span>
                    <span className="text-[var(--text-primary)]">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        const { data } = await api.get<{ logs?: AuditLogRow[] }>("/admin/audit-logs?limit=50");
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
    <TabChrome
      eyebrow="Operations"
      title="Operational console"
      description="Audit logs, timetable creation, and system health all live here."
    >
      <div className="space-y-6">
        <TimetableBuilderStub />
        <SystemHealth />

        <DataState
          status={status}
          error={error}
          loading="Loading audit logs..."
          empty={<AdminEmptyState title="No audit logs available" description="The backend did not return audit logs yet. Operational history will appear here once activity exists." />}
        >
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Audit log feed</p>
              <p className="text-sm text-[var(--text-muted)]">{logs.length} records</p>
            </div>
            <div className="mt-4 space-y-3">
              {logs.map((log) => {
                const actionFormatted = formatAction(log.action);
                return (
                  <div key={log._id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent-primary)]/30 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left side: Time and Action */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                          <Clock3 className="h-4 w-4" />
                          <span className="whitespace-nowrap text-sm">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <Badge tone={actionFormatted.tone}>{actionFormatted.label}</Badge>
                        <Badge tone={log.actorRole === "admin" ? "green" : log.actorRole === "teacher" ? "blue" : "amber"}>
                          {log.actorRole}
                        </Badge>
                      </div>
                      
                      {/* Right side: Resource */}
                      <div className="text-sm">
                        <span className="text-[var(--text-muted)]">Resource:</span>
                        <span className="ml-2 font-medium text-[var(--text-primary)]">{log.resource}</span>
                      </div>
                    </div>
                    
                    {/* Action Details */}
                    <div className="mt-4">
                      <ActionDetails log={log} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </DataState>
      </div>
    </TabChrome>
  );
}