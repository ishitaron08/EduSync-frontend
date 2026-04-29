"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronUp,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListTodo,
  ScanLine,
  Trophy,
  Settings2,
  Sparkles,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

type NavItem = { href: string; label: string; icon: typeof Home; roles?: Array<"student" | "teacher" | "admin"> };

const baseNav: NavItem[] = [{ href: "/", label: "Home", icon: Home }];

export function AppSidebar({ expanded }: { expanded: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const roleNav: NavItem[] = [];
  if (role) {
    roleNav.push({ href: `/dashboard/${role}`, label: "Dashboard", icon: LayoutDashboard });
  }
  if (role === "student") {
    roleNav.push(
      { href: "/timetable", label: "Timetable", icon: Calendar, roles: ["student"] },
      { href: "/attendance", label: "Attendance", icon: ScanLine, roles: ["student"] },
      { href: "/goals", label: "Goals", icon: Target, roles: ["student"] },
      { href: "/tasks", label: "Tasks", icon: ListTodo, roles: ["student"] },
      { href: "/assessments", label: "Assessments", icon: ClipboardCheck, roles: ["student"] },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["student"] },
      { href: "/recommendations", label: "Navigator", icon: Sparkles, roles: ["student"] },
      { href: "/rewards", label: "Rewards", icon: GraduationCap, roles: ["student"] }
    );
  }
  if (role === "teacher") {
    roleNav.push(
      { href: "/assessments", label: "Assessments", icon: ClipboardCheck, roles: ["teacher"] },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["teacher"] }
    );
  }
  if (role === "admin") {
    roleNav.push({ href: "/admin/setup", label: "Admin setup", icon: Settings2, roles: ["admin"] });
  }

  const items = role ? [...baseNav, ...roleNav] : baseNav;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-[12px] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        expanded ? "w-[252px]" : "w-16"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-[var(--border-subtle)] px-3">
        <Link
          href="/"
          className={cn(
            "font-[family-name:var(--font-fraunces)] font-semibold text-[var(--text-primary)]",
            expanded ? "text-lg" : "text-xl text-[var(--accent-primary)]"
          )}
        >
          {expanded ? "EduSync" : "E"}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 p-2.5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                active && "border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/8 text-[var(--text-primary)] shadow-[0_8px_18px_rgba(15,118,110,0.1)]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-[var(--accent-primary)] opacity-90" strokeWidth={1.6} />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {role ? (
        <div className="relative border-t border-[var(--border-subtle)] p-2">
          {menuOpen ? (
            <div className="absolute bottom-14 left-2 right-2 z-20 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-lg">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block rounded px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  router.replace("/auth");
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--bg-elevated)]"
              >
                Logout
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-[var(--bg-elevated)]",
              pathname.startsWith("/profile") && "border-[var(--accent-primary)] bg-[var(--bg-elevated)]"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--accent-secondary)]">
              {(user?.name?.[0] ?? role[0] ?? "?").toUpperCase()}
            </div>
            {expanded ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.name ?? "Profile"}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{user?.phone ?? role}</p>
              </div>
            ) : null}
            {expanded ? <ChevronUp className={cn("h-4 w-4 text-[var(--text-muted)]", menuOpen && "rotate-180")} /> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
