import { AQI_BREAKPOINTS } from '../../constants';
import type {
  AirQualityData,
  CookingFuel,
  HouseholdProfile,
  PrimaryCommute,
  RoutineSlot,
} from '../../types/vayunex';
import { findCleanestWindow } from './cleanWindow';

const COOKING_ADVICE: Record<CookingFuel, string> = {
  gas: 'Run range hood 2 min before lighting gas, cook on rear burners with lids on, or use an electric kettle/induction for morning tea & boiling.',
  biomass:
    'Avoid indoor solid fuel/wood today; use electric induction or clean LPG with cross-ventilation during the midday trough.',
  electric_induction:
    'Induction cooking keeps indoor NO₂ at zero—keep lids on during high-heat searing to trap oil aerosols.',
};

function commuteAdvice(commute: PrimaryCommute, highSmog: boolean): string {
  switch (commute) {
    case 'car':
      return 'Shift to Metro/electric transit or 3-family carpool. If driving, set cabin HVAC to Recirculate (not Fresh Air) in traffic.';
    case 'bike_walk':
      return highSmog
        ? 'Wear a tight-fitting N95/FFP2 respirator and take side streets away from arterial diesel traffic.'
        : 'Use tree-lined side streets; keep exertion steady to limit deep lung particle deposition.';
    case 'transit':
      return 'Use rail/electric transit; wear an N95 during platform waits and last-mile walks.';
  }
}

function purifierAdvice(hasPurifier: boolean): string {
  return hasPurifier
    ? 'Run HEPA purifier on Medium-High in the main living area; move it to bedrooms 45 min before sleep.'
    : 'Position a DIY Corsi-Rosenthal MERV-13 box fan in the main room and keep bedroom doors closed to create a clean-air sleep sanctuary.';
}

/** Returns true when the household includes anyone with elevated smog sensitivity. */
export function isSensitiveHousehold(profile: HouseholdProfile): boolean {
  return profile.hasChildren || profile.hasSeniors || profile.respiratorySensitivity !== 'none';
}

/**
 * Generates a personalized, five-slot low-emission daily routine timed to the
 * city's hourly smog curve and tailored to the household profile.
 */
export function generateRoutine(aq: AirQualityData, profile: HouseholdProfile): RoutineSlot[] {
  const { bestHour, bestAqi, worstHour } = findCleanestWindow(aq);
  const sensitive = isSensitiveHousehold(profile);
  const highSmog = aq.aqi > AQI_BREAKPOINTS.sensitive;
  const middayIsVentilatable = bestAqi <= AQI_BREAKPOINTS.sensitive;

  return [
    {
      id: 'slot-morning',
      timeWindow: '06:30 – 09:30',
      title: 'Morning Inversion & Commute Shield',
      category: 'commute',
      status: highSmog || sensitive ? 'avoid' : 'caution',
      recommendation: `${commuteAdvice(profile.primaryCommute, highSmog)} Keep windows latched during morning rush hour.`,
      reason: `Cold morning air traps vehicle exhaust near street level in ${aq.city.name} (current AQI ${aq.aqi}, PM2.5 ${aq.pm25} µg/m³).`,
      impactMetric: '-32% morning PM2.5 inhalation',
      completed: false,
    },
    {
      id: 'slot-breakfast',
      timeWindow: '08:00 – 09:00',
      title: 'Low-Emission Kitchen Routine',
      category: 'indoor',
      status: profile.cookingFuel === 'electric_induction' ? 'safe' : 'caution',
      recommendation: COOKING_ADVICE[profile.cookingFuel],
      reason:
        profile.cookingFuel === 'gas'
          ? 'Unvented gas cooking can double indoor NO₂ and PM2.5 within 15 minutes.'
          : 'Source control prevents indoor particulate spikes when windows must stay closed.',
      impactMetric: '-58% indoor cooking PM2.5',
      completed: false,
    },
    {
      id: 'slot-midday',
      timeWindow: `${bestHour} Window (${middayIsVentilatable ? '15–20 min' : '5-min flush'})`,
      title: 'Cleanest Atmospheric Flush & Errands',
      category: 'ventilation',
      status: bestAqi <= AQI_BREAKPOINTS.moderate ? 'safe' : 'caution',
      recommendation: middayIsVentilatable
        ? `Open two opposite windows for 15 minutes around ${bestHour} (lowest AQI ~${bestAqi}) to flush indoor CO₂. Batch outdoor errands or school pickup now.`
        : `AQI remains elevated (~${bestAqi}) even at midday. Limit window opening to 5 minutes with exhaust fans on, and wear N95 for errands.`,
      reason: `Midday solar warming lifts the winter inversion layer, making ${bestHour} the cleanest window of the day.`,
      impactMetric: '-45% indoor CO₂ buildup',
      completed: false,
    },
    {
      id: 'slot-evening',
      timeWindow: '17:30 – 20:30',
      title: 'Evening Smog Seal & Indoor Activity',
      category: 'outdoor',
      status: highSmog ? 'avoid' : 'caution',
      recommendation: `${
        sensitive
          ? 'Keep children and seniors indoors; swap outdoor play for indoor stretching or board games.'
          : 'Move cardio workouts indoors.'
      } Close all windows before dusk, wet-mop entryways, and avoid candles/incense.`,
      reason: `Smog typically peaks around ${worstHour} as evening traffic meets rapid cooling.`,
      impactMetric: '-44% outdoor smog infiltration',
      completed: false,
    },
    {
      id: 'slot-night',
      timeWindow: '21:30 – 06:30',
      title: 'Clean-Air Sleep Sanctuary',
      category: 'health',
      status: 'safe',
      recommendation: `${purifierAdvice(profile.hasPurifier)} Keep bedroom door shut and maintain 40–50% indoor humidity to protect nasal airways.`,
      reason:
        '8 hours of low-PM2.5 sleep lets lung macrophages clear daytime particulates and lowers overnight asthma flare risk.',
      impactMetric: '+8 hrs protected lung recovery',
      completed: false,
    },
  ];
}
