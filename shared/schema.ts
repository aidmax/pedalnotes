import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  workoutDate: text("workout_date").notNull(),
  goal: text("goal").notNull(),
  rpe: integer("rpe").notNull(),
  feel: text("feel").notNull(),
  choIntake: text("cho_intake"),
  normalizedPower: integer("normalized_power"),
  variabilityIndex: real("variability_index"),
  avgHeartRate: integer("avg_heart_rate"),
  hrv: text("hrv"),
  trainerRoadRpe: integer("trainer_road_rpe"),
  trainerRoadLgt: text("trainer_road_lgt"),
  whatWentWell: text("what_went_well"),
  whatCouldBeImproved: text("what_could_be_improved"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true
}).extend({
  rpe: z.number().min(1).max(10),
  feel: z.enum(["S", "G", "N", "P", "W"]),
  trainerRoadRpe: z.number().refine((val) => val === undefined || [1, 2, 3, 4, 5].includes(val), {
    message: "TR-RPE must be 1 (Easy), 2 (Moderate), 3 (Hard), 4 (Very hard), or 5 (Maximum effort)"
  }).optional(),
  trainerRoadLgt: z.enum(["G", "Y", "R"]).optional(),
  normalizedPower: z.number().positive().optional(),
  variabilityIndex: z.number().positive().optional(),
  avgHeartRate: z.number().positive().optional()
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
