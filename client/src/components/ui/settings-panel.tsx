import { useEffect } from "react";
import { X } from "lucide-react";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrainerRoadMetrics: boolean;
  onShowTrainerRoadMetricsChange: (value: boolean) => void;
}

export function SettingsPanel({
  open,
  onOpenChange,
  showTrainerRoadMetrics,
  onShowTrainerRoadMetricsChange,
}: SettingsPanelProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="settings-panel-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close settings"
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Show TrainerRoad metrics</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Show TR-RPE and TR-LGT fields on the form and in generated markdown.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showTrainerRoadMetrics}
            aria-label="Show TrainerRoad metrics"
            onClick={() => onShowTrainerRoadMetricsChange(!showTrainerRoadMetrics)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              showTrainerRoadMetrics ? "bg-brand-blue" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showTrainerRoadMetrics ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
