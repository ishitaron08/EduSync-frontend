"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  BookOpenText,
  Brain,
  CalendarRange,
  CheckCircle2,
  ChartColumnBig,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileWarning,
  GraduationCap,
  HardDrive,
  Hexagon,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Monitor,
  RefreshCcw,
  Search,
  Server,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  UserCheck,
  UserX,
  UsersRound,
  Wallet
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { cn } from "@/lib/utils";
import {
  activityTimeline,
  courseCategoryDistribution,
  courseEnrollments,
  courseRows,
  examAlerts,
  examDistribution,
  examMixDistribution,
  examQuestions,
  examRows,
  failedPaymentRows,
  geoDistribution,
  instructorComparison,
  instructorGrowth,
  instructorRows,
  lowEngagementCourses,
  logRows,
  monitoringCards,
  overviewInsights,
  overviewMetrics,
  overviewTrend,
  platformAlerts,
  revenueSourceDistribution,
  revenueTrend,
  roleDistribution,
  sentimentTrend,
  settingsItems,
  studentHeatmap,
  studentInsights,
  studentRadar,
  studentRows,
  supportRows,
  supportTrend,
  topSellingCourses,
  userRetention,
  userRows,
  userSessions,
  weeklyHeatmap
} from "./dashboard-data";

type FilterTone = "primary" | "success" | "warning" | "danger" | "info";

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

const chartTooltipStyle = {
  borderRadius: 16,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)"
};

const toneStyles: Record<FilterTone, string> = {
  primary: "border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  success: "border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 text-[var(--accent-success)]",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  danger: "border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-700"
};

const metricIcons: Record<string, ReactNode> = {
  "Total Students": <UsersRound className="h-4 w-4" />,
  "Teachers / Instructors": <GraduationCap className="h-4 w-4" />,
  "Total Courses": <BookOpenCheck className="h-4 w-4" />,
  "Active Users": <Activity className="h-4 w-4" />,
  "New Registrations": <Sparkles className="h-4 w-4" />,
  "Course Completion": <CheckCircle2 className="h-4 w-4" />,
  "Total Revenue": <Landmark className="h-4 w-4" />,
  "Pending Tickets": <AlertTriangle className="h-4 w-4" />,
  "Active Subscriptions": <Wallet className="h-4 w-4" />,
  "Platform Growth": <ArrowUpRight className="h-4 w-4" />
};

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function SectionTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</p>
        <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, delta, note, tone }: { label: string; value: string; delta: string; note: string; tone: FilterTone }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
          tone === "success" && "from-emerald-400 to-emerald-600",
          tone === "warning" && "from-amber-300 to-amber-500",
          tone === "danger" && "from-rose-400 to-rose-600",
          tone === "info" && "from-sky-400 to-sky-600",
          tone === "primary" && "from-[var(--accent-primary)] to-[var(--accent-secondary)]"
        )}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{value}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{note}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border text-sm", toneStyles[tone])}>{metricIcons[label] ?? <Hexagon className="h-4 w-4" />}</div>
      </div>
      <p className={cn("mt-4 inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]", toneStyles[tone])}>{delta}</p>
    </Card>
  );
}

function ChartCard({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-4 md:p-5">
      <SectionTitle title={title} description={description} action={action} />
      <div className="mt-4 h-[320px]">{children}</div>
    </Card>
  );
}

function TableCard({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-4 md:p-5">
      <SectionTitle title={title} description={description} action={action} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)]">{children}</div>
    </Card>
  );
}

function Pill({ children, tone = "primary" }: { children: ReactNode; tone?: FilterTone }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]", toneStyles[tone])}>{children}</span>;
}

function ProgressRow({ label, value, tone = "primary" }: { label: string; value: number; tone?: FilterTone }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
        <div
          className={cn(
            "h-2 rounded-full",
            tone === "success" && "bg-[var(--accent-success)]",
            tone === "warning" && "bg-amber-400",
            tone === "danger" && "bg-[var(--accent-danger)]",
            tone === "info" && "bg-sky-500",
            tone === "primary" && "bg-[var(--accent-primary)]"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Heatmap({ rows }: { rows: typeof weeklyHeatmap }) {
  const labels = ["6a", "9a", "12p", "3p", "6p", "9p", "12a"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
        <span />
        {labels.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-2">
            <span className="self-center font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{row.label}</span>
            {row.cells.map((cell, index) => (
              <div
                key={`${row.label}-${index}`}
                className="aspect-square rounded-xl border border-[var(--border-subtle)]"
                style={{
                  backgroundColor: `rgba(15, 118, 110, ${Math.max(0.08, cell / 100)})`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)"
                }}
                title={`${row.label} ${labels[index]} - ${cell}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTimeline() {
  return (
    <div className="space-y-4">
      {activityTimeline.map((item) => (
        <div key={`${item.time}-${item.title}`} className="flex gap-4">
          <div className="flex w-16 shrink-0 flex-col items-end pt-0.5 text-right font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            <span>{item.time}</span>
          </div>
          <div className="relative flex-1 border-l border-[var(--border-subtle)] pl-4 pb-4">
            <span
              className={cn(
                "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-white",
                item.tone === "success" && "bg-[var(--accent-success)]",
                item.tone === "warning" && "bg-amber-500",
                item.tone === "danger" && "bg-[var(--accent-danger)]",
                item.tone === "info" && "bg-sky-500",
                item.tone === "primary" && "bg-[var(--accent-primary)]"
              )}
            />
            <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeatmapTable({ rows }: { rows: typeof studentHeatmap }) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] gap-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
        <span />
        {labels.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] gap-2">
          <span className="self-center truncate text-sm text-[var(--text-primary)]">{row.name}</span>
          {row.values.map((value, index) => (
            <div
              key={`${row.name}-${index}`}
              className="aspect-square rounded-xl border border-[var(--border-subtle)]"
              style={{ backgroundColor: `rgba(15, 118, 110, ${Math.max(0.08, value / 100)})` }}
              title={`${row.name} ${labels[index]}: ${value}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: FilterTone; children: ReactNode }) {
  return <Badge tone={tone === "danger" ? "muted" : tone === "info" ? "blue" : tone === "success" ? "green" : tone === "warning" ? "amber" : "amber"} className={cn(tone === "danger" && "border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]")}>{children}</Badge>;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [courseFilter, setCourseFilter] = useState("All categories");
  const [supportFilter, setSupportFilter] = useState("All tickets");
  const [exportFormat, setExportFormat] = useState("PDF");
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [rbacEnabled, setRbacEnabled] = useState(true);
  const [darkPreview, setDarkPreview] = useState(false);

  const filteredUsers = useMemo(
    () =>
      userRows.filter((user) => {
        const matchesSearch = [user.name, user.email, user.location, user.role, user.status].some((value) => value.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
        const matchesStatus = statusFilter === "All statuses" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [roleFilter, search, statusFilter]
  );

  const filteredCourses = useMemo(
    () =>
      courseRows.filter((course) => {
        const matchesSearch = [course.title, course.category, course.instructor, course.status].some((value) => value.toLowerCase().includes(search.toLowerCase()));
        const matchesCourse = courseFilter === "All categories" || course.category === courseFilter;
        return matchesSearch && matchesCourse;
      }),
    [courseFilter, search]
  );

  const filteredTickets = useMemo(
    () =>
      supportRows.filter((ticket) => {
        const matchesSearch = [ticket.ticket, ticket.category, ticket.priority, ticket.status].some((value) => value.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = supportFilter === "All tickets" || ticket.status === supportFilter;
        return matchesSearch && matchesFilter;
      }),
    [search, supportFilter]
  );

  const darkPreviewClass = darkPreview ? "bg-slate-950 text-slate-100" : "";

  return (
    <main className={cn("relative mx-auto min-h-full max-w-[1600px] px-4 py-5 md:px-6 lg:px-8", darkPreviewClass)}>
      <motion.div initial="hidden" animate="show" variants={sectionVariants} transition={{ staggerChildren: 0.08 }} className="space-y-8">
        <motion.section variants={sectionVariants} className="relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(15,118,110,0.1),rgba(255,255,255,0.92))] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
            <div className="absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
          </div>
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="amber">Admin only</Badge>
                <Badge tone="green">Live analytics</Badge>
                <Badge tone="blue">Role-based access</Badge>
              </div>
              <div className="max-w-3xl">
                <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">Platform command center</h1>
                <p className="mt-3 text-base leading-7 text-[var(--text-muted)] md:text-lg">
                  Executive-grade visibility across students, teachers, courses, revenue, support, exams, and system health in a single production-ready dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="filled" className="gap-2">
                  <Download className="h-4 w-4" /> Export report
                </Button>
                <Button variant="ghost" className="gap-2">
                  <Search className="h-4 w-4" /> Advanced search
                </Button>
                <Button variant="ghost" className="gap-2">
                  <Bell className="h-4 w-4" /> Notifications
                </Button>
              </div>
            </div>
            <Card className="border-[var(--border-highlight)]/60 bg-white/80 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Today&apos;s operations</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">124 active signals</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Coverage</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">All core modules online</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Uptime</p>
                  <p className="mt-2 text-lg font-semibold">99.98%</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Latency</p>
                  <p className="mt-2 text-lg font-semibold">124ms</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Risk</p>
                  <p className="mt-2 text-lg font-semibold">Low</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.section>

        <motion.section variants={sectionVariants} className="space-y-4">
          <SectionTitle
            title="Overview controls"
            description="Keep the dashboard scoped to a specific operating window, export format, or notification state."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
                <Button variant="ghost" className="gap-2">
                  <CalendarRange className="h-4 w-4" /> Last 30 days
                </Button>
                <Button variant="ghost" className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
              </div>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {overviewMetrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </motion.section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0">
            {[
              ["overview", "Overview", LayoutDashboard],
              ["users", "Users", UsersRound],
              ["courses", "Courses", BookOpenText],
              ["students", "Students", GraduationCap],
              ["instructors", "Instructors", UserCheck],
              ["revenue", "Revenue", Landmark],
              ["exams", "Exams", ChartColumnBig],
              ["support", "Support", ListChecks],
              ["monitoring", "Monitoring", Monitor],
              ["settings", "Settings", Settings2]
            ].map(([value, label, Icon]) => (
              <TabsTrigger key={value as string} value={value as string} className="gap-2 shrink-0">
                <Icon className="h-4 w-4" />
                {label as string}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Platform growth" description="Students, teachers, courses, revenue, active users, and subscriptions over time.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="overviewRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="overviewUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Area type="monotone" dataKey="activeUsers" name="Active users" stroke="#2563eb" fillOpacity={1} fill="url(#overviewUsers)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f766e" fillOpacity={1} fill="url(#overviewRevenue)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title="Weekly engagement heatmap" description="Peak learning activity across days and times.">
                    <Heatmap rows={weeklyHeatmap} />
                  </ChartCard>
                  <Card className="p-4 md:p-5">
                    <SectionTitle title="Activity timeline" description="Recent platform milestones and operational events." />
                    <div className="mt-4 max-h-[320px] overflow-auto pr-1">
                      <ActivityTimeline />
                    </div>
                  </Card>
                </div>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <ChartCard title="User distribution" description="Role mix across the platform.">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleDistribution} dataKey="value" nameKey="name" innerRadius={78} outerRadius={120} paddingAngle={3}>
                        {roleDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="AI insights" description="Suggested actions surfaced from trend and anomaly analysis." />
                  <div className="mt-4 space-y-3">
                    {overviewInsights.map((insight) => (
                      <div key={insight.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 p-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-[var(--accent-primary)]" />
                          <p className="font-medium text-[var(--text-primary)]">{insight.title}</p>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{insight.detail}</p>
                        <div className="mt-3">
                          <Pill tone={insight.tone}>{insight.tone === "danger" ? "High priority" : insight.tone === "warning" ? "Review" : insight.tone === "success" ? "Opportunity" : "Watchlist"}</Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Notifications center" description="Live alerts across security, billing, support, and operations." />
                  <div className="mt-4 space-y-3">
                    {platformAlerts.map((alert) => (
                      <div key={alert.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--text-primary)]">{alert.label}</p>
                          <Badge tone={alert.label === "Security" ? "amber" : alert.label === "System" ? "muted" : "blue"}>{alert.value}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{alert.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Student count" value="24,860" delta="+12.8%" note="Enrolled learners" tone="primary" />
              <MetricCard label="Instructor count" value="1,284" delta="+5.4%" note="Verified instructors" tone="info" />
              <MetricCard label="Daily active users" value="18,640" delta="+16.3%" note="Active within 7 days" tone="success" />
              <MetricCard label="Retention analytics" value="78.4%" delta="+3.2 pts" note="Returning learners" tone="warning" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <Card className="p-4 md:p-5">
                  <SectionTitle
                    title="User management"
                    description="Search, filter, verify, block, and inspect activity without leaving the admin workspace."
                    action={
                      <div className="flex flex-wrap items-center gap-2">
                        <Input placeholder="Search users, email, location" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                          <option>All roles</option>
                          <option>Student</option>
                          <option>Instructor</option>
                          <option>Admin</option>
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                          <option>All statuses</option>
                          <option>Active</option>
                          <option>Blocked</option>
                          <option>Pending review</option>
                        </select>
                      </div>
                    }
                  />
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                        <tr>
                          <th className="px-4 py-3 font-medium">User</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">Location</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Engagement</th>
                          <th className="px-4 py-3 font-medium">Sessions</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.email} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">{user.role}</td>
                            <td className="px-4 py-3">{user.location}</td>
                            <td className="px-4 py-3">
                              <Badge
                                tone={user.status === "Active" ? "green" : user.status === "Blocked" ? "muted" : "amber"}
                                className={cn(user.status === "Blocked" && "border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]")}
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{user.engagement}%</td>
                            <td className="px-4 py-3">{user.sessions}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Button variant="ghost" className="h-8 px-3 text-xs">
                                  <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Verify
                                </Button>
                                <Button variant="ghost" className="h-8 px-3 text-xs">
                                  <UserX className="mr-1.5 h-3.5 w-3.5" /> Block
                                </Button>
                                <Button variant="ghost" className="h-8 px-3 text-xs">
                                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <ChartCard title="Geographic distribution" description="Users by region and retention cohort strength.">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={geoDistribution} dataKey="value" nameKey="name" innerRadius={78} outerRadius={120} paddingAngle={3}>
                        {geoDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="User retention" description="Cohort returns across the first six weeks." />
                  <div className="mt-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userRetention}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Active sessions" description="Recent login and engagement signals." />
                  <div className="mt-4 space-y-3">
                    {userSessions.map((session) => (
                      <div key={session.time} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{session.time}</p>
                        <p className="mt-2 text-sm text-[var(--text-primary)]">{session.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <SectionTitle
              title="Course analytics"
              description="Review enrollments, completion, and content quality across approved, pending, and rejected courses."
              action={
                <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]">
                  <option>All categories</option>
                  <option>STEM</option>
                  <option>Business</option>
                  <option>Language</option>
                  <option>Design</option>
                  <option>Career Skills</option>
                </select>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total courses" value="1,092" delta="+8.1%" note="Published and draft" tone="primary" />
              <MetricCard label="Enrollment trend" value="+18.3%" delta="Growth" note="Compared with last quarter" tone="success" />
              <MetricCard label="Completion rate" value="78.4%" delta="+3.2 pts" note="Across all categories" tone="warning" />
              <MetricCard label="Ratings average" value="4.7/5" delta="+0.2" note="Platform-wide score" tone="info" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Enrollment and completion trend" description="How course activity moves across approval cycles and learner progress.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={courseEnrollments}>
                      <defs>
                        <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.26} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Area type="monotone" dataKey="enrollments" stroke="#0f766e" fill="url(#enrollGradient)" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="completions" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Category analytics" description="Course supply and performance by category.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseCategoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                        {courseCategoryDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Top and low engagement" description="High performers and courses that need intervention." />
                  <div className="mt-4 space-y-4">
                    {lowEngagementCourses.map((course) => (
                      <div key={course.name} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{course.name}</p>
                          <Badge tone="amber">Low engagement</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          <ProgressRow label="Completion" value={course.completion} tone="warning" />
                          <ProgressRow label="Engagement" value={course.engagement} tone="danger" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <TableCard title="Course management" description="Approve, reject, and review course quality before publishing.">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Course</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Enrollments</th>
                        <th className="px-4 py-3 font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.title} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--text-primary)]">{course.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {course.category} · {course.instructor}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={course.status === "Approved" ? "green" : course.status === "Pending" ? "amber" : "muted"}>{course.status}</Badge>
                          </td>
                          <td className="px-4 py-3">{formatCompact(course.enrollments)}</td>
                          <td className="px-4 py-3">{course.rating.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Progress tracking" value="84%" delta="+6 pts" note="Average completion momentum" tone="primary" />
              <MetricCard label="Attendance analytics" value="91%" delta="+2 pts" note="Session attendance compliance" tone="success" />
              <MetricCard label="Quiz performance" value="76%" delta="+4 pts" note="Average score across exams" tone="info" />
              <MetricCard label="Dropout risk" value="Low" delta="2 high-risk" note="Students need outreach" tone="warning" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Student performance radar" description="Attendance, assignments, quizzes, learning hours, streaks, and confidence compared with cohort average.">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={studentRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                      <Radar name="Current" dataKey="current" stroke="#0f766e" fill="#0f766e" fillOpacity={0.22} />
                      <Radar name="Average" dataKey="average" stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Performance heatmap" description="A quick visual read of weekly academic momentum by metric." />
                  <div className="mt-4">
                    <HeatmapTable rows={studentHeatmap} />
                  </div>
                </Card>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Learning risk signals" description="AI-assisted interventions for at-risk students." />
                  <div className="mt-4 space-y-3">
                    {studentInsights.map((insight) => (
                      <div key={insight.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 p-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-[var(--accent-primary)]" />
                          <p className="font-medium text-[var(--text-primary)]">{insight.title}</p>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{insight.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Student cohort" description="Progress, attendance, assignments, and weak subjects." />
                  <div className="mt-4 space-y-4">
                    {studentRows.map((student) => (
                      <div key={student.name} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">Weak subject: {student.weakSubject}</p>
                          </div>
                          <Badge tone={student.risk > 30 ? "amber" : "green"}>{student.risk}% risk</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          <ProgressRow label="Progress" value={student.progress} tone="primary" />
                          <ProgressRow label="Attendance" value={student.attendance} tone="success" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instructors" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Instructor performance" value="93%" delta="+5 pts" note="Weighted composite score" tone="primary" />
              <MetricCard label="Engagement rate" value="87%" delta="+3 pts" note="Student interaction quality" tone="success" />
              <MetricCard label="Revenue per instructor" value="$31.2k" delta="+14.1%" note="Monthly average" tone="info" />
              <MetricCard label="Response time" value="18 min" delta="-4 min" note="Median support response" tone="warning" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Monthly growth analytics" description="Revenue and enrollments generated by instructors over time.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={instructorGrowth}>
                      <defs>
                        <linearGradient id="instructorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.26} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="url(#instructorRevenue)" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="enrollments" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Instructor leaderboard" description="Compare performance, revenue, feedback, and response time.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instructorComparison} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} width={110} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" />
                      <Bar dataKey="engagement" name="Engagement" fill="#0f766e" radius={[0, 12, 12, 0]} />
                      <Bar dataKey="rating" name="Rating" fill="#2563eb" radius={[0, 12, 12, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <TableCard title="Instructor performance" description="Revenue, ratings, response time, and success ratios.">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Instructor</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                        <th className="px-4 py-3 font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructorRows.map((instructor) => (
                        <tr key={instructor.name} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--text-primary)]">{instructor.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {instructor.courses} active courses · {instructor.responseTime} response
                            </p>
                          </td>
                          <td className="px-4 py-3">{instructor.revenue}</td>
                          <td className="px-4 py-3">{instructor.rating.toFixed(1)} / 5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Quick leadership signals" description="Course success ratios and instructor feedback quality." />
                  <div className="mt-4 space-y-3">
                    {instructorRows.map((instructor) => (
                      <div key={instructor.name} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--text-primary)]">{instructor.name}</p>
                          <Pill tone={instructor.successRatio > 90 ? "success" : "warning"}>{instructor.successRatio}% success</Pill>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-muted)]">
                          <span>Revenue generated</span>
                          <span>{instructor.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Total revenue" value="$268.4k" delta="+18.9%" note="All revenue streams" tone="primary" />
              <MetricCard label="Monthly recurring revenue" value="$171k" delta="+11.7%" note="Subscription base" tone="success" />
              <MetricCard label="Failed payments" value="7" delta="-21%" note="Retry queue active" tone="warning" />
              <MetricCard label="Refund statistics" value="$4.6k" delta="-13%" note="Net refunded total" tone="danger" />
              <MetricCard label="Coupon usage" value="16%" delta="+2.3 pts" note="Discount adoption" tone="info" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Revenue trend graph" description="Monthly recurring revenue and overall platform revenue.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend}>
                      <defs>
                        <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Area type="monotone" dataKey="mrr" stroke="#0f766e" fill="url(#revenueTrendFill)" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title="Revenue sources" description="Subscriptions, one-time purchases, enterprise, and coupons.">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenueSourceDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                          {revenueSourceDistribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Revenue and refunds" description="Monthly financial activity and risk indicators.">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="refunds" fill="#ef4444" radius={[12, 12, 0, 0]} />
                        <Bar dataKey="coupons" fill="#f59e0b" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <TableCard title="Payment status indicators" description="Monitor retries, refunds, and failed billing attempts.">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedPaymentRows.map((row) => (
                        <tr key={row.customer} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--text-primary)]">{row.customer}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {row.plan} · {row.reason} · {row.attempts} attempts
                            </p>
                          </td>
                          <td className="px-4 py-3"><Badge tone={row.status === "Retry queued" ? "amber" : row.status === "Awaiting review" ? "blue" : "muted"}>{row.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Top-selling courses" description="Courses driving the highest commercial output." />
                  <div className="mt-4 space-y-3">
                    {topSellingCourses.map((course) => (
                      <div key={course.name} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--text-primary)]">{course.name}</p>
                          <Badge tone="green">{course.revenue}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">{formatCompact(course.sales)} sales this year</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Exams conducted" value="428" delta="+9.4%" note="Across all programs" tone="primary" />
              <MetricCard label="Pass / fail ratio" value="81 / 19" delta="Improving" note="Overall assessment health" tone="success" />
              <MetricCard label="Average scores" value="78.6%" delta="+2.8 pts" note="Weighted average" tone="info" />
              <MetricCard label="Cheating alerts" value="7" delta="Under review" note="AI anomaly detection" tone="warning" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Score distribution" description="How learners are performing across score bands.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0f766e" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Question-wise performance" description="Spot topics and question sets that need refinement.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examQuestions} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={64} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="score" fill="#2563eb" radius={[0, 12, 12, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <ChartCard title="Pass / fail ratio" description="Overall exam health by result bucket.">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={examMixDistribution} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={3}>
                        {examMixDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="AI anomaly detection" description="Question integrity and plagiarism watchlist." />
                  <div className="mt-4 space-y-3">
                    {examAlerts.map((alert) => (
                      <div key={alert.time} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{alert.time}</p>
                        <p className="mt-2 font-medium text-[var(--text-primary)]">{alert.label}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{alert.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <TableCard title="Assessment monitoring" description="Pass rates, cheating alerts, and plagiarism reports.">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Exam</th>
                        <th className="px-4 py-3 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examRows.map((exam) => (
                        <tr key={exam.name} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--text-primary)]">{exam.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {exam.cheatingAlerts} cheating alerts · {exam.plagiarismReports} plagiarism reports
                            </p>
                          </td>
                          <td className="px-4 py-3">{exam.score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Open tickets" value="32" delta="-14.5%" note="Currently unresolved" tone="danger" />
              <MetricCard label="Resolved tickets" value="118" delta="+11.2%" note="Closed in the last 30 days" tone="success" />
              <MetricCard label="Average response" value="18 min" delta="-3 min" note="Median first reply" tone="info" />
              <MetricCard label="Satisfaction rating" value="4.7/5" delta="+0.1" note="Support CSAT" tone="primary" />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <ChartCard title="Ticket status chart" description="Backlog movement across open, resolved, escalated, and closed states.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supportTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0f766e" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Feedback sentiment analysis" description="Positive, neutral, and negative sentiment trends from recent feedback.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentTrend}>
                      <defs>
                        <linearGradient id="sentimentPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.26} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,96,116,0.14)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Area type="monotone" dataKey="positive" stroke="#0f766e" fill="url(#sentimentPos)" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Support queue" description="Current tickets with urgency and satisfaction context." action={<select value={supportFilter} onChange={(e) => setSupportFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"><option>All tickets</option><option>Open</option><option>Resolved</option><option>Escalated</option></select>} />
                  <div className="mt-4 space-y-3">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket.ticket} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--text-primary)]">{ticket.ticket}</p>
                          <StatusBadge tone={ticket.priority === "Critical" ? "danger" : ticket.priority === "High" ? "warning" : ticket.priority === "Medium" ? "info" : "success"}>{ticket.priority}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {ticket.category} · {ticket.status} · {ticket.responseTime} response
                        </p>
                        <ProgressRow label="Satisfaction" value={ticket.satisfaction} tone={ticket.satisfaction > 90 ? "success" : ticket.satisfaction > 75 ? "info" : "warning"} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Reported issues" description="An operational snapshot of urgent platform problems." />
                  <div className="mt-4 space-y-3">
                    {platformAlerts.map((alert) => (
                      <div key={alert.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 p-4">
                        <p className="font-medium text-[var(--text-primary)]">{alert.label}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{alert.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {monitoringCards.map((card) => (
                <Card key={card.label} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{card.note}</p>
                    </div>
                    <Pill tone={card.tone}>{card.tone}</Pill>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <SystemHealth />

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Real-time monitoring widgets" description="Server uptime, API response time, database performance, storage usage, and active sessions." />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Server className="h-4 w-4" />
                        <span className="text-sm">Server cluster</span>
                      </div>
                      <p className="mt-3 text-xl font-semibold">3 nodes healthy</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Database className="h-4 w-4" />
                        <span className="text-sm">Database load</span>
                      </div>
                      <p className="mt-3 text-xl font-semibold">42% average</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm">Storage growth</span>
                      </div>
                      <p className="mt-3 text-xl font-semibold">+6.4 GB today</p>
                    </div>
                  </div>
                </Card>

                <TableCard title="System logs" description="Recent operational logs and service health events.">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Time</th>
                        <th className="px-4 py-3 font-medium">Service</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logRows.map((log) => (
                        <tr key={`${log.time}-${log.service}`} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{log.time}</td>
                          <td className="px-4 py-3">{log.service}</td>
                          <td className="px-4 py-3">
                            <Badge tone={log.status === "Healthy" ? "green" : log.status === "Warning" ? "amber" : "muted"}>{log.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Alert notification system" description="Notification feed for security, payment, user activity, and platform warnings." />
                  <div className="mt-4 space-y-3">
                    {platformAlerts.map((alert) => (
                      <div key={alert.label} className="rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-[var(--text-primary)]">{alert.label}</p>
                          <Bell className="h-4 w-4 text-[var(--accent-primary)]" />
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{alert.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Recovery and backup" description="Operational safety and restore readiness." />
                  <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[var(--accent-success)]" /> Backup completed 02:00 UTC
                    </div>
                    <div className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-amber-500" /> Restore test pending for analytics cluster
                    </div>
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-sky-600" /> Failover policy ready
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Settings and security" description="Configure access policies, alerting, and reporting behavior." />
                  <div className="mt-5 space-y-4">
                    {settingsItems.map((item) => (
                      <div key={item.title} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] p-4">
                        <div className="max-w-2xl">
                          <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">{item.detail}</p>
                        </div>
                        <Switch
                          checked={item.title === "Role-based access control" ? rbacEnabled : item.title === "Security alerts" ? notificationsOn : item.title === "Dark mode for admins" ? darkPreview : item.enabled}
                          onCheckedChange={(checked) => {
                            if (item.title === "Role-based access control") setRbacEnabled(checked);
                            if (item.title === "Security alerts") setNotificationsOn(checked);
                            if (item.title === "Dark mode for admins") setDarkPreview(checked);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Advanced filters and search" description="A scalable hook for future API-backed admin exploration." />
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="mb-2 text-sm text-[var(--text-muted)]">Search scope</p>
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                        <p className="font-medium text-[var(--text-primary)]">Global query index</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Search users, courses, tickets, payments, and logs from one place.</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm text-[var(--text-muted)]">Permission model</p>
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                        <p className="font-medium text-[var(--text-primary)]">Fine-grained RBAC</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Enable or disable features by module, region, or admin tier.</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm text-[var(--text-muted)]">Export targets</p>
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                        <p className="font-medium text-[var(--text-primary)]">Board-ready packs</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">PDF, Excel, and CSV layouts for reporting and audit reviews.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="p-4 md:p-5">
                  <SectionTitle title="Quick actions" description="Common admin tasks and external handoffs." />
                  <div className="mt-4 space-y-3">
                    <Button variant="filled" className="w-full justify-between">
                      Generate export <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between">
                      View audit trail <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between">
                      Review alerts <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between">
                      Open security console <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <SectionTitle title="Export profile" description="Current output format and operational defaults." />
                  <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center justify-between">
                      <span>Format</span>
                      <span className="font-medium text-[var(--text-primary)]">{exportFormat}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Notifications</span>
                      <span className="font-medium text-[var(--text-primary)]">{notificationsOn ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>RBAC</span>
                      <span className="font-medium text-[var(--text-primary)]">{rbacEnabled ? "Active" : "Off"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dark preview</span>
                      <span className="font-medium text-[var(--text-primary)]">{darkPreview ? "On" : "Off"}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}