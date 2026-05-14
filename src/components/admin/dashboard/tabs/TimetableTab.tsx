"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabChrome } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { Plus, Trash2, Calendar as CalendarIcon, Edit2, FileText, Check, X, User, MapPin, AlertCircle } from "lucide-react";

type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  className: string;
  room: string;
  subject: string;
  teacher: string | { _id: string; name: string; email: string };
};

// The backend GET /admin/timetable/master returns the raw Mongoose document
// which uses `section` (ObjectId ref), never `sectionId`. The frontend holds
// sectionId in its own state so we don't need to read it from the response,
// but the type must reflect what actually arrives to avoid silent mismatches.
type Timetable = {
  _id?: string;
  // `section` is what the backend sends, an ObjectId string on the wire.
  // We keep `sectionId` as an optional alias for local state compatibility.
  section?: string;
  sectionId?: string;
  term?: string;
  year: number;
  slots: Slot[];
};

type Teacher = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
};

type Section = {
  _id: string;
  sectionCode: string;
  term: string;
  year: number;
  course: { _id?: string; code?: string; name?: string; title?: string };
  enrolledCount?: number;
};

// The backend GET /admin/timetable/master/list always returns `section` as a
// fully populated object (sectionCode, course, term, year, _id), never a
// plain string. The previous type allowed string | {_id} which was misleading.
type PopulatedSection = {
  _id: string;
  sectionCode: string;
  term: string;
  year: number;
  course: { _id?: string; code?: string; name?: string };
};

type MasterTimetableInfo = {
  _id: string;
  // sectionId is a convenience field the backend derives from section._id
  sectionId: string;
  // section is always a populated object from listMasterTimetables
  section?: PopulatedSection;
  className: string;
  term?: string;
  year: number;
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const EMPTY_SECTIONS: Section[] = [];
const EMPTY_TEACHERS: Teacher[] = [];
const EMPTY_MASTER_TIMETABLES: MasterTimetableInfo[] = [];

function teacherIdFrom(teacher: Slot["teacher"]) {
  if (typeof teacher === "string") return teacher;
  return teacher?._id ?? "";
}

export function TimetableTab() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [sectionId, setSectionId] = useState("");
  const [sectionTerm, setSectionTerm] = useState("fall");
  const [sectionYear, setSectionYear] = useState(new Date().getFullYear());
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  
  // Track if current section has a timetable
  const [hasExistingTimetable, setHasExistingTimetable] = useState(false);
  
  // Form for adding a slot
  const [activeSlot, setActiveSlot] = useState<{day: string, time: string} | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacher: "", room: "" });
  const [mobileDay, setMobileDay] = useState(DAYS[0]);
  const timetableSetupQuery = useQuery({
    queryKey: ["admin", "timetable", "setup"],
    queryFn: async () => {
      const [teachersRes, sectionsRes, timetablesRes] = await Promise.all([
        api.get("/admin/users?role=teacher&limit=100"),
        api.get<Section[]>("/admin/sections"),
        api.get<MasterTimetableInfo[]>("/admin/timetable/master/list")
      ]);
      const fetchedTeachers = teachersRes.data.users || teachersRes.data.data || teachersRes.data;
      return {
        teachers: Array.isArray(fetchedTeachers) ? fetchedTeachers as Teacher[] : [],
        sections: Array.isArray(sectionsRes.data) ? sectionsRes.data : [],
        masterTimetables: Array.isArray(timetablesRes.data) ? timetablesRes.data : []
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false
  });
  const sections = timetableSetupQuery.data?.sections ?? EMPTY_SECTIONS;
  const teachers = timetableSetupQuery.data?.teachers ?? EMPTY_TEACHERS;
  const masterTimetables = timetableSetupQuery.data?.masterTimetables ?? EMPTY_MASTER_TIMETABLES;
  const masterTimetableQuery = useQuery({
    queryKey: queryKeys.admin.timetable(sectionId, sectionTerm, sectionYear),
    queryFn: async () => {
      try {
        const { data } = await api.get<Timetable>(`/admin/timetable/master?sectionId=${sectionId}&term=${sectionTerm}&year=${sectionYear}`);
        if (!data || !data.slots || data.slots.length === 0) {
          return {
            timetable: { sectionId, section: sectionId, term: sectionTerm, year: sectionYear, slots: [] },
            hasExisting: false
          };
        }
        return {
          timetable: { ...data, sectionId: data.sectionId ?? sectionId },
          hasExisting: true
        };
      } catch (err: unknown) {
        const statusCode = (err as { response?: { status?: number } })?.response?.status;
        if (statusCode === 404) {
          return {
            timetable: { sectionId, section: sectionId, term: sectionTerm, year: sectionYear, slots: [] },
            hasExisting: false
          };
        }
        throw err;
      }
    },
    enabled: Boolean(sectionId),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    retry: false
  });
  const displayStatus: "loading" | "ready" | "error" =
    timetableSetupQuery.isLoading || (Boolean(sectionId) && masterTimetableQuery.isLoading)
      ? "loading"
      : timetableSetupQuery.isError || masterTimetableQuery.isError
        ? "error"
        : "ready";
  const displayError = error ?? (timetableSetupQuery.error || masterTimetableQuery.error ? describeApiError(timetableSetupQuery.error ?? masterTimetableQuery.error) : null);

  function writeTimetableUrl(section: Section | null, mode?: "edit" | "new") {
    const params = new URLSearchParams(searchParams.toString());
    if (pathname.endsWith("/dashboard/admin")) {
      params.set("tab", "timetable");
    }

    if (!section) {
      params.delete("section");
      params.delete("mode");
      params.delete("term");
      params.delete("year");
    } else {
      params.set("section", section._id);
      params.set("mode", mode ?? (checkExistingTimetable(section._id) ? "edit" : "new"));
      params.set("term", section.term || "fall");
      params.set("year", String(section.year || new Date().getFullYear()));
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function selectSection(section: Section, mode?: "edit" | "new", pushUrl = true) {
    setSectionId(section._id);
    setSectionTerm(section.term || "fall");
    setSectionYear(section.year || new Date().getFullYear());
    if (pushUrl) {
      writeTimetableUrl(section, mode);
    }
  }

  function clearSelectedSection() {
    setSectionId("");
    setTimetable(null);
    setHasExistingTimetable(false);
    setActiveSlot(null);
    setError(null);
    writeTimetableUrl(null);
  }

  // sectionId is always a plain string in the updated MasterTimetableInfo type.
  // The section object is also available as a fallback for older cached data.
  const getTimetableSectionId = (entry: MasterTimetableInfo): string => {
    return entry.sectionId || entry.section?._id || "";
  };

  const timetableSectionIds = useMemo(() => new Set(masterTimetables.map(getTimetableSectionId)), [masterTimetables]);

  const checkExistingTimetable = (sectId: string) => timetableSectionIds.has(String(sectId));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (sections.length === 0) return;

    const urlSectionId = searchParams.get("section");
    if (!urlSectionId) {
      if (sectionId) {
        setSectionId("");
        setTimetable(null);
        setHasExistingTimetable(false);
        setActiveSlot(null);
      }
      return;
    }

    if (urlSectionId === sectionId) return;

    const section = sections.find(s => s._id === urlSectionId);
    if (!section) return;

    setSectionId(section._id);
    setSectionTerm(searchParams.get("term") || section.term || "fall");
    setSectionYear(Number(searchParams.get("year") || section.year || new Date().getFullYear()));
  }, [searchParams, sections, sectionId]);

  useEffect(() => {
    if (!sectionId) return;
    if (masterTimetableQuery.data) {
      setTimetable(masterTimetableQuery.data.timetable);
      setHasExistingTimetable(masterTimetableQuery.data.hasExisting);
      setError(null);
    }
  }, [masterTimetableQuery.data, sectionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Refresh master timetables list
  const refreshMasterTimetables = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "timetable", "setup"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.timetableLists }),
      queryClient.invalidateQueries({ queryKey: ["admin", "section-management"] })
    ]);
  };

  async function handleSaveTimetable() {
    if (!timetable) return;
    setSaveStatus("saving");
    setError(null);
    try {
      const normalizedSlots = timetable.slots.map((slot) => ({
        ...slot,
        teacher: teacherIdFrom(slot.teacher)
      }));
      await api.put("/admin/timetable/master", {
        sectionId,
        term: sectionTerm,
        year: sectionYear,
        slots: normalizedSlots
      });
      setSaveStatus("saved");
      setHasExistingTimetable(true);
      await refreshMasterTimetables();
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.timetable(sectionId, sectionTerm, sectionYear) });
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setError("Conflict detected or save failed: " + describeApiError(err));
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  function handleAddSlot(e: FormEvent) {
    e.preventDefault();
    if (!activeSlot || !timetable) return;
    
    // Calculate end time (+1 hour)
    const [hh, mm] = activeSlot.time.split(":").map(Number);
    const endH = String(hh + 1).padStart(2, "0");
    const endTime = `${endH}:${String(mm).padStart(2, "0")}`;

    const section = sections.find(s => s._id === sectionId);
    const className = section ? `${section.course?.code || section.course?.name || "Course"} - ${section.sectionCode}` : "Class";

    const newSlot: Slot = {
      day: activeSlot.day,
      startTime: activeSlot.time,
      endTime,
      className,
      room: slotForm.room,
      subject: slotForm.subject,
      teacher: slotForm.teacher
    };

    setTimetable({
      ...timetable,
      slots: [...timetable.slots.filter(s => !(s.day === activeSlot.day && s.startTime === activeSlot.time)), newSlot]
    });
    setActiveSlot(null);
    setSlotForm({ subject: "", teacher: "", room: "" });
  }

  function removeSlot(day: string, time: string) {
    if (!timetable) return;
    setTimetable({
      ...timetable,
      slots: timetable.slots.filter(s => !(s.day === day && s.startTime === time))
    });
  }

  function getSlotAt(day: string, time: string) {
    return timetable?.slots.find(s => s.day === day && s.startTime === time);
  }

  // Get teacher name from slot
  const getTeacherName = (teacher: string | { _id: string; name: string; email: string }) => {
    if (typeof teacher === "object" && teacher?.name) {
      return teacher.name;
    }
    if (typeof teacher === "string") {
      const t = teachers.find(t => (t._id || t.id) === teacher);
      return t?.name || "Unknown";
    }
    return "Unknown";
  };

  // Sections grouped by timetable status
  const sectionsWithTimetable = sections.filter(s => checkExistingTimetable(s._id));
  const sectionsWithoutTimetable = sections.filter(s => !checkExistingTimetable(s._id));

  const selectedSection = sections.find(s => s._id === sectionId);

  return (
    <TabChrome
      actions={
        sectionId && timetable && (
          <Button 
            onClick={handleSaveTimetable} 
            variant="filled" 
            className="gap-2"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" && <span className="animate-spin">...</span>}
            {saveStatus === "saved" && <Check className="h-4 w-4" />}
            {saveStatus === "error" && <X className="h-4 w-4" />}
            {saveStatus === "idle" && <CalendarIcon className="h-4 w-4" />}
            {saveStatus === "saving" ? "Saving..." : 
             saveStatus === "saved" ? "Saved!" : 
             saveStatus === "error" ? "Error" : 
             hasExistingTimetable ? "Update Timetable" : "Create Timetable"}
          </Button>
        )
      }
    >
      <DataState status={displayStatus} error={displayError} loading="Loading schedule...">
        <div className="space-y-6">
          {/* Section Selection - Two Options */}
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Option 1: Edit Existing Timetable */}
              <div className="border border-[var(--border-subtle)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Edit2 className="h-4 w-4 text-[var(--accent-primary)]" />
                  <h4 className="font-medium text-[var(--text-primary)]">Edit Existing Timetable</h4>
                </div>
                {sectionsWithTimetable.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No sections with timetables yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sectionsWithTimetable.map(s => (
                      <button
                        key={s._id}
                        onClick={() => {
                          selectSection(s, "edit");
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          sectionId === s._id 
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div className="font-medium text-[var(--text-primary)]">
                          {s.course?.name || s.course?.title || "Unknown Course"}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {s.sectionCode} - {s.term} {s.year}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Option 2: Create New Timetable */}
              <div className="border border-[var(--border-subtle)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-green-500" />
                  <h4 className="font-medium text-[var(--text-primary)]">Create New Timetable</h4>
                </div>
                {sectionsWithoutTimetable.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">All sections have timetables. Create a new section first.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sectionsWithoutTimetable.map(s => (
                      <button
                        key={s._id}
                        onClick={() => {
                          selectSection(s, "new");
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          sectionId === s._id 
                            ? 'border-green-500 bg-green-500/10' 
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div className="font-medium text-[var(--text-primary)]">
                          {s.course?.name || s.course?.title || "Unknown Course"}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {s.sectionCode} - {s.term} {s.year} - {s.enrolledCount || 0} students
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Selected Section Info */}
          {sectionId && selectedSection && (
            <Card className={`p-4 ${hasExistingTimetable ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5' : 'border-green-500/30 bg-green-500/5'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {hasExistingTimetable ? "Editing Existing Timetable" : "Creating New Timetable"}
                  </p>
                  <p className="font-medium text-[var(--text-primary)] mt-1">
                    {selectedSection.course?.name || selectedSection.course?.title || "Unknown Course"} - {selectedSection.sectionCode}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selectedSection.term?.charAt(0).toUpperCase()}{selectedSection.term?.slice(1)} {selectedSection.year}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-[var(--text-muted)]">
                    {timetable?.slots?.length || 0} slots configured
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selectedSection.enrolledCount || 0} enrolled students
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={clearSelectedSection}>
                    Back to timetable
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="p-4 border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--accent-danger)]" />
                <p className="text-sm text-[var(--accent-danger)]">{error}</p>
              </div>
            </Card>
          )}

          {/* Slot Form */}
          {activeSlot && (
            <Card className="p-4 border-[var(--accent-primary)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-4">
                Assign Slot: {activeSlot.day.charAt(0).toUpperCase() + activeSlot.day.slice(1)} at {activeSlot.time}
              </h4>
              <form onSubmit={handleAddSlot} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto_auto] lg:items-end">
                <div className="min-w-0">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Subject</label>
                  <Input required value={slotForm.subject} onChange={(e) => setSlotForm({...slotForm, subject: e.target.value})} placeholder="e.g. Data Structures" />
                </div>
                <div className="min-w-0">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Room</label>
                  <Input required value={slotForm.room} onChange={(e) => setSlotForm({...slotForm, room: e.target.value})} placeholder="e.g. Room 101" />
                </div>
                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Teacher</label>
                  <select 
                    required 
                    value={slotForm.teacher} 
                    onChange={(e) => setSlotForm({...slotForm, teacher: e.target.value})}
                    className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="" disabled>Select a teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id || t._id} value={t.id || t._id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="filled">Add Slot</Button>
                <Button type="button" variant="ghost" onClick={() => setActiveSlot(null)}>Cancel</Button>
              </form>
            </Card>
          )}

          {/* Timetable Grid */}
          {sectionId && timetable && (
            <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:hidden">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={mobileDay === day ? "filled" : "ghost"}
                    className="shrink-0 capitalize"
                    onClick={() => setMobileDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>

              <div className="space-y-2 md:hidden">
                {TIMES.map(time => {
                  const slot = getSlotAt(mobileDay, time);
                  return (
                    <div key={`${mobileDay}-${time}`} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-[var(--text-primary)]">{time}</span>
                        <span className="text-xs capitalize text-[var(--text-muted)]">{mobileDay}</span>
                      </div>
                      {slot ? (
                        <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text-primary)]">{slot.subject}</p>
                              <p className="mt-1 text-xs text-[var(--text-muted)]">{getTeacherName(slot.teacher)}</p>
                              <p className="text-xs text-[var(--text-muted)]">{slot.room}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-[var(--accent-danger)]" onClick={() => removeSlot(mobileDay, time)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button type="button" variant="ghost" className="h-12 w-full border border-dashed border-[var(--border-subtle)]" onClick={() => setActiveSlot({ day: mobileDay, time })}>
                          <Plus className="mr-2 h-4 w-4" /> Add Slot
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] md:block">
                <table className="min-w-full text-left text-sm border-collapse">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-4 py-3 font-medium border-r border-[var(--border-subtle)] w-24">Time</th>
                      {DAYS.map(day => (
                        <th key={day} className="px-4 py-3 font-medium capitalize text-center border-r border-[var(--border-subtle)]">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map(time => (
                      <tr key={time} className="border-b border-[var(--border-subtle)]">
                        <td className="px-4 py-3 border-r border-[var(--border-subtle)] font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                          {time}
                        </td>
                        {DAYS.map(day => {
                          const slot = getSlotAt(day, time);
                          return (
                            <td key={`${day}-${time}`} className="p-2 border-r border-[var(--border-subtle)] text-center relative group min-w-[150px]">
                              {slot ? (
                                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg p-2">
                                  <span className="font-semibold text-[var(--text-primary)]">{slot.subject}</span>
                                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-[var(--text-muted)]">
                                    <MapPin className="h-3 w-3" />
                                    <span>{slot.room}</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                                    <User className="h-3 w-3" />
                                    <span>{getTeacherName(slot.teacher)}</span>
                                  </div>
                                  <button 
                                    onClick={() => removeSlot(day, time)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setActiveSlot({ day, time })}
                                  className="w-full h-16 flex flex-col items-center justify-center border-2 border-dashed border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-muted)] transition-all"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span className="text-xs mt-1">Add Slot</span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Section Selected */}
          {!sectionId && sections.length > 0 && (
            <Card className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-[var(--text-primary)] font-medium">Select a section to manage its timetable</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Choose from existing timetables to edit, or create a new one for a section without a timetable.</p>
            </Card>
          )}

          {/* No Sections */}
          {!sectionId && sections.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-[var(--text-primary)] font-medium">No sections available</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Create a section in the Sections tab first.</p>
            </Card>
          )}
        </div>
      </DataState>
    </TabChrome>
  );
}
