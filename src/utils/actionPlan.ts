import { getAqiMeta } from '../services/aqiMeta';
import { findCleanestWindow } from '../services/ai/cleanWindow';
import type {
  AirQualityData,
  HouseholdProfile,
  IndoorHack,
  RoutineSlot,
  SustainableSwap,
} from '../types/vayunex';

export interface ActionPlanInput {
  aq: AirQualityData;
  profile: HouseholdProfile;
  routine: readonly RoutineSlot[];
  hacks: readonly IndoorHack[];
  swaps: readonly SustainableSwap[];
}

/** Builds the plain-text household action plan offered for download. */
export function buildActionPlanText({ aq, profile, routine, hacks, swaps }: ActionPlanInput): string {
  const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);
  const meta = getAqiMeta(aq.aqi);

  return [
    'VAYUNEX — HOUSEHOLD CLEAN AIR ACTION PLAN',
    '==========================================',
    `City: ${aq.city.name}, ${aq.city.country}`,
    `Current AQI: ${aq.aqi} (${meta.label}) | PM2.5: ${aq.pm25} µg/m³ | NO₂: ${aq.no2} µg/m³`,
    `Cleanest Window Today: ${bestHour} (AQI ~${bestAqi})`,
    `Peak Smog Window: ${worstHour} (AQI ~${worstAqi})`,
    `Household: ${profile.householdName} (${profile.familySize} members, ${profile.homeType})`,
    '',
    "1. TODAY'S LOW-EMISSION ROUTINE",
    ...routine.map(
      (slot) => `- [${slot.completed ? 'x' : ' '}] ${slot.timeWindow} | ${slot.title}: ${slot.recommendation}`
    ),
    '',
    '2. ACTIVE INDOOR AIR MEASURES',
    ...hacks.map((hack) => `- ${hack.title} (-${hack.pm25ReductionPct}% PM2.5)`),
    '',
    '3. SUSTAINABLE ALTERNATIVES',
    ...swaps.map(
      (swap) =>
        `- ${swap.alternative} (-${swap.personalPm25SavedUgDay} µg/m³·day, -${swap.co2SavedKgMonth} kg CO₂e/mo)`
    ),
  ].join('\n');
}

/** Converts a city name into a filesystem-safe slug. */
export function toFileSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'City';
}

/** Triggers a browser download of plain text without navigating away. */
export function downloadTextFile(fileName: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
