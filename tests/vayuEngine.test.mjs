import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAqiMeta } from '../.tmp-test/services/airQualityService.js';
import {
  findCleanestWindow,
  generateRoutine,
  generateAiResponse,
} from '../.tmp-test/services/vayuAiEngine.js';

const SAMPLE_AQ = {
  city: {
    id: 'delhi',
    name: 'New Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.209,
  },
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

const SAMPLE_PROFILE = {
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
  it('maps AQI values to accurate EPA severity categories', () => {
    assert.equal(getAqiMeta(35).label, 'Good');
    assert.equal(getAqiMeta(75).label, 'Moderate');
    assert.equal(getAqiMeta(125).label, 'Unhealthy for Sensitive Groups');
    assert.equal(getAqiMeta(185).label, 'Unhealthy');
    assert.equal(getAqiMeta(250).label, 'Very Unhealthy');
    assert.equal(getAqiMeta(340).label, 'Hazardous');
  });
});

describe('findCleanestWindow', () => {
  it('identifies cleanest daytime hour and peak smog hour', () => {
    const win = findCleanestWindow(SAMPLE_AQ);
    assert.equal(win.bestHour, '14:00');
    assert.equal(win.bestAqi, 132);
    assert.equal(win.worstHour, '21:00');
    assert.equal(win.worstAqi, 245);
  });
});

describe('generateRoutine', () => {
  it('returns 5 time-slotted recommendations tailored to profile', () => {
    const slots = generateRoutine(SAMPLE_AQ, SAMPLE_PROFILE);
    assert.equal(slots.length, 5);
    assert.ok(slots[0].recommendation.includes('Recirculate'));
    assert.ok(slots[1].recommendation.includes('range hood'));
    assert.ok(slots[2].timeWindow.includes('14:00'));
    assert.ok(slots[4].recommendation.includes('Corsi-Rosenthal'));
  });
});

describe('generateAiResponse', () => {
  it('generates structured guidance and quantified impact cards', async () => {
    const reply = await generateAiResponse(
      'Plan today’s low-emission family schedule',
      SAMPLE_AQ,
      SAMPLE_PROFILE
    );
    assert.ok(reply.content.includes('New Delhi'));
    assert.equal(reply.impactCards.length, 3);
    assert.ok(reply.suggestedActions.length >= 2);
  });
});
