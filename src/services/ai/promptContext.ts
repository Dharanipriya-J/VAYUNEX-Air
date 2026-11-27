import { getAqiMeta } from '../aqiMeta';
import type { AirQualityData, HouseholdProfile } from '../../types/vayunex';
import { findCleanestWindow } from './cleanWindow';

/** Human-readable description of the most at-risk group in a household. */
export function describeRiskGroup(profile: HouseholdProfile): string {
  if (profile.hasChildren) return 'children (whose faster breathing rate draws 1.5× more PM2.5 per kg)';
  if (profile.hasSeniors) return 'older adults (higher cardiovascular sensitivity to PM2.5)';
  if (profile.respiratorySensitivity !== 'none') return 'sensitive airways';
  return 'your household';
}

/** Serializes live air quality and household context into a compact prompt block. */
export function buildContextSummary(aq: AirQualityData, profile: HouseholdProfile): string {
  const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);
  const air = [
    `City: ${aq.city.name}, ${aq.city.country}`,
    `Current AQI: ${aq.aqi} (${getAqiMeta(aq.aqi).label})`,
    `PM2.5: ${aq.pm25} µg/m³`,
    `PM10: ${aq.pm10} µg/m³`,
    `NO2: ${aq.no2} µg/m³`,
    `Cleanest daytime window: ${bestHour} (AQI ~${bestAqi})`,
    `Peak smog: ${worstHour} (AQI ~${worstAqi})`,
  ].join(' | ');
  const household = [
    `${profile.familySize} people`,
    `children=${profile.hasChildren}`,
    `seniors=${profile.hasSeniors}`,
    `respiratory=${profile.respiratorySensitivity}`,
    `home=${profile.homeType}`,
    `purifier=${profile.hasPurifier}`,
    `cooking=${profile.cookingFuel}`,
    `commute=${profile.primaryCommute}`,
    `budget=${profile.budgetMode}`,
  ].join(', ');
  return `${air}\nHousehold: ${household}`;
}
