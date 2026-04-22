import { describe, it, expect } from 'vitest';
import { insertWorkoutSchema } from '@shared/schema-static';

describe('Workout Schema Validation', () => {
  const validWorkout = {
    entryType: 'cycling' as const,
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

  it('should require goal field to be present for cycling entries', () => {
    const { goal, ...invalidWorkout } = validWorkout;
    const result = insertWorkoutSchema.safeParse(invalidWorkout);
    expect(result.success).toBe(false);
  });

  it('should require rpe for cycling entries', () => {
    const { rpe, ...invalidWorkout } = validWorkout;
    const result = insertWorkoutSchema.safeParse(invalidWorkout);
    expect(result.success).toBe(false);
  });

  it('should require feel for cycling entries', () => {
    const { feel, ...invalidWorkout } = validWorkout;
    const result = insertWorkoutSchema.safeParse(invalidWorkout);
    expect(result.success).toBe(false);
  });

  it('should validate RPE range (1-10) for cycling', () => {
    for (let rpe = 1; rpe <= 10; rpe++) {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, rpe });
      expect(result.success).toBe(true);
    }

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

    const invalidFeelValues = ['X', 'invalid', ''];
    invalidFeelValues.forEach(feel => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, feel });
      expect(result.success).toBe(false);
    });
  });

  it('should validate trainerRoadRpe values (1-5 or undefined)', () => {
    const validTrRpeValues = [1, 2, 3, 4, 5, undefined];
    validTrRpeValues.forEach(trainerRoadRpe => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadRpe });
      expect(result.success).toBe(true);
    });

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

    const invalidLgtValues = ['B', 'X', 'invalid'];
    invalidLgtValues.forEach(trainerRoadLgt => {
      const result = insertWorkoutSchema.safeParse({ ...validWorkout, trainerRoadLgt });
      expect(result.success).toBe(false);
    });
  });

  it('should validate positive numbers for power metrics', () => {
    const positiveFields = ['normalizedPower', 'tss', 'avgHeartRate', 'rMSSD', 'rhr'];

    positiveFields.forEach(field => {
      const validWorkoutPositive = { ...validWorkout, [field]: 100 };
      const result = insertWorkoutSchema.safeParse(validWorkoutPositive);
      expect(result.success).toBe(true);

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
      entryType: validWorkout.entryType,
      workoutDate: validWorkout.workoutDate,
      goal: validWorkout.goal,
      rpe: validWorkout.rpe,
      feel: validWorkout.feel
    };

    const result = insertWorkoutSchema.safeParse(minimalWorkout);
    expect(result.success).toBe(true);
  });

  describe('entryType', () => {
    it('should reject missing entryType', () => {
      const { entryType, ...workoutWithoutType } = validWorkout;
      const result = insertWorkoutSchema.safeParse(workoutWithoutType);
      expect(result.success).toBe(false);
    });

    it('should reject invalid entryType values', () => {
      const invalidTypes = ['mfr', 'yoga', 'ride', 'recovery', ''];
      invalidTypes.forEach(entryType => {
        const result = insertWorkoutSchema.safeParse({ ...validWorkout, entryType });
        expect(result.success).toBe(false);
      });
    });

    it('should accept all valid entryType values', () => {
      const validTypes = ['cycling', 'rest', 'other'] as const;
      validTypes.forEach(entryType => {
        const minimal = { entryType, workoutDate: '2025-10-07' };
        // Cycling requires extra fields; the others don't
        const workout = entryType === 'cycling'
          ? { ...minimal, goal: '', rpe: 5, feel: 'N' as const }
          : minimal;
        const result = insertWorkoutSchema.safeParse(workout);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('rest entries', () => {
    it('should validate a rest entry without goal/rpe/feel', () => {
      const restWorkout = {
        entryType: 'rest' as const,
        workoutDate: '2025-10-07',
        hrv: 'Limit intensity today',
        rMSSD: 30,
        rhr: 63,
        weight: 82.5,
        restNotes: 'Took a real day off',
      };
      const result = insertWorkoutSchema.safeParse(restWorkout);
      expect(result.success).toBe(true);
    });

    it('should reject zero/negative weight', () => {
      const base = { entryType: 'rest' as const, workoutDate: '2025-10-07' };
      [0, -1, -5.2].forEach(weight => {
        const result = insertWorkoutSchema.safeParse({ ...base, weight });
        expect(result.success).toBe(false);
      });
    });

    it('should accept positive weight (float)', () => {
      const result = insertWorkoutSchema.safeParse({
        entryType: 'rest',
        workoutDate: '2025-10-07',
        weight: 82.5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('other entries', () => {
    it('should validate an other entry without goal/rpe/feel', () => {
      const otherWorkout = {
        entryType: 'other' as const,
        workoutDate: '2025-10-07',
        activityGoal: 'MFR',
        activityNotes: 'Full body protocol',
      };
      const result = insertWorkoutSchema.safeParse(otherWorkout);
      expect(result.success).toBe(true);
    });

    it('should validate an other entry with only entryType and date', () => {
      const result = insertWorkoutSchema.safeParse({
        entryType: 'other',
        workoutDate: '2025-10-07',
      });
      expect(result.success).toBe(true);
    });
  });
});
