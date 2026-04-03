import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema, type InsertWorkout } from "@shared/schema-static";
import { useFormPersistence } from "@/hooks/use-form-persistence";

const DRAFT_KEY = "pedalnotes-draft-test";

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

function renderFormAndPersistence(initialLocalStorage?: string) {
  if (initialLocalStorage !== undefined) {
    localStorage.setItem(DRAFT_KEY, initialLocalStorage);
  }

  return renderHook(() => {
    const form = useForm<InsertWorkout>({
      resolver: zodResolver(insertWorkoutSchema),
      defaultValues,
    });
    const persistence = useFormPersistence(form, { key: DRAFT_KEY, debounceMs: 0 });
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
    expect(parsed.goal).toBe("Endurance ride");
  });

  it("restores draft on mount and sets wasRestored=true", () => {
    const savedDraft = JSON.stringify({ ...defaultValues, goal: "Recovery ride", workoutDate: "2025-12-01" });

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.wasRestored).toBe(true);
    expect(result.current.form.getValues("goal")).toBe("Recovery ride");
    expect(result.current.form.getValues("workoutDate")).toBe("2025-12-01");
  });

  it("preserves persisted date on restore (does not overwrite with today)", () => {
    const pastDate = "2024-06-15";
    const savedDraft = JSON.stringify({ ...defaultValues, workoutDate: pastDate });

    const { result } = renderFormAndPersistence(savedDraft);

    expect(result.current.form.getValues("workoutDate")).toBe(pastDate);
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
    const savedDraft = JSON.stringify({ ...defaultValues, goal: "Sprint session" });
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
