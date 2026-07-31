import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings, type Settings } from "@/hooks/use-settings";

const SETTINGS_KEY = "pedalnotes-settings-test";

const defaults: Settings = {
  showTrainerRoadMetrics: false,
};

function makeStored(data: Partial<Settings>, version = 1) {
  return JSON.stringify({ version, data });
}

function renderHookWithDefaults() {
  return renderHook(() => useSettings({ key: SETTINGS_KEY, defaults }));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("useSettings", () => {
  it("returns defaults when no localStorage entry exists", () => {
    const { result } = renderHookWithDefaults();
    expect(result.current.settings).toEqual(defaults);
  });

  it("restores persisted state on mount", () => {
    localStorage.setItem(SETTINGS_KEY, makeStored({ showTrainerRoadMetrics: true }));

    const { result } = renderHookWithDefaults();
    expect(result.current.settings).toEqual({ showTrainerRoadMetrics: true });
  });

  it("setSetting updates a single setting and persists", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.setSetting("showTrainerRoadMetrics", true);
    });

    expect(result.current.settings.showTrainerRoadMetrics).toBe(true);
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(stored.data.showTrainerRoadMetrics).toBe(true);
  });

  it("discards malformed localStorage data, falls back to defaults, and overwrites the bad value", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(SETTINGS_KEY, "not valid json {{{{");

    const { result } = renderHookWithDefaults();
    expect(result.current.settings).toEqual(defaults);

    // Should overwrite the malformed value so subsequent mounts don't re-hit the parse error
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(stored).toEqual({ version: 1, data: defaults });

    consoleSpy.mockRestore();
  });

  it("discards data with wrong version and falls back to defaults", () => {
    const badVersion = JSON.stringify({ version: 99, data: { showTrainerRoadMetrics: true } });
    localStorage.setItem(SETTINGS_KEY, badVersion);

    const { result } = renderHookWithDefaults();
    expect(result.current.settings).toEqual(defaults);

    // Should overwrite with version 1
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(stored.version).toBe(1);
  });

  it("merges defaults for missing keys (forward compatibility)", () => {
    localStorage.setItem(SETTINGS_KEY, makeStored({}));

    const { result } = renderHookWithDefaults();

    expect(result.current.settings.showTrainerRoadMetrics).toBe(false); // from defaults
  });

  it("drops unknown keys silently", () => {
    const withExtra = { showTrainerRoadMetrics: true, unknownSetting: true } as unknown as Partial<Settings>;
    localStorage.setItem(SETTINGS_KEY, makeStored(withExtra));

    const { result } = renderHookWithDefaults();

    expect((result.current.settings as Record<string, unknown>)["unknownSetting"]).toBeUndefined();
    expect(result.current.settings.showTrainerRoadMetrics).toBe(true);
  });

  it("catches QuotaExceededError on write without crashing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    const { result } = renderHookWithDefaults();

    expect(() => {
      act(() => {
        result.current.setSetting("showTrainerRoadMetrics", true);
      });
    }).not.toThrow();

    vi.restoreAllMocks();
    consoleSpy.mockRestore();
  });

  it("persists version:1 wrapper in localStorage", () => {
    const { result } = renderHookWithDefaults();

    act(() => {
      result.current.setSetting("showTrainerRoadMetrics", true);
    });

    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(stored.version).toBe(1);
    expect(typeof stored.data).toBe("object");
  });
});
