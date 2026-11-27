import { WHO_GUIDELINES } from '../../constants';
import { getAqiMeta } from '../aqiMeta';
import type { AirQualityData, CookingFuel, HouseholdProfile, ImpactCard } from '../../types/vayunex';
import { findCleanestWindow } from './cleanWindow';
import { describeRiskGroup } from './promptContext';

/** Structured assistant reply rendered by the chat UI. */
export interface AiReply {
  content: string;
  impactCards: ImpactCard[];
  suggestedActions: string[];
}

/** Topics the on-device Smart Engine can answer in depth. */
export type Intent = 'routine' | 'indoor' | 'cooking' | 'commute' | 'general';

interface ReplyContext {
  aq: AirQualityData;
  profile: HouseholdProfile;
  riskGroup: string;
  window: ReturnType<typeof findCleanestWindow>;
}

/** Ordered by specificity: the first topic with a matching keyword wins. */
const INTENT_KEYWORDS: ReadonlyArray<[Intent, readonly string[]]> = [
  ['routine', ['routine', 'today', 'schedule', 'plan']],
  ['cooking', ['cook', 'gas', 'induction', 'stove', 'heat', 'fuel']],
  ['commute', ['commute', 'car', 'bus', 'metro', 'emission', 'sustainable', 'alternative']],
  ['indoor', ['indoor', 'hack', 'purifier', 'home', 'window', 'measure']],
];

const FOLLOW_UPS = {
  routine: 'Plan today’s low-emission family schedule',
  indoor: 'Recommend low-cost indoor air quality measures',
  cooking: 'Analyze how my cooking fuel affects indoor air',
  commute: 'Compare low-emission commute alternatives',
} as const;

const COOKING_FUEL_LABEL: Record<CookingFuel, string> = {
  gas: 'Gas Stove',
  biomass: 'Biomass / Wood',
  electric_induction: 'Electric / Induction',
};

/** Classifies a free-text question into the most relevant Smart Engine topic. */
export function detectIntent(prompt: string): Intent {
  const query = prompt.toLowerCase();
  const match = INTENT_KEYWORDS.find(([, keywords]) => keywords.some((word) => query.includes(word)));
  return match ? match[0] : 'general';
}

/** Suggests follow-up prompts covering the topics the user has not just asked about. */
export function suggestFollowUps(intent: Intent): string[] {
  return (Object.keys(FOLLOW_UPS) as Array<keyof typeof FOLLOW_UPS>)
    .filter((topic) => topic !== intent)
    .slice(0, 3)
    .map((topic) => FOLLOW_UPS[topic]);
}

/** Default impact cards summarizing the household's biggest levers. */
export function buildDefaultImpactCards(aq: AirQualityData, profile: HouseholdProfile): ImpactCard[] {
  const { bestHour, bestAqi } = findCleanestWindow(aq);
  return [
    { label: 'Cleanest Window', value: bestHour, detail: `Projected AQI ~${bestAqi} (${getAqiMeta(bestAqi).label})` },
    {
      label: 'Indoor Shield Potential',
      value: profile.hasPurifier ? '-70% PM2.5' : '-65% PM2.5',
      detail: profile.hasPurifier ? 'HEPA + window sealing during peak smog' : 'DIY MERV-13 box + weatherstripping',
    },
    {
      label: 'Monthly Emission Cut',
      value: profile.primaryCommute === 'car' ? '74+ kg CO₂e' : '38+ kg CO₂e',
      detail: 'With transit/carpool & clean cooking swaps',
    },
  ];
}

function routineReply({ aq, profile, riskGroup, window }: ReplyContext): Omit<AiReply, 'suggestedActions'> {
  const meta = getAqiMeta(aq.aqi);
  const commute =
    profile.primaryCommute === 'car'
      ? 'Swap solo car trips for metro/bus or a 3-family carpool today. If you must drive, keep HVAC on **Recirculate** to cut in-cabin exhaust PM2.5 by ~60%.'
      : 'Wear a snug **N95/FFP2** mask on street-level walks and choose side streets one block away from main diesel corridors.';
  const evening = profile.hasPurifier
    ? 'Run your HEPA purifier on Medium-High in the living room until 9 PM, then move it to bedrooms.'
    : 'Keep bedroom doors shut, wet-mop entryway dust, and avoid candles or incense.';

  return {
    content: [
      `### Today's Tailored Plan for ${aq.city.name} (AQI ${aq.aqi} — ${meta.label})`,
      '',
      `Based on your **${profile.familySize}-person ${profile.homeType}** profile and protection needed for **${riskGroup}**:`,
      '',
      `- **Best Outdoor & Ventilation Window:** Aim for **${window.bestHour}** when AQI dips to **~${window.bestAqi}**. Open two opposite windows for 15 minutes to flush indoor CO₂, then seal up before dusk.`,
      `- **Peak Smog Avoidance:** Avoid outdoor exertion around **${window.worstHour}** (projected AQI **~${window.worstAqi}**). ${meta.outdoorAdvice}.`,
      `- **Commute Adjustment:** ${commute}`,
      `- **Evening Indoor Sanctuary:** ${evening}`,
    ].join('\n'),
    impactCards: [
      { label: 'PM2.5 Exposure Cut', value: '-42%', detail: 'Shifting errands to midday trough + evening seal' },
      { label: 'Commute CO₂e Saved', value: '2.9 kg/day', detail: 'Swapping 15 km solo drive for transit/carpool' },
      { label: 'Mask Filtration', value: '≥95%', detail: 'Properly sealed N95/FFP2 vs cloth mask (~25%)' },
    ],
  };
}

function indoorReply({ aq, profile, window }: ReplyContext): Omit<AiReply, 'suggestedActions'> {
  const filtration = profile.hasPurifier
    ? '**Optimize Your HEPA Placement:** Place your purifier 30 cm away from walls in the most-used room, and run it continuously on Medium rather than cycling it off.'
    : '**Build a $60 Corsi-Rosenthal Box:** Tape four 20×20 MERV-13 filters to a 20-inch box fan. It delivers 450+ CFM of clean air—matching $300+ commercial purifiers and cutting indoor PM2.5 by **~72%**.';

  return {
    content: [
      `### High-Impact Indoor Air Measures for Your ${profile.homeType === 'apartment' ? 'Apartment' : 'Home'}`,
      '',
      `With outdoor PM2.5 at **${aq.pm25} µg/m³** in ${aq.city.name}, indoor air can either be a safe refuge or trap pollutants:`,
      '',
      `1. ${filtration}`,
      `2. **Timed Cross-Ventilation Only:** Seal leaky window gaps with EPDM foam tape, and open windows **only for 15 minutes around ${window.bestHour}** (AQI ~${window.bestAqi}).`,
      '3. **Wet-Mop Instead of Sweeping:** Dry brooms resuspend settled soot and heavy metals. Damp-mopping cuts resuspended PM10/PM2.5 by **28%**.',
      '4. **Zero Indoor Combustion:** Skip candles, incense, and aerosol sprays—one incense stick can spike bedroom PM2.5 above 200 µg/m³.',
    ].join('\n'),
    impactCards: [
      { label: 'Indoor PM2.5 Drop', value: '-65% to -72%', detail: 'MERV-13 filtration + sealed window gaps' },
      { label: 'Resuspended Dust', value: '-28%', detail: 'Wet microfiber mopping vs dry sweeping' },
      { label: 'Annual Filter Cost', value: '~$65/yr', detail: 'DIY Corsi-Rosenthal vs $220+ HEPA refills' },
    ],
  };
}

function cookingReply({ aq, profile, riskGroup }: ReplyContext): Omit<AiReply, 'suggestedActions'> {
  return {
    content: [
      '### Why Cooking & Heating Choices Directly Change Your Air',
      '',
      `You are currently using **${COOKING_FUEL_LABEL[profile.cookingFuel]}**.`,
      '',
      `- **The Hidden Indoor Spike:** Unvented gas burners release **NO₂** and ultrafine particles directly into your kitchen—often pushing indoor levels above ${aq.city.name}’s outdoor NO₂ (${aq.no2} µg/m³). For ${riskGroup}, NO₂ irritates bronchial linings and lowers resistance to winter respiratory viruses.`,
      '- **Immediate Zero-Cost Fix:** Turn on your exhaust hood **2 minutes before** cooking, use **back burners**, and keep **lids on pots**. This captures **~58%** of cooking emissions.',
      '- **High-Impact Swap:** A **single-burner portable induction cooktop** for daily boiling, tea, and sautéing eliminates indoor combustion NO₂ and cuts cooking PM2.5 exposure by **34 µg/day**.',
    ].join('\n'),
    impactCards: [
      { label: 'Indoor NO₂ Reduction', value: '-75%', detail: 'Switching daily boiling/simmering to induction' },
      { label: 'PM2.5 Saved', value: '34 µg/day', detail: 'Direct reduction in household lung exposure' },
      { label: 'CO₂e Saved', value: '28 kg/mo', detail: 'Lower wasted heat & cleaner electric load' },
    ],
  };
}

function commuteReply({ aq }: ReplyContext): Omit<AiReply, 'suggestedActions'> {
  return {
    content: [
      '### Low-Emission Commute & Lifestyle Alternatives',
      '',
      `In ${aq.city.name} (AQI **${aq.aqi}**), urban transport and residential burning drive the winter smog layer:`,
      '',
      '1. **Transit or Carpool over Solo Driving:** Swapping a 15 km/day solo car commute for Metro/electric bus saves **74 kg CO₂e/month** and keeps you out of stop-and-go tailpipe plumes.',
      '2. **Eliminate Cold-Start Idling:** Turning off engines during school drop-offs prevents concentrated PM2.5 hotspots at children’s breathing height.',
      '3. **Zero Waste / Leaf Burning:** Composting or municipal mulching instead of burning dry winter leaves prevents **42 µg/day** of smoke exposure for nearby families.',
      '4. **Why Your Choice Matters:** Every 10 households that shift 3 car trips/week to transit remove **~550 kg of CO₂e** from the neighborhood airshed each month.',
    ].join('\n'),
    impactCards: [
      { label: 'CO₂e Prevented', value: '74 kg/mo', detail: 'Metro/bus shift on a 15 km daily commute' },
      { label: 'Fuel & Parking Saved', value: '~$85/mo', detail: 'Direct monthly household savings' },
      { label: 'Personal PM2.5 Cut', value: '-18 µg/day', detail: 'Avoiding stop-and-go traffic exhaust' },
    ],
  };
}

function generalReply({ aq, profile, riskGroup, window }: ReplyContext): Omit<AiReply, 'suggestedActions'> {
  const meta = getAqiMeta(aq.aqi);
  const whoMultiple = aq.pm25 / WHO_GUIDELINES.pm25;
  const pm25Note =
    whoMultiple > 1 ? `${whoMultiple.toFixed(1)}× the WHO 24-hr guideline` : 'within the WHO 24-hr guideline';
  const prevention =
    profile.cookingFuel === 'gas'
      ? 'Use your kitchen exhaust fan + rear burners when cooking.'
      : 'Keep indoor air free of candles, incense, and aerosol sprays.';
  const action =
    profile.primaryCommute === 'car'
      ? 'Replacing even 2 solo car commutes per week with transit or carpooling cuts household transport emissions by 40%.'
      : 'Your low-emission commute already helps keep neighborhood NO₂ down—pair it with an N95 on high-AQI mornings.';

  return {
    content: [
      `### VayuNex Guidance for ${aq.city.name} (AQI ${aq.aqi} — ${meta.label})`,
      '',
      `Here is what matters most right now for **${riskGroup}**:`,
      '',
      `- **Current Air Snapshot:** PM2.5 is **${aq.pm25} µg/m³** (${pm25Note}), and NO₂ is **${aq.no2} µg/m³**.`,
      `- **Smart Timing:** Schedule errands or a brief 15-minute cross-ventilation around **${window.bestHour}** (lowest AQI **~${window.bestAqi}**), and keep windows sealed around **${window.worstHour}** (peak **~${window.worstAqi}**).`,
      `- **Protection & Prevention:** ${meta.maskAdvice}. ${prevention}`,
      `- **Sustainable Action:** ${action}`,
    ].join('\n'),
    impactCards: buildDefaultImpactCards(aq, profile),
  };
}

const REPLY_BUILDERS: Record<Intent, (ctx: ReplyContext) => Omit<AiReply, 'suggestedActions'>> = {
  routine: routineReply,
  indoor: indoorReply,
  cooking: cookingReply,
  commute: commuteReply,
  general: generalReply,
};

/**
 * On-device VayuNex Smart Engine: produces a deterministic, personalized reply
 * grounded in live air quality and the household profile, with no network calls.
 */
export function generateSmartReply(prompt: string, aq: AirQualityData, profile: HouseholdProfile): AiReply {
  const intent = detectIntent(prompt);
  const context: ReplyContext = {
    aq,
    profile,
    riskGroup: describeRiskGroup(profile),
    window: findCleanestWindow(aq),
  };
  return { ...REPLY_BUILDERS[intent](context), suggestedActions: suggestFollowUps(intent) };
}
