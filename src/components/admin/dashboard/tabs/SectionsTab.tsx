"use client";

import { useEffect, useState, FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabChrome } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Plus, Trash2, Edit2, Users, X, Search, UserPlus } from "lucide-react";


type Course = { _id: string; name: string; code: string; id?: string };
type StudentEnrollment = {
  section?: {
    _id: string;
    sectionCode: string;
    term: string;
    year: number;
    course?: Course;
  };
};
type Student = { _id: string; name: string; email: string; enrollment?: StudentEnrollment | null };
type EnrolledStudent = { _id: string; student: Student; enrolledAt: string };
type Section = {
  _id: string;
  sectionCode: string;
  term: string;
  year: number;
  capacity: number;
  course: Course;
  enrolledCount?: number;
};

export function SectionsTab() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Student selection state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Student management modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [modalCapacity, setModalCapacity] = useState(0);
  
  const defaultForm = { sectionCode: "", term: "fall", year: new Date().getFullYear(), capacity: 60, course: "" };
  const [form, setForm] = useState(defaultForm);

  function writeSectionUrl(action: "new" | "edit" | "manage" | null, sectionId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (pathname.endsWith("/dashboard/admin")) {
      params.set("tab", "sections");
    }

    if (!action) {
      params.delete("sectionAction");
      params.delete("sectionId");
    } else {
      params.set("sectionAction", action);
      if (sectionId) {
        params.set("sectionId", sectionId);
      } else {
        params.delete("sectionId");
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function closeSectionWorkspace(pushUrl = true) {
    setIsFormOpen(false);
    setEditingId(null);
    setEditingSectionId(null);
    setIsStudentModalOpen(false);
    setSelectedStudents([]);
    setForm(defaultForm);
    if (pushUrl) writeSectionUrl(null);
  }

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

  async function loadStudents(search: string = "") {
    try {
      setLoadingStudents(true);
      const res = await api.get(`/admin/students?limit=100${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      console.log("Students API response:", res.data);
      setAllStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to load students:", describeApiError(err));
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadEnrolledStudents(sectionId: string) {
    try {
      const res = await api.get(`/admin/sections/${sectionId}/students?limit=100`);
      setEnrolledStudents(res.data.students || []);
      setModalCapacity(res.data.capacity);
    } catch (err) {
      console.error("Failed to load enrolled students:", describeApiError(err));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isFormOpen) {
      loadStudents();
    }
  }, [isFormOpen]);

  useEffect(() => {
    if (isStudentModalOpen && editingSectionId) {
      loadEnrolledStudents(editingSectionId);
    }
  }, [isStudentModalOpen, editingSectionId]);

  useEffect(() => {
    const action = searchParams.get("sectionAction");
    const urlSectionId = searchParams.get("sectionId");

    if (!action) {
      if (isFormOpen || isStudentModalOpen || editingId || editingSectionId) {
        closeSectionWorkspace(false);
      }
      return;
    }

    if (action === "new") {
      if (!isFormOpen || editingId) {
        setEditingId(null);
        setForm(defaultForm);
        setSelectedStudents([]);
        setIsStudentModalOpen(false);
        setEditingSectionId(null);
        setIsFormOpen(true);
      }
      return;
    }

    if (!urlSectionId || sections.length === 0) return;
    const section = sections.find(sec => sec._id === urlSectionId);
    if (!section) return;

    if (action === "edit" && editingId !== section._id) {
      setIsStudentModalOpen(false);
      handleEditSection(section, false);
      return;
    }

    if (action === "manage" && editingSectionId !== section._id) {
      setIsFormOpen(false);
      setEditingId(null);
      openStudentModal(section._id, false);
    }
  }, [searchParams, sections, isFormOpen, isStudentModalOpen, editingId, editingSectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, students: selectedStudents };
      if (editingId) {
        await api.put(`/admin/sections/${editingId}`, payload);
      } else {
        await api.post("/admin/sections", payload);
      }
      closeSectionWorkspace();
      loadData();
    } catch (err) {
      alert("Failed to save section: " + describeApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this section? This will also remove all student enrollments.")) return;
    try {
      await api.delete(`/admin/sections/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete: " + describeApiError(err));
    }
  }

  async function handleAddStudentToSection(studentId: string) {
    if (!editingSectionId) return;
    try {
      await api.post(`/admin/sections/${editingSectionId}/students`, { studentIds: [studentId] });
      loadEnrolledStudents(editingSectionId);
    } catch (err) {
      alert("Failed to add student: " + describeApiError(err));
    }
  }

  async function handleRemoveStudentFromSection(studentId: string) {
    if (!editingSectionId) return;
    try {
      await api.delete(`/admin/sections/${editingSectionId}/students/${studentId}`);
      loadEnrolledStudents(editingSectionId);
    } catch (err) {
      alert("Failed to remove student: " + describeApiError(err));
    }
  }

  function handleEditSection(sec: Section, pushUrl = true) {
    setForm({
      sectionCode: sec.sectionCode,
      term: sec.term,
      year: sec.year,
      capacity: sec.capacity,
      course: sec.course?._id || ""
    });
    setEditingId(sec._id);
    setIsStudentModalOpen(false);
    setEditingSectionId(null);
    setIsFormOpen(true);
    if (pushUrl) writeSectionUrl("edit", sec._id);
    // Load currently enrolled students for this section
    loadEnrolledStudentsForEdit(sec._id);
  }

  async function loadEnrolledStudentsForEdit(sectionId: string) {
    try {
      const res = await api.get(`/admin/sections/${sectionId}/students?limit=100`);
      console.log("Enrolled students response:", res.data);
      const enrollments = res.data.students || [];
      // Store the full enrollment data temporarily to display names
      const studentIds = enrollments.map((es: EnrolledStudent) => es.student._id);
      setSelectedStudents(studentIds);
      // Also add these students to allStudents if not already present
      const studentsFromEnrollments = enrollments.map((es: EnrolledStudent) => es.student);
      setAllStudents(prev => {
        const existingIds = new Set(prev.map(s => s._id));
        const newStudents = studentsFromEnrollments.filter((s: Student) => !existingIds.has(s._id));
        return [...prev, ...newStudents];
      });
    } catch (err) {
      console.error("Failed to load enrolled students:", describeApiError(err));
    }
  }

  function toggleStudentSelection(studentId: string) {
    const student = allStudents.find(s => s._id === studentId);
    if (isStudentLocked(student)) return;
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }

  function openStudentModal(sectionId: string, pushUrl = true) {
    setIsFormOpen(false);
    setEditingId(null);
    setEditingSectionId(sectionId);
    setIsStudentModalOpen(true);
    if (pushUrl) writeSectionUrl("manage", sectionId);
  }

  function getEnrollmentSectionId(student?: Student | null) {
    return student?.enrollment?.section?._id ?? null;
  }

  function isStudentLocked(student?: Student | null) {
    const enrolledSectionId = getEnrollmentSectionId(student);
    if (!enrolledSectionId) return false;
    const currentSectionId = editingId || editingSectionId;
    return !currentSectionId || enrolledSectionId !== currentSectionId;
  }

  function getEnrollmentLabel(student?: Student | null) {
    const section = student?.enrollment?.section;
    if (!section) return "";
    const courseLabel = section.course?.code || section.course?.name || "Course";
    return `${courseLabel} ${section.sectionCode}`;
  }

  return (
    <TabChrome
      eyebrow="Section Management"
      title="Sections"
      description="Create and manage class sections, assign courses and students."
      actions={
        <Button onClick={() => {
          setIsFormOpen(true);
          setEditingId(null);
          setForm(defaultForm);
          setSelectedStudents([]);
          setIsStudentModalOpen(false);
          setEditingSectionId(null);
          writeSectionUrl("new");
        }} variant="filled" className="gap-2">
          <Plus className="h-4 w-4" /> New Section
        </Button>
      }
    >
      <DataState status={status} error={error} loading="Loading sections...">
        <div className="space-y-6">
          {/* Section Form */}
          {isFormOpen && (
            <Card className="p-4 border-[var(--accent-primary)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-4">{editingId ? "Edit Section" : "Create New Section"}</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4 flex-wrap items-end">
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
                      {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div className="w-[100px]">
                    <label className="text-xs uppercase text-[var(--text-muted)]">Capacity</label>
                    <Input type="number" required value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
                  </div>
                </div>

                {/* Student Selection */}
                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase text-[var(--text-muted)]">
                      Students ({selectedStudents.length}/{form.capacity})
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <Input 
                        className="pl-8 w-64" 
                        placeholder="Search students..." 
                        value={studentSearch}
                        onChange={e => {
                          setStudentSearch(e.target.value);
                          loadStudents(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* Available Students */}
                    <div className="flex-1 border border-[var(--border-subtle)] rounded-lg max-h-48 overflow-y-auto">
                      <div className="p-2 bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)]">
                        Available Students
                      </div>
                      <div className="p-2 space-y-1">
                        {loadingStudents ? (
                          <div className="text-center p-4 text-[var(--text-muted)]">Loading...</div>
                        ) : allStudents.length === 0 ? (
                          <div className="text-center p-4 text-[var(--text-muted)]">No students found</div>
                        ) : (
                          allStudents.map(student => {
                            const locked = isStudentLocked(student);
                            return (
                            <div 
                              key={student._id} 
                              className={`flex items-center gap-2 p-2 rounded transition-colors ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[var(--bg-elevated)]'} ${selectedStudents.includes(student._id) ? 'bg-[var(--accent-primary)]/10' : ''}`}
                              onClick={() => toggleStudentSelection(student._id)}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedStudents.includes(student._id)}
                                disabled={locked}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{student.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{student.email}</div>
                                {locked && (
                                  <div className="text-xs text-[var(--accent-danger)]">
                                    Already in {getEnrollmentLabel(student)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                          })
                        )}
                      </div>
                    </div>

                    {/* Selected Students */}
                    <div className="w-64 border border-[var(--border-subtle)] rounded-lg max-h-48 overflow-y-auto">
                      <div className="p-2 bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)]">
                        Selected ({selectedStudents.length})
                      </div>
                      <div className="p-2 space-y-1">
                        {selectedStudents.length === 0 ? (
                          <div className="text-center p-4 text-[var(--text-muted)] text-sm">No students selected</div>
                        ) : (
                          selectedStudents.map(id => {
                            const student = allStudents.find(s => s._id === id);
                            if (!student) return null;
                            return (
                              <div key={id} className="flex items-center gap-2 p-2 rounded bg-[var(--bg-elevated)]">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{student.name}</div>
                                  <div className="text-xs text-[var(--text-muted)] truncate">{student.email}</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => toggleStudentSelection(id)}
                                  className="p-1 hover:bg-[var(--accent-danger)]/20 rounded"
                                >
                                  <X className="h-4 w-4 text-[var(--accent-danger)]" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="submit" variant="filled">Save Section</Button>
                  <Button type="button" variant="ghost" onClick={() => closeSectionWorkspace()}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Sections Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Term/Year</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Enrolled/Capacity</th>
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
                    <td className="px-4 py-3">{sec.course?.name || "Unknown Course"}</td>
                    <td className="px-4 py-3">
                      <span className={`${(sec.enrolledCount || 0) >= sec.capacity ? 'text-[var(--accent-danger)]' : ''}`}>
                        {sec.enrolledCount || 0}/{sec.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openStudentModal(sec._id)} title="Manage Students">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditSection(sec)} title="Edit Section">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(sec._id)} className="text-[var(--accent-danger)]" title="Delete Section">
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

      {/* Student Management Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col m-4">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-medium text-lg">Manage Students</h3>
              <Button variant="ghost" size="sm" onClick={() => closeSectionWorkspace()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <Input 
                    className="pl-8" 
                    placeholder="Search students to add..." 
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      loadStudents(e.target.value);
                    }}
                  />
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {enrolledStudents.length}/{modalCapacity} enrolled
                </div>
              </div>
              
              {/* Students to add */}
              {studentSearch && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-[var(--border-subtle)] rounded">
                  {loadingStudents ? (
                    <div className="p-2 text-center text-[var(--text-muted)]">Loading...</div>
                  ) : allStudents.length === 0 ? (
                    <div className="p-2 text-center text-[var(--text-muted)]">No students found</div>
                  ) : (
                    allStudents
                      .filter(s => !enrolledStudents.some(es => es.student._id === s._id))
                      .slice(0, 5)
                      .map(student => {
                        const locked = isStudentLocked(student);
                        return (
                        <div 
                          key={student._id}
                          className={`flex items-center justify-between p-2 ${locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-[var(--bg-elevated)] cursor-pointer'}`}
                          onClick={() => {
                            if (!locked) handleAddStudentToSection(student._id);
                          }}
                        >
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{student.email}</div>
                            {locked && (
                              <div className="text-xs text-[var(--accent-danger)]">
                                Already in {getEnrollmentLabel(student)}
                              </div>
                            )}
                          </div>
                          {!locked && <UserPlus className="h-4 w-4 text-[var(--accent-primary)]" />}
                        </div>
                      );
                      })
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {enrolledStudents.length === 0 ? (
                <div className="text-center p-8 text-[var(--text-muted)]">
                  No students enrolled in this section yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledStudents.map(es => (
                    <div key={es._id} className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg">
                      <div>
                        <div className="font-medium">{es.student.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{es.student.email}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveStudentFromSection(es.student._id)}
                        className="text-[var(--accent-danger)]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="filled" onClick={() => closeSectionWorkspace()}>Done</Button>
            </div>
          </Card>
        </div>
      )}
    </TabChrome>
  );
}
