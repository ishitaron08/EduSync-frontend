"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDashboardGuard } from "@/lib/authGuard";
import { describeApiError } from "@/lib/apiErrors";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Plus, Trash2 } from "lucide-react";

type TeacherSection = {
  _id: string;
  sectionCode: string;
  course?: { code?: string; name?: string };
};

type Question = {
  prompt: string;
  options: string[];
  correctOptionIndex: number | null;
  marks: number;
};

type WrittenQuestion = {
  prompt: string;
  marks: number;
};

type WrittenSourceMode = "typed" | "link" | "upload";

type Assessment = {
  _id: string;
  title: string;
  type: "mcq" | "written";
  status: "draft" | "published" | "closed";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questions?: Question[];
};

const blankQuestion = (): Question => ({
  prompt: "",
  options: ["", ""],
  correctOptionIndex: null,
  marks: 1
});

const blankWrittenQuestion = (): WrittenQuestion => ({
  prompt: "",
  marks: 10
});

function sectionLabel(section: TeacherSection) {
  return `${section.course?.code ? `${section.course.code} - ` : ""}${section.course?.name || "Course"} (${section.sectionCode})`;
}

function questionIsValid(question: Question) {
  const filledOptions = question.options
    .map((option, index) => ({ option: option.trim(), index }))
    .filter(entry => entry.option.length > 0);
  const correctOption = typeof question.correctOptionIndex === "number"
    ? question.options[question.correctOptionIndex]?.trim()
    : "";

  return (
    question.prompt.trim().length > 0 &&
    filledOptions.length >= 2 &&
    typeof question.correctOptionIndex === "number" &&
    correctOption.length > 0 &&
    Number(question.marks) > 0
  );
}

function normalizeQuestionForPayload(question: Question) {
  const options = question.options
    .map((option, index) => ({ value: option.trim(), originalIndex: index }))
    .filter(option => option.value.length > 0);
  const correctOptionIndex = options.findIndex(option => option.originalIndex === question.correctOptionIndex);
  return {
    prompt: question.prompt.trim(),
    options: options.map(option => option.value),
    correctOptionIndex,
    marks: Number(question.marks)
  };
}

function writtenQuestionIsValid(question: WrittenQuestion) {
  return question.prompt.trim().length > 0 && Number(question.marks) > 0;
}

function normalizeWrittenQuestionForPayload(question: WrittenQuestion) {
  return {
    prompt: question.prompt.trim(),
    options: [],
    marks: Number(question.marks)
  };
}

export default function TeacherTestsPage() {
  const allowed = useDashboardGuard("teacher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [duration, setDuration] = useState("30");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [rubric, setRubric] = useState("");
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [writtenQuestions, setWrittenQuestions] = useState<WrittenQuestion[]>([blankWrittenQuestion()]);
  const [writtenSourceMode, setWrittenSourceMode] = useState<WrittenSourceMode>("typed");
  const [testTypeTab, setTestTypeTab] = useState<"mcq" | "written" | "history">("mcq");
  const [saving, setSaving] = useState(false);

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

  async function loadAssessments() {
    const { data } = await api.get<Assessment[]>("/teacher/assessments");
    setAssessments(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!allowed) return;
    loadAssessments().catch((e) => setLoadErr(describeApiError(e)));
  }, [allowed]);

  const commonValid = title.trim() && sectionId && Number(duration) > 0 && startTime && endTime;
  const mcqValid = Boolean(commonValid && questions.length > 0 && questions.every(questionIsValid));
  const hasValidWrittenQuestions = writtenQuestions.length > 0 && writtenQuestions.every(writtenQuestionIsValid);
  const writtenSourceValid =
    writtenSourceMode === "typed"
      ? hasValidWrittenQuestions
      : Boolean(fileUrl.trim());
  const writtenValid = Boolean(commonValid && rubric.trim() && writtenSourceValid);

  if (!allowed) {
    return <main className="p-4 md:p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

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

  function resetForm() {
    setTitle("");
    setDuration("30");
    setStartTime("");
    setEndTime("");
    setFileUrl("");
    setRubric("");
    setQuestions([blankQuestion()]);
    setWrittenQuestions([blankWrittenQuestion()]);
    setWrittenSourceMode("typed");
  }

  function handleWrittenPaperUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateTest(type: "mcq" | "written") {
    try {
      setSaving(true);
      setLoadErr(null);
      setSuccess(null);
      const writtenQuestionsPayload =
        type === "written" && writtenSourceMode === "typed"
          ? writtenQuestions.filter(writtenQuestionIsValid).map(normalizeWrittenQuestionForPayload)
          : [];
      const writtenFileUrl =
        type === "written" && (writtenSourceMode === "link" || writtenSourceMode === "upload")
          ? fileUrl
          : undefined;
      await api.post("/teacher/assessments", {
        title,
        section: sectionId,
        type,
        durationMinutes: Number(duration),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        questions: type === "mcq"
          ? questions.map(normalizeQuestionForPayload)
          : writtenQuestionsPayload,
        fileUrl: writtenFileUrl,
        rubric: type === "written" ? rubric : undefined
      });
      setSuccess("Test draft created.");
      resetForm();
      await loadAssessments();
      setTestTypeTab("history");
      updateTestsUrl({ section: sectionId, type: "history" });
    } catch (e) {
      setLoadErr(describeApiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function publishAssessment(id: string) {
    try {
      setLoadErr(null);
      await api.patch(`/teacher/assessments/${id}/publish`);
      setSuccess("Test published.");
      await loadAssessments();
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  }

  async function deleteAssessment(id: string) {
    if (!confirm("Delete this draft test?")) return;
    try {
      setLoadErr(null);
      await api.delete(`/teacher/assessments/${id}`);
      setSuccess("Draft deleted.");
      await loadAssessments();
    } catch (e) {
      setLoadErr(describeApiError(e));
    }
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions(current => current.map((question, qIndex) => qIndex === index ? { ...question, ...patch } : question));
  }

  function updateWrittenQuestion(index: number, patch: Partial<WrittenQuestion>) {
    setWrittenQuestions(current => current.map((question, qIndex) => qIndex === index ? { ...question, ...patch } : question));
  }

  function selectWrittenSourceMode(mode: WrittenSourceMode) {
    setWrittenSourceMode(mode);
    setFileUrl("");
    if (mode !== "typed") {
      setWrittenQuestions([blankWrittenQuestion()]);
    }
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions(current => current.map((question, qIndex) => {
      if (qIndex !== questionIndex) return question;
      const options = question.options.map((option, idx) => idx === optionIndex ? value : option);
      return { ...question, options };
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions(current => current.map((question, qIndex) => {
      if (qIndex !== questionIndex || question.options.length <= 2) return question;
      const options = question.options.filter((_, idx) => idx !== optionIndex);
      const correctOptionIndex =
        question.correctOptionIndex === optionIndex
          ? null
          : typeof question.correctOptionIndex === "number" && question.correctOptionIndex > optionIndex
            ? question.correctOptionIndex - 1
            : question.correctOptionIndex;
      return { ...question, options, correctOptionIndex };
    }));
  }

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [assessments]
  );

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)] md:text-3xl">Manage Tests</h1>
        <p className="text-sm text-[var(--text-muted)]">Create drafts, publish ready tests, and export results.</p>
      </div>

      {loadErr && <p className="mb-4 text-sm text-[var(--accent-danger)]">{loadErr}</p>}
      {success && <p className="mb-4 text-sm text-[var(--accent-primary)]">{success}</p>}

      <Tabs value={testTypeTab} onValueChange={handleTypeChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="mcq">MCQ Test</TabsTrigger>
          <TabsTrigger value="written">Written Test</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {(["mcq", "written"] as const).map(type => (
          <TabsContent key={type} value={type}>
            <Card className="p-0">
              <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-4 md:px-6 md:py-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{type === "mcq" ? "Create MCQ Draft" : "Create Written Draft"}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {type === "mcq"
                    ? "Build objective questions with a marked correct option for auto-grading."
                    : "Choose how students will receive the written paper, then add the grading rubric."}
                </p>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
                <div>
                  <label className="text-xs uppercase text-[var(--text-muted)]">Test Title</label>
                  <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Quiz" />
                </div>
                <div>
                  <label className="text-xs uppercase text-[var(--text-muted)]">Section</label>
                  <select className="mt-1 flex h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm" value={sectionId} onChange={e => handleSectionChange(e.target.value)}>
                    <option value="" disabled>Select section...</option>
                    {sections.map(section => <option key={section._id} value={section._id}>{sectionLabel(section)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-[var(--text-muted)]">Duration (Minutes)</label>
                  <Input className="mt-1" type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} />
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

              {type === "mcq" ? (
                <div className="space-y-4 px-4 pb-4 md:px-6 md:pb-6">
                  {questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-medium">Question {questionIndex + 1}</h3>
                        <Button type="button" variant="ghost" size="sm" disabled={questions.length === 1} onClick={() => setQuestions(current => current.filter((_, idx) => idx !== questionIndex))}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </div>
                      <Input value={question.prompt} onChange={e => updateQuestion(questionIndex, { prompt: e.target.value })} placeholder="Question prompt" />
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                              <Input value={option} onChange={e => updateOption(questionIndex, optionIndex, e.target.value)} placeholder={`Option ${optionIndex + 1}`} />
                              <Button
                                type="button"
                                variant={question.correctOptionIndex === optionIndex ? "filled" : "ghost"}
                                size="sm"
                                className="shrink-0 gap-2"
                                onClick={() => updateQuestion(questionIndex, { correctOptionIndex: optionIndex })}
                                title="Mark this option as correct"
                              >
                                <Check className="h-4 w-4" />
                                Correct
                              </Button>
                              <Button type="button" variant="ghost" size="icon" disabled={question.options.length <= 2} onClick={() => removeOption(questionIndex, optionIndex)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="ghost" size="sm" onClick={() => updateQuestion(questionIndex, { options: [...question.options, ""] })}>
                            <Plus className="mr-2 h-4 w-4" /> Add option
                          </Button>
                        </div>
                        <div>
                          <label className="text-xs uppercase text-[var(--text-muted)]">Marks</label>
                          <Input className="mt-1 w-full sm:w-24" type="number" min="1" value={question.marks} onChange={e => updateQuestion(questionIndex, { marks: Number(e.target.value) })} />
                        </div>
                      </div>
                      {!questionIsValid(question) && <p className="mt-2 text-xs text-[var(--accent-danger)]">Fill the prompt, at least two non-empty options, mark one filled option as correct, and set marks.</p>}
                    </Card>
                  ))}
                  <Button type="button" variant="ghost" onClick={() => setQuestions(current => [...current, blankQuestion()])}>
                    <Plus className="mr-2 h-4 w-4" /> Add question
                  </Button>
                </div>
              ) : (
                <div className="grid gap-5 px-4 pb-4 md:px-6 md:pb-6">
                  <div>
                    <p className="mb-3 text-xs uppercase text-[var(--text-muted)]">Question Source</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {([
                        { value: "typed", title: "Type questions", description: "Create each written question here." },
                        { value: "link", title: "Link", description: "Paste a paper URL for students." },
                        { value: "upload", title: "Image / PDF", description: "Attach a scanned or digital paper." }
                      ] as Array<{ value: WrittenSourceMode; title: string; description: string }>).map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectWrittenSourceMode(option.value)}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            writtenSourceMode === option.value
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]"
                          }`}
                        >
                          <span className="block font-medium text-[var(--text-primary)]">{option.title}</span>
                          <span className="mt-1 block text-xs text-[var(--text-muted)]">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {writtenSourceMode === "typed" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[var(--text-primary)]">Typed Questions</h3>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setWrittenQuestions(current => [...current, blankWrittenQuestion()])}>
                          <Plus className="mr-2 h-4 w-4" /> Add question
                        </Button>
                      </div>
                      {writtenQuestions.map((question, questionIndex) => (
                        <Card key={questionIndex} className="p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="font-medium">Question {questionIndex + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={writtenQuestions.length === 1}
                              onClick={() => setWrittenQuestions(current => current.filter((_, idx) => idx !== questionIndex))}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <textarea
                              className="min-h-[90px] w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm"
                              value={question.prompt}
                              onChange={e => updateWrittenQuestion(questionIndex, { prompt: e.target.value })}
                              placeholder="Write the question students should answer..."
                            />
                            <div>
                              <label className="text-xs uppercase text-[var(--text-muted)]">Marks</label>
                              <Input
                                className="mt-1 w-full sm:w-24"
                                type="number"
                                min="1"
                                value={question.marks}
                                onChange={e => updateWrittenQuestion(questionIndex, { marks: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                          {!writtenQuestionIsValid(question) && (
                            <p className="mt-2 text-xs text-[var(--accent-danger)]">Question text and marks are required.</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {writtenSourceMode === "link" && (
                    <div>
                      <label className="text-xs uppercase text-[var(--text-muted)]">Question Paper Link</label>
                      <Input className="mt-1" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  )}

                  {writtenSourceMode === "upload" && (
                    <div>
                      <label className="text-xs uppercase text-[var(--text-muted)]">Image / PDF Upload</label>
                      <Input className="mt-1" type="file" accept="image/*,.pdf" onChange={e => handleWrittenPaperUpload(e.target.files?.[0] ?? null)} />
                    {fileUrl.startsWith("data:image/") && (
                      <img src={fileUrl} alt="Uploaded question paper preview" className="mt-3 max-h-64 rounded-lg border border-[var(--border-subtle)] object-contain" />
                    )}
                    {fileUrl.startsWith("data:application/pdf") && (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">PDF question paper attached.</p>
                    )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs uppercase text-[var(--text-muted)]">Grading Rubric</label>
                    <textarea className="mt-1 min-h-[120px] w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm" value={rubric} onChange={e => setRubric(e.target.value)} />
                  </div>
                  {!writtenValid && (
                    <p className="text-xs text-[var(--accent-danger)]">
                      {writtenSourceMode === "typed"
                        ? "Add at least one typed question and fill the rubric."
                        : "Attach or link the question paper and fill the rubric."}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-[var(--border-subtle)] px-4 py-4 md:px-6 md:py-5">
                <Button onClick={() => handleCreateTest(type)} disabled={saving || (type === "mcq" ? !mcqValid : !writtenValid)} variant="filled">
                  {saving ? "Creating..." : "Create Test (Draft)"}
                </Button>
              </div>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="history">
          <ResponsiveTable
            items={sortedAssessments}
            getKey={(assessment) => assessment._id}
            empty={<Card className="p-6 text-center text-[var(--text-muted)]">No tests created yet.</Card>}
            table={
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Window</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {sortedAssessments.map(assessment => (
                    <tr key={assessment._id}>
                      <td className="px-4 py-3 font-medium">{assessment.title}</td>
                      <td className="px-4 py-3">{assessment.type.toUpperCase()}</td>
                      <td className="px-4 py-3"><Badge tone={assessment.status === "published" ? "green" : assessment.status === "draft" ? "blue" : "muted"}>{assessment.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(assessment.startTime).toLocaleString()} - {new Date(assessment.endTime).toLocaleString()}</td>
                      <td className="px-4 py-3">{assessment.questions?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {assessment.status === "draft" ? (
                            <>
                              <Button size="sm" variant="filled" onClick={() => publishAssessment(assessment._id)}>Publish</Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteAssessment(assessment._id)}>Delete</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/teacher/analytics?test=${assessment._id}`)}>Analytics</Button>
                              <Button size="sm" variant="ghost" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/teacher/assessments/${assessment._id}/export`, "_blank")}>Export CSV</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
            renderCard={(assessment) => (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--text-primary)]">{assessment.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{assessment.type.toUpperCase()} - {assessment.questions?.length ?? 0} questions</p>
                  </div>
                  <Badge tone={assessment.status === "published" ? "green" : assessment.status === "draft" ? "blue" : "muted"}>{assessment.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {new Date(assessment.startTime).toLocaleString()} - {new Date(assessment.endTime).toLocaleString()}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {assessment.status === "draft" ? (
                    <>
                      <Button size="sm" variant="filled" className="h-10" onClick={() => publishAssessment(assessment._id)}>Publish</Button>
                      <Button size="sm" variant="ghost" className="h-10" onClick={() => deleteAssessment(assessment._id)}>Delete</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" className="h-10" onClick={() => router.push(`/dashboard/teacher/analytics?test=${assessment._id}`)}>Analytics</Button>
                      <Button size="sm" variant="ghost" className="h-10" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/teacher/assessments/${assessment._id}/export`, "_blank")}>Export</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
