import { AQI_BREAKPOINTS } from '../constants';

/** Presentation and guidance metadata for a US EPA AQI category. */
export interface AqiMeta {
  label: string;
  badgeClass: string;
  ringColor: string;
  textColor: string;
  maskAdvice: string;
  windowAdvice: string;
  outdoorAdvice: string;
}

const AQI_CATEGORIES: ReadonlyArray<{ maxAqi: number; meta: AqiMeta }> = [
  {
    maxAqi: AQI_BREAKPOINTS.good,
    meta: {
      label: 'Good',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      ringColor: '#10b981',
      textColor: 'text-emerald-700',
      maskAdvice: 'Not needed outdoors',
      windowAdvice: 'Open windows for fresh cross-ventilation',
      outdoorAdvice: 'Ideal for outdoor exercise & family walks',
    },
  },
  {
    maxAqi: AQI_BREAKPOINTS.moderate,
    meta: {
      label: 'Moderate',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      ringColor: '#f59e0b',
      textColor: 'text-amber-700',
      maskAdvice: 'Optional for sensitive groups',
      windowAdvice: 'Ventilate briefly during midday (1–3 PM)',
      outdoorAdvice: 'Safe for most; sensitive groups pace exertion',
    },
  },
  {
    maxAqi: AQI_BREAKPOINTS.sensitive,
    meta: {
      label: 'Unhealthy for Sensitive Groups',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      ringColor: '#f97316',
      textColor: 'text-orange-700',
      maskAdvice: 'KF94 / N95 recommended for kids, seniors & asthma',
      windowAdvice: 'Keep windows closed except 15-min midday flush',
      outdoorAdvice: 'Limit prolonged outdoor exertion; move workouts indoors',
    },
  },
  {
    maxAqi: AQI_BREAKPOINTS.unhealthy,
    meta: {
      label: 'Unhealthy',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      ringColor: '#e11d48',
      textColor: 'text-rose-700',
      maskAdvice: 'Well-fitted N95 / FFP2 essential outdoors',
      windowAdvice: 'Seal windows & run HEPA / Corsi-Rosenthal box',
      outdoorAdvice: 'Avoid outdoor cardio; reschedule errands to midday trough',
    },
  },
  {
    maxAqi: AQI_BREAKPOINTS.veryUnhealthy,
    meta: {
      label: 'Very Unhealthy',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
      ringColor: '#9333ea',
      textColor: 'text-purple-800',
      maskAdvice: 'Mandatory N95 / N99 for any outdoor trip',
      windowAdvice: 'Keep home sealed; use wet-mopping & source control',
      outdoorAdvice: 'Stay indoors; keep children & seniors in filtered rooms',
    },
  },
];

const HAZARDOUS_META: AqiMeta = {
  label: 'Hazardous',
  badgeClass: 'bg-red-950 text-red-100 border-red-900',
  ringColor: '#881337',
  textColor: 'text-red-900',
  maskAdvice: 'N95 / N99 with tight seal; minimize any outdoor time',
  windowAdvice: 'Full indoor seal + continuous air filtration',
  outdoorAdvice: 'Emergency smog protocol — avoid all outdoor activity',
};

/**
 * Maps a US AQI value to its EPA severity category, display styling,
 * and actionable health guidance.
 */
export function getAqiMeta(aqi: number): AqiMeta {
  const match = AQI_CATEGORIES.find((category) => aqi <= category.maxAqi);
  return match ? match.meta : HAZARDOUS_META;
}
