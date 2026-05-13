"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PencilLine, RefreshCcw, Search, Trash2, UserPlus } from "lucide-react";
import { useAdminDashboardFilters } from "../hooks/useAdminDashboardFilters";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { DataState } from "../DataState";
import { AdminEmptyState, TabChrome } from "../TabChrome";

type AdminUserRow = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  rewardPoints?: number;
  createdAt: string;
  updatedAt: string;
};

type UserListResponse = {
  users?: AdminUserRow[];
  total?: number;
  page?: number;
  limit?: number;
};

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: AdminUserRow["role"];
  rewardPoints: string;
};

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "student",
  rewardPoints: "0"
};

const ROLE_OPTIONS = ["All roles", "student", "teacher", "admin"] as const;

function roleTone(role: AdminUserRow["role"]) {
  if (role === "admin") return "green" as const;
  if (role === "teacher") return "blue" as const;
  return "amber" as const;
}

export function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const { search, setSearch, roleFilter, setRoleFilter } = useAdminDashboardFilters();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadUsers() {
      setStatus("loading");
      setError(null);
      try {
        const { data } = await api.get<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
        if (!alive) return;
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setTotal(Number(data?.total ?? 0));
        setStatus("ready");
      } catch (loadError) {
        if (!alive) return;
        setUsers([]);
        setTotal(0);
        setError(describeApiError(loadError));
        setStatus("error");
      }
    }

    loadUsers();
    return () => {
      alive = false;
    };
  }, [limit, page]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !query || [user.name, user.email, user.role].some((value) => value.toLowerCase().includes(query));
      const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [roleFilter, search, users]);

  const tableState = status === "loading" ? "loading" : status === "error" ? "error" : filteredUsers.length === 0 ? "empty" : "ready";

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startEdit(user: AdminUserRow) {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      rewardPoints: String(user.rewardPoints ?? 0)
    });
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, {
          name: form.name.trim(),
          role: form.role,
          rewardPoints: Number(form.rewardPoints || 0)
        });
      } else {
        await api.post("/admin/users", {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role
        });
      }

      resetForm();
      const { data } = await api.get<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setTotal(Number(data?.total ?? 0));
      setStatus("ready");
    } catch (submitError) {
      setError(describeApiError(submitError));
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(userId: string) {
    const confirmed = window.confirm("Delete this user from the admin panel?");
    if (!confirmed) return;

    setDeletingId(userId);
    setError(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      const { data } = await api.get<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setTotal(Number(data?.total ?? 0));
      setStatus("ready");
      if (editingId === userId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(describeApiError(deleteError));
      setStatus("error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bulkFile) return;
    setBulkUploading(true);
    setError(null);

    try {
      const text = await bulkFile.text();
      const rows = text.split("\n").map((r) => r.trim()).filter(Boolean);
      const usersToCreate = rows.slice(1).map((row) => {
        const [name, email, role] = row.split(",");
        return { name, email, role: role || "student", password: Math.random().toString(36).slice(-8) };
      });

      await api.post("/admin/users/bulk", { users: usersToCreate });
      setBulkFile(null);
      const { data } = await api.get<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setTotal(Number(data?.total ?? 0));
      setStatus("ready");
      alert(`Successfully uploaded ${usersToCreate.length} users.`);
    } catch (err) {
      setError(describeApiError(err));
      setStatus("error");
    } finally {
      setBulkUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <TabChrome
        eyebrow="Users"
        title="User management"
        description="Create, update, and remove users backed by the live admin API."
        actions={
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() =>
              void api
                .get<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`)
                .then(({ data }) => {
                  setUsers(Array.isArray(data?.users) ? data.users : []);
                  setTotal(Number(data?.total ?? 0));
                  setStatus("ready");
                })
                .catch((refreshError) => {
                  setError(describeApiError(refreshError));
                  setStatus("error");
                })
            }
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        }
      >
        {/* items-start prevents CSS Grid from stretching the left card to match the right card's height */}
        <div className="grid items-start gap-6 xl:grid-cols-12">
        {/* sticky: pins the form once the user scrolls past the TabChrome header.
            top-6 matches the page's py-6 padding so it sits flush at the scroll viewport edge. */}
        <Card className="p-2.5 md:p-3.5 xl:col-span-4 xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{editingId ? "Edit user" : "Create user"}</p>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{editingId ? "Update the selected account and keep access aligned." : "Add a new account to the admin-managed user base."}</p>
            </div>
            <UserPlus className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>

          <form className="mt-2 space-y-2" onSubmit={submitUser}>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" required />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</label>
              <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@edusync.edu" type="email" required disabled={Boolean(editingId)} />
            </div>

            {!editingId ? (
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Password</label>
                <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Temporary password" type="password" required />
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Role</label>
                <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminUserRow["role"] }))} className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editingId ? (
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Reward points</label>
                  <Input value={form.rewardPoints} onChange={(event) => setForm((current) => ({ ...current, rewardPoints: event.target.value }))} type="number" min="0" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 pt-0">
              <Button type="submit" variant="filled" className="gap-2" disabled={saving}>
                {editingId ? <PencilLine className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {editingId ? "Save changes" : "Create user"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Bulk Upload</p>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">Upload a CSV file (Name, Email, Role) to create multiple accounts at once.</p>
              </div>
            </div>
            <form className="mt-3 space-y-2" onSubmit={handleBulkUpload}>
              <Input type="file" accept=".csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
              <Button type="submit" variant="filled" className="w-full gap-2" disabled={bulkUploading || !bulkFile}>
                Upload CSV
              </Button>
            </form>
          </div>
        </Card>

        {/* User Directory card fills remaining height; its table area scrolls independently */}
        <Card className="flex min-h-0 flex-col p-4 md:p-5 xl:col-span-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">User directory</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Search and filter the current page of results from the backend.</p>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,280px)_auto]">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or role" className="pl-9" />
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)} className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "All roles" ? "All roles" : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable table area — max-height keeps the card from growing unbounded.
              The value uses dvh so it works correctly with the fixed-height layout we set up. */}
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 280px)" }}>
            <DataState
              status={tableState}
              error={error}
              loading="Loading users..."
              empty={
                <AdminEmptyState
                  title="No users found"
                  description="No users matched the current search or role filter. Clear the filters or add a new account to continue."
                />
              }
            >
              <ResponsiveTable
                items={filteredUsers}
                getKey={(user) => user._id}
                table={
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Reward points</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{Number(user.rewardPoints ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={() => startEdit(user)}>
                                <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button type="button" variant="ghost" className="h-8 px-3 text-xs text-[var(--accent-danger)] hover:text-[var(--accent-danger)]" disabled={deletingId === user._id} onClick={() => void removeUser(user._id)}>
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
                renderCard={(user) => (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                      <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase text-[var(--text-muted)]">Points</p>
                        <p className="font-medium text-[var(--text-primary)]">{Number(user.rewardPoints ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-[var(--text-muted)]">Created</p>
                        <p className="font-medium text-[var(--text-primary)]">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button type="button" variant="ghost" className="h-10 text-xs" onClick={() => startEdit(user)}>
                        <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button type="button" variant="ghost" className="h-10 text-xs text-[var(--accent-danger)] hover:text-[var(--accent-danger)]" disabled={deletingId === user._id} onClick={() => void removeUser(user._id)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              />
            </DataState>
          </div>

          {/* Pagination footer stays pinned below the scrollable table area */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(total / limit));
            const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
            const rangeEnd = Math.min(page * limit, total);

            // Build a compact page-number window: always show first, last,
            // current ±1, and ellipsis where there are gaps.
            const pageNumbers: (number | "…")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
            } else {
              const near = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
              let prev = 0;
              for (const n of [...near].sort((a, b) => a - b)) {
                if (n - prev > 1) pageNumbers.push("…");
                pageNumbers.push(n);
                prev = n;
              }
            }

            return (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3 text-sm text-[var(--text-muted)]">
                {/* Record range */}
                <p className="shrink-0">
                  {total === 0
                    ? "No users found"
                    : <>Showing <span className="font-medium text-[var(--text-primary)]">{rangeStart}–{rangeEnd}</span> of <span className="font-medium text-[var(--text-primary)]">{total.toLocaleString()}</span> users</>}
                </p>

                {/* Page controls */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2.5 text-xs"
                    disabled={page <= 1 || status === "loading"}
                    onClick={() => setPage((c) => Math.max(1, c - 1))}
                  >
                    ← Prev
                  </Button>

                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)]">…</span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        disabled={status === "loading"}
                        onClick={() => setPage(n)}
                        className={
                          n === page
                            ? "flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-[var(--accent-primary)] px-2.5 text-xs font-semibold text-white"
                            : "flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        }
                      >
                        {n}
                      </button>
                    )
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2.5 text-xs"
                    disabled={page >= totalPages || status === "loading"}
                    onClick={() => setPage((c) => c + 1)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            );
          })()}
        </Card>
      </div>
      </TabChrome>
    </div>
  );
}
