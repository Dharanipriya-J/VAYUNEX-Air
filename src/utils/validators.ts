import type { AppSettings, CityLocation, CommunityPledge, HouseholdProfile } from '../types/vayunex';

/**
 * Runtime type guards for data restored from Web Storage. Persisted values can
 * be stale or tampered with, so they are validated before use.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isCityLocation(value: unknown): value is CityLocation {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.country === 'string' &&
    isFiniteNumber(value.lat) &&
    isFiniteNumber(value.lon)
  );
}

export function isAppSettings(value: unknown): value is AppSettings {
  return (
    isRecord(value) &&
    isFiniteNumber(value.alertThresholdAqi) &&
    typeof value.notificationsEnabled === 'boolean'
  );
}

export function isHouseholdProfile(value: unknown): value is HouseholdProfile {
  return (
    isRecord(value) &&
    typeof value.householdName === 'string' &&
    isFiniteNumber(value.familySize) &&
    typeof value.hasChildren === 'boolean' &&
    typeof value.hasSeniors === 'boolean' &&
    typeof value.hasPurifier === 'boolean' &&
    ['none', 'mild', 'asthma_copd'].includes(value.respiratorySensitivity as string) &&
    ['apartment', 'house'].includes(value.homeType as string) &&
    ['electric_induction', 'gas', 'biomass'].includes(value.cookingFuel as string) &&
    ['car', 'transit', 'bike_walk'].includes(value.primaryCommute as string) &&
    ['diy_low_cost', 'balanced', 'smart_home'].includes(value.budgetMode as string)
  );
}

export function isPledgeList(value: unknown): value is CommunityPledge[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.neighborhood === 'string' &&
        typeof item.description === 'string' &&
        isFiniteNumber(item.participants) &&
        isFiniteNumber(item.monthlyCo2Kg) &&
        isFiniteNumber(item.pm25GramsSaved) &&
        typeof item.joined === 'boolean'
    )
  );
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
