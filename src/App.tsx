import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CalendarClock,
  Home,
  Leaf,
  Users,
  AlertTriangle,
} from 'lucide-react';
import {
  DEFAULT_PROFILE,
  INDOOR_HACKS,
  INITIAL_PLEDGES,
  PRESET_CITIES,
  SUSTAINABLE_SWAPS,
} from './data/knowledgeBase';
import { fetchAirQuality, getAqiMeta } from './services/airQualityService';
import { findCleanestWindow, generateRoutine } from './services/vayuAiEngine';
import { usePersistentState } from './hooks/usePersistentState';
import type {
  AirQualityData,
  AppSettings,
  CityLocation,
  CommunityPledge,
  HouseholdProfile,
  RoutineSlot,
} from './types/vayunex';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AiAssistant } from './components/AiAssistant';
import { RoutinePlanner } from './components/RoutinePlanner';
import { IndoorAirLab } from './components/IndoorAirLab';
import { ImpactSimulator } from './components/ImpactSimulator';
import { CommunityHub } from './components/CommunityHub';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';

type TabId = 'overview' | 'assistant' | 'routine' | 'indoor' | 'impact' | 'community';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCity, setSelectedCity] = usePersistentState<CityLocation>(
    'vayunex_city',
    PRESET_CITIES[0]
  );
  const [profile, setProfile] = usePersistentState<HouseholdProfile>(
    'vayunex_profile',
    DEFAULT_PROFILE
  );
  const [settings, setSettings] = usePersistentState<AppSettings>('vayunex_settings', {
    geminiApiKey: '',
    alertThresholdAqi: 150,
    notificationsEnabled: true,
  });
  const [savedHackIds, setSavedHackIds] = usePersistentState<string[]>('vayunex_hacks', [
    'cross-ventilation-window',
    'cooking-capture',
  ]);
  const [selectedSwapIds, setSelectedSwapIds] = usePersistentState<string[]>(
    'vayunex_swaps',
    ['commute-transit', 'gas-to-induction']
  );
  const [pledges, setPledges] = usePersistentState<CommunityPledge[]>(
    'vayunex_pledges',
    INITIAL_PLEDGES
  );

  const [aq, setAq] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const loadAirData = useCallback(async (city: CityLocation) => {
    setIsLoading(true);
    const data = await fetchAirQuality(city);
    setAq(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAirData(selectedCity);
  }, [selectedCity, loadAirData]);

  useEffect(() => {
    if (!aq) return;
    setRoutineSlots(generateRoutine(aq, profile));
  }, [aq, profile]);

  const handleToggleSlot = (id: string) => {
    setRoutineSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddCustomSlot = (
    title: string,
    timeWindow: string,
    recommendation: string
  ) => {
    setRoutineSlots((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        timeWindow,
        title,
        category: 'indoor',
        status: 'safe',
        recommendation,
        reason: 'Custom household clean-air commitment.',
        impactMetric: 'Custom protection',
        completed: false,
      },
    ]);
  };

  const handleToggleHack = (id: string) => {
    setSavedHackIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSwap = (id: string) => {
    setSelectedSwapIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTogglePledge = (id: string) => {
    setPledges((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              joined: !p.joined,
              participants: p.joined ? p.participants - 1 : p.participants + 1,
            }
          : p
      )
    );
  };

  const handleCreatePledge = (
    title: string,
    neighborhood: string,
    description: string
  ) => {
    setPledges((prev) => [
      {
        id: `pledge-${Date.now()}`,
        neighborhood,
        title,
        description,
        participants: 1,
        monthlyCo2Kg: 120,
        pm25GramsSaved: 85,
        joined: true,
      },
      ...prev,
    ]);
  };

  const handleExportPlan = () => {
    if (!aq) return;
    const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);
    const meta = getAqiMeta(aq.aqi);
    const chosenHacks = INDOOR_HACKS.filter((h) => savedHackIds.includes(h.id));
    const chosenSwaps = SUSTAINABLE_SWAPS.filter((s) => selectedSwapIds.includes(s.id));

    const lines = [
      `VAYUNEX — HOUSEHOLD CLEAN AIR ACTION PLAN`,
      `==========================================`,
      `City: ${aq.city.name}, ${aq.city.country}`,
      `Current AQI: ${aq.aqi} (${meta.label}) | PM2.5: ${aq.pm25} µg/m³ | NO₂: ${aq.no2} µg/m³`,
      `Cleanest Window Today: ${bestHour} (AQI ~${bestAqi})`,
      `Peak Smog Window: ${worstHour} (AQI ~${worstAqi})`,
      `Household: ${profile.householdName} (${profile.familySize} members, ${profile.homeType})`,
      ``,
      `1. TODAY'S LOW-EMISSION ROUTINE`,
      ...routineSlots.map(
        (s) => `- [${s.completed ? 'x' : ' '}] ${s.timeWindow} | ${s.title}: ${s.recommendation}`
      ),
      ``,
      `2. ACTIVE INDOOR AIR HACKS`,
      ...chosenHacks.map((h) => `- ${h.title} (-${h.pm25ReductionPct}% PM2.5)`),
      ``,
      `3. SUSTAINABLE ALTERNATIVES`,
      ...chosenSwaps.map(
        (sw) =>
          `- ${sw.alternative} (-${sw.personalPm25SavedUgDay} µg/m³·day, -${sw.co2SavedKgMonth} kg CO₂e/mo)`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeCitySlug = aq.city.name.replace(/[^a-zA-Z0-9_-]+/g, '-');
    a.download = `VayuNex-${safeCitySlug}-Action-Plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'assistant', label: 'VayuNex AI', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'routine', label: 'Daily Routine', icon: <CalendarClock className="h-4 w-4" /> },
    { id: 'indoor', label: 'Indoor Air', icon: <Home className="h-4 w-4" /> },
    { id: 'impact', label: 'Impact Simulator', icon: <Leaf className="h-4 w-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="h-4 w-4" /> },
  ];

  const showAlertBanner =
    aq && settings.notificationsEnabled && aq.aqi >= settings.alertThresholdAqi;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onExportPlan={handleExportPlan}
        onRefresh={() => loadAirData(selectedCity)}
        isLoading={isLoading}
      />

      {/* Navigation Tabs */}
      <nav className="border-b border-slate-200 bg-white no-print" aria-label="Primary">
        <div
          role="tablist"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {showAlertBanner && aq && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-900 no-print">
            <div className="flex items-center gap-2.5 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                <strong>Smog Alert in {aq.city.name}:</strong> AQI is {aq.aqi} (above your{' '}
                {settings.alertThresholdAqi} threshold). Seal windows and wear N95 outdoors.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('routine')}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              View Safe Routine
            </button>
          </div>
        )}
        {!aq ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="text-sm font-medium text-slate-500">
              Loading atmospheric data for {selectedCity.name}...
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                aq={aq}
                profile={profile}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'assistant' && (
              <AiAssistant
                aq={aq}
                profile={profile}
                geminiApiKey={settings.geminiApiKey}
              />
            )}
            {activeTab === 'routine' && (
              <RoutinePlanner
                slots={routineSlots}
                onToggleSlot={handleToggleSlot}
                onAddCustomSlot={handleAddCustomSlot}
              />
            )}
            {activeTab === 'indoor' && (
              <IndoorAirLab
                savedHackIds={savedHackIds}
                onToggleHack={handleToggleHack}
                outdoorPm25={aq.pm25}
              />
            )}
            {activeTab === 'impact' && (
              <ImpactSimulator
                selectedSwapIds={selectedSwapIds}
                onToggleSwap={handleToggleSwap}
                familySize={profile.familySize}
              />
            )}
            {activeTab === 'community' && (
              <CommunityHub
                pledges={pledges}
                cityName={aq.city.name}
                onToggleJoin={handleTogglePledge}
                onCreatePledge={handleCreatePledge}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 no-print">
        VayuNex • Urban Air Quality &amp; Low-Emission Living Intelligence
      </footer>

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onSave={setProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
