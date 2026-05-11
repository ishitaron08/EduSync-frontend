"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherTimetablePage() {
  const allowed = useDashboardGuard("teacher");
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api.get("/teacher/timetable")
      .then((res) => setTimetables(Array.isArray(res.data) ? res.data : []))
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed]);

  if (!allowed) return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;

  const handleRequestChange = () => {
    alert("Change request notification sent to admin.");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">My Schedule</h1>
          <p className="text-sm text-[var(--text-muted)]">Read-only view of your weekly classes.</p>
        </div>
        <Button onClick={handleRequestChange} variant="outline">
          Request Schedule Change
        </Button>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}

      <div className="grid gap-6">
        {timetables.length === 0 ? (
          <Card className="p-6 text-center text-[var(--text-muted)]">
            No schedule found. Contact administration.
          </Card>
        ) : (
          timetables.map((tt, idx) => (
            <Card key={idx} className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                {tt.year} Term {tt.term} Schedule {tt.sectionId ? `(Section)` : ""}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Day</th>
                      <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Time</th>
                      <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Subject</th>
                      <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Room</th>
                      <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {tt.slots?.map((slot: any, sIdx: number) => (
                      <tr key={sIdx} className="hover:bg-[var(--bg-surface)]">
                        <td className="px-4 py-3 capitalize">{slot.dayOfWeek}</td>
                        <td className="px-4 py-3 font-mono text-xs">{slot.startTime} - {slot.endTime}</td>
                        <td className="px-4 py-3 font-semibold">{slot.subject}</td>
                        <td className="px-4 py-3">{slot.room}</td>
                        <td className="px-4 py-3 capitalize">{slot.type}</td>
                      </tr>
                    ))}
                    {(!tt.slots || tt.slots.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">No assigned slots.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
