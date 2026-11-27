import { describe, expect, it, vi } from 'vitest';
import {
  buildEstimatedAirQuality,
  fetchAirQuality,
  getAqiMeta,
  parseAirQualityResponse,
} from '../src/services/airQualityService';
import {
  findCleanestWindow,
  generateAiResponse,
  generateRoutine,
} from '../src/services/vayuAiEngine';
import { detectIntent, suggestFollowUps } from '../src/services/ai/smartEngine';
import { buildActionPlanText, toFileSlug } from '../src/utils/actionPlan';
import { clamp, sanitizeText, toggleId } from '../src/utils/helpers';
import {
  isAppSettings,
  isCityLocation,
  isHouseholdProfile,
  isPledgeList,
  isStringArray,
} from '../src/utils/validators';
import type { AirQualityData, HouseholdProfile } from '../src/types/vayunex';

const SAMPLE_AQ: AirQualityData = {
  city: { id: 'delhi', name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.209 },
  aqi: 185,
  pm25: 88.5,
  pm10: 142.0,
  no2: 44.0,
  o3: 38.0,
  co: 920,
  so2: 14.0,
  source: 'estimated',
  updatedAt: '12:00',
  hourly: [
    { time: '2026-11-25T07:00', hourLabel: '07:00', aqi: 210, pm25: 98, pm10: 160 },
    { time: '2026-11-25T14:00', hourLabel: '14:00', aqi: 132, pm25: 58, pm10: 95 },
    { time: '2026-11-25T21:00', hourLabel: '21:00', aqi: 245, pm25: 118, pm10: 190 },
  ],
};

const SAMPLE_PROFILE: HouseholdProfile = {
  householdName: 'Test Family',
  familySize: 4,
  hasChildren: true,
  hasSeniors: false,
  respiratorySensitivity: 'asthma_copd',
  homeType: 'apartment',
  hasPurifier: false,
  cookingFuel: 'gas',
  primaryCommute: 'car',
  budgetMode: 'diy_low_cost',
};

describe('getAqiMeta', () => {
  it('maps EPA AQI breakpoints accurately', () => {
    expect(getAqiMeta(50).label).toBe('Good');
    expect(getAqiMeta(51).label).toBe('Moderate');
    expect(getAqiMeta(150).label).toBe('Unhealthy for Sensitive Groups');
    expect(getAqiMeta(185).label).toBe('Unhealthy');
    expect(getAqiMeta(250).label).toBe('Very Unhealthy');
    expect(getAqiMeta(350).label).toBe('Hazardous');
  });
});

describe('cleanWindow & routineGenerator', () => {
  it('finds cleanest daytime hour and peak smog hour', () => {
    const win = findCleanestWindow(SAMPLE_AQ);
    expect(win.bestHour).toBe('14:00');
    expect(win.bestAqi).toBe(132);
    expect(win.worstHour).toBe('21:00');
    expect(win.worstAqi).toBe(245);
  });

  it('tailors 5 routine slots to household profile', () => {
    const slots = generateRoutine(SAMPLE_AQ, SAMPLE_PROFILE);
    expect(slots).toHaveLength(5);
    expect(slots[0].recommendation).toContain('Recirculate');
    expect(slots[1].recommendation).toContain('range hood');
    expect(slots[2].timeWindow).toContain('14:00');
    expect(slots[4].recommendation).toContain('Corsi-Rosenthal');

    const cleanHome = generateRoutine(SAMPLE_AQ, {
      ...SAMPLE_PROFILE,
      cookingFuel: 'electric_induction',
      primaryCommute: 'transit',
      hasPurifier: true,
    });
    expect(cleanHome[1].status).toBe('safe');
    expect(cleanHome[4].recommendation).toContain('HEPA purifier');
  });
});

describe('AI Engine', () => {
  it('classifies intents and excludes current intent from follow-ups', () => {
    expect(detectIntent('Plan today schedule')).toBe('routine');
    expect(detectIntent('My gas stove cooking')).toBe('cooking');
    expect(detectIntent('Metro commute vs car')).toBe('commute');
    expect(detectIntent('Air purifier placement')).toBe('indoor');
    expect(detectIntent('What is the air quality?')).toBe('general');

    const followUps = suggestFollowUps('routine');
    expect(followUps).toHaveLength(3);
    expect(followUps.every((f) => !f.toLowerCase().includes('schedule'))).toBe(true);
  });

  it('uses Smart Engine by default and falls back gracefully when Gemini fails', async () => {
    const localReply = await generateAiResponse('Plan today routine', SAMPLE_AQ, SAMPLE_PROFILE);
    expect(localReply.engine).toBe('smart-engine');
    expect(localReply.content).toContain('New Delhi');
    expect(localReply.impactCards).toHaveLength(3);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    const fallbackReply = await generateAiResponse(
      'Indoor air measures',
      SAMPLE_AQ,
      SAMPLE_PROFILE,
      'AIzaSyDummyValidLengthApiKey12345'
    );
    expect(fallbackReply.engine).toBe('smart-engine');
  });

  it('uses Gemini response when a valid API key and response are returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '### Gemini Custom Advice\n- Stay indoors.' }] } }],
        }),
      })
    );
    const reply = await generateAiResponse(
      'Help with smog',
      SAMPLE_AQ,
      SAMPLE_PROFILE,
      'AIzaSyDummyValidLengthApiKey12345'
    );
    expect(reply.engine).toBe('gemini');
    expect(reply.content).toContain('Gemini Custom Advice');
  });
});

describe('airQualityService', () => {
  it('parses Open-Meteo responses and falls back on invalid coordinates', async () => {
    const parsed = parseAirQualityResponse(SAMPLE_AQ.city, {
      current: { us_aqi: 164, pm2_5: 72.4, pm10: 110.2, nitrogen_dioxide: 31.1 },
      hourly: {
        time: ['2026-11-25T13:00', '2026-11-25T14:00'],
        us_aqi: [150, 140],
        pm2_5: [65, 58],
        pm10: [95, 88],
      },
    });
    expect(parsed.source).toBe('live');
    expect(parsed.aqi).toBe(164);
    expect(parsed.hourly).toHaveLength(2);

    const badCity = await fetchAirQuality({ ...SAMPLE_AQ.city, lat: Number.NaN });
    expect(badCity.source).toBe('estimated');
    expect(buildEstimatedAirQuality(SAMPLE_AQ.city).hourly).toHaveLength(24);
  });
});

describe('utils & validators', () => {
  it('validates persisted shapes and sanitizes text/filenames', () => {
    expect(isCityLocation(SAMPLE_AQ.city)).toBe(true);
    expect(isCityLocation({ name: 'Incomplete' })).toBe(false);
    expect(isAppSettings({ alertThresholdAqi: 150, notificationsEnabled: true })).toBe(true);
    expect(isHouseholdProfile(SAMPLE_PROFILE)).toBe(true);
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isPledgeList([])).toBe(true);

    expect(clamp(20, 1, 15)).toBe(15);
    expect(toggleId(['a', 'b'], 'b')).toEqual(['a']);
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(sanitizeText('hello\u0000world  ', 10)).toBe('hello worl');
    expect(toFileSlug('New Delhi!')).toBe('New-Delhi');

    const plan = buildActionPlanText({
      aq: SAMPLE_AQ,
      profile: SAMPLE_PROFILE,
      routine: generateRoutine(SAMPLE_AQ, SAMPLE_PROFILE),
      hacks: [],
      swaps: [],
    });
    expect(plan).toContain('VAYUNEX — HOUSEHOLD CLEAN AIR ACTION PLAN');
    expect(plan).toContain('New Delhi, India');
  });
});
