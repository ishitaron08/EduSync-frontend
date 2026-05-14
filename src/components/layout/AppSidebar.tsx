"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronUp,
  Calendar,
  ClipboardCheck,
  LogOut,
  GraduationCap,
  LayoutDashboard,
  ScanLine,
  Trophy,
  Sparkles,
  Target,
  Users,
  Settings,
  Activity,
  Layers,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; section?: string; roles?: Array<"student" | "teacher" | "admin"> };

type AppSidebarProps = {
  expanded: boolean;
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({ expanded, mobile = false, className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const roleNav: NavItem[] = [];
  if (role === "admin") {
    roleNav.push(
      { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
      { href: "/dashboard/admin/users", label: "User Management", icon: Users, roles: ["admin"] },
      { href: "/dashboard/admin/sections", label: "Section Management", icon: Layers, roles: ["admin"] },
      { href: "/dashboard/admin/timetable", label: "Timetable Management", icon: Calendar, roles: ["admin"] },
      { href: "/dashboard/admin/attendance", label: "Attendance Records", icon: ScanLine, roles: ["admin"] },
      { href: "/dashboard/admin/analytics", label: "Learning Analytics", icon: Activity, roles: ["admin"] }
    );
  } else if (role === "student") {
    roleNav.push({ href: `/dashboard/${role}`, label: "Dashboard", icon: LayoutDashboard });
  }
  if (role === "student") {
    roleNav.push(
      { href: "/dashboard/student/timetable", label: "Timetable", icon: Calendar, roles: ["student"] },
      { href: "/dashboard/student/attendance", label: "Attendance", icon: ScanLine, roles: ["student"] },
      { href: "/dashboard/student/learning", label: "AI Learning", icon: Sparkles, roles: ["student"] },
      { href: "/dashboard/student/syllabus-goals", label: "Syllabus Goals", icon: Target, roles: ["student"] },
      { href: "/dashboard/student/assessments", label: "Assessments", icon: ClipboardCheck, roles: ["student"] },
      { href: "/dashboard/student/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["student"] },
      { href: "/dashboard/student/profile", label: "Profile", icon: Settings, roles: ["student"] }
    );
  }
  if (role === "teacher") {
    roleNav.push(
      { href: "/dashboard/teacher", label: "Dashboard", icon: LayoutDashboard, roles: ["teacher"] },
      { href: "/dashboard/teacher/timetable", label: "My Schedule", icon: Calendar, roles: ["teacher"] },
      { href: "/dashboard/teacher/attendance", label: "Attendance", icon: ScanLine, roles: ["teacher"] },
      { href: "/dashboard/teacher/tests", label: "Create Tests", icon: ClipboardCheck, roles: ["teacher"] },
      { href: "/dashboard/teacher/analytics", label: "Test Analytics", icon: Activity, roles: ["teacher"] },
      { href: "/dashboard/teacher/students", label: "Student Progress", icon: GraduationCap, roles: ["teacher"] },
      { href: "/dashboard/teacher/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["teacher"] }
    );
  }

  const items = role ? roleNav : [];

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        mobile ? "h-[100dvh] w-[280px] max-w-[86vw]" : "h-full",
        !mobile && (expanded ? "w-[252px]" : "w-16"),
        className
      )}
    >
      <div className="flex h-14 items-center border-b border-[var(--border-subtle)] px-3">
        <Link
          href={role ? `/dashboard/${role}` : "/auth"}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg font-semibold text-[var(--text-primary)]",
            expanded ? "px-2 text-lg" : "mx-auto w-9 justify-center bg-[var(--accent-primary)] text-sm text-[var(--text-inverse)]"
          )}
        >
          {expanded ? (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-xs text-[var(--text-inverse)]">E</span>
              EduSync
            </>
          ) : "E"}
        </Link>
      </div>
      <nav className="flex flex-col gap-1 overflow-y-auto p-2.5">
        {expanded && role ? (
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {role === "student" ? "Student workspace" : role === "teacher" ? "Teaching tools" : "Admin tools"}
          </p>
        ) : null}
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-[background-color,border-color,color] duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                active && "border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} strokeWidth={1.8} />
              {expanded && <span className="truncate">{item.label}</span>}
              {expanded && active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" /> : null}
            </Link>
          );
        })}
      </nav>
      {role ? (
        <div className="relative mt-auto border-t border-[var(--border-subtle)] p-2">
          {menuOpen ? (
            <div className="absolute bottom-14 left-2 right-2 z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-lift)]">
              <Link
                href={role === "student" ? "/dashboard/student/profile" : "/profile"}
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                <UserRound className="h-4 w-4" />
                Profile
              </Link>
              {role === "admin" && (
                <Link
                  href="/dashboard/admin/settings"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  router.replace("/auth");
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--bg-elevated)]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-[var(--bg-elevated)]",
              (pathname.startsWith("/profile") || pathname.endsWith("/profile")) && "border-[var(--accent-primary)] bg-[var(--bg-elevated)]"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--accent-secondary)]">
              {(user?.name?.[0] ?? role[0] ?? "?").toUpperCase()}
            </div>
            {expanded ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.name ?? "Profile"}</p>
                <p className="truncate text-xs capitalize text-[var(--text-muted)]">{user?.phone ?? role}</p>
              </div>
            ) : null}
            {expanded ? <ChevronUp className={cn("h-4 w-4 text-[var(--text-muted)]", menuOpen && "rotate-180")} /> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
