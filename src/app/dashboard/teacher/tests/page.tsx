"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";
import { describeApiError } from "@/lib/apiErrors";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck } from "lucide-react";

type TeacherSection = {
  _id: string;
  sectionCode: string;
  course?: { code?: string; name?: string };
};

export default function TeacherTestsPage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  
  // Common
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [duration, setDuration] = useState("30");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [testTypeTab, setTestTypeTab] = useState<"mcq" | "written" | "history">("mcq");

  useEffect(() => {
    if (!allowed) return;
    api.get<TeacherSection[]>("/teacher/sections")
      .then((res) => {
        const fetched = Array.isArray(res.data) ? res.data : [];
        setSections(fetched);
        const urlSection = searchParams.get("section");
        if (urlSection && fetched.some(section => section._id === urlSection)) {
          setSectionId(urlSection);
        } else if (!sectionId && fetched.length > 0) {
          setSectionId(fetched[0]._id);
        }
      })
      .catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed, sectionId, searchParams]);

  useEffect(() => {
    const urlType = searchParams.get("type");
    if (urlType === "mcq" || urlType === "written" || urlType === "history") {
      setTestTypeTab(urlType);
    }
  }, [searchParams]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  const handleCreateTest = async (type: "mcq" | "written") => {
    try {
      setLoadErr(null);
      setSuccess(null);
      const payload: any = {
        title,
        section: sectionId,
        type,
        durationMinutes: parseInt(duration),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        questions: []
      };

      if (type === "mcq") {
        // In a real implementation, you'd add dynamic questions state here
        payload.questions = [
          { prompt: "Sample MCQ Question?", options: ["A", "B", "C", "D"], correctOptionIndex: 0, marks: 1 }
        ];
      } else {
        payload.fileUrl = "https://example.com/question-paper.pdf";
        payload.rubric = "Q1: 10 marks, Q2: 15 marks";
      }

      await api.post("/teacher/assessments", payload);
      setSuccess(`${type.toUpperCase()} Test created successfully!`);
      // Reset form
      setTitle("");
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  };

  function updateTestsUrl(next: { section?: string; type?: "mcq" | "written" | "history" }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.section) params.set("section", next.section);
    if (next.type) params.set("type", next.type);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSectionChange(nextSection: string) {
    setSectionId(nextSection);
    updateTestsUrl({ section: nextSection, type: testTypeTab });
  }

  function handleTypeChange(value: string) {
    const nextType = value as "mcq" | "written" | "history";
    setTestTypeTab(nextType);
    updateTestsUrl({ section: sectionId, type: nextType });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Manage Tests</h1>
        <p className="text-sm text-[var(--text-muted)]">Create and publish MCQ or Written tests.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}
      {success && <p className="mb-4 text-sm text-[var(--accent-primary)]">{success}</p>}

      <Tabs value={testTypeTab} onValueChange={handleTypeChange} className="space-y-6">
        <TabsList className="bg-[var(--bg-elevated)] p-1 rounded-lg">
          <TabsTrigger value="mcq" className="data-[state=active]:bg-[var(--bg-surface)]">MCQ Test</TabsTrigger>
          <TabsTrigger value="written" className="data-[state=active]:bg-[var(--bg-surface)]">Written Test</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[var(--bg-surface)]">History</TabsTrigger>
        </TabsList>

        <TabsContent value="mcq">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Create MCQ Test</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Test Title</label>
                <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Quiz" />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Section</label>
                <select className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm" value={sectionId} onChange={e => handleSectionChange(e.target.value)}>
                  <option value="" disabled>Select section...</option>
                  {sections.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.course?.code ? `${section.course.code} - ` : ""}{section.course?.name || "Course"} ({section.sectionCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Duration (Mins)</label>
                <Input className="mt-1" type="number" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div />
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Start Time</label>
                <Input className="mt-1" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">End Time</label>
                <Input className="mt-1" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            
            {/* Mock question builder area */}
            <div className="mt-6 p-4 border border-dashed border-[var(--border-subtle)] rounded-lg text-center text-[var(--text-muted)]">
              <ClipboardCheck className="mx-auto mb-2 opacity-50" />
              <p>Dynamic Question Builder goes here.</p>
              <p className="text-xs">For this demo, clicking publish will attach 1 mock question.</p>
            </div>

            <Button onClick={() => handleCreateTest("mcq")} className="mt-6 w-full md:w-auto" variant="filled">
              Publish MCQ Test
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="written">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Create Written Test</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Test Title</label>
                <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Final Essay" />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Section</label>
                <select className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm" value={sectionId} onChange={e => handleSectionChange(e.target.value)}>
                  <option value="" disabled>Select section...</option>
                  {sections.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.course?.code ? `${section.course.code} - ` : ""}{section.course?.name || "Course"} ({section.sectionCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">Start Time</label>
                <Input className="mt-1" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-muted)]">End Time</label>
                <Input className="mt-1" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="mt-6 p-4 border border-[var(--border-subtle)] rounded-lg">
              <label className="text-xs uppercase text-[var(--text-muted)]">Upload Question Paper (PDF)</label>
              <Input type="file" className="mt-2" accept=".pdf" />
              <p className="text-xs text-[var(--text-muted)] mt-1">Mock upload. Will attach dummy URL.</p>
            </div>

            <div className="mt-4 p-4 border border-[var(--border-subtle)] rounded-lg">
              <label className="text-xs uppercase text-[var(--text-muted)]">Grading Rubric</label>
              <textarea className="w-full mt-2 p-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] min-h-[100px]" placeholder="Q1: 10 marks for structure, 5 for content..."></textarea>
            </div>

            <Button onClick={() => handleCreateTest("written")} className="mt-6 w-full md:w-auto" variant="filled">
              Publish Written Test
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6 text-center text-[var(--text-muted)]">
            <p>Fetching active and closed tests...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
