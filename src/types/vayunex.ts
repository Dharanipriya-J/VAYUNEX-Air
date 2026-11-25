export interface CityLocation {
  id: string;
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface HourlyPoint {
  time: string;
  hourLabel: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AirQualityData {
  city: CityLocation;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  so2: number;
  hourly: HourlyPoint[];
  source: 'live' | 'estimated';
  updatedAt: string;
}

export type RespiratorySensitivity = 'none' | 'mild' | 'asthma_copd';
export type HomeType = 'apartment' | 'house';
export type CookingFuel = 'electric_induction' | 'gas' | 'biomass';
export type PrimaryCommute = 'car' | 'transit' | 'bike_walk';
export type BudgetMode = 'diy_low_cost' | 'balanced' | 'smart_home';

export interface HouseholdProfile {
  householdName: string;
  familySize: number;
  hasChildren: boolean;
  hasSeniors: boolean;
  respiratorySensitivity: RespiratorySensitivity;
  homeType: HomeType;
  hasPurifier: boolean;
  cookingFuel: CookingFuel;
  primaryCommute: PrimaryCommute;
  budgetMode: BudgetMode;
}

export type RoutineStatus = 'safe' | 'caution' | 'avoid';

export interface RoutineSlot {
  id: string;
  timeWindow: string;
  title: string;
  category: 'ventilation' | 'commute' | 'outdoor' | 'indoor' | 'health';
  status: RoutineStatus;
  recommendation: string;
  reason: string;
  impactMetric: string;
  completed: boolean;
}

export interface IndoorHack {
  id: string;
  title: string;
  category: 'filtration' | 'ventilation' | 'cooking' | 'sealing' | 'habits';
  difficulty: 'Easy' | 'Moderate';
  costLabel: string;
  pm25ReductionPct: number;
  timeToApply: string;
  summary: string;
  steps: string[];
  whyItWorks: string;
}

export interface SustainableSwap {
  id: string;
  category: 'transport' | 'cooking' | 'heating' | 'waste' | 'household';
  currentHabit: string;
  alternative: string;
  personalPm25SavedUgDay: number;
  co2SavedKgMonth: number;
  costDeltaMonth: string;
  explanation: string;
  difficulty: 'Easy' | 'Moderate' | 'Upgrade';
}

export interface ImpactCard {
  label: string;
  value: string;
  detail: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  impactCards?: ImpactCard[];
  suggestedActions?: string[];
}

export interface CommunityPledge {
  id: string;
  neighborhood: string;
  title: string;
  description: string;
  participants: number;
  monthlyCo2Kg: number;
  pm25GramsSaved: number;
  joined: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  alertThresholdAqi: number;
  notificationsEnabled: boolean;
}
