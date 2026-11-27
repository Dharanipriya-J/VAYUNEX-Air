import React, { useId, useMemo, useState } from 'react';
import { Calculator, Check, Home, Plus, Sparkles } from 'lucide-react';
import {
  DIY_BOX_CADR_CFM,
  INDOOR_INFILTRATION_RATIO,
  TARGET_AIR_CHANGES_PER_HOUR,
} from '../constants';
import { INDOOR_HACKS } from '../data/knowledgeBase';
import type { IndoorHack } from '../types/vayunex';
import { roundTo } from '../utils/helpers';
import { Card } from './ui/Card';

interface IndoorAirLabProps {
  savedHackIds: string[];
  onToggleHack: (id: string) => void;
  outdoorPm25: number;
}

const CATEGORIES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'all', label: 'All Measures' },
  { id: 'filtration', label: 'Filtration' },
  { id: 'ventilation', label: 'Ventilation' },
  { id: 'cooking', label: 'Kitchen & Cooking' },
  { id: 'sealing', label: 'Building Envelope' },
  { id: 'habits', label: 'Zero-Cost Measures' },
];

const MAX_COMBINED_REDUCTION = 88;
const MIN_INDOOR_PM25 = 4;

export const IndoorAirLab: React.FC<IndoorAirLabProps> = ({
  savedHackIds,
  onToggleHack,
  outdoorPm25,
}) => {
  const [filter, setFilter] = useState('all');
  const [roomSqFt, setRoomSqFt] = useState(250);
  const [ceilingFt, setCeilingFt] = useState(9);
  const [expandedId, setExpandedId] = useState<string | null>(INDOOR_HACKS[0].id);
  const areaSliderId = useId();
  const heightSliderId = useId();

  const visibleHacks = useMemo(
    () => (filter === 'all' ? INDOOR_HACKS : INDOOR_HACKS.filter((h) => h.category === filter)),
    [filter]
  );

  const roomVolumeCuFt = roomSqFt * ceilingFt;
  const requiredCadr = Math.round((roomVolumeCuFt * TARGET_AIR_CHANGES_PER_HOUR) / 60);
  const crBoxesNeeded = Math.max(1, Math.ceil(requiredCadr / DIY_BOX_CADR_CFM));

  const { combinedReduction, estimatedIndoorPm25 } = useMemo(() => {
    const saved = INDOOR_HACKS.filter((h) => savedHackIds.includes(h.id));
    const reduction = Math.min(
      MAX_COMBINED_REDUCTION,
      saved.reduce((acc, h) => acc + h.pm25ReductionPct * (1 - acc / 100), 0)
    );
    const indoor = Math.max(
      MIN_INDOOR_PM25,
      roundTo(outdoorPm25 * INDOOR_INFILTRATION_RATIO * (1 - reduction / 100))
    );
    return { combinedReduction: reduction, estimatedIndoorPm25: indoor };
  }, [savedHackIds, outdoorPm25]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Home className="h-4 w-4" aria-hidden="true" />
            My Home Air Shield
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
            Indoor Air Quality Measures
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select practical indoor interventions for your Home Plan to model your projected indoor PM2.5 against today&apos;s outdoor air ({outdoorPm25} µg/m³).
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
            <div>
              <div className="text-xs text-slate-500">Active Measures</div>
              <div className="font-mono-num text-xl font-bold text-slate-900">
                {savedHackIds.length} / {INDOOR_HACKS.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Combined Reduction</div>
              <div className="font-mono-num text-xl font-bold text-emerald-700">
                -{Math.round(combinedReduction)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Est. Indoor PM2.5</div>
              <div className="font-mono-num text-xl font-bold text-slate-900">
                {estimatedIndoorPm25} <span className="text-xs font-normal">µg/m³</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Room Filtration Sizing
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Calculate the Clean Air Delivery Rate (CADR) for {TARGET_AIR_CHANGES_PER_HOUR} air changes/hour during severe smog.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-700">
                <label htmlFor={areaSliderId}>Room Area</label>
                <span className="font-mono-num font-semibold text-slate-900">{roomSqFt} sq ft</span>
              </div>
              <input
                id={areaSliderId}
                type="range"
                min={100}
                max={700}
                step={25}
                value={roomSqFt}
                onChange={(e) => setRoomSqFt(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700">
                <label htmlFor={heightSliderId}>Ceiling Height</label>
                <span className="font-mono-num font-semibold text-slate-900">{ceilingFt} ft</span>
              </div>
              <input
                id={heightSliderId}
                type="range"
                min={8}
                max={14}
                step={1}
                value={ceilingFt}
                onChange={(e) => setCeilingFt(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[11px] text-slate-500">Target CADR ({TARGET_AIR_CHANGES_PER_HOUR} ACH)</div>
              <div className="font-mono-num text-lg font-bold text-emerald-700">
                {requiredCadr} CFM
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500">DIY MERV-13 Units</div>
              <div className="font-mono-num text-lg font-bold text-slate-900">
                {crBoxesNeeded} {crBoxesNeeded === 1 ? 'Box' : 'Boxes'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter measures by category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === c.id
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleHacks.map((hack: IndoorHack) => {
          const isSaved = savedHackIds.includes(hack.id);
          const isExpanded = expandedId === hack.id;

          return (
            <div
              key={hack.id}
              className={`rounded-2xl border p-5 transition ${
                isSaved
                  ? 'border-emerald-300 bg-emerald-50/30 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 capitalize">
                      {hack.category}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800">
                      -{hack.pm25ReductionPct}% PM2.5
                    </span>
                    <span className="text-slate-500">
                      {hack.costLabel} • {hack.timeToApply}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-slate-900">
                    {hack.title}
                  </h3>
                </div>

                <button
                  type="button"
                  aria-pressed={isSaved}
                  onClick={() => onToggleHack(hack.id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    isSaved
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to Plan
                    </>
                  )}
                </button>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">{hack.summary}</p>

              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : hack.id)}
                className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
              >
                {isExpanded ? 'Hide step-by-step guide' : 'View step-by-step guide & science'}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-slate-200/70 pt-3">
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                    {hack.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                  <div className="flex items-start gap-2 rounded-xl bg-slate-100/80 p-3 text-xs text-slate-700">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>
                      <strong>Why it works:</strong> {hack.whyItWorks}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
