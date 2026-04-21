import { z } from "zod";

export const entryTypeEnum = z.enum(["cycling", "rest", "other"]);
export type EntryType = z.infer<typeof entryTypeEnum>;

// Simplified schema for static application (no database)
export const insertWorkoutSchema = z.object({
  // --- Shared (all types) ---
  entryType: entryTypeEnum,
  workoutDate: z.string(),

  // --- Cycling-only (existing fields, all optional at schema level) ---
  goal: z.string().optional(),
  rpe: z.number().min(1).max(10).optional(),
  feel: z.enum(["S", "G", "N", "P", "W"]).optional(),
  choIntakePre: z.string().optional(),
  choIntake: z.string().optional(),
  choIntakePost: z.string().optional(),
  normalizedPower: z.number().positive().optional(),
  tss: z.number().positive().optional(),
  avgHeartRate: z.number().positive().optional(),
  hrv: z.string().optional(),
  rMSSD: z.number().positive().optional(),
  rhr: z.number().positive().optional(),
  trainerRoadRpe: z.number().refine(
    (val) => val === undefined || [1, 2, 3, 4, 5].includes(val),
    { message: "TR-RPE must be 1 (Easy), 2 (Moderate), 3 (Hard), 4 (Very hard), or 5 (Maximum effort)" }
  ).optional(),
  trainerRoadLgt: z.enum(["G", "Y", "R"]).optional(),
  whatWentWell: z.string().optional(),
  whatCouldBeImproved: z.string().optional(),
  description: z.string().optional(),

  // --- Rest-only ---
  weight: z.number().positive().optional(),
  restNotes: z.string().optional(),

  // --- Other-only ---
  activityGoal: z.string().optional(),
  activityNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.entryType === "cycling") {
    if (!data.goal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["goal"],
        message: "Goal is required for cycling entries",
      });
    }
    if (data.rpe === undefined || data.rpe === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rpe"],
        message: "RPE is required for cycling entries",
      });
    }
    if (!data.feel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feel"],
        message: "Feel is required for cycling entries",
      });
    }
  }
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

// For static app, we don't need the full database workout type
export type Workout = InsertWorkout & {
  id: number;
  createdAt: Date;
};
