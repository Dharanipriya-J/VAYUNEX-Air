import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Circle, HeartPulse, Leaf } from 'lucide-react';
import { COMMUNITY_MULTIPLIER_HOMES, PM25_PER_CIGARETTE } from '../constants';
import { SUSTAINABLE_SWAPS } from '../data/knowledgeBase';
import { roundTo } from '../utils/helpers';
import { Card } from './ui/Card';

interface ImpactSimulatorProps {
  selectedSwapIds: string[];
  onToggleSwap: (id: string) => void;
  familySize: number;
}

const SWAP_CATEGORIES = ['all', 'transport', 'cooking', 'heating', 'waste', 'household'] as const;

export const ImpactSimulator: React.FC<ImpactSimulatorProps> = ({
  selectedSwapIds,
  onToggleSwap,
  familySize,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { activeCount, totalPm25UgDay, totalCo2KgMonth, annualCo2Kg, eqCigsWeek } = useMemo(() => {
    const active = SUSTAINABLE_SWAPS.filter((s) => selectedSwapIds.includes(s.id));
    const pm25 = active.reduce((sum, s) => sum + s.personalPm25SavedUgDay, 0);
    const co2 = active.reduce((sum, s) => sum + s.co2SavedKgMonth, 0);
    return {
      activeCount: active.length,
      totalPm25UgDay: pm25,
      totalCo2KgMonth: co2,
      annualCo2Kg: co2 * 12,
      eqCigsWeek: roundTo((pm25 / PM25_PER_CIGARETTE) * 7),
    };
  }, [selectedSwapIds]);

  const visibleSwaps = useMemo(
    () =>
      categoryFilter === 'all'
        ? SUSTAINABLE_SWAPS
        : SUSTAINABLE_SWAPS.filter((s) => s.category === categoryFilter),
    [categoryFilter]
  );

  return (
    <div className="space-y-6">
      <Card>
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
            {activeCount} Active Swaps • Household of {familySize}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
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
              <Leaf className="h-4 w-4" aria-hidden="true" />
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
              <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
              Community Multiplier (×{COMMUNITY_MULTIPLIER_HOMES} Homes)
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-slate-900">
              {((totalCo2KgMonth * COMMUNITY_MULTIPLIER_HOMES) / 1000).toFixed(1)}{' '}
              <span className="text-sm font-normal">tonnes/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              If {COMMUNITY_MULTIPLIER_HOMES} families on your block adopt these same swaps this winter.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter swaps by category">
        {SWAP_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={categoryFilter === cat}
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
                  <div className="mt-0.5" aria-hidden="true">
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

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{swap.explanation}</p>

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
