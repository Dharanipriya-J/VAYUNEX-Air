import { AlertTriangle } from 'lucide-react';

interface SmogAlertBannerProps {
  cityName: string;
  aqi: number;
  threshold: number;
  onViewRoutine: () => void;
}

/** Prominent, screen-reader-announced alert shown when AQI exceeds the user's threshold. */
export function SmogAlertBanner({ cityName, aqi, threshold, onViewRoutine }: SmogAlertBannerProps) {
  return (
    <div
      role="alert"
      className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:text-sm"
    >
      <div className="flex items-center gap-2.5 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
        <span>
          <strong>Smog Alert in {cityName}:</strong> AQI is {aqi} (above your {threshold} threshold). Seal
          windows and wear N95 outdoors.
        </span>
      </div>
      <button
        type="button"
        onClick={onViewRoutine}
        className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800"
      >
        View Safe Routine
      </button>
    </div>
  );
}
