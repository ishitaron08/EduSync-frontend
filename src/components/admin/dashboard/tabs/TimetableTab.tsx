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

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function TimetableTab() {
  const [sectionId, setSectionId] = useState("65a12345678901234567890a"); // Dummy section ID for demo
  const [className, setClassName] = useState("Computer Science - Year 1");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  
  // Form for adding a slot
  const [activeSlot, setActiveSlot] = useState<{day: string, time: string} | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacher: "65b12345678901234567890b", room: "" }); // Teacher needs objectId

  useEffect(() => {
    let alive = true;
    async function loadMasterTimetable() {
      setStatus("loading");
      try {
        const { data } = await api.get<Timetable>(`/admin/timetable/master?sectionId=${sectionId}`);
        if (alive) {
          setTimetable(data);
          setStatus("ready");
        }
      } catch (err) {
        if (alive) {
          setError(describeApiError(err));
          setStatus("error");
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
    setSlotForm({ subject: "", teacher: "65b12345678901234567890b", room: "" });
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
      description="Create classes, assign subjects, and build schedules to prevent conflicts."
      actions={
        <Button onClick={handleSaveTimetable} variant="filled" className="gap-2">
          <CalendarIcon className="h-4 w-4" /> Save Timetable
        </Button>
      }
    >
      <DataState status={status} error={error} loading="Loading schedule...">
        <div className="space-y-6">
          <Card className="p-4 flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Class/Section Name</label>
              <Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Section ID (System)</label>
              <Input value={sectionId} readOnly className="mt-1 bg-[var(--bg-elevated)]" />
            </div>
          </Card>

          {activeSlot && (
            <Card className="p-4 border-[var(--accent-primary)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-4">
                Assign Slot: {activeSlot.day.toUpperCase()} at {activeSlot.time}
              </h4>
              <form onSubmit={handleAddSlot} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Subject</label>
                  <Input required value={slotForm.subject} onChange={(e) => setSlotForm({...slotForm, subject: e.target.value})} placeholder="e.g. Data Structures" />
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Room</label>
                  <Input required value={slotForm.room} onChange={(e) => setSlotForm({...slotForm, room: e.target.value})} placeholder="e.g. Room 101" />
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase text-[var(--text-muted)]">Teacher ID (ObjectId)</label>
                  <Input required value={slotForm.teacher} onChange={(e) => setSlotForm({...slotForm, teacher: e.target.value})} />
                </div>
                <Button type="submit" variant="filled">Add Slot</Button>
                <Button type="button" variant="ghost" onClick={() => setActiveSlot(null)}>Cancel</Button>
              </form>
            </Card>
          )}

          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
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
        </div>
      </DataState>
    </TabChrome>
  );
}
