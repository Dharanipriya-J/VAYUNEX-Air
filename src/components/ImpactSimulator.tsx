import React, { useState } from 'react';
import { Leaf, HeartPulse, CheckCircle2, Circle, ArrowRightLeft } from 'lucide-react';
import { SUSTAINABLE_SWAPS } from '../data/knowledgeBase';

interface ImpactSimulatorProps {
  selectedSwapIds: string[];
  onToggleSwap: (id: string) => void;
  familySize: number;
}

export const ImpactSimulator: React.FC<ImpactSimulatorProps> = ({
  selectedSwapIds,
  onToggleSwap,
  familySize,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const activeSwaps = SUSTAINABLE_SWAPS.filter((s) => selectedSwapIds.includes(s.id));
  const totalPm25UgDay = activeSwaps.reduce((sum, s) => sum + s.personalPm25SavedUgDay, 0);
  const totalCo2KgMonth = activeSwaps.reduce((sum, s) => sum + s.co2SavedKgMonth, 0);
  const annualCo2Kg = totalCo2KgMonth * 12;
  // Equivalent cigarettes avoided (~22 µg/m³ PM2.5 ~ 1 cigarette/day)
  const eqCigsWeek = Math.round(((totalPm25UgDay / 22) * 7) * 10) / 10;

  const visibleSwaps =
    categoryFilter === 'all'
      ? SUSTAINABLE_SWAPS
      : SUSTAINABLE_SWAPS.filter((s) => s.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Impact Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Sustainable Alternatives &amp; Direct Impact Simulator
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select daily swaps below to see how your household&apos;s choices directly lower inhaled PM2.5 and neighborhood emissions.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {activeSwaps.length} Active Swaps • Household of {familySize}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <HeartPulse className="h-4 w-4" />
              Direct Health Relief
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-slate-900">
              -{totalPm25UgDay} <span className="text-sm font-normal">µg/m³·day</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Equivalent to avoiding ~<strong>{eqCigsWeek}</strong> passive smog-cigarettes/week per person.
            </p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
              <Leaf className="h-4 w-4" />
              Neighborhood Carbon Cut
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-slate-900">
              {totalCo2KgMonth} <span className="text-sm font-normal">kg CO₂e/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              <strong>{annualCo2Kg.toLocaleString()} kg/year</strong> prevented from your local airshed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ArrowRightLeft className="h-4 w-4" />
              Community Multiplier (×50 Homes)
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-slate-900">
              {((totalCo2KgMonth * 50) / 1000).toFixed(1)}{' '}
              <span className="text-sm font-normal">tonnes/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              If 50 families on your block adopt these same swaps this winter.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'transport', 'cooking', 'heating', 'waste', 'household'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Swaps List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleSwaps.map((swap) => {
          const active = selectedSwapIds.includes(swap.id);
          return (
            <div
              key={swap.id}
              role="checkbox"
              aria-checked={active}
              tabIndex={0}
              onClick={() => onToggleSwap(swap.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleSwap(swap.id);
                }
              }}
              className={`cursor-pointer rounded-2xl border p-5 transition focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
                active
                  ? 'border-emerald-400 bg-emerald-50/30 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {active ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                      {swap.category} • {swap.difficulty}
                    </span>
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-400">Current:</span>{' '}
                      {swap.currentHabit}
                    </div>
                    <h3 className="mt-0.5 font-display text-base font-bold text-slate-900">
                      {swap.alternative}
                    </h3>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {swap.costDeltaMonth}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {swap.explanation}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">
                  -{swap.personalPm25SavedUgDay} µg/m³·day personal PM2.5
                </span>
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-teal-700">
                  -{swap.co2SavedKgMonth} kg CO₂e/month
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
