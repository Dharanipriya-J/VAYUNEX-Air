import React from 'react';
import {
  ShieldAlert,
  DoorOpen,
  Footprints,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getAqiMeta } from '../services/airQualityService';
import { findCleanestWindow } from '../services/vayuAiEngine';
import type { AirQualityData, HouseholdProfile } from '../types/vayunex';
import { AqiTrajectoryChart } from './AqiTrajectoryChart';

interface DashboardOverviewProps {
  aq: AirQualityData;
  profile: HouseholdProfile;
  onNavigate: (tab: 'assistant' | 'routine' | 'indoor' | 'impact') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  aq,
  profile,
  onNavigate,
}) => {
  const meta = getAqiMeta(aq.aqi);
  const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);

  const whoRatio = Math.max(1, Math.round((aq.pm25 / 15) * 10) / 10);
  const gaugePct = Math.min(100, Math.round((aq.aqi / 350) * 100));

  const pollutants = [
    { name: 'PM2.5', value: aq.pm25, ref: 15, unit: 'µg/m³', note: 'Fine particulate matter' },
    { name: 'PM10', value: aq.pm10, ref: 45, unit: 'µg/m³', note: 'Coarse dust & soot' },
    { name: 'NO₂', value: aq.no2, ref: 25, unit: 'µg/m³', note: 'Traffic & gas stoves' },
    { name: 'O₃', value: aq.o3, ref: 100, unit: 'µg/m³', note: 'Ground-level ozone' },
    { name: 'CO', value: aq.co, ref: 4000, unit: 'µg/m³', note: 'Incomplete combustion' },
    { name: 'SO₂', value: aq.so2, ref: 40, unit: 'µg/m³', note: 'Industrial & fuel sulfur' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* AQI Hero Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        aq.source === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {aq.source === 'live' ? 'Live Atmospheric Feed' : 'Regional Model'}
                  </span>
                  <span>•</span>
                  <span>Updated {aq.updatedAt}</span>
                </div>
                <h1 className="mt-1.5 font-display text-2xl font-bold text-slate-900">
                  {aq.city.name}
                  <span className="font-normal text-slate-500">, {aq.city.country}</span>
                </h1>
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  US AQI Index
                </div>
                <div className={`font-mono-num text-6xl font-bold tracking-tight ${meta.textColor}`}>
                  {aq.aqi}
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-600">
                  PM2.5 is <span className="font-semibold">{whoRatio}×</span> the WHO 24h guideline{' '}
                  <span className="whitespace-nowrap">(15 µg/m³)</span>
                </p>
              </div>

              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={meta.ringColor}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(gaugePct * 263.9) / 100} 263.9`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    PM2.5
                  </span>
                  <span className="font-mono-num text-sm font-bold text-slate-900">
                    {aq.pm25}
                  </span>
                  <span className="text-[10px] text-slate-500">µg/m³</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4 text-slate-300" />
              Ask VayuNex AI
            </button>
            <button
              type="button"
              onClick={() => onNavigate('routine')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Today&apos;s Routine
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AqiTrajectoryChart
          hourly={aq.hourly}
          accentColor={meta.ringColor}
          bestHour={bestHour}
          bestAqi={bestAqi}
          worstHour={worstHour}
          worstAqi={worstAqi}
        />
      </div>

      {/* Personalized Immediate Action Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <ShieldAlert className="h-4 w-4" />
              </div>
              Masking Guidance
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{meta.maskAdvice}</p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
            Calibrated for {profile.hasChildren ? 'children & ' : ''}
            {profile.respiratorySensitivity === 'asthma_copd'
              ? 'asthma/COPD protection'
              : 'daily outdoor trips'}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <DoorOpen className="h-4 w-4" />
              </div>
              Ventilation Window
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{meta.windowAdvice}</p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onNavigate('indoor')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-emerald-700"
            >
              Indoor air measures <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Footprints className="h-4 w-4" />
              </div>
              Outdoor &amp; Exercise
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{meta.outdoorAdvice}</p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
            Best daytime window: <span className="font-semibold text-slate-700">{bestHour}</span>{' '}
            <span className="whitespace-nowrap">(AQI {bestAqi})</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Activity className="h-4 w-4" />
              </div>
              Choice Impact Focus
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {profile.primaryCommute === 'car'
                ? 'Swapping solo car trips for transit cuts ~74 kg CO₂e/month and avoids in-cabin exhaust.'
                : 'Your low-emission commute cuts neighborhood NO₂—pair with clean cooking for indoor relief.'}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onNavigate('impact')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-emerald-700"
            >
              Open Impact Simulator <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Pollutant Breakdown Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-slate-900">
            Atmospheric Pollutant Breakdown
          </h2>
          <span className="text-xs text-slate-400">
            Bar indicates concentration relative to WHO 24h reference threshold
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {pollutants.map((p) => {
            const ratio = p.value / p.ref;
            const barPct = Math.min(100, Math.max(8, Math.round((ratio / 3) * 100)));
            const barColor =
              ratio > 2 ? 'bg-rose-500' : ratio > 1 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div
                key={p.name}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
              >
                <div className="text-xs font-semibold text-slate-500">{p.name}</div>
                <div className="mt-1 font-mono-num text-xl font-bold text-slate-900">
                  {p.value}
                  <span className="ml-1 text-xs font-normal text-slate-500">{p.unit}</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500">{p.note}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
