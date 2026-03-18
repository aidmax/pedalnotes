import { z } from "zod";

// Simplified schema for static application (no database)
export const insertWorkoutSchema = z.object({
  workoutDate: z.string(),
  goal: z.string(),
  rpe: z.number().min(1).max(10),
  feel: z.enum(["S", "G", "N", "P", "W"]),
  choIntakePre: z.string().optional(),
  choIntake: z.string().optional(),
  choIntakePost: z.string().optional(),
  normalizedPower: z.number().positive().optional(),
  tss: z.number().positive().optional(),
  avgHeartRate: z.number().positive().optional(),
  hrv: z.string().optional(),
  rMSSD: z.number().positive().optional(),
  rhr: z.number().positive().optional(),
  trainerRoadRpe: z.number().refine((val) => val === undefined || [1, 2, 3, 4, 5].includes(val), {
    message: "TR-RPE must be 1 (Easy), 2 (Moderate), 3 (Hard), 4 (Very hard), or 5 (Maximum effort)"
  }).optional(),
  trainerRoadLgt: z.enum(["G", "Y", "R"]).optional(),
  whatWentWell: z.string().optional(),
  whatCouldBeImproved: z.string().optional(),
  description: z.string().optional()
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

// For static app, we don't need the full database workout type
export type Workout = InsertWorkout & {
  id: number;
  createdAt: Date;
};
