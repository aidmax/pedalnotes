import { describe, it, expect } from 'vitest';
import { insertWorkoutSchema } from '@shared/schema-static';

describe('Workout Schema Validation', () => {
  const validWorkout = {
    workoutDate: '2025-10-07',
    goal: 'Test workout goal',
    rpe: 5,
    feel: 'N' as const,
    choIntake: 'Test CHO intake',
    normalizedPower: 250,
    tss: 100,
    avgHeartRate: 150,
    hrv: 'Test HRV',
    rMSSD: 45.5,
    rhr: 55,
    trainerRoadRpe: 3,
    trainerRoadLgt: 'G' as const,
    whatWentWell: 'Test WWW',
    whatCouldBeImproved: 'Test WCBI',
    description: 'Test description'
  };

  it('should validate a complete valid workout', () => {
    const result = insertWorkoutSchema.safeParse(validWorkout);
    expect(result.success).toBe(true);
  });

  it('should require workoutDate', () => {
    const { workoutDate, ...invalidWorkout } = validWorkout;
    const result = insertWorkoutSchema.safeParse(invalidWorkout);
    expect(result.success).toBe(false);
  });

  it('should allow empty goal (schema accepts empty strings)', () => {
    const workoutWithEmptyGoal = { ...validWorkout, goal: '' };
    const result = insertWorkoutSchema.safeParse(workoutWithEmptyGoal);
    expect(result.success).toBe(true);
  });

  it('should require goal field to be present', () => {
    const { goal, ...invalidWorkout } = validWorkout;
    const result = insertWorkoutSchema.safeParse(invalidWorkout);
    expect(result.success).toBe(false);
  });

  it('should validate RPE range (1-10)', () => {
    // Valid RPE values
    for (let rpe = 1; rpe <= 10; rpe++) {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, rpe });
      expect(result.success).toBe(true);
    }

    // Invalid RPE values
    const invalidRpeValues = [0, 11, -1, 15];
    invalidRpeValues.forEach(rpe => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, rpe });
      expect(result.success).toBe(false);
    });
  });

  it('should validate feel enum values', () => {
    const validFeelValues = ['S', 'G', 'N', 'P', 'W'];
    validFeelValues.forEach(feel => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, feel });
      expect(result.success).toBe(true);
    });

    // Invalid feel values
    const invalidFeelValues = ['X', 'invalid', ''];
    invalidFeelValues.forEach(feel => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, feel });
      expect(result.success).toBe(false);
    });
  });

  it('should validate trainerRoadRpe values (1-5 or undefined)', () => {
    // Valid TR-RPE values
    const validTrRpeValues = [1, 2, 3, 4, 5, undefined];
    validTrRpeValues.forEach(trainerRoadRpe => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadRpe });
      expect(result.success).toBe(true);
    });

    // Invalid TR-RPE values
    const invalidTrRpeValues = [0, 6, 10, -1];
    invalidTrRpeValues.forEach(trainerRoadRpe => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadRpe });
      expect(result.success).toBe(false);
    });
  });

  it('should validate trainerRoadLgt enum values', () => {
    const validLgtValues = ['G', 'Y', 'R', undefined];
    validLgtValues.forEach(trainerRoadLgt => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadLgt });
      expect(result.success).toBe(true);
    });

    // Invalid LGT values
    const invalidLgtValues = ['B', 'X', 'invalid'];
    invalidLgtValues.forEach(trainerRoadLgt => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadLgt });
      expect(result.success).toBe(false);
    });
  });

  it('should validate positive numbers for power metrics', () => {
    const positiveFields = ['normalizedPower', 'tss', 'avgHeartRate', 'rMSSD', 'rhr'];
    
    positiveFields.forEach(field => {
      // Valid positive values
      const validWorkoutPositive = { ...validWorkout, [field]: 100 };
      const result = insertWorkoutSchema.safeParse(validWorkoutPositive);
      expect(result.success).toBe(true);

      // Invalid negative/zero values
      const invalidValues = [0, -1, -100];
      invalidValues.forEach(value => {
        const invalidWorkout = { ...validWorkout, [field]: value };
        const result = insertWorkoutSchema.safeParse(invalidWorkout);
        expect(result.success).toBe(false);
      });
    });
  });

  it('should allow optional fields to be undefined', () => {
    const minimalWorkout = {
      workoutDate: validWorkout.workoutDate,
      goal: validWorkout.goal,
      rpe: validWorkout.rpe,
      feel: validWorkout.feel
    };
    
    const result = insertWorkoutSchema.safeParse(minimalWorkout);
    expect(result.success).toBe(true);
  });
});