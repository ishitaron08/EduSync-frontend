export type MetricTone = "primary" | "success" | "warning" | "danger" | "info";

export type OverviewMetric = {
  label: string;
  value: string;
  delta: string;
  note: string;
  tone: MetricTone;
};

export type TrendPoint = {
  name: string;
  students: number;
  teachers: number;
  courses: number;
  revenue: number;
  activeUsers: number;
  subscriptions: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type HeatmapRow = {
  label: string;
  cells: number[];
};

export type ActivityItem = {
  time: string;
  title: string;
  detail: string;
  tone: MetricTone;
};

export type InsightCard = {
  title: string;
  detail: string;
  tone: MetricTone;
};

export type UserRow = {
  name: string;
  role: "Student" | "Instructor" | "Admin";
  email: string;
  location: string;
  status: "Active" | "Blocked" | "Pending review";
  lastLogin: string;
  sessions: number;
  engagement: number;
  verified?: boolean;
};

export type CourseRow = {
  title: string;
  category: string;
  instructor: string;
  status: "Approved" | "Pending" | "Rejected";
  enrollments: number;
  completion: number;
  rating: number;
  revenue: string;
};

export type StudentRow = {
  name: string;
  progress: number;
  attendance: number;
  assignments: number;
  quizzes: number;
  hours: number;
  risk: number;
  streak: string;
  weakSubject: string;
};

export type InstructorRow = {
  name: string;
  courses: number;
  revenue: string;
  rating: number;
  responseTime: string;
  successRatio: number;
};

export type RevenueRow = {
  name: string;
  mrr: number;
  revenue: number;
  refunds: number;
  coupons: number;
};

export type ExamRow = {
  name: string;
  score: number;
  passRate: number;
  cheatingAlerts: number;
  plagiarismReports: number;
};

export type SupportRow = {
  ticket: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Resolved" | "Escalated";
  responseTime: string;
  satisfaction: number;
};

export type LogRow = {
  time: string;
  service: string;
  status: "Healthy" | "Warning" | "Critical";
  message: string;
};

export const overviewMetrics: OverviewMetric[] = [
  { label: "Total Students", value: "24,860", delta: "+12.8%", note: "Compared with last month", tone: "primary" },
  { label: "Teachers / Instructors", value: "1,284", delta: "+5.4%", note: "Verified teaching staff", tone: "info" },
  { label: "Total Courses", value: "1,092", delta: "+8.1%", note: "Published and draft courses", tone: "success" },
  { label: "Active Users", value: "18,640", delta: "+16.3%", note: "Learners active in the last 7 days", tone: "primary" },
  { label: "New Registrations", value: "1,248", delta: "+9.7%", note: "Fresh sign-ups this month", tone: "warning" },
  { label: "Course Completion", value: "78.4%", delta: "+3.2 pts", note: "Average completion rate", tone: "success" },
  { label: "Total Revenue", value: "$268.4k", delta: "+18.9%", note: "Recurring + one-time income", tone: "info" },
  { label: "Pending Tickets", value: "32", delta: "-14.5%", note: "Open support queue", tone: "danger" },
  { label: "Active Subscriptions", value: "16,890", delta: "+11.1%", note: "Paid plans currently live", tone: "primary" },
  { label: "Platform Growth", value: "14.2%", delta: "+2.6 pts", note: "Quarter-over-quarter expansion", tone: "success" }
];

export const overviewTrend: TrendPoint[] = [
  { name: "Jan", students: 18000, teachers: 920, courses: 820, revenue: 184000, activeUsers: 12900, subscriptions: 12400 },
  { name: "Feb", students: 18850, teachers: 960, courses: 850, revenue: 192500, activeUsers: 13400, subscriptions: 12840 },
  { name: "Mar", students: 19750, teachers: 1010, courses: 875, revenue: 203000, activeUsers: 13980, subscriptions: 13320 },
  { name: "Apr", students: 21220, teachers: 1080, courses: 940, revenue: 217600, activeUsers: 15120, subscriptions: 14250 },
  { name: "May", students: 22840, teachers: 1140, courses: 975, revenue: 236800, activeUsers: 16250, subscriptions: 15180 },
  { name: "Jun", students: 23960, teachers: 1210, courses: 1030, revenue: 251200, activeUsers: 17340, subscriptions: 15980 },
  { name: "Jul", students: 24860, teachers: 1284, courses: 1092, revenue: 268400, activeUsers: 18640, subscriptions: 16890 }
];

export const roleDistribution: DistributionPoint[] = [
  { name: "Students", value: 24860, color: "#0f766e" },
  { name: "Instructors", value: 1284, color: "#2563eb" },
  { name: "Admins", value: 52, color: "#8b5cf6" },
  { name: "Support", value: 91, color: "#f59e0b" }
];

export const courseCategoryDistribution: DistributionPoint[] = [
  { name: "STEM", value: 32, color: "#0f766e" },
  { name: "Business", value: 24, color: "#2563eb" },
  { name: "Language", value: 18, color: "#8b5cf6" },
  { name: "Design", value: 16, color: "#f59e0b" },
  { name: "Career Skills", value: 10, color: "#ef4444" }
];

export const revenueSourceDistribution: DistributionPoint[] = [
  { name: "Subscriptions", value: 62, color: "#0f766e" },
  { name: "One-time purchases", value: 21, color: "#2563eb" },
  { name: "Enterprise", value: 11, color: "#8b5cf6" },
  { name: "Coupons", value: 6, color: "#f59e0b" }
];

export const examMixDistribution: DistributionPoint[] = [
  { name: "Passed", value: 81, color: "#0f766e" },
  { name: "Needs review", value: 14, color: "#f59e0b" },
  { name: "Failed", value: 5, color: "#ef4444" }
];

export const weeklyHeatmap: HeatmapRow[] = [
  { label: "Mon", cells: [34, 42, 48, 57, 66, 73, 81] },
  { label: "Tue", cells: [28, 38, 44, 53, 64, 70, 77] },
  { label: "Wed", cells: [31, 40, 47, 56, 67, 74, 86] },
  { label: "Thu", cells: [24, 35, 43, 52, 61, 69, 75] },
  { label: "Fri", cells: [26, 39, 45, 58, 71, 78, 88] },
  { label: "Sat", cells: [18, 26, 31, 39, 47, 54, 60] },
  { label: "Sun", cells: [14, 21, 28, 34, 41, 48, 55] }
];

export const activityTimeline: ActivityItem[] = [
  { time: "08:20", title: "New cohort onboarding completed", detail: "820 students joined the July intake with 96% profile completion.", tone: "success" },
  { time: "09:10", title: "Course approvals reviewed", detail: "12 pending instructor submissions were approved after moderation.", tone: "primary" },
  { time: "10:45", title: "Anomaly alert resolved", detail: "Unusual login spikes were throttled and flagged for review.", tone: "warning" },
  { time: "12:30", title: "Revenue sync complete", detail: "Subscription billing and refund records reconciled successfully.", tone: "info" },
  { time: "14:05", title: "Support queue stabilized", detail: "Ticket backlog is down 14% after priority escalation.", tone: "success" }
];

export const overviewInsights: InsightCard[] = [
  { title: "Dropout risk cluster", detail: "Students with under 3 study hours and two missed quizzes are 2.7x more likely to churn.", tone: "danger" },
  { title: "Revenue opportunity", detail: "Enterprise cohorts in business and career tracks show the highest expansion potential this quarter.", tone: "success" },
  { title: "Content gap", detail: "STEM courses outperform average completion but still need more advanced practice assessments.", tone: "warning" },
  { title: "Anomaly watch", detail: "Login activity from two regions is trending above the historical baseline and should stay monitored.", tone: "info" }
];

export const platformAlerts = [
  { label: "Security", value: "2 critical alerts", detail: "Password reset anomalies and elevated admin access requests." },
  { label: "Payments", value: "7 failed payments", detail: "Retry queue scheduled for the next billing window." },
  { label: "Course approvals", value: "14 waiting", detail: "Pending moderation for new instructor submissions." },
  { label: "System", value: "1 warning", detail: "Storage usage reached 72% on the analytics node." }
];

export const userRows: UserRow[] = [
  { name: "Aanya Sharma", role: "Student", email: "aanya@edusync.edu", location: "Mumbai, IN", status: "Active", lastLogin: "5 min ago", sessions: 18, engagement: 92, verified: true },
  { name: "Marcus Lee", role: "Instructor", email: "marcus@edusync.edu", location: "Singapore", status: "Active", lastLogin: "22 min ago", sessions: 14, engagement: 84, verified: true },
  { name: "Priya Nair", role: "Student", email: "priya@edusync.edu", location: "Bengaluru, IN", status: "Pending review", lastLogin: "1 hr ago", sessions: 11, engagement: 61 },
  { name: "Jordan Miller", role: "Instructor", email: "jordan@edusync.edu", location: "Toronto, CA", status: "Blocked", lastLogin: "2 days ago", sessions: 8, engagement: 33, verified: false },
  { name: "Leila Hassan", role: "Admin", email: "leila@edusync.edu", location: "Dubai, UAE", status: "Active", lastLogin: "7 min ago", sessions: 23, engagement: 97, verified: true },
  { name: "Noah Patel", role: "Student", email: "noah@edusync.edu", location: "London, UK", status: "Active", lastLogin: "18 min ago", sessions: 15, engagement: 88, verified: true }
];

export const userRetention = [
  { name: "Week 1", value: 92 },
  { name: "Week 2", value: 86 },
  { name: "Week 3", value: 80 },
  { name: "Week 4", value: 76 },
  { name: "Week 6", value: 71 }
];

export const geoDistribution = [
  { name: "Asia", value: 48, color: "#0f766e" },
  { name: "Europe", value: 19, color: "#2563eb" },
  { name: "North America", value: 17, color: "#8b5cf6" },
  { name: "Middle East", value: 9, color: "#f59e0b" },
  { name: "Other", value: 7, color: "#ef4444" }
];

export const userSessions = [
  { time: "08:15", label: "5 new sessions from verified instructors" },
  { time: "09:40", label: "Active learners peaked in the Asia region" },
  { time: "11:05", label: "Admin console access reviewed successfully" },
  { time: "13:20", label: "Retention cohort crossed the 80% threshold" }
];

export const courseRows: CourseRow[] = [
  { title: "Data Science Foundations", category: "STEM", instructor: "Marcus Lee", status: "Approved", enrollments: 1840, completion: 88, rating: 4.9, revenue: "$46.2k" },
  { title: "Product Design Sprint", category: "Design", instructor: "Leila Hassan", status: "Approved", enrollments: 920, completion: 74, rating: 4.7, revenue: "$29.4k" },
  { title: "Business Strategy Lab", category: "Business", instructor: "Avery Brooks", status: "Pending", enrollments: 640, completion: 61, rating: 4.3, revenue: "$18.1k" },
  { title: "Conversational English", category: "Language", instructor: "Nina Choi", status: "Rejected", enrollments: 280, completion: 38, rating: 3.8, revenue: "$6.8k" },
  { title: "AI Ethics and Governance", category: "Career Skills", instructor: "Jordan Miller", status: "Approved", enrollments: 1120, completion: 91, rating: 4.8, revenue: "$34.6k" }
];

export const courseEnrollments = [
  { name: "Week 1", enrollments: 820, completions: 560, approvals: 9 },
  { name: "Week 2", enrollments: 910, completions: 610, approvals: 11 },
  { name: "Week 3", enrollments: 980, completions: 650, approvals: 12 },
  { name: "Week 4", enrollments: 1120, completions: 730, approvals: 14 },
  { name: "Week 5", enrollments: 1280, completions: 820, approvals: 16 }
];

export const lowEngagementCourses = [
  { name: "Conversational English", completion: 38, engagement: 41 },
  { name: "Intro to Accounting", completion: 44, engagement: 46 },
  { name: "Marketing Basics", completion: 51, engagement: 58 },
  { name: "Statistics Bootcamp", completion: 57, engagement: 63 }
];

export const studentRows: StudentRow[] = [
  { name: "Aanya Sharma", progress: 94, attendance: 98, assignments: 96, quizzes: 92, hours: 14.6, risk: 8, streak: "21 days", weakSubject: "Linear algebra" },
  { name: "Noah Patel", progress: 88, attendance: 91, assignments: 87, quizzes: 82, hours: 12.8, risk: 13, streak: "17 days", weakSubject: "Probability" },
  { name: "Priya Nair", progress: 72, attendance: 74, assignments: 68, quizzes: 65, hours: 8.4, risk: 34, streak: "9 days", weakSubject: "Essay writing" },
  { name: "Ethan Cole", progress: 61, attendance: 63, assignments: 59, quizzes: 56, hours: 6.2, risk: 48, streak: "5 days", weakSubject: "Data visualization" }
];

export const studentRadar = [
  { subject: "Attendance", current: 88, average: 74, fullMark: 100 },
  { subject: "Assignments", current: 84, average: 68, fullMark: 100 },
  { subject: "Quizzes", current: 79, average: 65, fullMark: 100 },
  { subject: "Learning hours", current: 72, average: 58, fullMark: 100 },
  { subject: "Streak", current: 91, average: 62, fullMark: 100 },
  { subject: "Confidence", current: 86, average: 70, fullMark: 100 }
];

export const studentHeatmap = [
  { name: "Assignments", values: [82, 78, 69, 74, 88, 91, 94] },
  { name: "Attendance", values: [91, 89, 85, 83, 88, 90, 95] },
  { name: "Quiz scores", values: [76, 79, 72, 71, 77, 82, 86] },
  { name: "Study hours", values: [62, 64, 58, 57, 66, 69, 73] }
];

export const studentInsights = [
  { title: "Dropout prediction", detail: "Priya Nair and Ethan Cole need intervention if study time stays below 8 weekly hours.", tone: "danger" },
  { title: "Learning streak gain", detail: "High streak retention is lifting completion in the current cohort by 11 points.", tone: "success" },
  { title: "Weak subject cluster", detail: "Probability and essay writing remain the most common weak areas across the cohort.", tone: "warning" }
];

export const instructorRows: InstructorRow[] = [
  { name: "Marcus Lee", courses: 14, revenue: "$58.4k", rating: 4.9, responseTime: "14 min", successRatio: 94 },
  { name: "Leila Hassan", courses: 11, revenue: "$44.1k", rating: 4.8, responseTime: "18 min", successRatio: 91 },
  { name: "Avery Brooks", courses: 9, revenue: "$31.6k", rating: 4.5, responseTime: "22 min", successRatio: 86 },
  { name: "Nina Choi", courses: 7, revenue: "$24.8k", rating: 4.3, responseTime: "29 min", successRatio: 79 }
];

export const instructorComparison = [
  { name: "Marcus Lee", engagement: 94, revenue: 58, rating: 4.9, response: 14 },
  { name: "Leila Hassan", engagement: 91, revenue: 44, rating: 4.8, response: 18 },
  { name: "Avery Brooks", engagement: 84, revenue: 32, rating: 4.5, response: 22 },
  { name: "Nina Choi", engagement: 78, revenue: 25, rating: 4.3, response: 29 }
];

export const instructorGrowth = [
  { name: "Jan", revenue: 180, enrollments: 920 },
  { name: "Feb", revenue: 194, enrollments: 980 },
  { name: "Mar", revenue: 205, enrollments: 1010 },
  { name: "Apr", revenue: 218, enrollments: 1085 },
  { name: "May", revenue: 236, enrollments: 1142 },
  { name: "Jun", revenue: 249, enrollments: 1204 }
];

export const revenueTrend: RevenueRow[] = [
  { name: "Jan", revenue: 184, mrr: 120, refunds: 8, coupons: 12 },
  { name: "Feb", revenue: 193, mrr: 126, refunds: 6, coupons: 10 },
  { name: "Mar", revenue: 206, mrr: 134, refunds: 7, coupons: 11 },
  { name: "Apr", revenue: 218, mrr: 143, refunds: 5, coupons: 14 },
  { name: "May", revenue: 237, mrr: 154, refunds: 4, coupons: 13 },
  { name: "Jun", revenue: 251, mrr: 163, refunds: 6, coupons: 15 },
  { name: "Jul", revenue: 268, mrr: 171, refunds: 7, coupons: 16 }
];

export const failedPaymentRows = [
  { customer: "Aanya Sharma", plan: "Premium", attempts: 2, reason: "Card expired", status: "Retry queued" },
  { customer: "Northbridge Academy", plan: "Enterprise", attempts: 1, reason: "Bank validation", status: "Awaiting review" },
  { customer: "Noah Patel", plan: "Standard", attempts: 3, reason: "Insufficient funds", status: "Escalated" }
];

export const topSellingCourses = [
  { name: "Data Science Foundations", revenue: "$46.2k", sales: 1420 },
  { name: "Product Design Sprint", revenue: "$29.4k", sales: 920 },
  { name: "AI Ethics and Governance", revenue: "$34.6k", sales: 1120 },
  { name: "Business Strategy Lab", revenue: "$18.1k", sales: 640 }
];

export const examRows: ExamRow[] = [
  { name: "June Assessment", score: 82, passRate: 88, cheatingAlerts: 2, plagiarismReports: 1 },
  { name: "Weekly Quiz Batch", score: 76, passRate: 79, cheatingAlerts: 4, plagiarismReports: 2 },
  { name: "Capstone Review", score: 91, passRate: 94, cheatingAlerts: 1, plagiarismReports: 0 },
  { name: "Midterm Exam", score: 69, passRate: 73, cheatingAlerts: 6, plagiarismReports: 3 }
];

export const examDistribution = [
  { name: "A", value: 18 },
  { name: "B", value: 34 },
  { name: "C", value: 26 },
  { name: "D", value: 14 },
  { name: "F", value: 8 }
];

export const examQuestions = [
  { name: "Q1", score: 94 },
  { name: "Q2", score: 88 },
  { name: "Q3", score: 73 },
  { name: "Q4", score: 81 },
  { name: "Q5", score: 69 },
  { name: "Q6", score: 77 }
];

export const examAlerts = [
  { time: "09:08", label: "AI anomaly detected in midterm submissions", detail: "Two answers repeated across unrelated accounts." },
  { time: "09:44", label: "Plagiarism review pending", detail: "Question 5 similarity score crossed the review threshold." },
  { time: "10:20", label: "Score distribution normalized", detail: "Capstone submissions returned to expected variance." }
];

export const supportRows: SupportRow[] = [
  { ticket: "SUP-2041", category: "Payment", priority: "Critical", status: "Open", responseTime: "8 min", satisfaction: 74 },
  { ticket: "SUP-2037", category: "Course access", priority: "High", status: "Escalated", responseTime: "21 min", satisfaction: 68 },
  { ticket: "SUP-2031", category: "Bug report", priority: "Medium", status: "Resolved", responseTime: "14 min", satisfaction: 91 },
  { ticket: "SUP-2028", category: "Account", priority: "Low", status: "Resolved", responseTime: "29 min", satisfaction: 95 }
];

export const supportTrend = [
  { name: "Open", value: 32 },
  { name: "Resolved", value: 118 },
  { name: "Escalated", value: 14 },
  { name: "Closed", value: 76 }
];

export const sentimentTrend = [
  { name: "Mon", positive: 72, neutral: 18, negative: 10 },
  { name: "Tue", positive: 75, neutral: 15, negative: 10 },
  { name: "Wed", positive: 69, neutral: 21, negative: 10 },
  { name: "Thu", positive: 77, neutral: 14, negative: 9 },
  { name: "Fri", positive: 81, neutral: 11, negative: 8 }
];

export const logRows: LogRow[] = [
  { time: "14:02:11", service: "API Gateway", status: "Healthy", message: "Response time averaged 124ms across 2,380 requests." },
  { time: "14:03:27", service: "Database", status: "Warning", message: "Index scan rate rose to 72% during report exports." },
  { time: "14:04:10", service: "Queue Worker", status: "Healthy", message: "Ticket event processing backlog cleared." },
  { time: "14:05:39", service: "Auth Service", status: "Critical", message: "Three admin session refreshes failed and were revalidated." }
];

export const monitoringCards = [
  { label: "Server uptime", value: "99.98%", note: "Last 30 days", tone: "success" as MetricTone },
  { label: "API response time", value: "124ms", note: "Rolling average", tone: "primary" as MetricTone },
  { label: "Database performance", value: "92/100", note: "Healthy index coverage", tone: "info" as MetricTone },
  { label: "Storage usage", value: "72%", note: "Analytics node", tone: "warning" as MetricTone },
  { label: "Active sessions", value: "1,480", note: "Authenticated users", tone: "primary" as MetricTone },
  { label: "Backup status", value: "Completed", note: "Nightly snapshot verified", tone: "success" as MetricTone }
];

export const settingsItems = [
  { title: "Role-based access control", detail: "Restrict admin capabilities by permission group and feature scope.", enabled: true },
  { title: "Security alerts", detail: "Notify admins instantly when unusual login or payment patterns appear.", enabled: true },
  { title: "Dark mode for admins", detail: "Store individual theme preference across desktop and mobile sessions.", enabled: false },
  { title: "Export reports", detail: "Enable PDF and Excel exports for analytics packs and board reviews.", enabled: true },
  { title: "Weekly health summaries", detail: "Send platform uptime, latency, and incident summaries by email.", enabled: false }
];