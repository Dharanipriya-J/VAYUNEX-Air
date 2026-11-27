import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Bell, KeyRound, SlidersHorizontal } from 'lucide-react';
import { MIN_API_KEY_LENGTH } from '../constants';
import type { AppSettings } from '../types/vayunex';
import { Modal } from './ui/Modal';

interface SettingsModalProps {
  settings: AppSettings;
  apiKey: string;
  onSave: (settings: AppSettings, apiKey: string) => void;
  onClose: () => void;
}

const THRESHOLD_RANGE = { min: 50, max: 300, step: 25 } as const;

/** Validates an optional API key, returning an error message or null. */
export function validateApiKey(key: string): string | null {
  const trimmed = key.trim();
  if (trimmed === '') return null;
  if (/\s/.test(trimmed)) return 'API key must not contain spaces.';
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    return `API key looks too short (minimum ${MIN_API_KEY_LENGTH} characters).`;
  }
  return null;
}

/** Dialog for smog alert preferences and the optional session-only Gemini API key. */
export function SettingsModal({ settings, apiKey, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>(settings);
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keyError, setKeyError] = useState<string | null>(null);
  const thresholdId = useId();
  const keyId = useId();
  const keyHelpId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const error = validateApiKey(keyDraft);
    setKeyError(error);
    if (error) return;
    onSave(form, keyDraft.trim());
    onClose();
  };

  return (
    <Modal
      title="VayuNex Settings"
      description="Smog alert thresholds & optional Gemini API connection"
      icon={<SlidersHorizontal className="h-4 w-4" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-sm" noValidate>
        <div>
          <label htmlFor={thresholdId} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Bell className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Smog Alert Banner Threshold (US AQI)
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id={thresholdId}
              type="range"
              min={THRESHOLD_RANGE.min}
              max={THRESHOLD_RANGE.max}
              step={THRESHOLD_RANGE.step}
              value={form.alertThresholdAqi}
              onChange={(event) => setForm({ ...form, alertThresholdAqi: Number(event.target.value) })}
              className="flex-1 accent-emerald-600"
            />
            <output
              htmlFor={thresholdId}
              className="font-mono-num w-14 rounded-lg bg-slate-100 py-1 text-center text-xs font-bold text-slate-800"
            >
              {form.alertThresholdAqi}
            </output>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.notificationsEnabled}
              onChange={(event) => setForm({ ...form, notificationsEnabled: event.target.checked })}
              className="accent-emerald-600"
            />
            Show active smog alert banner when city AQI exceeds threshold
          </label>
        </div>

        <div>
          <label htmlFor={keyId} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <KeyRound className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Gemini API Key (Optional)
          </label>
          <input
            id={keyId}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={keyDraft}
            onChange={(event) => {
              setKeyDraft(event.target.value);
              setKeyError(null);
            }}
            placeholder="Leave blank to use built-in VayuNex Smart Engine"
            aria-invalid={keyError !== null}
            aria-describedby={keyHelpId}
            className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 ${
              keyError ? 'border-rose-400' : 'border-slate-200 focus:border-emerald-500'
            }`}
          />
          <p id={keyHelpId} className={`mt-1 text-[11px] ${keyError ? 'text-rose-700' : 'text-slate-500'}`} role={keyError ? 'alert' : undefined}>
            {keyError ??
              'Kept in this browser tab only (session storage) and cleared when the tab closes. VayuNex works fully without a key.'}
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
    </Modal>
  );
}
