import { useEffect, useRef, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UseFormPersistenceOptions {
  key: string;
  debounceMs?: number;
  maxAgeMs?: number;
}

interface PersistedDraft<T> {
  data: T;
  savedAt: number;
}

export function useFormPersistence<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: UseFormPersistenceOptions
): {
  wasRestored: boolean;
  clearDraft: () => void;
} {
  const { key, debounceMs = 500, maxAgeMs = DEFAULT_MAX_AGE_MS } = options;
  const [wasRestored, setWasRestored] = useState(false);

  // On mount: restore draft from localStorage if within maxAgeMs
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: PersistedDraft<T> = JSON.parse(saved);
        const age = Date.now() - parsed.savedAt;
        if (age > maxAgeMs) {
          localStorage.removeItem(key);
          return;
        }
        form.reset(parsed.data);
        setWasRestored(true);
      }
    } catch (err) {
      console.error("[use-form-persistence] Failed to restore draft:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // On form change: debounced write to localStorage
  useEffect(() => {
    const subscription = form.watch((values) => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        try {
          const draft: PersistedDraft<typeof values> = { data: values, savedAt: Date.now() };
          localStorage.setItem(key, JSON.stringify(draft));
        } catch (err) {
          if (err instanceof DOMException && err.name === "QuotaExceededError") {
            console.error("[use-form-persistence] localStorage quota exceeded");
          }
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimerRef.current);
    };
  }, [form, key, debounceMs]);

  const clearDraft = () => {
    clearTimeout(debounceTimerRef.current);
    try {
      localStorage.removeItem(key);
    } catch (_) {}
    setWasRestored(false);
  };

  return { wasRestored, clearDraft };
}
