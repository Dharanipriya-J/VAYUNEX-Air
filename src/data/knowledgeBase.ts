import type {
  CityLocation,
  CommunityPledge,
  HouseholdProfile,
  IndoorHack,
  SustainableSwap,
} from '../types/vayunex';

export const DEFAULT_PROFILE: HouseholdProfile = {
  householdName: 'My Household',
  familySize: 4,
  hasChildren: true,
  hasSeniors: false,
  respiratorySensitivity: 'mild',
  homeType: 'apartment',
  hasPurifier: false,
  cookingFuel: 'gas',
  primaryCommute: 'car',
  budgetMode: 'balanced',
};

export const PRESET_CITIES: CityLocation[] = [
  {
    id: 'delhi',
    name: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
    lat: 28.6139,
    lon: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'lahore',
    name: 'Lahore',
    region: 'Punjab',
    country: 'Pakistan',
    lat: 31.5497,
    lon: 74.3436,
    timezone: 'Asia/Karachi',
  },
  {
    id: 'beijing',
    name: 'Beijing',
    region: 'Beijing',
    country: 'China',
    lat: 39.9042,
    lon: 116.4074,
    timezone: 'Asia/Shanghai',
  },
  {
    id: 'milan',
    name: 'Milan',
    region: 'Lombardy',
    country: 'Italy',
    lat: 45.4642,
    lon: 9.19,
    timezone: 'Europe/Rome',
  },
  {
    id: 'krakow',
    name: 'Kraków',
    region: 'Lesser Poland',
    country: 'Poland',
    lat: 50.0647,
    lon: 19.945,
    timezone: 'Europe/Warsaw',
  },
  {
    id: 'london',
    name: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
    timezone: 'Europe/London',
  },
  {
    id: 'la',
    name: 'Los Angeles',
    region: 'California',
    country: 'United States',
    lat: 34.0522,
    lon: -118.2437,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'cdmx',
    name: 'Mexico City',
    region: 'CDMX',
    country: 'Mexico',
    lat: 19.4326,
    lon: -99.1332,
    timezone: 'America/Mexico_City',
  },
];

export const INDOOR_HACKS: IndoorHack[] = [
  {
    id: 'corsi-rosenthal',
    title: 'DIY Corsi-Rosenthal Box Air Cleaner',
    category: 'filtration',
    difficulty: 'Moderate',
    costLabel: '$55–$75',
    pm25ReductionPct: 72,
    timeToApply: '25 mins',
    summary:
      'Tape four MERV-13 HVAC filters and a cardboard shroud onto a standard 20-inch box fan to match or outperform commercial HEPA purifiers.',
    steps: [
      'Arrange four 20×20×1 MERV-13 filters in a square cube with airflow arrows pointing inward.',
      'Tape all vertical seams airtight with duct tape so air only enters through the filter media.',
      'Tape a cardboard base to the bottom and mount a 20-inch box fan facing upward on top.',
      'Add a cardboard shroud ring over the fan corners to prevent air recirculation and run on low-medium.',
    ],
    whyItWorks:
      'Delivers 400–600 CFM of clean air delivery rate (CADR) at a fraction of commercial HEPA cost, capturing >85% of fine PM2.5 particles per pass.',
  },
  {
    id: 'cross-ventilation-window',
    title: 'Thermal-Window Cross-Ventilation',
    category: 'ventilation',
    difficulty: 'Easy',
    costLabel: '$0',
    pm25ReductionPct: 38,
    timeToApply: '10 mins/day',
    summary:
      'Flush stale indoor CO₂ and cooking VOCs only during the midday atmospheric mixing window (typically 1:00 PM – 3:30 PM) when winter inversion lifts.',
    steps: [
      'Check the hourly PM2.5 curve on your VayuNex dashboard before opening any window.',
      'Open two opposite windows for exactly 10–15 minutes during the lowest midday AQI trough.',
      'Close and latch windows before 4:30 PM when evening temperature inversion traps ground-level smog.',
    ],
    whyItWorks:
      'Winter thermal inversions trap exhaust and woodsmoke near the ground at dawn and night; midday solar heating temporarily disperses pollutants.',
  },
  {
    id: 'cooking-capture',
    title: 'Back-Burner + Lid + Pre-Exhaust Protocol',
    category: 'cooking',
    difficulty: 'Easy',
    costLabel: '$0',
    pm25ReductionPct: 58,
    timeToApply: 'Immediate',
    summary:
      'Cooking on a gas stove can spike indoor PM2.5 and NO₂ above outdoor smog levels within minutes. Capture emissions at the source.',
    steps: [
      'Turn on the range hood or kitchen exhaust fan 2 minutes BEFORE igniting the burner.',
      'Cook on the back burners whenever possible—exhaust hoods capture 2× more plume from rear burners.',
      'Keep lids on pots and pans to trap aerosolized cooking oils and ultrafine particles.',
      'Leave the exhaust fan running for 10 minutes after turning off the stove.',
    ],
    whyItWorks:
      'Gas combustion generates NO₂ and frying generates ultrafine PM2.5; source capture prevents pollutants from diffusing into bedrooms.',
  },
  {
    id: 'wet-mop-lock',
    title: 'Microfiber Wet-Mop Dust Lock',
    category: 'habits',
    difficulty: 'Easy',
    costLabel: '$0–$10',
    pm25ReductionPct: 28,
    timeToApply: '15 mins',
    summary:
      'Replace dry sweeping and non-HEPA vacuuming with damp microfiber mopping to stop settled heavy metals and soot from resuspending.',
    steps: [
      'Avoid dry brooms or feather dusters during high-AQI days—they launch settled PM2.5 back to breathing height.',
      'Wipe windowsills, floors, and hard surfaces with a damp microfiber cloth.',
      'Leave outdoor shoes on a washable entry mat at the door to block tracked-in road soot.',
    ],
    whyItWorks:
      'Up to 40% of indoor PM10/PM2.5 comes from resuspended dust; moisture binds particles so they leave the airshed.',
  },
  {
    id: 'door-draft-seal',
    title: 'Door-Sweep & Window-Gap Weatherstripping',
    category: 'sealing',
    difficulty: 'Easy',
    costLabel: '$8–$18',
    pm25ReductionPct: 44,
    timeToApply: '20 mins',
    summary:
      'Seal leaky window frames and exterior door bottoms with adhesive foam tape and a door sweep to cut outdoor smog infiltration.',
    steps: [
      'Hold a damp hand near closed window edges on a breezy evening to spot cold air leaks.',
      'Apply adhesive EPDM foam weatherstripping along leaky sashes.',
      'Slide a rubber door sweep or rolled towel under exterior doors and bedroom doors.',
    ],
    whyItWorks:
      'Cutting air-exchange leakage from 1.0 ACH to 0.3 ACH reduces indoor-to-outdoor PM2.5 infiltration by nearly half and lowers winter heating bills.',
  },
  {
    id: 'zero-combustion-indoors',
    title: 'Zero-Combustion Indoor Sanctuary Rule',
    category: 'habits',
    difficulty: 'Easy',
    costLabel: '$0',
    pm25ReductionPct: 52,
    timeToApply: 'Immediate',
    summary:
      'Eliminate indoor incense, scented candles, mosquito coils, and aerosol sprays during winter smog episodes.',
    steps: [
      'Pause all candles, incense sticks, and fireplace use whenever outdoor AQI exceeds 100.',
      'Swap aerosol room sprays for baking-soda odor jars or simmered citrus peels on electric heat.',
      'Keep bedroom doors closed when creating a clean-air sleep zone.',
    ],
    whyItWorks:
      'A single incense stick or paraffin candle can raise a closed bedroom’s PM2.5 by 150–300 µg/m³—equivalent to severe outdoor smog.',
  },
];

export const SUSTAINABLE_SWAPS: SustainableSwap[] = [
  {
    id: 'commute-transit',
    category: 'transport',
    currentHabit: 'Solo Petrol/Diesel Car Commute (15 km/day)',
    alternative: 'Metro / Electric Bus + N95 Last-Mile Walk',
    personalPm25SavedUgDay: 18,
    co2SavedKgMonth: 74,
    costDeltaMonth: '-$85/mo saved',
    explanation:
      'In-cabin car concentrations in stop-and-go winter traffic trap exhaust from vehicles ahead. Shifting to rail/electric transit cuts tailpipe NO₂ and slashes personal commute emissions.',
    difficulty: 'Easy',
  },
  {
    id: 'gas-to-induction',
    category: 'cooking',
    currentHabit: 'Unvented Gas Stove Cooking (2 hrs/day)',
    alternative: 'Single-Burner Portable Induction + Electric Kettle',
    personalPm25SavedUgDay: 34,
    co2SavedKgMonth: 28,
    costDeltaMonth: '-$12/mo saved',
    explanation:
      'Eliminates indoor NO₂ spikes (which trigger pediatric asthma) and cuts indoor cooking particulates by over 60% while boiling water twice as fast.',
    difficulty: 'Moderate',
  },
  {
    id: 'biomass-to-electric',
    category: 'heating',
    currentHabit: 'Wood / Coal Space Heating or Fireplace',
    alternative: 'Sealed Room + Electric Heat Pump / Heated Throw',
    personalPm25SavedUgDay: 65,
    co2SavedKgMonth: 190,
    costDeltaMonth: '-$20/mo net',
    explanation:
      'Residential wood and coal burning is the #1 controllable source of winter neighborhood PM2.5. Zoned electric heat eliminates both indoor smoke and neighborhood haze.',
    difficulty: 'Upgrade',
  },
  {
    id: 'carpool-school',
    category: 'transport',
    currentHabit: 'Idling in School Drop-off Queue',
    alternative: '3-Family Carpool or Walking School Bus',
    personalPm25SavedUgDay: 14,
    co2SavedKgMonth: 38,
    costDeltaMonth: '-$45/mo saved',
    explanation:
      'Cold-start idling outside schools creates concentrated PM2.5 and benzene hotspots right at children’s breathing height.',
    difficulty: 'Easy',
  },
  {
    id: 'compost-over-burn',
    category: 'waste',
    currentHabit: 'Open Burning of Yard Leaves / Dry Waste',
    alternative: 'Municipal Mulching or Home Leaf-Mold Compost Bin',
    personalPm25SavedUgDay: 42,
    co2SavedKgMonth: 55,
    costDeltaMonth: '$0',
    explanation:
      'Smoldering wet winter leaves release 10× more PM2.5 and PAHs per kilogram than highway traffic. Composting locks carbon into soil instead of lungs.',
    difficulty: 'Easy',
  },
  {
    id: 'natural-cleaners',
    category: 'household',
    currentHabit: 'Aerosol Sprays & Synthetic Fragrance Cleaners',
    alternative: 'Diluted White Vinegar / Castile Soap Spray',
    personalPm25SavedUgDay: 11,
    co2SavedKgMonth: 9,
    costDeltaMonth: '-$15/mo saved',
    explanation:
      'Aerosol propellants and terpenes react with indoor ozone to form secondary ultrafine particles that irritate airways.',
    difficulty: 'Easy',
  },
];

export const INITIAL_PLEDGES: CommunityPledge[] = [
  {
    id: 'pledge-1',
    neighborhood: 'Central Ward & School Zones',
    title: 'Zero-Idling School Drop-Off Zone',
    description:
      'Turn off engines within 200 m of school gates and coordinate 3-family carpools twice a week.',
    participants: 148,
    monthlyCo2Kg: 2140,
    pm25GramsSaved: 890,
    joined: false,
  },
  {
    id: 'pledge-2',
    neighborhood: 'Metro Corridor',
    title: 'Smog-Alert Transit Shift (AQI > 150)',
    description:
      'Swap solo car trips for metro, bus, or remote workdays whenever morning AQI crosses 150.',
    participants: 312,
    monthlyCo2Kg: 6840,
    pm25GramsSaved: 1920,
    joined: true,
  },
  {
    id: 'pledge-3',
    neighborhood: 'Residential Blocks',
    title: 'No-Burn Winter Evenings',
    description:
      'Pledge zero backyard leaf burning, wood fires, or outdoor charcoal grills during winter inversion alerts.',
    participants: 204,
    monthlyCo2Kg: 4180,
    pm25GramsSaved: 3450,
    joined: false,
  },
];
