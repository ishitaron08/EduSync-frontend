"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PencilLine, RefreshCcw, Search, Trash2, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataState } from "../DataState";

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

const ROLE_OPTIONS: Array<"all" | AdminUserRow["role"]> = ["all", "student", "teacher", "admin"];

function roleTone(role: AdminUserRow["role"]) {
  if (role === "admin") return "green" as const;
  if (role === "teacher") return "blue" as const;
  return "amber" as const;
}

export function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminUserRow["role"]>("all");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

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
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
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

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Users</p>
            <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">Create, update, and remove users backed by the live admin API.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="p-4 md:p-5 xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{editingId ? "Edit user" : "Create user"}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{editingId ? "Update the selected account and keep access aligned." : "Add a new account to the admin-managed user base."}</p>
            </div>
            <UserPlus className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>

          <form className="mt-4 space-y-3" onSubmit={submitUser}>
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

            <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="flex flex-wrap gap-2 pt-1">
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
        </Card>

        <Card className="p-4 md:p-5 xl:col-span-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">User directory</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Search and filter the current page of results from the backend.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full min-w-[240px] lg:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or role" className="pl-9" />
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All roles" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <DataState status={tableState} error={error} loading="Loading users..." empty="No users matched the current search or role filter.">
              <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
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
              </div>
            </DataState>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
            <p>
              Showing page {page} of {Math.max(1, Math.ceil(total / limit))} · {total.toLocaleString()} total users
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={page <= 1 || status === "loading"} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button type="button" variant="ghost" disabled={page >= Math.ceil(total / limit) || status === "loading"} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}