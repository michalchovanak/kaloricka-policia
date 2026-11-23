import type { Profile } from "./nutrition";

export interface FoodItem {
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  sugarG: number;
  addedSugarG: number;
  fatG: number;
  satFatG: number;
  fiberG: number;
  sodiumMg: number;
  confidence: number;
  assumptions: string;
}

export interface AnalysisResult {
  isFood: boolean;
  mealTitle: string;
  emoji: string;
  items: FoodItem[];
  mealConfidence: number;
  notes: string;
  question: string;
  verdict: string; // krátka hravá hláška maskota
}

export type MealStatus = "analyzing" | "done" | "error";

export interface Meal {
  id: string;
  createdAt: string; // ISO
  dayKey: string; // YYYY-MM-DD (lokálny čas)
  photo?: string; // malý náhľad (data URL)
  caption?: string;
  status: MealStatus;
  error?: string;
  title: string;
  emoji: string;
  items: FoodItem[];
  portion: number; // násobok porcie (0.5, 1, 1.5, 2)
  notes?: string;
  question?: string;
  verdict?: string;
  mealConfidence?: number;
}

export interface Settings {
  inviteCode: string;
  ownApiKey: string;
}

export interface AppState {
  profile: Profile | null;
  meals: Meal[];
  water: Record<string, number>; // dayKey -> ml
  settings: Settings;
  onboardedAt?: string;
}
