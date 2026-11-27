import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Home, LayoutDashboard, Leaf, Sparkles, Users } from 'lucide-react';
import { SESSION_KEYS, STORAGE_KEYS } from './constants';
import {
  DEFAULT_PROFILE,
  INDOOR_HACKS,
  INITIAL_PLEDGES,
  PRESET_CITIES,
  SUSTAINABLE_SWAPS,
} from './data/knowledgeBase';
import { useAirQuality } from './hooks/useAirQuality';
import { usePersistentState } from './hooks/usePersistentState';
import { generateRoutine } from './services/vayuAiEngine';
import type { AppSettings, CommunityPledge, RoutineSlot, TabId } from './types/vayunex';
import { buildActionPlanText, downloadTextFile, toFileSlug } from './utils/actionPlan';
import { createId, toggleId } from './utils/helpers';
import {
  isAppSettings,
  isCityLocation,
  isHouseholdProfile,
  isPledgeList,
  isString,
  isStringArray,
} from './utils/validators';
import { AiAssistant } from './components/AiAssistant';
import { CommunityHub } from './components/CommunityHub';
import { DashboardOverview } from './components/DashboardOverview';
import { Header } from './components/Header';
import { ImpactSimulator } from './components/ImpactSimulator';
import { IndoorAirLab } from './components/IndoorAirLab';
import { ProfileModal } from './components/ProfileModal';
import { RoutinePlanner } from './components/RoutinePlanner';
import { SettingsModal } from './components/SettingsModal';
import { SmogAlertBanner } from './components/SmogAlertBanner';
import { TabNav, tabButtonId, tabPanelId } from './components/TabNav';
import type { TabDefinition } from './components/TabNav';

const TABS: ReadonlyArray<TabDefinition<TabId>> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'assistant', label: 'VayuNex AI', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'routine', label: 'Daily Routine', icon: <CalendarClock className="h-4 w-4" /> },
  { id: 'indoor', label: 'Indoor Air', icon: <Home className="h-4 w-4" /> },
  { id: 'impact', label: 'Impact Simulator', icon: <Leaf className="h-4 w-4" /> },
  { id: 'community', label: 'Community', icon: <Users className="h-4 w-4" /> },
];

const DEFAULT_SETTINGS: AppSettings = { alertThresholdAqi: 150, notificationsEnabled: true };
const DEFAULT_HACK_IDS = ['cross-ventilation-window', 'cooking-capture'];
const DEFAULT_SWAP_IDS = ['commute-transit', 'gas-to-induction'];
const NEW_PLEDGE_IMPACT = { monthlyCo2Kg: 120, pm25GramsSaved: 85 } as const;

/** Root application shell: global state, navigation, and feature panels. */
export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCity, setSelectedCity] = usePersistentState(STORAGE_KEYS.city, PRESET_CITIES[0], {
    validate: isCityLocation,
  });
  const [profile, setProfile] = usePersistentState(STORAGE_KEYS.profile, DEFAULT_PROFILE, {
    validate: isHouseholdProfile,
  });
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
    validate: isAppSettings,
  });
  const [geminiApiKey, setGeminiApiKey] = usePersistentState(SESSION_KEYS.geminiApiKey, '', {
    storage: 'session',
    validate: isString,
  });
  const [savedHackIds, setSavedHackIds] = usePersistentState(STORAGE_KEYS.hacks, DEFAULT_HACK_IDS, {
    validate: isStringArray,
  });
  const [selectedSwapIds, setSelectedSwapIds] = usePersistentState(STORAGE_KEYS.swaps, DEFAULT_SWAP_IDS, {
    validate: isStringArray,
  });
  const [pledges, setPledges] = usePersistentState<CommunityPledge[]>(STORAGE_KEYS.pledges, INITIAL_PLEDGES, {
    validate: isPledgeList,
  });

  const { data: aq, isLoading, refresh } = useAirQuality(selectedCity);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);
  const [openModal, setOpenModal] = useState<'profile' | 'settings' | null>(null);

  useEffect(() => {
    if (aq) setRoutineSlots(generateRoutine(aq, profile));
  }, [aq, profile]);

  const handleToggleSlot = useCallback((id: string) => {
    setRoutineSlots((previous) =>
      previous.map((slot) => (slot.id === id ? { ...slot, completed: !slot.completed } : slot))
    );
  }, []);

  const handleAddCustomSlot = useCallback((title: string, timeWindow: string, recommendation: string) => {
    setRoutineSlots((previous) => [
      ...previous,
      {
        id: createId('custom'),
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
  }, []);

  const handleToggleHack = useCallback(
    (id: string) => setSavedHackIds((previous) => toggleId(previous, id)),
    [setSavedHackIds]
  );

  const handleToggleSwap = useCallback(
    (id: string) => setSelectedSwapIds((previous) => toggleId(previous, id)),
    [setSelectedSwapIds]
  );

  const handleTogglePledge = useCallback(
    (id: string) =>
      setPledges((previous) =>
        previous.map((pledge) =>
          pledge.id === id
            ? {
                ...pledge,
                joined: !pledge.joined,
                participants: pledge.participants + (pledge.joined ? -1 : 1),
              }
            : pledge
        )
      ),
    [setPledges]
  );

  const handleCreatePledge = useCallback(
    (title: string, neighborhood: string, description: string) =>
      setPledges((previous) => [
        {
          id: createId('pledge'),
          neighborhood,
          title,
          description,
          participants: 1,
          ...NEW_PLEDGE_IMPACT,
          joined: true,
        },
        ...previous,
      ]),
    [setPledges]
  );

  const handleExportPlan = useCallback(() => {
    if (!aq) return;
    const text = buildActionPlanText({
      aq,
      profile,
      routine: routineSlots,
      hacks: INDOOR_HACKS.filter((hack) => savedHackIds.includes(hack.id)),
      swaps: SUSTAINABLE_SWAPS.filter((swap) => selectedSwapIds.includes(swap.id)),
    });
    downloadTextFile(`VayuNex-${toFileSlug(aq.city.name)}-Action-Plan.txt`, text);
  }, [aq, profile, routineSlots, savedHackIds, selectedSwapIds]);

  const showAlertBanner = useMemo(
    () => Boolean(aq && settings.notificationsEnabled && aq.aqi >= settings.alertThresholdAqi),
    [aq, settings]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>

      <Header
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        profile={profile}
        onOpenProfile={() => setOpenModal('profile')}
        onOpenSettings={() => setOpenModal('settings')}
        onExportPlan={handleExportPlan}
        onRefresh={refresh}
        isLoading={isLoading}
      />

      <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {showAlertBanner && aq && (
          <SmogAlertBanner
            cityName={aq.city.name}
            aqi={aq.aqi}
            threshold={settings.alertThresholdAqi}
            onViewRoutine={() => setActiveTab('routine')}
          />
        )}

        {!aq ? (
          <div
            role="status"
            aria-live="polite"
            className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500"
          >
            Loading atmospheric data for {selectedCity.name}...
          </div>
        ) : (
          <section
            id={tabPanelId(activeTab)}
            role="tabpanel"
            aria-labelledby={tabButtonId(activeTab)}
            tabIndex={-1}
            className="focus:outline-none"
          >
            {activeTab === 'overview' && (
              <DashboardOverview aq={aq} profile={profile} onNavigate={setActiveTab} />
            )}
            {activeTab === 'assistant' && <AiAssistant aq={aq} profile={profile} geminiApiKey={geminiApiKey} />}
            {activeTab === 'routine' && (
              <RoutinePlanner
                slots={routineSlots}
                onToggleSlot={handleToggleSlot}
                onAddCustomSlot={handleAddCustomSlot}
              />
            )}
            {activeTab === 'indoor' && (
              <IndoorAirLab savedHackIds={savedHackIds} onToggleHack={handleToggleHack} outdoorPm25={aq.pm25} />
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
          </section>
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        VayuNex • Urban Air Quality &amp; Low-Emission Living Intelligence
      </footer>

      {openModal === 'profile' && (
        <ProfileModal profile={profile} onSave={setProfile} onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'settings' && (
        <SettingsModal
          settings={settings}
          apiKey={geminiApiKey}
          onSave={(nextSettings, nextKey) => {
            setSettings(nextSettings);
            setGeminiApiKey(nextKey);
          }}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}

export default App;
