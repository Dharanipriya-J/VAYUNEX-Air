import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import type {
  BudgetMode,
  CookingFuel,
  HomeType,
  HouseholdProfile,
  PrimaryCommute,
  RespiratorySensitivity,
} from '../types/vayunex';

interface ProfileModalProps {
  profile: HouseholdProfile;
  onSave: (updated: HouseholdProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<HouseholdProfile>(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="font-display text-lg font-bold text-slate-900">
                Household &amp; Lifestyle Profile
              </h2>
              <p className="text-xs text-slate-500">
                Tailors your daily routine, indoor air hacks &amp; AI guidance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close household profile modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Household Name
              </label>
              <input
                type="text"
                value={form.householdName}
                onChange={(e) => setForm({ ...form, householdName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Family Size
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={form.familySize}
                onChange={(e) =>
                  setForm({ ...form, familySize: Math.max(1, Number(e.target.value)) })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.hasChildren}
                onChange={(e) => setForm({ ...form, hasChildren: e.target.checked })}
                className="accent-emerald-600"
              />
              Children in home
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.hasSeniors}
                onChange={(e) => setForm({ ...form, hasSeniors: e.target.checked })}
                className="accent-emerald-600"
              />
              Older adults (65+)
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.hasPurifier}
                onChange={(e) => setForm({ ...form, hasPurifier: e.target.checked })}
                className="accent-emerald-600"
              />
              Have HEPA air purifier
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Respiratory Sensitivity
              </label>
              <select
                value={form.respiratorySensitivity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    respiratorySensitivity: e.target.value as RespiratorySensitivity,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="none">None</option>
                <option value="mild">Mild / Seasonal Allergies</option>
                <option value="asthma_copd">Asthma / COPD / Cardiac</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Home Type
              </label>
              <select
                value={form.homeType}
                onChange={(e) =>
                  setForm({ ...form, homeType: e.target.value as HomeType })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="apartment">Apartment / Condo</option>
                <option value="house">Independent House</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Primary Cooking Fuel
              </label>
              <select
                value={form.cookingFuel}
                onChange={(e) =>
                  setForm({ ...form, cookingFuel: e.target.value as CookingFuel })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="electric_induction">Electric / Induction</option>
                <option value="gas">Gas Stove</option>
                <option value="biomass">Wood / Biomass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Primary Commute
              </label>
              <select
                value={form.primaryCommute}
                onChange={(e) =>
                  setForm({ ...form, primaryCommute: e.target.value as PrimaryCommute })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="car">Personal Car</option>
                <option value="transit">Metro / Bus / Rail</option>
                <option value="bike_walk">Walk / Bike</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Solution Preference
            </label>
            <select
              value={form.budgetMode}
              onChange={(e) =>
                setForm({ ...form, budgetMode: e.target.value as BudgetMode })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none"
            >
              <option value="diy_low_cost">DIY &amp; Zero-Cost Hacks First</option>
              <option value="balanced">Balanced (DIY + Essential Gear)</option>
              <option value="smart_home">Smart Purifiers &amp; Appliances</option>
            </select>
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
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Save &amp; Personalize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
