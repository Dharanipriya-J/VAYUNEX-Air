import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Users } from 'lucide-react';
import { MAX_TEXT_FIELD_LENGTH } from '../constants';
import type { HouseholdProfile } from '../types/vayunex';
import { clamp, sanitizeText } from '../utils/helpers';
import { Modal } from './ui/Modal';

interface ProfileModalProps {
  profile: HouseholdProfile;
  onSave: (updated: HouseholdProfile) => void;
  onClose: () => void;
}

const FAMILY_SIZE_RANGE = { min: 1, max: 15 } as const;

interface Option<T extends string> {
  value: T;
  label: string;
}

const SENSITIVITY_OPTIONS: Option<HouseholdProfile['respiratorySensitivity']>[] = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild / Seasonal Allergies' },
  { value: 'asthma_copd', label: 'Asthma / COPD / Cardiac' },
];
const HOME_OPTIONS: Option<HouseholdProfile['homeType']>[] = [
  { value: 'apartment', label: 'Apartment / Condo' },
  { value: 'house', label: 'Independent House' },
];
const FUEL_OPTIONS: Option<HouseholdProfile['cookingFuel']>[] = [
  { value: 'electric_induction', label: 'Electric / Induction' },
  { value: 'gas', label: 'Gas Stove' },
  { value: 'biomass', label: 'Wood / Biomass' },
];
const COMMUTE_OPTIONS: Option<HouseholdProfile['primaryCommute']>[] = [
  { value: 'car', label: 'Personal Car' },
  { value: 'transit', label: 'Metro / Bus / Rail' },
  { value: 'bike_walk', label: 'Walk / Bike' },
];
const BUDGET_OPTIONS: Option<HouseholdProfile['budgetMode']>[] = [
  { value: 'diy_low_cost', label: 'DIY & Zero-Cost Measures First' },
  { value: 'balanced', label: 'Balanced (DIY + Essential Gear)' },
  { value: 'smart_home', label: 'Smart Purifiers & Appliances' },
];

const INPUT_CLASS =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30';

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className={INPUT_CLASS}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Dialog for editing the household and lifestyle profile that personalizes guidance. */
export function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
  const [form, setForm] = useState<HouseholdProfile>(profile);
  const nameId = useId();
  const sizeId = useId();

  const update = <K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      ...form,
      householdName: sanitizeText(form.householdName, MAX_TEXT_FIELD_LENGTH) || 'My Household',
      familySize: clamp(Math.round(form.familySize) || FAMILY_SIZE_RANGE.min, FAMILY_SIZE_RANGE.min, FAMILY_SIZE_RANGE.max),
    });
    onClose();
  };

  return (
    <Modal
      title="Household & Lifestyle Profile"
      description="Tailors your daily routine, indoor air measures & AI guidance"
      icon={<Users className="h-4 w-4" />}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={nameId} className="block text-xs font-semibold text-slate-700">
              Household Name
            </label>
            <input
              id={nameId}
              type="text"
              maxLength={MAX_TEXT_FIELD_LENGTH}
              value={form.householdName}
              onChange={(event) => update('householdName', event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor={sizeId} className="block text-xs font-semibold text-slate-700">
              Family Size
            </label>
            <input
              id={sizeId}
              type="number"
              min={FAMILY_SIZE_RANGE.min}
              max={FAMILY_SIZE_RANGE.max}
              value={form.familySize}
              onChange={(event) => update('familySize', Number(event.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <fieldset className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-3">
          <legend className="sr-only">Household members and equipment</legend>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.hasChildren}
              onChange={(event) => update('hasChildren', event.target.checked)}
              className="accent-emerald-600"
            />
            Children in home
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.hasSeniors}
              onChange={(event) => update('hasSeniors', event.target.checked)}
              className="accent-emerald-600"
            />
            Older adults (65+)
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.hasPurifier}
              onChange={(event) => update('hasPurifier', event.target.checked)}
              className="accent-emerald-600"
            />
            Have HEPA air purifier
          </label>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Respiratory Sensitivity"
            value={form.respiratorySensitivity}
            options={SENSITIVITY_OPTIONS}
            onChange={(value) => update('respiratorySensitivity', value)}
          />
          <SelectField label="Home Type" value={form.homeType} options={HOME_OPTIONS} onChange={(value) => update('homeType', value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Primary Cooking Fuel"
            value={form.cookingFuel}
            options={FUEL_OPTIONS}
            onChange={(value) => update('cookingFuel', value)}
          />
          <SelectField
            label="Primary Commute"
            value={form.primaryCommute}
            options={COMMUTE_OPTIONS}
            onChange={(value) => update('primaryCommute', value)}
          />
        </div>

        <SelectField
          label="Solution Preference"
          value={form.budgetMode}
          options={BUDGET_OPTIONS}
          onChange={(value) => update('budgetMode', value)}
        />

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
            className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Save &amp; Personalize
          </button>
        </div>
      </form>
    </Modal>
  );
}
