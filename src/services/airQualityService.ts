import { API_ENDPOINTS, NETWORK_TIMEOUT_MS } from '../constants';
import { PRESET_CITIES } from '../data/knowledgeBase';
import type { AirQualityData, CityLocation, HourlyPoint } from '../types/vayunex';
import { fetchJsonWithTimeout } from '../utils/http';
import { formatTimeLabel, roundTo } from '../utils/helpers';

export { getAqiMeta } from './aqiMeta';
export type { AqiMeta } from './aqiMeta';

/** Shape of a single result returned by the Open-Meteo Geocoding API. */
interface GeocodingResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

/** Subset of the Open-Meteo Air Quality API response consumed by the app. */
interface AirQualityResponse {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
    sulphur_dioxide?: number;
  };
  hourly?: {
    time?: string[];
    us_aqi?: Array<number | null>;
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
  };
}

/** Typical winter diurnal AQI multipliers: peaks at morning/evening rush, trough mid-afternoon. */
const WINTER_DIURNAL_MULTIPLIERS = [
  1.18, 1.15, 1.1, 1.05, 1.02, 1.08, 1.18, 1.28, 1.25, 1.12, 0.96, 0.82, 0.72, 0.66, 0.64, 0.68,
  0.78, 0.94, 1.12, 1.24, 1.32, 1.3, 1.26, 1.22,
] as const;

/** Representative winter AQI baselines used when live data is unavailable. */
const CITY_BASELINE_AQI: ReadonlyArray<[keyword: string, aqi: number]> = [
  ['delhi', 248],
  ['lahore', 276],
  ['beijing', 158],
  ['krak', 142],
  ['milan', 124],
  ['mexico', 118],
  ['los angeles', 86],
  ['london', 58],
];
const DEFAULT_BASELINE_AQI = 132;

/** Empirical ratios used to estimate pollutant concentrations from AQI in fallback mode. */
const FALLBACK_RATIOS = { pm25PerAqi: 0.48, pm10PerPm25: 1.65, pm10PerAqi: 0.79, no2PerAqi: 0.24, coPerAqi: 3.8, so2PerAqi: 0.08, o3: 38 } as const;

/** Default values used when an individual live reading is missing. */
const LIVE_DEFAULTS = { aqi: 100, pm25: 35, pm10: 60, no2: 28, o3: 42, co: 420, so2: 9 } as const;

const MIN_FALLBACK_AQI = 15;
const HOURS_PER_DAY = 24;
const MAX_GEOCODING_RESULTS = 6;

function hourLabel(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/** Builds a synthetic 24-hour curve from a baseline AQI using the winter diurnal pattern. */
export function buildFallbackHourly(baseAqi: number, now: Date = new Date()): HourlyPoint[] {
  return WINTER_DIURNAL_MULTIPLIERS.map((multiplier, hour) => {
    const timestamp = new Date(now);
    timestamp.setHours(hour, 0, 0, 0);
    const aqi = Math.max(MIN_FALLBACK_AQI, Math.round(baseAqi * multiplier));
    const pm25 = roundTo(aqi * FALLBACK_RATIOS.pm25PerAqi);
    return {
      time: timestamp.toISOString(),
      hourLabel: hourLabel(hour),
      aqi,
      pm25,
      pm10: roundTo(pm25 * FALLBACK_RATIOS.pm10PerPm25),
    };
  });
}

/** Returns a representative winter baseline AQI for a city name. */
export function getCityBaselineAqi(cityName: string): number {
  const lower = cityName.toLowerCase();
  const match = CITY_BASELINE_AQI.find(([keyword]) => lower.includes(keyword));
  return match ? match[1] : DEFAULT_BASELINE_AQI;
}

function matchPresetCities(query: string): CityLocation[] {
  const needle = query.toLowerCase();
  return PRESET_CITIES.filter(
    (city) => city.name.toLowerCase().includes(needle) || city.country.toLowerCase().includes(needle)
  );
}

function toCityLocation(result: GeocodingResult): CityLocation {
  return {
    id: String(result.id),
    name: result.name,
    region: result.admin1,
    country: result.country ?? '',
    lat: result.latitude,
    lon: result.longitude,
    timezone: result.timezone,
  };
}

/**
 * Searches cities worldwide via Open-Meteo Geocoding. Falls back to matching
 * the curated preset list when the network is unavailable.
 */
export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return PRESET_CITIES;

  const localMatches = matchPresetCities(trimmed);
  const params = new URLSearchParams({
    name: trimmed,
    count: String(MAX_GEOCODING_RESULTS),
    language: 'en',
    format: 'json',
  });

  try {
    const json = await fetchJsonWithTimeout<GeocodingResponse>(
      `${API_ENDPOINTS.geocoding}?${params.toString()}`,
      NETWORK_TIMEOUT_MS.geocoding
    );
    return Array.isArray(json.results) ? json.results.map(toCityLocation) : localMatches;
  } catch {
    return localMatches;
  }
}

function hasValidCoordinates(city: CityLocation): boolean {
  return (
    Number.isFinite(city.lat) &&
    Number.isFinite(city.lon) &&
    Math.abs(city.lat) <= 90 &&
    Math.abs(city.lon) <= 180
  );
}

function buildAirQualityUrl(city: CityLocation): string {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    hourly: 'us_aqi,pm2_5,pm10',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `${API_ENDPOINTS.airQuality}?${params.toString()}`;
}

/** Converts a raw Open-Meteo response into the application's AirQualityData model. */
export function parseAirQualityResponse(city: CityLocation, data: AirQualityResponse): AirQualityData {
  const current = data.current ?? {};
  const raw = data.hourly ?? {};
  const currentAqi = current.us_aqi ?? LIVE_DEFAULTS.aqi;

  const hourly: HourlyPoint[] = (raw.time ?? []).slice(0, HOURS_PER_DAY).map((time, index) => ({
    time,
    hourLabel: time.slice(11, 16),
    aqi: Math.round(raw.us_aqi?.[index] ?? currentAqi),
    pm25: roundTo(raw.pm2_5?.[index] ?? current.pm2_5 ?? LIVE_DEFAULTS.pm25),
    pm10: roundTo(raw.pm10?.[index] ?? current.pm10 ?? LIVE_DEFAULTS.pm10),
  }));

  return {
    city,
    aqi: Math.round(currentAqi),
    pm25: roundTo(current.pm2_5 ?? LIVE_DEFAULTS.pm25),
    pm10: roundTo(current.pm10 ?? LIVE_DEFAULTS.pm10),
    no2: roundTo(current.nitrogen_dioxide ?? LIVE_DEFAULTS.no2),
    o3: roundTo(current.ozone ?? LIVE_DEFAULTS.o3),
    co: roundTo(current.carbon_monoxide ?? LIVE_DEFAULTS.co),
    so2: roundTo(current.sulphur_dioxide ?? LIVE_DEFAULTS.so2),
    hourly: hourly.length > 0 ? hourly : buildFallbackHourly(currentAqi),
    source: 'live',
    updatedAt: formatTimeLabel(),
  };
}

/** Produces a regional estimate when live data cannot be retrieved. */
export function buildEstimatedAirQuality(city: CityLocation): AirQualityData {
  const base = getCityBaselineAqi(city.name);
  return {
    city,
    aqi: base,
    pm25: roundTo(base * FALLBACK_RATIOS.pm25PerAqi),
    pm10: roundTo(base * FALLBACK_RATIOS.pm10PerAqi),
    no2: roundTo(base * FALLBACK_RATIOS.no2PerAqi),
    o3: FALLBACK_RATIOS.o3,
    co: Math.round(base * FALLBACK_RATIOS.coPerAqi),
    so2: roundTo(base * FALLBACK_RATIOS.so2PerAqi),
    hourly: buildFallbackHourly(base),
    source: 'estimated',
    updatedAt: formatTimeLabel(),
  };
}

/**
 * Fetches live air quality for a city from Open-Meteo, falling back to a
 * regional winter estimate on invalid coordinates, timeouts, or API errors.
 */
export async function fetchAirQuality(city: CityLocation): Promise<AirQualityData> {
  if (!hasValidCoordinates(city)) return buildEstimatedAirQuality(city);
  try {
    const data = await fetchJsonWithTimeout<AirQualityResponse>(
      buildAirQualityUrl(city),
      NETWORK_TIMEOUT_MS.airQuality
    );
    return parseAirQualityResponse(city, data);
  } catch {
    return buildEstimatedAirQuality(city);
  }
}
