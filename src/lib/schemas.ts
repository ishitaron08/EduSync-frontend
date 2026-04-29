import { z } from "zod";

export const authSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6)
});

export const recommendationSchema = z.object({
  student_year: z.number().int().min(1).max(8),
  goal_type: z.string(),
  free_time_duration: z.number().min(15),
  completion_rate: z.number().min(0).max(1),
  difficulty_preference: z.enum(["easy", "medium", "hard"])
});

export const recommendationV2Schema = z.object({
  studentContext: z.object({
    academicYear: z.number().int().min(1).max(8)
  }),
  goalContext: z.object({
    goalType: z.string().min(1),
    difficultyPreference: z.enum(["easy", "medium", "hard"])
  }),
  availabilityContext: z.object({
    freeMinutesToday: z.number().min(0),
    freeSlotCountToday: z.number().int().min(0)
  }),
  progressContext: z.object({
    completionRate: z.number().min(0).max(1),
    completedTasks: z.number().int().min(0),
    totalTasks: z.number().int().min(0)
  }),
  preferences: z.object({
    preferredSessionMinutes: z.number().int().min(10).max(240).optional(),
    focusAreas: z.array(z.string().min(1)).optional()
  }).optional()
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]+$/, "Phone contains invalid characters")
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone must be at most 20 characters")
    .or(z.literal(""))
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(8, "Confirm password is required")
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });
