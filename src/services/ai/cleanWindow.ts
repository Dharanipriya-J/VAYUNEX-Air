import { DAYTIME_WINDOW } from '../../constants';
import type { AirQualityData, HourlyPoint } from '../../types/vayunex';

/** Cleanest daytime hour and peak smog hour derived from an hourly forecast. */
export interface CleanWindow {
  bestHour: string;
  bestAqi: number;
  worstHour: string;
  worstAqi: number;
}

const DEFAULT_BEST_HOUR = '14:00';
const DEFAULT_WORST_HOUR = '21:00';

function isDaytime(point: HourlyPoint): boolean {
  const hour = Number.parseInt(point.hourLabel.slice(0, 2), 10);
  return hour >= DAYTIME_WINDOW.startHour && hour <= DAYTIME_WINDOW.endHour;
}

function minByAqi(points: readonly HourlyPoint[]): HourlyPoint | undefined {
  return points.reduce<HourlyPoint | undefined>(
    (best, point) => (best === undefined || point.aqi < best.aqi ? point : best),
    undefined
  );
}

function maxByAqi(points: readonly HourlyPoint[]): HourlyPoint | undefined {
  return points.reduce<HourlyPoint | undefined>(
    (worst, point) => (worst === undefined || point.aqi > worst.aqi ? point : worst),
    undefined
  );
}

/**
 * Identifies the cleanest daytime hour (for errands and ventilation) and the
 * peak smog hour across the full 24-hour forecast. Falls back to all hours
 * when no daytime data is available, and to sensible defaults when empty.
 */
export function findCleanestWindow(aq: AirQualityData): CleanWindow {
  const daytime = aq.hourly.filter(isDaytime);
  const best = minByAqi(daytime.length > 0 ? daytime : aq.hourly);
  const worst = maxByAqi(aq.hourly);

  return {
    bestHour: best?.hourLabel ?? DEFAULT_BEST_HOUR,
    bestAqi: best?.aqi ?? aq.aqi,
    worstHour: worst?.hourLabel ?? DEFAULT_WORST_HOUR,
    worstAqi: worst?.aqi ?? aq.aqi,
  };
}
