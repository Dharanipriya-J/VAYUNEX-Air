/**
 * Shared domain constants. Centralizing these values keeps thresholds,
 * storage keys, and tuning parameters in one documented place.
 */

/** WHO 2021 24-hour air quality guideline reference values (µg/m³). */
export const WHO_GUIDELINES = {
  pm25: 15,
  pm10: 45,
  no2: 25,
  o3: 100,
  co: 4000,
  so2: 40,
} as const;

/** US EPA AQI category upper bounds. */
export const AQI_BREAKPOINTS = {
  good: 50,
  moderate: 100,
  sensitive: 150,
  unhealthy: 200,
  veryUnhealthy: 300,
} as const;

/** Upper bound used to scale the circular AQI gauge. */
export const AQI_GAUGE_MAX = 350;

/** Hours (inclusive, 24h clock) considered "daytime" for errands and ventilation. */
export const DAYTIME_WINDOW = { startHour: 10, endHour: 17 } as const;

/** Approximate PM2.5 exposure equivalent to smoking one cigarette per day (µg/m³). */
export const PM25_PER_CIGARETTE = 22;

/** Number of neighboring households used for the community multiplier. */
export const COMMUNITY_MULTIPLIER_HOMES = 50;

/** Target air changes per hour for room filtration sizing during severe smog. */
export const TARGET_AIR_CHANGES_PER_HOUR = 5;

/** Approximate clean air delivery rate of one DIY MERV-13 box fan unit (CFM). */
export const DIY_BOX_CADR_CFM = 450;

/** Fraction of outdoor PM2.5 that infiltrates a typical closed home. */
export const INDOOR_INFILTRATION_RATIO = 0.65;

/** Network timeouts for external API calls (ms). */
export const NETWORK_TIMEOUT_MS = {
  geocoding: 3500,
  airQuality: 4500,
  gemini: 15000,
} as const;

/** Debounce delay for the city search input (ms). */
export const SEARCH_DEBOUNCE_MS = 220;

/** Maximum accepted length for free-text user inputs. */
export const MAX_PROMPT_LENGTH = 500;
export const MAX_TEXT_FIELD_LENGTH = 120;

/** Minimum length for a plausible Gemini API key. */
export const MIN_API_KEY_LENGTH = 20;

/** External API endpoints. */
export const API_ENDPOINTS = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  gemini:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
} as const;

/** localStorage keys for persisted, non-sensitive user state. */
export const STORAGE_KEYS = {
  city: 'vayunex_city',
  profile: 'vayunex_profile',
  settings: 'vayunex_settings',
  hacks: 'vayunex_hacks',
  swaps: 'vayunex_swaps',
  pledges: 'vayunex_pledges',
} as const;

/** sessionStorage key for the optional Gemini API key (cleared when the tab closes). */
export const SESSION_KEYS = {
  geminiApiKey: 'vayunex_gemini_key',
} as const;
