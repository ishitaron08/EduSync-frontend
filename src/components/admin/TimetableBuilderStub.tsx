"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = [9, 10, 11, 12, 13, 14];

export function TimetableBuilderStub() {
  const [collision, setCollision] = useState<string | null>(null);

  return (
    <Card className="p-4">
      <p className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--text-primary)]">Timetable planner</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Select a slot to review placement and quickly identify collisions before publishing.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr>
              <th className="p-2 font-mono text-[10px] uppercase text-[var(--text-muted)]" />
              {DAYS.map((d) => (
                <th key={d} className="p-2 text-center font-mono text-[10px] uppercase text-[var(--text-muted)]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h}>
                <td className="p-2 font-mono text-[10px] text-[var(--text-muted)]">{h}:00</td>
                {DAYS.map((d) => {
                  const id = `${d}-${h}`;
                  return (
                    <td key={id} className="p-1">
                      <button
                        type="button"
                        className={`h-10 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)] hover:border-[var(--accent-primary)] ${
                          collision === id ? "border-[var(--accent-danger)] bg-[var(--accent-danger)]/15" : ""
                        }`}
                        onClick={() => setCollision(id)}
                      >
                        +
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
