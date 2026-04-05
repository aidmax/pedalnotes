import { useEffect, useRef, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

interface UseFormPersistenceOptions {
  key: string;
  debounceMs?: number;
}

export function useFormPersistence<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: UseFormPersistenceOptions
): {
  wasRestored: boolean;
  clearDraft: () => void;
} {
  const { key, debounceMs = 500 } = options;
  const [wasRestored, setWasRestored] = useState(false);

  // On mount: restore draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
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
          localStorage.setItem(key, JSON.stringify(values));
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
