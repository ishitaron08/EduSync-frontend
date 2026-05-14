"use client";

import { useEffect, useState, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TabChrome } from "../TabChrome";
import { DataState } from "../DataState";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";

type SystemSettingsType = {
  institutionName: string;
  contactEmail: string;
  qrValidityMinutes: number;
  pointMultipliers: {
    streakBonus: number;
    earlySubmission: number;
  };
  academicCalendar: {
    semesterStart: string;
    semesterEnd: string;
  };
};

export function SettingsTab() {
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: async () => {
      const { data } = await api.get<SystemSettingsType>("/admin/settings");
      return data;
    }
  });
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: SystemSettingsType) => {
      const { data } = await api.put<SystemSettingsType>("/admin/settings", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.admin.settings, data);
      setSettings(data);
    }
  });
  const status = settingsQuery.isLoading ? "loading" : settingsQuery.isError ? "error" : "ready";
  const error = settingsQuery.error ? describeApiError(settingsQuery.error) : null;
  const saving = saveSettingsMutation.isPending;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      await saveSettingsMutation.mutateAsync(settings);
      alert("Settings saved successfully.");
    } catch (err) {
      alert("Failed to save settings: " + describeApiError(err));
    }
  }

  return (
    <TabChrome>
      <DataState status={status} error={error} loading="Loading settings...">
        <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Institution Details</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Institution Name</label>
                  <Input value={settings?.institutionName || ""} onChange={(e) => setSettings((s) => s ? ({ ...s, institutionName: e.target.value }) : null)} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Contact Email</label>
                  <Input type="email" value={settings?.contactEmail || ""} onChange={(e) => setSettings((s) => s ? ({ ...s, contactEmail: e.target.value }) : null)} required />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">System Parameters</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">QR Validity (Minutes)</label>
                  <Input type="number" value={settings?.qrValidityMinutes || 5} onChange={(e) => setSettings((s) => s ? ({ ...s, qrValidityMinutes: parseInt(e.target.value) }) : null)} required min="1" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Streak Bonus Multiplier</label>
                  <Input type="number" step="0.1" value={settings?.pointMultipliers?.streakBonus || 1.5} onChange={(e) => setSettings((s) => s ? ({ ...s, pointMultipliers: { ...s.pointMultipliers, streakBonus: parseFloat(e.target.value) } }) : null)} required />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Academic Calendar</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Semester Start</label>
                  <Input type="date" value={settings?.academicCalendar?.semesterStart?.split("T")[0] || ""} onChange={(e) => setSettings((s) => s ? ({ ...s, academicCalendar: { ...s.academicCalendar, semesterStart: new Date(e.target.value).toISOString() } }) : null)} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Semester End</label>
                  <Input type="date" value={settings?.academicCalendar?.semesterEnd?.split("T")[0] || ""} onChange={(e) => setSettings((s) => s ? ({ ...s, academicCalendar: { ...s.academicCalendar, semesterEnd: new Date(e.target.value).toISOString() } }) : null)} required />
                </div>
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="filled" disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </div>
        </form>
      </DataState>
    </TabChrome>
  );
}
