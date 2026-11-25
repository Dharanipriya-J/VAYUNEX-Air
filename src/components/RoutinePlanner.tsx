import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Plus, ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';
import type { RoutineSlot, RoutineStatus } from '../types/vayunex';

interface RoutinePlannerProps {
  slots: RoutineSlot[];
  onToggleSlot: (id: string) => void;
  onAddCustomSlot: (title: string, timeWindow: string, recommendation: string) => void;
}

const STATUS_STYLE: Record<
  RoutineStatus,
  { badge: string; label: string; icon: React.ReactNode }
> = {
  safe: {
    badge: 'bg-emerald-100 text-emerald-800',
    label: 'Optimal Window',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  caution: {
    badge: 'bg-amber-100 text-amber-800',
    label: 'Take Precautions',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  avoid: {
    badge: 'bg-rose-100 text-rose-800',
    label: 'High-Smog Shield',
    icon: <XOctagon className="h-3.5 w-3.5" />,
  },
};

export const RoutinePlanner: React.FC<RoutinePlannerProps> = ({
  slots,
  onToggleSlot,
  onAddCustomSlot,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('14:00 – 14:30');
  const [newNote, setNewNote] = useState('');

  const completedCount = slots.filter((s) => s.completed).length;
  const pct = slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCustomSlot(
      newTitle.trim(),
      newTime.trim() || 'Flexible',
      newNote.trim() || 'Custom low-emission household habit.'
    );
    setNewTitle('');
    setNewNote('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Daily Low-Emission &amp; Smog-Safe Routine
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Dynamically timed to today&apos;s atmospheric inversion curve and your household setup.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Shield Score
            </div>
            <div className="font-mono-num text-2xl font-bold text-emerald-700">
              {completedCount}/{slots.length} ({pct}%)
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Habit
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm"
        >
          <h3 className="font-display text-sm font-bold text-slate-900">
            Add Custom Routine Action
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Habit title (e.g., Run HEPA in kids room)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="Time window (e.g., 19:00 – 19:30)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Action details..."
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Save to Routine
            </button>
          </div>
        </form>
      )}

      {/* Timeline Cards */}
      <div className="space-y-3.5">
        {slots.map((slot) => {
          const st = STATUS_STYLE[slot.status];
          return (
            <div
              key={slot.id}
              role="checkbox"
              aria-checked={slot.completed}
              tabIndex={0}
              onClick={() => onToggleSlot(slot.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleSlot(slot.id);
                }
              }}
              className={`group cursor-pointer rounded-2xl border p-5 transition focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
                slot.completed
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    className="mt-0.5 text-slate-400 transition group-hover:text-emerald-600"
                    aria-label="Toggle routine completion"
                  >
                    {slot.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono-num text-xs font-semibold text-slate-700">
                        <Clock className="h-3 w-3" />
                        {slot.timeWindow}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.badge}`}
                      >
                        {st.icon}
                        {st.label}
                      </span>
                    </div>

                    <h3
                      className={`mt-2 font-display text-base font-bold ${
                        slot.completed ? 'text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {slot.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {slot.recommendation}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-slate-500">Why:</span> {slot.reason}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-start rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
                  {slot.impactMetric}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
