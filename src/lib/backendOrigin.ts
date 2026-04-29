/** Backend HTTP origin (no /api) for /health and similar. */
export function getBackendOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  try {
    const u = new URL(apiUrl);
    let pathname = u.pathname.replace(/\/$/, "");
    if (pathname.endsWith("/api")) {
      pathname = pathname.slice(0, -4) || "/";
      u.pathname = pathname === "/" ? "" : pathname;
    }
    return u.origin + (pathname && pathname !== "/" ? pathname : "");
  } catch {
    return "http://localhost:5000";
  }
}
