import { getAqiMeta } from './airQualityService';
import type {
  AirQualityData,
  HouseholdProfile,
  ImpactCard,
  RoutineSlot,
} from '../types/vayunex';

/**
 * Identifies the cleanest daytime hour and peak smog hour from a 24-hour AQI forecast.
 */
export function findCleanestWindow(aq: AirQualityData): {
  bestHour: string;
  bestAqi: number;
  worstHour: string;
  worstAqi: number;
} {
  const daytime = aq.hourly.filter((h) => {
    const hr = parseInt(h.hourLabel.slice(0, 2), 10);
    return hr >= 10 && hr <= 17;
  });
  const pool = daytime.length > 0 ? daytime : aq.hourly;
  const best = pool.reduce((a, b) => (b.aqi < a.aqi ? b : a), pool[0]);
  const worst = aq.hourly.reduce((a, b) => (b.aqi > a.aqi ? b : a), aq.hourly[0]);

  return {
    bestHour: best?.hourLabel ?? '14:00',
    bestAqi: best?.aqi ?? aq.aqi,
    worstHour: worst?.hourLabel ?? '21:00',
    worstAqi: worst?.aqi ?? aq.aqi,
  };
}

/**
 * Generates a personalized, time-slotted low-emission daily routine from live AQI and household profile.
 */
export function generateRoutine(
  aq: AirQualityData,
  profile: HouseholdProfile
): RoutineSlot[] {
  const { bestHour, bestAqi, worstHour } = findCleanestWindow(aq);
  const sensitive =
    profile.hasChildren ||
    profile.hasSeniors ||
    profile.respiratorySensitivity !== 'none';
  const highSmog = aq.aqi > 150;
  const severeSmog = aq.aqi > 200;

  const commuteAdvice =
    profile.primaryCommute === 'car'
      ? 'Shift to Metro/electric transit or 3-family carpool. If driving, set cabin HVAC to Recirculate (not Fresh Air) in traffic.'
      : profile.primaryCommute === 'bike_walk'
      ? highSmog
        ? 'Wear a tight-fitting N95/FFP2 respirator and take side streets away from arterial diesel traffic.'
        : 'Use tree-lined side streets; keep exertion steady to limit deep lung particle deposition.'
      : 'Use rail/electric transit; wear an N95 during platform waits and last-mile walks.';

  const cookingAdvice =
    profile.cookingFuel === 'gas'
      ? 'Run range hood 2 min before lighting gas, cook on rear burners with lids on, or use an electric kettle/induction for morning tea & boiling.'
      : profile.cookingFuel === 'biomass'
      ? 'Avoid indoor solid fuel/wood today; use electric induction or clean LPG with cross-ventilation during the midday trough.'
      : 'Induction cooking keeps indoor NO₂ at zero—keep lids on during high-heat searing to trap oil aerosols.';

  const purifierAdvice = profile.hasPurifier
    ? 'Run HEPA purifier on Medium-High in the main living area; move it to bedrooms 45 min before sleep.'
    : 'Position a DIY Corsi-Rosenthal MERV-13 box fan in the main room and keep bedroom doors closed to create a clean-air sleep sanctuary.';

  return [
    {
      id: 'slot-morning',
      timeWindow: '06:30 – 09:30',
      title: 'Morning Inversion & Commute Shield',
      category: 'commute',
      status: highSmog || sensitive ? 'avoid' : 'caution',
      recommendation: `${commuteAdvice} Keep windows latched during morning rush hour.`,
      reason: `Cold morning air traps vehicle exhaust near street level in ${aq.city.name} (current AQI ${aq.aqi}, PM2.5 ${aq.pm25} µg/m³).`,
      impactMetric: '-32% morning PM2.5 inhalation',
      completed: false,
    },
    {
      id: 'slot-breakfast',
      timeWindow: '08:00 – 09:00',
      title: 'Low-Emission Kitchen Routine',
      category: 'indoor',
      status: profile.cookingFuel === 'electric_induction' ? 'safe' : 'caution',
      recommendation: cookingAdvice,
      reason:
        profile.cookingFuel === 'gas'
          ? 'Unvented gas cooking can double indoor NO₂ and PM2.5 within 15 minutes.'
          : 'Source control prevents indoor particulate spikes when windows must stay closed.',
      impactMetric: '-58% indoor cooking PM2.5',
      completed: false,
    },
    {
      id: 'slot-midday',
      timeWindow: `${bestHour} Window (${bestAqi <= 150 ? '15–20 min' : '5-min flush'})`,
      title: 'Cleanest Atmospheric Flush & Errands',
      category: 'ventilation',
      status: bestAqi <= 100 ? 'safe' : 'caution',
      recommendation:
        bestAqi <= 150
          ? `Open two opposite windows for 15 minutes around ${bestHour} (lowest AQI ~${bestAqi}) to flush indoor CO₂. Batch outdoor errands or school pickup now.`
          : `AQI remains elevated (~${bestAqi}) even at midday. Limit window opening to 5 minutes with exhaust fans on, and wear N95 for errands.`,
      reason: `Midday solar warming lifts the winter inversion layer, making ${bestHour} the cleanest window of the day.`,
      impactMetric: '-45% indoor CO₂ buildup',
      completed: false,
    },
    {
      id: 'slot-evening',
      timeWindow: '17:30 – 20:30',
      title: 'Evening Smog Seal & Indoor Activity',
      category: 'outdoor',
      status: severeSmog || highSmog ? 'avoid' : 'caution',
      recommendation: `${
        sensitive
          ? 'Keep children and seniors indoors; swap outdoor play for indoor stretching or board games.'
          : 'Move cardio workouts indoors.'
      } Close all windows before dusk, wet-mop entryways, and avoid candles/incense.`,
      reason: `Smog typically peaks around ${worstHour} as evening traffic meets rapid cooling.`,
      impactMetric: '-44% outdoor smog infiltration',
      completed: false,
    },
    {
      id: 'slot-night',
      timeWindow: '21:30 – 06:30',
      title: 'Clean-Air Sleep Sanctuary',
      category: 'health',
      status: 'safe',
      recommendation: `${purifierAdvice} Keep bedroom door shut and maintain 40–50% indoor humidity to protect nasal airways.`,
      reason:
        '8 hours of low-PM2.5 sleep lets lung macrophages clear daytime particulates and lowers overnight asthma flare risk.',
      impactMetric: '+8 hrs protected lung recovery',
      completed: false,
    },
  ];
}

export interface AiReply {
  content: string;
  impactCards: ImpactCard[];
  suggestedActions: string[];
}

function buildContextSummary(aq: AirQualityData, profile: HouseholdProfile): string {
  const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);
  return `City: ${aq.city.name}, ${aq.city.country} | Current AQI: ${aq.aqi} (${getAqiMeta(aq.aqi).label}) | PM2.5: ${aq.pm25} µg/m³ | PM10: ${aq.pm10} µg/m³ | NO2: ${aq.no2} µg/m³ | Cleanest Window: ${bestHour} (AQI ~${bestAqi}) | Peak Smog: ${worstHour} (AQI ~${worstAqi}).
Household: ${profile.familySize} people, children=${profile.hasChildren}, seniors=${profile.hasSeniors}, respiratory=${profile.respiratorySensitivity}, home=${profile.homeType}, purifier=${profile.hasPurifier}, cooking=${profile.cookingFuel}, commute=${profile.primaryCommute}, budget=${profile.budgetMode}.`;
}

export async function generateAiResponse(
  userPrompt: string,
  aq: AirQualityData,
  profile: HouseholdProfile,
  geminiApiKey?: string
): Promise<AiReply> {
  const context = buildContextSummary(aq, profile);

  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey.trim(),
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are VayuNex, an expert Urban Air Quality & Clean Living AI Assistant.
Live Context:
${context}

User Question: ${userPrompt}

Respond concisely in clear markdown with:
1. Direct, actionable recommendations tailored to their exact city AQI, cleanest window, and household profile.
2. Specific low-emission alternatives and indoor air quality hacks.
3. Clear explanation of the direct health & emission impact of each choice (quantified where possible).`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          return {
            content: text,
            impactCards: deriveImpactCards(userPrompt, aq, profile),
            suggestedActions: deriveFollowUps(userPrompt),
          };
        }
      }
    } catch {
      // Fall back smoothly to local VayuNex Intelligence Engine
    }
  }

  // Deterministic, deeply tailored VayuNex Intelligence Engine
  const q = userPrompt.toLowerCase();
  const meta = getAqiMeta(aq.aqi);
  const { bestHour, bestAqi, worstHour, worstAqi } = findCleanestWindow(aq);
  const whoRisk = profile.hasChildren
    ? 'children (whose faster breathing rate draws 1.5× more PM2.5 per kg)'
    : profile.hasSeniors
    ? 'older adults (higher cardiovascular sensitivity to PM2.5)'
    : profile.respiratorySensitivity !== 'none'
    ? 'sensitive airways'
    : 'your household';

  if (q.includes('routine') || q.includes('today') || q.includes('schedule') || q.includes('plan')) {
    return {
      content: `### Today's Tailored Plan for ${aq.city.name} (AQI ${aq.aqi} — ${meta.label})

Based on your **${profile.familySize}-person ${profile.homeType}** profile and protection needed for **${whoRisk}**:

- **Best Outdoor & Ventilation Window:** Aim for **${bestHour}** when AQI dips to **~${bestAqi}**. Open two opposite windows for 15 minutes to flush indoor CO₂, then seal up before dusk.
- **Peak Smog Avoidance:** Avoid outdoor exertion around **${worstHour}** (projected AQI **~${worstAqi}**). ${meta.outdoorAdvice}.
- **Commute Adjustment:** ${
        profile.primaryCommute === 'car'
          ? 'Swap solo car trips for metro/bus or a 3-family carpool today. If you must drive, keep HVAC on **Recirculate** to cut in-cabin exhaust PM2.5 by ~60%.'
          : 'Wear a snug **N95/FFP2** mask on street-level walks and choose side streets one block away from main diesel corridors.'
      }
- **Evening Indoor Sanctuary:** ${
        profile.hasPurifier
          ? 'Run your HEPA purifier on Medium-High in the living room until 9 PM, then move it to bedrooms.'
          : 'Keep bedroom doors shut, wet-mop entryway dust, and avoid candles or incense.'
      }`,
      impactCards: [
        { label: 'PM2.5 Exposure Cut', value: '-42%', detail: 'Shifting errands to midday trough + evening seal' },
        { label: 'Commute CO₂e Saved', value: '2.9 kg/day', detail: 'Swapping 15 km solo drive for transit/carpool' },
        { label: 'Mask Filtration', value: '≥95%', detail: 'Properly sealed N95/FFP2 vs cloth mask (~25%)' },
      ],
      suggestedActions: [
        'Show me low-cost indoor air hacks',
        'How does my cooking fuel affect indoor air?',
        'What sustainable swaps save the most PM2.5?',
      ],
    };
  }

  if (q.includes('indoor') || q.includes('hack') || q.includes('purifier') || q.includes('home') || q.includes('window')) {
    return {
      content: `### High-Impact Indoor Air Hacks for Your ${profile.homeType === 'apartment' ? 'Apartment' : 'Home'}

With outdoor PM2.5 at **${aq.pm25} µg/m³** in ${aq.city.name}, indoor air can either be a safe refuge or trap pollutants:

1. **${profile.hasPurifier ? 'Optimize Your HEPA Placement' : 'Build a $60 Corsi-Rosenthal Box'}:** ${
        profile.hasPurifier
          ? 'Place your purifier 30 cm away from walls in the most-used room, and run it continuously on Medium rather than cycling it off.'
          : 'Tape four 20×20 MERV-13 filters to a 20-inch box fan. It delivers 450+ CFM of clean air—matching $300+ commercial purifiers and cutting indoor PM2.5 by **~72%**.'
      }
2. **Timed Cross-Ventilation Only:** Seal leaky window gaps with $10 EPDM foam tape, and open windows **only for 15 minutes around ${bestHour}** (AQI ~${bestAqi}).
3. **Wet-Mop Instead of Sweeping:** Dry brooms resuspend settled soot and heavy metals. Damp-mopping cuts resuspended PM10/PM2.5 by **28%**.
4. **Zero Indoor Combustion:** Skip candles, incense, and aerosol sprays—one incense stick can spike bedroom PM2.5 above 200 µg/m³.`,
      impactCards: [
        { label: 'Indoor PM2.5 Drop', value: '-65% to -72%', detail: 'MERV-13 filtration + sealed window gaps' },
        { label: 'Resuspended Dust', value: '-28%', detail: 'Wet microfiber mopping vs dry sweeping' },
        { label: 'Annual Filter Cost', value: '~$65/yr', detail: 'DIY Corsi-Rosenthal vs $220+ HEPA refills' },
      ],
      suggestedActions: [
        'Plan today’s safe routine for my family',
        'Explain how induction cooking improves indoor air',
        'What commute swaps cut emissions most?',
      ],
    };
  }

  if (q.includes('cook') || q.includes('gas') || q.includes('induction') || q.includes('stove') || q.includes('heat')) {
    return {
      content: `### Why Cooking & Heating Choices Directly Change Your Air

You are currently using **${
        profile.cookingFuel === 'gas'
          ? 'Gas Stove'
          : profile.cookingFuel === 'biomass'
          ? 'Biomass / Wood'
          : 'Electric / Induction'
      }**.

- **The Hidden Indoor Spike:** Unvented gas burners release **NO₂** (nitrogen dioxide) and ultrafine particles directly into your kitchen—often pushing indoor levels above ${aq.city.name}’s outdoor NO₂ (${aq.no2} µg/m³). For ${whoRisk}, NO₂ irritates bronchial linings and lowers resistance to winter respiratory viruses.
- **Immediate Zero-Cost Fix:** Turn on your exhaust hood **2 minutes before** cooking, use **back burners**, and keep **lids on pots**. This captures **~58%** of cooking emissions.
- **High-Impact Swap:** Adding a **$50 single-burner portable induction cooktop** for daily boiling, tea, and sautéing eliminates indoor combustion NO₂ completely and cuts cooking PM2.5 by **34 µg/day** of personal exposure.`,
      impactCards: [
        { label: 'Indoor NO₂ Reduction', value: '-75%', detail: 'Switching daily boiling/simmering to induction' },
        { label: 'PM2.5 Saved', value: '34 µg/day', detail: 'Direct reduction in household lung exposure' },
        { label: 'CO₂e Saved', value: '28 kg/mo', detail: 'Lower wasted heat & cleaner electric load' },
      ],
      suggestedActions: [
        'Show me low-cost indoor air hacks',
        'Plan today’s safe routine for my family',
        'Compare car commute vs metro impact',
      ],
    };
  }

  if (q.includes('commute') || q.includes('car') || q.includes('bus') || q.includes('metro') || q.includes('emission') || q.includes('sustainable') || q.includes('alternative')) {
    return {
      content: `### Low-Emission Commute & Lifestyle Alternatives

In ${aq.city.name} (AQI **${aq.aqi}**), urban transport and residential burning drive the winter smog layer:

1. **Transit or Carpool over Solo Driving:** Swapping a 15 km/day solo car commute for Metro/electric bus saves **74 kg CO₂e/month** and keeps you out of stop-and-go tailpipe plumes (where in-cabin NO₂ and benzene spike).
2. **Eliminate Cold-Start Idling:** Turning off engines during school drop-offs prevents concentrated PM2.5 hotspots right at children’s breathing height.
3. **Zero Waste / Leaf Burning:** Composting or municipal mulching instead of burning dry winter leaves prevents **42 µg/day** of toxic PAH/smoke exposure for nearby families.
4. **Why Your Choice Matters:** Every 10 households that shift 3 car trips/week to transit remove **~550 kg of CO₂e** and measurable brake/exhaust particulates from the local neighborhood airshed each month.`,
      impactCards: [
        { label: 'CO₂e Prevented', value: '74 kg/mo', detail: 'Metro/bus shift on a 15 km daily commute' },
        { label: 'Fuel & Parking Saved', value: '~$85/mo', detail: 'Direct monthly household savings' },
        { label: 'Personal PM2.5 Cut', value: '-18 µg/day', detail: 'Avoiding stop-and-go traffic exhaust' },
      ],
      suggestedActions: [
        'Plan today’s safe routine for my family',
        'How can I seal my home against evening smog?',
        'How does induction cooking help indoor air?',
      ],
    };
  }

  // General intelligent response
  return {
    content: `### VayuNex Guidance for ${aq.city.name} (AQI ${aq.aqi} — ${meta.label})

Here is what matters most right now for **${whoRisk}**:

- **Current Air Snapshot:** PM2.5 is **${aq.pm25} µg/m³** (${
      aq.pm25 > 35 ? `${(aq.pm25 / 15).toFixed(1)}× above WHO 24-hr guideline` : 'within manageable range'
    }), and NO₂ is **${aq.no2} µg/m³**.
- **Smart Timing:** Schedule outdoor errands or brief 15-minute cross-ventilation around **${bestHour}** (lowest AQI **~${bestAqi}**), and keep windows sealed around **${worstHour}** (peak **~${worstAqi}**).
- **Protection & Prevention:** ${meta.maskAdvice}. ${
      profile.cookingFuel === 'gas'
        ? 'Use your kitchen exhaust fan + rear burners when cooking.'
        : 'Keep indoor air free of candles, incense, and aerosol sprays.'
    }
- **Sustainable Action:** ${
      profile.primaryCommute === 'car'
        ? 'Replacing even 2 solo car commutes per week with transit or carpooling cuts your household transport emissions by 40%.'
        : 'Your low-emission commute already helps keep neighborhood NO₂ down—pair it with an N95 on high-AQI mornings.'
    }`,
    impactCards: deriveImpactCards(userPrompt, aq, profile),
    suggestedActions: deriveFollowUps(userPrompt),
  };
}

function deriveImpactCards(
  _prompt: string,
  aq: AirQualityData,
  profile: HouseholdProfile
): ImpactCard[] {
  const { bestHour, bestAqi } = findCleanestWindow(aq);
  return [
    {
      label: 'Cleanest Window',
      value: bestHour,
      detail: `Projected AQI ~${bestAqi} (${getAqiMeta(bestAqi).label})`,
    },
    {
      label: 'Indoor Shield Potential',
      value: profile.hasPurifier ? '-70% PM2.5' : '-65% PM2.5',
      detail: profile.hasPurifier
        ? 'HEPA + window sealing during peak smog'
        : 'DIY MERV-13 box + weatherstripping',
    },
    {
      label: 'Monthly Emission Cut',
      value: profile.primaryCommute === 'car' ? '74+ kg CO₂e' : '38+ kg CO₂e',
      detail: 'With transit/carpool & clean cooking swaps',
    },
  ];
}

function deriveFollowUps(prompt: string): string[] {
  const q = prompt.toLowerCase();
  if (q.includes('indoor')) {
    return [
      'Plan today’s safe routine for my family',
      'What sustainable swaps save the most PM2.5?',
      'Explain how gas cooking affects my kids',
    ];
  }
  return [
    'Show me low-cost indoor air hacks',
    'Plan today’s safe routine for my family',
    'Compare car commute vs metro impact',
  ];
}
