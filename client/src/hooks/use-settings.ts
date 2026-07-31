import { useState } from "react";

export interface Settings {
  showTrainerRoadMetrics: boolean;
}

interface PersistedSettings {
  version: 1;
  data: Settings;
}

interface UseSettingsOptions {
  key: string;
  defaults: Settings;
}

export function useSettings(options: UseSettingsOptions): {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
} {
  const { key, defaults } = options;

  const [settings, setSettings] = useState<Settings>(() => {
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
        const data = (parsed as PersistedSettings).data;
        // Merge: use defaults for missing keys, drop unknown keys
        const merged: Settings = { ...defaults };
        for (const settingKey of Object.keys(defaults) as (keyof Settings)[]) {
          if (typeof data[settingKey] === "boolean") {
            merged[settingKey] = data[settingKey];
          }
        }
        return merged;
      }
    } catch (err) {
      console.error("[use-settings] Failed to restore settings:", err);
    }
    return { ...defaults };
  });

  function setSetting<K extends keyof Settings>(settingKey: K, value: Settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [settingKey]: value };
      persistRaw(key, next);
      return next;
    });
  }

  return { settings, setSetting };
}

function persistRaw(key: string, data: Settings) {
  try {
    const toStore: PersistedSettings = { version: 1, data };
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("[use-settings] localStorage quota exceeded");
    }
  }
}
