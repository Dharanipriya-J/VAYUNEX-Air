import React, { useState } from 'react';
import { CheckCircle2, MapPin, Plus, Sparkles, Users } from 'lucide-react';
import { MAX_PROMPT_LENGTH, MAX_TEXT_FIELD_LENGTH } from '../constants';
import type { CommunityPledge } from '../types/vayunex';
import { sanitizeText } from '../utils/helpers';
import { Card } from './ui/Card';

interface CommunityHubProps {
  pledges: CommunityPledge[];
  cityName: string;
  onToggleJoin: (id: string) => void;
  onCreatePledge: (title: string, neighborhood: string, description: string) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  pledges,
  cityName,
  onToggleJoin,
  onCreatePledge,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [description, setDescription] = useState('');

  const totalParticipants = pledges.reduce((sum, p) => sum + p.participants, 0);
  const totalCo2 = pledges.reduce((sum, p) => sum + p.monthlyCo2Kg, 0);
  const totalPm25 = pledges.reduce((sum, p) => sum + p.pm25GramsSaved, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, MAX_TEXT_FIELD_LENGTH);
    if (!cleanTitle) return;
    onCreatePledge(
      cleanTitle,
      sanitizeText(neighborhood, MAX_TEXT_FIELD_LENGTH) || `${cityName} Local Block`,
      sanitizeText(description, MAX_PROMPT_LENGTH) || 'Community-led winter clean air action.'
    );
    setTitle('');
    setNeighborhood('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Community Airshed Pledges — {cityName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Coordinate neighborhood low-emission actions that measurably reduce winter smog peaks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Start Local Pledge
        </button>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500">Active Households</div>
          <div className="mt-1 font-mono-num text-3xl font-bold text-slate-900">
            {totalParticipants.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Committed across {pledges.length} local initiatives
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500">Monthly CO₂e Prevented</div>
          <div className="mt-1 font-mono-num text-3xl font-bold text-emerald-700">
            {(totalCo2 / 1000).toFixed(1)} <span className="text-sm font-normal">tonnes</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Collective transport &amp; heating shift</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500">Direct PM2.5 Kept Out of Air</div>
          <div className="mt-1 font-mono-num text-3xl font-bold text-teal-700">
            {(totalPm25 / 1000).toFixed(2)} <span className="text-sm font-normal">kg/mo</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Prevents localized street-level smog spikes</div>
        </Card>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm"
        >
          <h3 className="font-display text-sm font-bold text-slate-900">
            Launch a Neighborhood Clean-Air Pledge
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              maxLength={MAX_TEXT_FIELD_LENGTH}
              aria-label="Pledge title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pledge title (e.g., No-Burn Courtyard Evenings)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <input
              type="text"
              maxLength={MAX_TEXT_FIELD_LENGTH}
              aria-label="Neighborhood or zone"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Neighborhood / Zone"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <textarea
            maxLength={MAX_PROMPT_LENGTH}
            aria-label="Pledge description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the collective action and why it lowers local smog..."
            rows={2}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Publish Pledge
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pledges.map((pledge) => (
          <div
            key={pledge.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
              pledge.joined
                ? 'border-emerald-300 bg-emerald-50/30 shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {pledge.neighborhood}
              </div>
              <h3 className="mt-2 font-display text-base font-bold text-slate-900">
                {pledge.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{pledge.description}</p>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {pledge.participants} households
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />-
                  {pledge.monthlyCo2Kg.toLocaleString()} kg CO₂e/mo
                </span>
              </div>

              <button
                type="button"
                aria-pressed={pledge.joined}
                onClick={() => onToggleJoin(pledge.id)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                  pledge.joined
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {pledge.joined ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Joined Pledge
                  </>
                ) : (
                  'Join This Pledge'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
