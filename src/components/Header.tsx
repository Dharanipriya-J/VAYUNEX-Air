import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Users,
  SlidersHorizontal,
  Download,
  RefreshCw,
} from 'lucide-react';
import { PRESET_CITIES } from '../data/knowledgeBase';
import { searchCities } from '../services/airQualityService';
import type { CityLocation, HouseholdProfile } from '../types/vayunex';

interface HeaderProps {
  selectedCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  profile: HouseholdProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onExportPlan: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCity,
  onSelectCity,
  profile,
  onOpenProfile,
  onOpenSettings,
  onExportPlan,
  onRefresh,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CityLocation[]>(PRESET_CITIES);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const found = await searchCities(query);
      if (!cancelled) {
        setResults(found);
        setSearching(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white no-print">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center">
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            VayuNex
          </span>
        </div>

        {/* City Search */}
        <div className="relative flex-1 max-w-md min-w-[220px]" ref={dropdownRef}>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
            <input
              type="text"
              value={open ? query : `${selectedCity.name}, ${selectedCity.country}`}
              onFocus={() => {
                setQuery('');
                setOpen(true);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder="Search any city worldwide..."
              className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
              aria-label="Search city"
            />
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
          </div>

          {open && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {searching
                  ? 'Searching global stations...'
                  : query.trim()
                  ? 'Matching Cities'
                  : 'Monitored Winter Smog Hubs'}
              </div>
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  No matching cities found. Try another name.
                </div>
              ) : (
                results.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                      city.id === selectedCity.id ? 'bg-emerald-50/80 font-semibold text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    <span>
                      {city.name}
                      {city.region ? (
                        <span className="text-slate-400">, {city.region}</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-slate-500">{city.country}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh live air data"
            aria-label="Refresh live air data"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <Users className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">{profile.householdName}</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
              {profile.familySize}
            </span>
          </button>

          <button
            type="button"
            onClick={onExportPlan}
            title="Download Family Action Plan"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Plan</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="AI & Alert Settings"
            aria-label="AI and Alert Settings"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
