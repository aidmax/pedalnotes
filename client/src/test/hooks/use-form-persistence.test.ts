import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema, type InsertWorkout } from "@shared/schema-static";
import { useFormPersistence } from "@/hooks/use-form-persistence";

const DRAFT_KEY = "pedalnotes-draft-test";
const ONE_HOUR_MS = 60 * 60 * 1000;
const EIGHT_HOURS_MS = 8 * ONE_HOUR_MS;

const defaultValues: InsertWorkout = {
  workoutDate: "2026-01-01",
  goal: "",
  rpe: 1,
  feel: "N",
  choIntakePre: "",
  choIntake: "",
  choIntakePost: "",
  normalizedPower: undefined,
  tss: undefined,
  avgHeartRate: undefined,
  hrv: "",
  rMSSD: undefined,
  rhr: undefined,
  trainerRoadRpe: undefined,
  trainerRoadLgt: undefined,
  whatWentWell: "",
  whatCouldBeImproved: "",
  description: "",
};

function makeDraft(values: InsertWorkout, savedAt: number) {
  return JSON.stringify({ data: values, savedAt });
}

function renderFormAndPersistence(initialLocalStorage?: string, maxAgeMs?: number) {
  if (initialLocalStorage !== undefined) {
    localStorage.setItem(DRAFT_KEY, initialLocalStorage);
  }

  return renderHook(() => {
    const form = useForm<InsertWorkout>({
      resolver: zodResolver(insertWorkoutSchema),
      defaultValues,
    });
    const persistence = useFormPersistence(form, { key: DRAFT_KEY, debounceMs: 0, ...(maxAgeMs !== undefined && { maxAgeMs }) });
    return { form, ...persistence };
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("useFormPersistence", () => {
  it("saves form values to localStorage after debounce", async () => {
    const { result } = renderFormAndPersistence();

    await act(async () => {
      result.current.form.setValue("goal", "Endurance ride");
    });

    act(() => {
      vi.runAllTimers();
    });

    const saved = localStorage.getItem(DRAFT_KEY);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.data.goal).toBe("Endurance ride");
    expect(typeof parsed.savedAt).toBe("number");
  });

  it("restores draft on mount and sets wasRestored=true", () => {
    const savedDraft = makeDraft({ ...defaultValues, goal: "Recovery ride", workoutDate: "2025-12-01" }, Date.now());

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.wasRestored).toBe(true);
    expect(result.current.form.getValues("goal")).toBe("Recovery ride");
    expect(result.current.form.getValues("workoutDate")).toBe("2025-12-01");
  });

  it("preserves persisted date on restore (does not overwrite with today)", () => {
    const pastDate = "2024-06-15";
    const savedDraft = makeDraft({ ...defaultValues, workoutDate: pastDate }, Date.now());

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.form.getValues("workoutDate")).toBe(pastDate);
  });

  it("discards draft that exceeds maxAgeMs and does not restore", () => {
    const expiredSavedAt = Date.now() - EIGHT_HOURS_MS - 1;
    const savedDraft = makeDraft({ ...defaultValues, goal: "Old ride" }, expiredSavedAt);

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.wasRestored).toBe(false);
    expect(result.current.form.getValues("goal")).toBe("");
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("restores draft that is within maxAgeMs", () => {
    const recentSavedAt = Date.now() - ONE_HOUR_MS;
    const savedDraft = makeDraft({ ...defaultValues, goal: "Recent ride" }, recentSavedAt);

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.wasRestored).toBe(true);
    expect(result.current.form.getValues("goal")).toBe("Recent ride");
  });

  it("discards draft older than custom maxAgeMs", () => {
    const customMaxAgeMs = ONE_HOUR_MS;
    const twoHoursAgo = Date.now() - 2 * ONE_HOUR_MS;
    const savedDraft = makeDraft({ ...defaultValues, goal: "Old ride" }, twoHoursAgo);

    const { result } = renderFormAndPersistence(savedDraft, customMaxAgeMs);

    expect(result.current.wasRestored).toBe(false);
    expect(result.current.form.getValues("goal")).toBe("");
  });

  it("discards old-format draft (no savedAt) and does not set wasRestored", () => {
    // Simulate a draft written by the previous version of the hook (plain values, no savedAt)
    const oldFormatDraft = JSON.stringify({ ...defaultValues, goal: "Old format ride" });

    const { result } = renderFormAndPersistence(oldFormatDraft);

    expect(result.current.wasRestored).toBe(false);
    expect(result.current.form.getValues("goal")).toBe("");
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("handles corrupt localStorage data without crashing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderFormAndPersistence("not valid json {{{{");

    expect(result.current.wasRestored).toBe(false);
    expect(result.current.form.getValues("goal")).toBe("");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("clearDraft removes key from localStorage and resets wasRestored", async () => {
    const savedDraft = makeDraft({ ...defaultValues, goal: "Sprint session" }, Date.now());
    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.wasRestored).toBe(true);
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.wasRestored).toBe(false);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("does not set wasRestored when no draft exists", () => {
    const { result } = renderFormAndPersistence();
    expect(result.current.wasRestored).toBe(false);
  });
});
