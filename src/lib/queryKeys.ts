export const queryKeys = {
  health: {
    backend: ["health", "backend"] as const,
    system: ["health", "system"] as const
  },
  admin: {
    metrics: ["admin", "metrics"] as const,
    courses: ["admin", "courses"] as const,
    assessments: ["admin", "assessments"] as const,
    attendanceStats: ["admin", "attendance", "stats"] as const,
    learningAnalytics: ["admin", "analytics", "learning"] as const,
    auditLogs: ["admin", "audit-logs"] as const,
    settings: ["admin", "settings"] as const,
    users: (page: number, limit: number) => ["admin", "users", page, limit] as const,
    sections: ["admin", "sections"] as const,
    students: (search: string) => ["admin", "students", search] as const,
    sectionStudents: (sectionId: string) => ["admin", "sections", sectionId, "students"] as const,
    timetableLists: ["admin", "timetable", "master", "list"] as const,
    timetable: (sectionId: string, term: string, year: number) => ["admin", "timetable", "master", sectionId, term, year] as const
  },
  teacher: {
    dashboard: ["teacher", "dashboard"] as const,
    performance: ["teacher", "performance"] as const,
    sections: ["teacher", "sections"] as const,
    assessments: ["teacher", "assessments"] as const,
    assessmentAnalytics: (assessmentId: string) => ["teacher", "assessments", assessmentId, "analytics"] as const,
    attendanceStudents: (sectionId: string, slotKey: string) => ["teacher", "attendance", "students", sectionId, slotKey] as const,
    attendanceLive: (sectionId: string, slotKey: string, sessionDate: string) => ["teacher", "attendance", "live", sectionId, slotKey, sessionDate] as const,
    studentsProgress: ["teacher", "students", "progress"] as const,
    timetable: ["teacher", "timetable"] as const,
    leaderboard: ["teacher", "leaderboard"] as const
  },
  student: {
    profile: ["student", "profile"] as const,
    goals: ["student", "goals"] as const,
    goalLibrary: ["student", "goal-library"] as const,
    tasks: ["student", "tasks"] as const,
    freeSlots: ["student", "free-slots"] as const,
    timetable: ["student", "timetable"] as const,
    attendanceStats: ["student", "attendance", "stats"] as const,
    attendanceHistory: (limit: number) => ["student", "attendance", "history", limit] as const,
    leaderboard: (scope: string) => ["student", "leaderboard", scope] as const,
    assessments: ["student", "assessments"] as const,
    assessmentResults: ["student", "assessments", "results"] as const,
    assessmentTake: (assessmentId: string) => ["student", "assessments", assessmentId, "take"] as const,
    rewardPoints: ["student", "reward-points"] as const,
    syllabusGoals: ["student", "syllabus-goals"] as const
  }
};
