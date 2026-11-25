import React, { useState } from 'react';
import { X, SlidersHorizontal, KeyRound, Bell } from 'lucide-react';
import type { AppSettings } from '../types/vayunex';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="font-display text-lg font-bold text-slate-900">
                VayuNex Settings
              </h2>
              <p className="text-xs text-slate-500">
                Smog alert thresholds &amp; optional Gemini API connection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-sm">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Bell className="h-3.5 w-3.5 text-amber-600" />
              Smog Alert Banner Threshold (US AQI)
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={300}
                step={25}
                value={form.alertThresholdAqi}
                onChange={(e) =>
                  setForm({ ...form, alertThresholdAqi: Number(e.target.value) })
                }
                className="flex-1 accent-emerald-600"
              />
              <span className="font-mono-num w-14 rounded-lg bg-slate-100 py-1 text-center text-xs font-bold text-slate-800">
                {form.alertThresholdAqi}
              </span>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.notificationsEnabled}
                onChange={(e) =>
                  setForm({ ...form, notificationsEnabled: e.target.checked })
                }
                className="accent-emerald-600"
              />
              Show active smog alert banner when city AQI exceeds threshold
            </label>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={form.geminiApiKey}
              onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
              placeholder="Leave blank to use built-in VayuNex Smart Engine"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Stored locally in your browser only. VayuNex works out of the box even without a key.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
