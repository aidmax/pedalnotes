import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSectionState, type SectionId } from "@/hooks/use-section-state";

const SECTIONS_KEY = "pedalnotes-sections-test";

const defaults: Record<SectionId, boolean> = {
  "core-metrics": true,
  "fueling": false,
  "performance-metrics": false,
  "recovery-metrics": false,
  "reflection": true,
};

function makeStored(data: Record<SectionId, boolean>, version = 1) {
  return JSON.stringify({ version, data });
}

function renderHookWithDefaults() {
  return renderHook(() =>
    useSectionState({ key: SECTIONS_KEY, defaults })
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("useSectionState", () => {
  it("returns defaults when no localStorage entry exists", () => {
    const { result } = renderHookWithDefaults();
    expect(result.current.sectionStates).toEqual(defaults);
  });

  it("restores persisted state on mount", () => {
    const persisted: Record<SectionId, boolean> = {
      "core-metrics": false,
      "fueling": true,
      "performance-metrics": true,
      "recovery-metrics": false,
      "reflection": false,
    };
    localStorage.setItem(SECTIONS_KEY, makeStored(persisted));

    const { result } = renderHookWithDefaults();
    expect(result.current.sectionStates).toEqual(persisted);
  });

  it("toggleSection flips a single section and persists", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.toggleSection("fueling");
    });

    expect(result.current.sectionStates["fueling"]).toBe(true);
    // Other sections unchanged
    expect(result.current.sectionStates["core-metrics"]).toBe(true);
    expect(result.current.sectionStates["reflection"]).toBe(true);

    const stored = JSON.parse(localStorage.getItem(SECTIONS_KEY)!);
    expect(stored.data["fueling"]).toBe(true);
  });

  it("toggleSection flips open section to closed", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.toggleSection("core-metrics");
    });

    expect(result.current.sectionStates["core-metrics"]).toBe(false);
  });

  it("setSection sets explicit value and persists", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.setSection("performance-metrics", true);
    });

    expect(result.current.sectionStates["performance-metrics"]).toBe(true);
    const stored = JSON.parse(localStorage.getItem(SECTIONS_KEY)!);
    expect(stored.data["performance-metrics"]).toBe(true);
  });

  it("setSection to same value is idempotent", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.setSection("fueling", false); // already false
    });

    expect(result.current.sectionStates["fueling"]).toBe(false);
  });

  it("resetSections restores defaults and persists", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.toggleSection("fueling");
      result.current.toggleSection("core-metrics");
    });

    act(() => {
      result.current.resetSections();
    });

    expect(result.current.sectionStates).toEqual(defaults);
    const stored = JSON.parse(localStorage.getItem(SECTIONS_KEY)!);
    expect(stored.data).toEqual(defaults);
  });

  it("discards malformed localStorage data and falls back to defaults", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(SECTIONS_KEY, "not valid json {{{{");

    const { result } = renderHookWithDefaults();
    expect(result.current.sectionStates).toEqual(defaults);

    consoleSpy.mockRestore();
  });

  it("discards data with wrong version and falls back to defaults", () => {
    const badVersion = JSON.stringify({ version: 99, data: { "core-metrics": false } });
    localStorage.setItem(SECTIONS_KEY, badVersion);

    const { result } = renderHookWithDefaults();
    expect(result.current.sectionStates).toEqual(defaults);

    // Should overwrite with version 1
    const stored = JSON.parse(localStorage.getItem(SECTIONS_KEY)!);
    expect(stored.version).toBe(1);
  });

  it("merges defaults for missing keys (forward compatibility)", () => {
    // Stored data is missing 'reflection' and 'recovery-metrics'
    const partial = {
      "core-metrics": false,
      "fueling": true,
      "performance-metrics": true,
    } as unknown as Record<SectionId, boolean>;
    localStorage.setItem(SECTIONS_KEY, makeStored(partial));

    const { result } = renderHookWithDefaults();

    expect(result.current.sectionStates["core-metrics"]).toBe(false); // from stored
    expect(result.current.sectionStates["fueling"]).toBe(true);       // from stored
    expect(result.current.sectionStates["recovery-metrics"]).toBe(false); // from defaults
    expect(result.current.sectionStates["reflection"]).toBe(true);    // from defaults
  });

  it("drops unknown keys silently", () => {
    const withExtra = {
      "core-metrics": false,
      "fueling": true,
      "performance-metrics": false,
      "recovery-metrics": false,
      "reflection": false,
      "unknown-section": true,  // extra key
    } as unknown as Record<SectionId, boolean>;
    localStorage.setItem(SECTIONS_KEY, makeStored(withExtra));

    const { result } = renderHookWithDefaults();

    // Should not have the unknown key
    expect((result.current.sectionStates as Record<string, unknown>)["unknown-section"]).toBeUndefined();
    expect(result.current.sectionStates["core-metrics"]).toBe(false);
  });

  it("catches QuotaExceededError on write without crashing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    const { result } = renderHookWithDefaults();

    expect(() => {
      act(() => {
        result.current.toggleSection("fueling");
      });
    }).not.toThrow();

    vi.restoreAllMocks();
    consoleSpy.mockRestore();
  });

  it("persists version:1 wrapper in localStorage", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.toggleSection("fueling");
    });

    const stored = JSON.parse(localStorage.getItem(SECTIONS_KEY)!);
    expect(stored.version).toBe(1);
    expect(typeof stored.data).toBe("object");
  });
});
