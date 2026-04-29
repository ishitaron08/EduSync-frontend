"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { TimetableBuilderStub } from "@/components/admin/TimetableBuilderStub";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";

type UserRow = { _id: string; name: string; email: string; role: string };
type AuditRow = { _id: string; action: string; resource: string; createdAt: string; actorRole: string };

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function AdminSetupPage() {
  const role = useAuthStore((s) => s.role);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "teacher" | "student">("student");
  const [year, setYear] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [slotDay, setSlotDay] = useState<string>("monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [className, setClassName] = useState("CS101");
  const [room, setRoom] = useState("A1");
  const [subject, setSubject] = useState("Algorithms");
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoadError(null);
    setLoadingUsers(true);
    try {
      const { data } = await api.get<{ users?: UserRow[] }>("/admin/users");
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      setUsers([]);
      setLoadError(describeApiError(err));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditError(null);
    try {
      const { data } = await api.get<{ logs?: AuditRow[] }>("/admin/audit-logs?limit=20");
      setAuditLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err) {
      setAuditLogs([]);
      setAuditError(describeApiError(err));
    }
  }, []);

  const createUser = async () => {
    setSubmitError(null);
    try {
      await api.post("/admin/users", {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole
      });
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("student");
      await loadUsers();
      await loadAuditLogs();
    } catch (err) {
      setSubmitError(describeApiError(err));
    }
  };

  const removeUser = async (id: string) => {
    setSubmitError(null);
    try {
      await api.delete(`/admin/users/${id}`);
      await loadUsers();
      await loadAuditLogs();
    } catch (err) {
      setSubmitError(describeApiError(err));
    }
  };

  const submitTimetable = async () => {
    setSubmitError(null);
    setSubmitResult(null);
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/timetable", {
        year,
        student: studentId.trim(),
        slots: [
          {
            day: slotDay,
            startTime,
            endTime,
            className,
            room,
            subject,
            teacher: teacherId.trim()
          }
        ]
      });
      setSubmitResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setSubmitError(describeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Admin setup</h1>
        <Card className="p-4">
          <p className="text-[var(--text-primary)]">
            Sign in as an <strong>admin</strong> to list users and create a sample timetable for a student.
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Register with role admin on the{" "}
            <Link href="/auth" className="font-medium text-[var(--accent-secondary)] underline">
              Auth
            </Link>{" "}
            page, then return here.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Admin setup</h1>
      <p className="text-sm text-[var(--text-muted)]">
        Load users to copy MongoDB <code className="rounded bg-[var(--bg-elevated)] px-1 font-mono text-xs">_id</code>{" "}
        values. Create one timetable linked to a student; each slot must reference a teacher&apos;s{" "}
        <code className="rounded bg-[var(--bg-elevated)] px-1 font-mono text-xs">_id</code>.
      </p>

      <TimetableBuilderStub />

      <SystemHealth />

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={loadUsers} disabled={loadingUsers}>
            {loadingUsers ? "Loading..." : "Load users"}
          </Button>
          <Button type="button" variant="ghost" onClick={loadAuditLogs}>
            Load audit logs
          </Button>
        </div>
        {loadError && (
          <p className="rounded-[8px] border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 px-3 py-2 text-sm text-[var(--accent-danger)]">
            {loadError}
          </p>
        )}
        {users.length > 0 && (
          <div className="overflow-x-auto rounded-[8px] border border-[var(--border-subtle)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <tr>
                  <th className="p-2 font-medium">_id</th>
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Email</th>
                  <th className="p-2 font-medium">Role</th>
                  <th className="p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100">
                    <td className="p-2 font-mono text-xs break-all">{u._id}</td>
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      <Button type="button" variant="ghost" onClick={() => removeUser(u._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {auditError && <p className="text-sm text-[var(--accent-danger)]">{auditError}</p>}
        {auditLogs.length > 0 && (
          <div className="overflow-x-auto rounded-[8px] border border-[var(--border-subtle)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <tr>
                  <th className="p-2 font-medium">Action</th>
                  <th className="p-2 font-medium">Resource</th>
                  <th className="p-2 font-medium">Actor role</th>
                  <th className="p-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100">
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">{log.resource}</td>
                    <td className="p-2">{log.actorRole}</td>
                    <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create user</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="newUserName">Name</Label>
            <Input id="newUserName" placeholder="Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUserEmail">Email</Label>
            <Input id="newUserEmail" placeholder="Email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUserPassword">Password</Label>
            <Input
              id="newUserPassword"
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUserRole">Role</Label>
            <select
              id="newUserRole"
              className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as "admin" | "teacher" | "student")}
            >
              <option value="student">student</option>
              <option value="teacher">teacher</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
        <Button type="button" onClick={createUser} disabled={!newUserName || !newUserEmail || !newUserPassword}>
          Create user
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create sample timetable</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">Year</span>
            <Input
              type="number"
              className="mt-1"
              value={year}
              min={1}
              onChange={(e) => setYear(Number(e.target.value) || 1)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-[var(--text-primary)]">Student _id</span>
            <Input
              className="mt-1 font-mono text-xs"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Paste student ObjectId"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-[var(--text-primary)]">Teacher _id (for slot)</span>
            <Input
              className="mt-1 font-mono text-xs"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              placeholder="Paste teacher ObjectId"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">Day</span>
            <select className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3" value={slotDay} onChange={(e) => setSlotDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">Start</span>
            <Input className="mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">End</span>
            <Input className="mt-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">Class name</span>
            <Input className="mt-1" value={className} onChange={(e) => setClassName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="font-medium text-[var(--text-primary)]">Room</span>
            <Input className="mt-1" value={room} onChange={(e) => setRoom(e.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-3">
            <span className="font-medium text-[var(--text-primary)]">Subject</span>
            <Input className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        </div>
        <Button type="button" onClick={submitTimetable} disabled={submitting || !studentId.trim() || !teacherId.trim()}>
          {submitting ? "Submitting..." : "POST /api/admin/timetable"}
        </Button>
        {submitError && (
          <p className="rounded-md border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 px-3 py-2 text-sm text-[var(--accent-danger)]">{submitError}</p>
        )}
        {submitResult && (
          <pre className="max-h-64 overflow-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs">{submitResult}</pre>
        )}
      </section>
    </main>
  );
}
