import { useState } from "react";

export type SectionId =
  | "core-metrics"
  | "fueling"
  | "performance-metrics"
  | "recovery-metrics"
  | "reflection";

const ALL_SECTION_IDS: SectionId[] = [
  "core-metrics",
  "fueling",
  "performance-metrics",
  "recovery-metrics",
  "reflection",
];

interface PersistedSectionState {
  version: 1;
  data: Record<SectionId, boolean>;
}

interface UseSectionStateOptions {
  key: string;
  defaults: Record<SectionId, boolean>;
}

export function useSectionState(options: UseSectionStateOptions): {
  sectionStates: Record<SectionId, boolean>;
  toggleSection: (id: SectionId) => void;
  setSection: (id: SectionId, open: boolean) => void;
  resetSections: () => void;
} {
  const { key, defaults } = options;

  const [sectionStates, setSectionStates] = useState<Record<SectionId, boolean>>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          (parsed as Record<string, unknown>).version !== 1 ||
          typeof (parsed as Record<string, unknown>).data !== "object" ||
          (parsed as Record<string, unknown>).data === null
        ) {
          // Malformed or wrong version — fall back to defaults and overwrite
          persistRaw(key, defaults);
          return { ...defaults };
        }
        const data = (parsed as PersistedSectionState).data;
        // Merge: use defaults for missing keys, drop unknown keys
        const merged: Record<SectionId, boolean> = { ...defaults };
        for (const id of ALL_SECTION_IDS) {
          if (typeof data[id] === "boolean") {
            merged[id] = data[id];
          }
        }
        return merged;
      }
    } catch (err) {
      console.error("[use-section-state] Failed to restore section states:", err);
    }
    return { ...defaults };
  });

  function toggleSection(id: SectionId) {
    setSectionStates((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persistRaw(key, next);
      return next;
    });
  }

  function setSection(id: SectionId, open: boolean) {
    setSectionStates((prev) => {
      const next = { ...prev, [id]: open };
      persistRaw(key, next);
      return next;
    });
  }

  function resetSections() {
    const next = { ...defaults };
    persistRaw(key, next);
    setSectionStates(next);
  }

  return { sectionStates, toggleSection, setSection, resetSections };
}

function persistRaw(key: string, data: Record<SectionId, boolean>) {
  try {
    const toStore: PersistedSectionState = { version: 1, data };
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("[use-section-state] localStorage quota exceeded");
    }
  }
}
