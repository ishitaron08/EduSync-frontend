"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, Loader2, LockKeyhole, MessageCircle, Send, ShieldCheck, UserRound } from "lucide-react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { queryKeys } from "@/lib/queryKeys";
import { useDashboardGuard } from "@/lib/authGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatStatus = {
  quota: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: string;
  };
  provider: string;
  model: string;
  privacy: {
    stored: boolean;
    context: string;
  };
};

type ChatResponse = {
  reply: string;
  quota: ChatStatus["quota"];
  provider: string;
  model: string;
  privacy: {
    stored: boolean;
    redacted: boolean;
  };
};

const STARTER_PROMPTS = [
  "Explain this topic in simple terms",
  "Make a 30 minute study plan",
  "Give me practice questions",
  "Help me debug my code"
];

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatReset(value?: string) {
  if (!value) return "tomorrow";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

export default function StudentChatPage() {
  const allowed = useDashboardGuard("student");
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask me for explanations, study plans, practice questions, writing help, coding help, or career prep. I will keep it focused and privacy-safe."
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: queryKeys.student.chatStatus,
    queryFn: async () => {
      const { data } = await api.get<ChatStatus>("/student/chat/status");
      return data;
    },
    enabled: allowed
  });

  const quota = statusQuery.data?.quota;
  const visibleHistory = useMemo(
    () => messages
      .filter((message) => message.id !== "welcome")
      .slice(-6)
      .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post<ChatResponse>("/student/chat", {
        message,
        history: visibleHistory
      });
      return data;
    },
    onSuccess: (data) => {
      setMessages((current) => [
        ...current.filter((message) => message.id !== "pending"),
        { id: messageId(), role: "assistant", content: data.reply }
      ]);
      queryClient.setQueryData<ChatStatus | undefined>(queryKeys.student.chatStatus, (current) =>
        current ? { ...current, quota: data.quota, provider: data.provider, model: data.model } : current
      );
    },
    onError: (err) => {
      setMessages((current) => current.filter((message) => message.id !== "pending"));
      setError(describeApiError(err));
    }
  });

  function sendMessage(value: string) {
    const trimmed = value.trim();
    if (!trimmed || chatMutation.isPending) return;
    if (quota && quota.remaining <= 0) {
      setError(`Daily chat limit reached. Resets ${formatReset(quota.resetAt)}.`);
      return;
    }

    setError(null);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: messageId(), role: "user", content: trimmed },
      { id: "pending", role: "assistant", content: "Thinking..." }
    ]);
    chatMutation.mutate(trimmed);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  if (!allowed) {
    return (
      <main className="p-4 md:p-6">
        <div className="nc-skeleton h-10 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-56px)] w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:h-[calc(100dvh-56px)] lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Student assistant</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Study Chat</h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
                Ask for help learning, planning, coding, writing, revision, or career prep.
              </p>
            </div>
            <Badge tone={quota && quota.remaining <= 3 ? "destructive" : "green"}>
              {quota ? `${quota.remaining}/${quota.limit} left` : "Loading quota"}
            </Badge>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-success)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Privacy guard</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Chats are not stored by EduSync. Do not send passwords, OTPs, API keys, phone numbers, or private records.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {error ? (
        <div className="rounded-lg border border-[var(--accent-danger)]/25 bg-[var(--accent-danger)]/8 p-3 text-sm text-[var(--accent-danger)]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <section className="grid min-h-0 gap-4 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex min-h-[420px] flex-col p-0 lg:min-h-0">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isPending = message.id === "pending";
              return (
                <div key={message.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    </div>
                  ) : null}
                  <div
                    className={[
                      "max-w-[min(760px,85%)] overflow-hidden whitespace-pre-wrap break-words rounded-lg px-4 py-3 text-sm leading-6",
                      isUser
                        ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                        : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    ].join(" ")}
                  >
                    {message.content}
                  </div>
                  {isUser ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <UserRound className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] p-3 md:p-4">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 1200))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about a topic, plan, assignment, project, or doubt..."
                className="min-h-[48px] flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-primary)]/12"
                disabled={chatMutation.isPending || Boolean(quota && quota.remaining <= 0)}
              />
              <Button
                type="submit"
                className="h-12 w-12 shrink-0 p-0"
                disabled={!input.trim() || chatMutation.isPending || Boolean(quota && quota.remaining <= 0)}
                aria-label="Send message"
              >
                {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>{input.length}/1200 characters</span>
              <span>{quota ? `Resets ${formatReset(quota.resetAt)}` : "Checking quota..."}</span>
            </div>
          </form>
        </Card>

        <aside className="min-w-0 space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[var(--accent-primary)]" />
              <p className="font-semibold text-[var(--text-primary)]">Try asking</p>
            </div>
            <div className="space-y-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-[border-color,background-color] hover:border-[var(--accent-primary)]/35 hover:bg-[var(--bg-primary)]"
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Usage limits</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Each student has a daily quota and a short per-minute limit to keep API usage controlled.
                </p>
                <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Used</span><span>{quota?.used ?? 0}</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-[var(--text-muted)]">Daily limit</span><span>{quota?.limit ?? "..."}</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-[var(--text-muted)]">Model</span><span className="max-w-[150px] truncate">{statusQuery.data?.model ?? "..."}</span></div>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </section>
    </main>
  );
}
