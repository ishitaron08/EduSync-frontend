"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { getBackendOrigin } from "@/lib/backendOrigin";

type Status = "checking" | "ok" | "error";

export function BackendHealth() {
  const healthUrl = `${getBackendOrigin()}/health`;
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>(healthUrl);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    fetch(healthUrl)
      .then(async (res) => {
        if (!res.ok) {
          setStatus("error");
          setDetail(`${healthUrl} (HTTP ${res.status})`);
          return;
        }
        const body = await res.json().catch(() => ({}));
        setStatus("ok");
        setDetail(`${healthUrl} | ${JSON.stringify(body)}`);
      })
      .catch((err: Error) => {
        setStatus("error");
        setDetail(`${healthUrl} | ${err.message}`);
      });
  }, [attempt, healthUrl]);

  return (
    <article className="rounded-[2.5rem] border border-zinc-800 bg-zinc-950/65 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">Backend health</p>
        <button
          type="button"
          onClick={() => {
            setStatus("checking");
            setAttempt((value) => value + 1);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-zinc-600 hover:text-zinc-100 active:-translate-y-[1px] active:scale-[0.98]"
        >
          <ReloadIcon className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>

      {status === "checking" && (
        <div className="mt-4 space-y-2">
          <div className="nc-skeleton h-4 w-24 rounded-md" />
          <div className="nc-skeleton h-3 w-full rounded-md" />
          <div className="nc-skeleton h-3 w-4/5 rounded-md" />
        </div>
      )}

      {status === "ok" && (
        <p className="mt-3 text-sm text-emerald-300">Operational and reachable.</p>
      )}

      {status === "error" && (
        <div className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/30 p-3">
          <p className="text-sm text-rose-300">Unreachable or returning an error.</p>
          <p className="mt-1 text-xs text-zinc-400">Check backend URL, CORS policy, and health route deployment.</p>
        </div>
      )}

      <p className="mt-3 break-all font-[family-name:var(--font-jetbrains)] text-xs text-zinc-500">{detail}</p>
    </article>
  );
}
