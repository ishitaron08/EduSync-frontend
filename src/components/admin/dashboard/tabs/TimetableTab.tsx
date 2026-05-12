"use client";

import { useEffect, useState, FormEvent } from "react";
import { TabChrome } from "../TabChrome";
import { DataState } from "../DataState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";

type Slot = {
  day: string;
  startTime: string;
  endTime: string;
  className: string;
  room: string;
  subject: string;
  teacher: string;
};

type Timetable = {
  sectionId?: string;
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
  course: { title: string };
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function TimetableTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [sectionId, setSectionId] = useState("");
  const [className, setClassName] = useState("");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  
  // Form for adding a slot
  const [activeSlot, setActiveSlot] = useState<{day: string, time: string} | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacher: "", room: "" });

  useEffect(() => {
    let alive = true;
    async function loadInitialData() {
      try {
        const [teachersRes, sectionsRes] = await Promise.all([
          api.get("/admin/users?role=teacher&limit=100"),
          api.get("/admin/sections")
        ]);
        if (alive) {
          const fetchedTeachers = teachersRes.data.users || teachersRes.data.data || teachersRes.data;
          setTeachers(Array.isArray(fetchedTeachers) ? fetchedTeachers : []);
          
          const fetchedSections = sectionsRes.data;
          setSections(Array.isArray(fetchedSections) ? fetchedSections : []);
          
          if (fetchedSections && fetchedSections.length > 0) {
             setSectionId(fetchedSections[0]._id);
             setClassName(`${fetchedSections[0].course?.title || "Course"} - ${fetchedSections[0].sectionCode}`);
          }
        }
      } catch(e) {
        console.error("Failed to fetch initial data", e);
      }
    }
    loadInitialData();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    
    let alive = true;
    async function loadMasterTimetable() {
      setStatus("loading");
      try {
        const { data } = await api.get<Timetable>(`/admin/timetable/master?sectionId=${sectionId}`);
        if (alive) {
          // If no timetable returned (empty slots), initialize a fresh one
          if (!data || !data.slots || data.slots.length === 0) {
             setTimetable({ sectionId, year: new Date().getFullYear(), slots: [] });
          } else {
             setTimetable(data);
          }
          setStatus("ready");
        }
      } catch (err: any) {
        if (alive) {
          // If 404 or not found, it means timetable doesn't exist yet, we can create a new one
          if (err?.response?.status === 404) {
             setTimetable({ sectionId, year: new Date().getFullYear(), slots: [] });
             setStatus("ready");
          } else {
             setError(describeApiError(err));
             setStatus("error");
          }
        }
      }
    }
    loadMasterTimetable();
    return () => { alive = false; };
  }, [sectionId]);

  async function handleSaveTimetable() {
    if (!timetable) return;
    try {
      await api.put("/admin/timetable/master", {
        sectionId,
        year: new Date().getFullYear(),
        slots: timetable.slots
      });
      alert("Timetable saved successfully!");
    } catch (err) {
      alert("Conflict detected or save failed: " + describeApiError(err));
    }
  }

  function handleAddSlot(e: FormEvent) {
    e.preventDefault();
    if (!activeSlot || !timetable) return;
    
    // Calculate end time (+1 hour)
    const [hh, mm] = activeSlot.time.split(":").map(Number);
    const endH = String(hh + 1).padStart(2, "0");
    const endTime = `${endH}:${String(mm).padStart(2, "0")}`;

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

  return (
    <TabChrome
      eyebrow="Timetable Management"
      title="Master Schedule Builder"
      description="Select a section to build and manage its timetable."
      actions={
        <Button onClick={handleSaveTimetable} variant="filled" className="gap-2">
          <CalendarIcon className="h-4 w-4" /> Save Timetable
        </Button>
      }
    >
      <DataState status={status} error={error} loading="Loading schedule...">
        <div className="space-y-6">
          <Card className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Select Section</label>
              <select 
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={sectionId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSectionId(val);
                  const found = sections.find(s => s._id === val);
                  if (found) setClassName(`${found.course?.title || "Course"} - ${found.sectionCode}`);
                }}
              >
                {sections.length === 0 && <option value="" disabled>No sections available. Create one in the Sections tab.</option>}
                {sections.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.course?.title || "Unknown"} - {s.sectionCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Section Details</label>
              <Input value={className} readOnly className="mt-1 bg-[var(--bg-elevated)]" />
            </div>
          </Card>

          {activeSlot && (
            <Card className="p-4 border-[var(--accent-primary)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-4">
                Assign Slot: {activeSlot.day.toUpperCase()} at {activeSlot.time}
              </h4>
              <form onSubmit={handleAddSlot} className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Subject</label>
                  <Input required value={slotForm.subject} onChange={(e) => setSlotForm({...slotForm, subject: e.target.value})} placeholder="e.g. Data Structures" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Room</label>
                  <Input required value={slotForm.room} onChange={(e) => setSlotForm({...slotForm, room: e.target.value})} placeholder="e.g. Room 101" />
                </div>
                <div className="flex-1 min-w-[250px]">
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

          {timetable && timetable.slots && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-6">
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
                            <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg p-2 flex flex-col items-center">
                              <span className="font-semibold text-[var(--text-primary)]">{slot.subject}</span>
                              <span className="text-xs text-[var(--text-muted)]">Room: {slot.room}</span>
                              <button 
                                onClick={() => removeSlot(day, time)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setActiveSlot({ day, time })}
                              className="w-full h-12 flex items-center justify-center border-2 border-dashed border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-muted)] transition-all"
                            >
                              <Plus className="h-4 w-4" />
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
          )}
        </div>
      </DataState>
    </TabChrome>
  );
}
