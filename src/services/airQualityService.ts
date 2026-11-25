import { PRESET_CITIES } from '../data/knowledgeBase';
import type { AirQualityData, CityLocation, HourlyPoint } from '../types/vayunex';

export interface AqiMeta {
  label: string;
  badgeClass: string;
  ringColor: string;
  accentBg: string;
  textColor: string;
  maskAdvice: string;
  windowAdvice: string;
  outdoorAdvice: string;
}

/**
 * Maps a US AQI value to severity metadata, Tailwind badge classes, and actionable health guidance.
 */
export function getAqiMeta(aqi: number): AqiMeta {
  if (aqi <= 50) {
    return {
      label: 'Good',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      ringColor: '#10b981',
      accentBg: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-700',
      maskAdvice: 'Not needed outdoors',
      windowAdvice: 'Open windows for fresh cross-ventilation',
      outdoorAdvice: 'Ideal for outdoor exercise & family walks',
    };
  }
  if (aqi <= 100) {
    return {
      label: 'Moderate',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      ringColor: '#f59e0b',
      accentBg: 'from-amber-50 to-yellow-50',
      textColor: 'text-amber-700',
      maskAdvice: 'Optional for sensitive groups',
      windowAdvice: 'Ventilate briefly during midday (1–3 PM)',
      outdoorAdvice: 'Safe for most; sensitive groups pace exertion',
    };
  }
  if (aqi <= 150) {
    return {
      label: 'Unhealthy for Sensitive Groups',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      ringColor: '#f97316',
      accentBg: 'from-orange-50 to-amber-50',
      textColor: 'text-orange-700',
      maskAdvice: 'KF94 / N95 recommended for kids, seniors & asthma',
      windowAdvice: 'Keep windows closed except 15-min midday flush',
      outdoorAdvice: 'Limit prolonged outdoor exertion; move workouts indoors',
    };
  }
  if (aqi <= 200) {
    return {
      label: 'Unhealthy',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      ringColor: '#e11d48',
      accentBg: 'from-rose-50 to-orange-50',
      textColor: 'text-rose-700',
      maskAdvice: 'Well-fitted N95 / FFP2 essential outdoors',
      windowAdvice: 'Seal windows & run HEPA / Corsi-Rosenthal box',
      outdoorAdvice: 'Avoid outdoor cardio; reschedule errands to midday trough',
    };
  }
  if (aqi <= 300) {
    return {
      label: 'Very Unhealthy',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
      ringColor: '#9333ea',
      accentBg: 'from-purple-50 to-rose-50',
      textColor: 'text-purple-800',
      maskAdvice: 'Mandatory N95 / N99 for any outdoor trip',
      windowAdvice: 'Keep home sealed; use wet-mopping & source control',
      outdoorAdvice: 'Stay indoors; keep children & seniors in filtered rooms',
    };
  }
  return {
    label: 'Hazardous',
    badgeClass: 'bg-red-950 text-red-100 border-red-900',
    ringColor: '#881337',
    accentBg: 'from-red-100 to-rose-100',
    textColor: 'text-red-900',
    maskAdvice: 'N95 / N99 with tight seal; minimize any outdoor time',
    windowAdvice: 'Full indoor seal + continuous air filtration',
    outdoorAdvice: 'Emergency smog protocol — avoid all outdoor activity',
  };
}

function buildFallbackHourly(baseAqi: number): HourlyPoint[] {
  // Winter diurnal curve: high at 7-9 AM and 8-11 PM, lowest at 2-4 PM
  const multipliers = [
    1.18, 1.15, 1.1, 1.05, 1.02, 1.08, 1.18, 1.28, 1.25, 1.12, 0.96, 0.82,
    0.72, 0.66, 0.64, 0.68, 0.78, 0.94, 1.12, 1.24, 1.32, 1.3, 1.26, 1.22,
  ];
  const now = new Date();
  return multipliers.map((m, idx) => {
    const dt = new Date(now);
    dt.setHours(idx, 0, 0, 0);
    const aqi = Math.max(15, Math.round(baseAqi * m));
    const pm25 = Math.round((aqi * 0.48) * 10) / 10;
    const pm10 = Math.round((pm25 * 1.65) * 10) / 10;
    return {
      time: dt.toISOString(),
      hourLabel: `${idx.toString().padStart(2, '0')}:00`,
      aqi,
      pm25,
      pm10,
    };
  });
}

function getCityBaselineAqi(cityName: string): number {
  const lower = cityName.toLowerCase();
  if (lower.includes('delhi')) return 248;
  if (lower.includes('lahore')) return 276;
  if (lower.includes('beijing')) return 158;
  if (lower.includes('krak')) return 142;
  if (lower.includes('milan')) return 124;
  if (lower.includes('mexico')) return 118;
  if (lower.includes('los angeles')) return 86;
  if (lower.includes('london')) return 58;
  return 132;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return PRESET_CITIES;

  const localMatches = PRESET_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      c.country.toLowerCase().includes(trimmed.toLowerCase())
  );

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        trimmed
      )}&count=6&language=en&format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return localMatches;
    const json = await res.json();
    if (!json.results || !Array.isArray(json.results)) return localMatches;

    return json.results.map(
      (r: {
        id: number;
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
      }) => ({
        id: String(r.id),
        name: r.name,
        region: r.admin1,
        country: r.country ?? '',
        lat: r.latitude,
        lon: r.longitude,
        timezone: r.timezone,
      })
    );
  } catch {
    return localMatches;
  }
}

export async function fetchAirQuality(city: CityLocation): Promise<AirQualityData> {
  try {
    if (!Number.isFinite(city.lat) || !Number.isFinite(city.lon)) {
      throw new Error('Invalid coordinates');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(
      city.lat
    )}&longitude=${encodeURIComponent(
      city.lon
    )}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=us_aqi,pm2_5,pm10&timezone=auto&forecast_days=1`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const cur = data.current;
    const hourlyRaw = data.hourly;

    const hourly: HourlyPoint[] = (hourlyRaw?.time ?? [])
      .slice(0, 24)
      .map((t: string, i: number) => ({
        time: t,
        hourLabel: t.slice(11, 16),
        aqi: Math.round(hourlyRaw.us_aqi?.[i] ?? cur?.us_aqi ?? 100),
        pm25: Math.round((hourlyRaw.pm2_5?.[i] ?? cur?.pm2_5 ?? 35) * 10) / 10,
        pm10: Math.round((hourlyRaw.pm10?.[i] ?? cur?.pm10 ?? 60) * 10) / 10,
      }));

    return {
      city,
      aqi: Math.round(cur?.us_aqi ?? 100),
      pm25: Math.round((cur?.pm2_5 ?? 35) * 10) / 10,
      pm10: Math.round((cur?.pm10 ?? 60) * 10) / 10,
      no2: Math.round((cur?.nitrogen_dioxide ?? 28) * 10) / 10,
      o3: Math.round((cur?.ozone ?? 42) * 10) / 10,
      co: Math.round((cur?.carbon_monoxide ?? 420) * 10) / 10,
      so2: Math.round((cur?.sulphur_dioxide ?? 9) * 10) / 10,
      hourly: hourly.length > 0 ? hourly : buildFallbackHourly(cur?.us_aqi ?? 100),
      source: 'live',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    const base = getCityBaselineAqi(city.name);
    const hourly = buildFallbackHourly(base);
    return {
      city,
      aqi: base,
      pm25: Math.round(base * 0.48 * 10) / 10,
      pm10: Math.round(base * 0.79 * 10) / 10,
      no2: Math.round(base * 0.24 * 10) / 10,
      o3: 38,
      co: Math.round(base * 3.8),
      so2: Math.round(base * 0.08 * 10) / 10,
      hourly,
      source: 'estimated',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
