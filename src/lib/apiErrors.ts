import axios from "axios";

export function describeApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    const firstIssueMessage = data?.issues?.[0]?.message;
    if (typeof firstIssueMessage === "string" && firstIssueMessage) {
      return firstIssueMessage;
    }
    const msg = data?.message ?? data?.error?.message;
    if (typeof msg === "string" && msg) return msg;
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Network error — is the backend running on the configured URL?";
    }
    if (status === 401) return "401 — log in (or your session expired).";
    if (status === 403) return "403 — this account cannot access this resource.";
    if (status === 404) return "404 — no resource found (e.g. no timetable yet; use Admin setup as admin).";
    if (status) return `Request failed (${status}).`;
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
