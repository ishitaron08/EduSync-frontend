"use client";

import { useQuery } from "@tanstack/react-query";
import { getBackendOrigin } from "@/lib/backendOrigin";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function SystemHealth() {
  const healthQuery = useQuery({
    queryKey: queryKeys.health.system,
    queryFn: async () => {
    const origin = getBackendOrigin();
    const start = performance.now();
      const response = await fetch(`${origin}/health`);
      return { ms: Math.round(performance.now() - start), ok: response.ok };
    },
    refetchInterval: 60 * 1000
  });
  const ms = healthQuery.data?.ms ?? null;
  const status: "ok" | "err" = healthQuery.data?.ok && !healthQuery.isError ? "ok" : "err";

  const spark = [12, 18, 14, 22, 19, 24, 20];

  return (
    <Card className="border-[var(--accent-secondary)]/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">API gateway</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status === "ok" ? "animate-ping bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  status === "ok" ? "bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"
                }`}
              />
            </span>
            <Badge tone={status === "ok" ? "green" : "muted"}>{status === "ok" ? "Active" : "Error"}</Badge>
            {ms != null && <span className="font-mono text-xs text-[var(--text-muted)]">{ms}ms</span>}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">ML service (stub)</p>
          <Badge tone="blue" className="mt-2">
            Active
          </Badge>
        </div>
        <div className="flex items-end gap-0.5">
          {spark.map((h, i) => (
            <div key={i} className="w-1 rounded-sm bg-[var(--accent-secondary)]/60" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>
    </Card>
  );
}
