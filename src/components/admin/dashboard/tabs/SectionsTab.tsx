"use client";

import { useEffect, useState, FormEvent } from "react";
import { TabChrome } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Plus, Trash2, Edit2 } from "lucide-react";


type Course = { _id: string; title: string; courseCode: string; id?: string };
type Section = {
  _id: string;
  sectionCode: string;
  term: string;
  year: number;
  capacity: number;
  course: Course;
};

export function SectionsTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm = { sectionCode: "", term: "fall", year: new Date().getFullYear(), capacity: 60, course: "" };
  const [form, setForm] = useState(defaultForm);

  async function loadData() {
    try {
      setStatus("loading");
      const [secRes, cRes] = await Promise.all([
        api.get("/admin/sections"),
        api.get("/admin/courses?limit=100")
      ]);
      setSections(secRes.data);
      setCourses(cRes.data.courses || cRes.data.data || []);
      setStatus("ready");
    } catch (err) {
      setError(describeApiError(err));
      setStatus("error");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/sections/${editingId}`, form);
      } else {
        await api.post("/admin/sections", form);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      loadData();
    } catch (err) {
      alert("Failed to save section: " + describeApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await api.delete(`/admin/sections/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete: " + describeApiError(err));
    }
  }

  return (
    <TabChrome
      eyebrow="Section Management"
      title="Sections"
      description="Create and manage class sections, and assign courses."
      actions={
        <Button onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setForm(defaultForm); }} variant="filled" className="gap-2">
          <Plus className="h-4 w-4" /> New Section
        </Button>
      }
    >
      <DataState status={status} error={error} loading="Loading sections...">
        <div className="space-y-6">
          {isFormOpen && (
            <Card className="p-4 border-[var(--accent-primary)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-4">{editingId ? "Edit Section" : "Create New Section"}</h4>
              <form onSubmit={handleSubmit} className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Section Code</label>
                  <Input required value={form.sectionCode} onChange={e => setForm({...form, sectionCode: e.target.value})} placeholder="e.g. CS101-A" />
                </div>
                <div className="w-[120px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Term</label>
                  <select required className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm" value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
                    <option value="fall">Fall</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
                <div className="w-[100px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Year</label>
                  <Input type="number" required value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Course</label>
                  <select required className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm" value={form.course} onChange={e => setForm({...form, course: e.target.value})}>
                    <option value="" disabled>Select course...</option>
                    {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="w-[100px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Capacity</label>
                  <Input type="number" required value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
                </div>
                <Button type="submit" variant="filled">Save</Button>
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              </form>
            </Card>
          )}

          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Term/Year</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-4 text-[var(--text-muted)]">No sections found.</td></tr>
                )}
                {sections.map(sec => (
                  <tr key={sec._id} className="border-b border-[var(--border-subtle)]">
                    <td className="px-4 py-3 font-medium">{sec.sectionCode}</td>
                    <td className="px-4 py-3 capitalize">{sec.term} {sec.year}</td>
                    <td className="px-4 py-3">{sec.course?.title || "Unknown Course"}</td>
                    <td className="px-4 py-3">{sec.capacity}</td>
                    <td className="px-4 py-3 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setForm({
                          sectionCode: sec.sectionCode,
                          term: sec.term,
                          year: sec.year,
                          capacity: sec.capacity,
                          course: sec.course?._id || ""
                        });
                        setEditingId(sec._id);
                        setIsFormOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(sec._id)} className="text-[var(--accent-danger)]">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DataState>
    </TabChrome>
  );
}
