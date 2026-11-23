// Výpočty cieľov podľa docs/nutrition-research.md (Mifflin-St Jeor, WHO/EFSA limity).
export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "extreme";
export type Goal = "lose" | "maintain" | "gain";
export type Pace = "slow" | "normal" | "fast";

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  pace: Pace;
}

export const ACTIVITY: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, { label: string; labelF: string; desc: string; emoji: string }> = {
  sedentary: { label: "Gauč", labelF: "Skôr sedím", desc: "Kancel, auto, takmer žiadny šport", emoji: "🛋️" },
  light: { label: "Ľahko aktívny", labelF: "Ľahko aktívna", desc: "Prechádzky, šport 1–3× týždenne", emoji: "🚶" },
  moderate: { label: "Aktívny", labelF: "Aktívna", desc: "Šport 3–5× týždenne alebo veľa chôdze", emoji: "🚴" },
  very: { label: "Veľmi aktívny", labelF: "Veľmi aktívna", desc: "Tvrdý tréning 6–7× týždenne", emoji: "🏋️" },
  extreme: { label: "Beast mode", labelF: "Beast mode", desc: "Fyzická práca + denný tréning", emoji: "🦍" },
};

export const GOAL_LABELS: Record<Goal, { label: string; desc: string; emoji: string }> = {
  lose: { label: "Schudnúť", desc: "Mierny deficit, veľa bielkovín", emoji: "📉" },
  maintain: { label: "Udržať váhu", desc: "Jesť vyvážene a mať prehľad", emoji: "⚖️" },
  gain: { label: "Pribrať / svaly", desc: "Mierny prebytok, viac bielkovín", emoji: "💪" },
};

export const PACE_LABELS: Record<Pace, { label: string; lose: string; gain: string; emoji: string }> = {
  slow: { label: "Pomaly", lose: "~0,25 kg týždenne", gain: "~0,15 kg týždenne", emoji: "🐢" },
  normal: { label: "Normálne", lose: "~0,5 kg týždenne", gain: "~0,3 kg týždenne", emoji: "🐇" },
  fast: { label: "Rýchlo", lose: "~0,75 kg týždenne", gain: "~0,5 kg týždenne", emoji: "🚀" },
};

const GOAL_OFFSET: Record<Goal, Record<Pace, number>> = {
  lose: { slow: -250, normal: -500, fast: -750 },
  maintain: { slow: 0, normal: 0, fast: 0 },
  gain: { slow: 150, normal: 300, fast: 500 },
};
const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
const PROTEIN_G_PER_KG: Record<Goal, number> = { lose: 1.6, maintain: 1.2, gain: 1.8 };

export interface Targets {
  bmr: number;
  tdee: number;
  kcal: number;
  floorApplied: boolean;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  freeSugarMaxG: number;
  freeSugarIdealG: number;
  totalSugarMaxG: number;
  satFatMaxG: number;
  sodiumMaxMg: number;
  waterMl: number;
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

export function computeTargets(p: Profile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY[p.activity];
  let offset = GOAL_OFFSET[p.goal][p.pace];
  if (offset < 0) offset = -Math.min(-offset, tdee * 0.25);
  const raw = tdee + offset;
  const floor = Math.min(KCAL_FLOOR[p.sex], tdee);
  const floorApplied = raw < floor;
  const kcal = Math.round(Math.max(raw, floor) / 10) * 10;

  const hM = p.heightCm / 100;
  const refKg = p.weightKg / (hM * hM) > 30 ? 27 * hM * hM : p.weightKg;
  const proteinG = Math.round(Math.min(refKg * PROTEIN_G_PER_KG[p.goal], (kcal * 0.35) / 4));
  let fatG = Math.round((kcal * 0.3) / 9);
  let carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  if (carbsG < 130) {
    const minFatG = Math.round((kcal * 0.2) / 9);
    fatG = Math.max(minFatG, fatG - Math.ceil(((130 - carbsG) * 4) / 9));
    carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  }
  const active = p.activity === "very" || p.activity === "extreme";
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    floorApplied,
    proteinG,
    fatG,
    carbsG,
    fiberG: Math.round(Math.max(25, (kcal / 1000) * 14)),
    freeSugarMaxG: Math.round((kcal * 0.1) / 4),
    freeSugarIdealG: Math.round((kcal * 0.05) / 4),
    totalSugarMaxG: Math.round((kcal * 0.18) / 4),
    satFatMaxG: Math.round((kcal * 0.1) / 9),
    sodiumMaxMg: 2000,
    waterMl:
      Math.round(clamp(p.weightKg * 33, 1500, 3500) / 50) * 50 + (active ? 500 : 0),
  };
}

export interface Totals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  sugarG: number;
  addedSugarG: number;
  fatG: number;
  satFatG: number;
  fiberG: number;
  sodiumMg: number;
}

export const EMPTY_TOTALS: Totals = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  sugarG: 0,
  addedSugarG: 0,
  fatG: 0,
  satFatG: 0,
  fiberG: 0,
  sodiumMg: 0,
};

/** 0–100. final=false → podjedenie sa počas dňa netrestá. */
export function qualityScore(t: Totals, g: Targets, final = true): number {
  if (t.kcal <= 0) return 0;
  const dev = (t.kcal - g.kcal) / g.kcal;
  const kcalDev = final ? Math.abs(dev) : Math.max(0, dev);
  const overPts = (v: number, lim: number) => clamp(1 - Math.max(0, v / lim - 1));
  const score =
    25 * clamp(1 - Math.max(0, kcalDev - 0.1) / 0.3) +
    25 * clamp(t.proteinG / g.proteinG) +
    20 * clamp(t.fiberG / g.fiberG) +
    15 * overPts(t.addedSugarG, g.freeSugarMaxG) +
    10 * overPts(t.sodiumMg, g.sodiumMaxMg) +
    5 * overPts(t.satFatG, g.satFatMaxG);
  return Math.round(score);
}

export function scoreGrade(score: number): { label: string; emoji: string; tone: "great" | "good" | "warn" | "bad" } {
  if (score >= 85) return { label: "Vzorný občan", emoji: "🏅", tone: "great" };
  if (score >= 70) return { label: "Bez priestupku", emoji: "✅", tone: "good" };
  if (score >= 50) return { label: "Napomenutie", emoji: "📝", tone: "warn" };
  return { label: "Pokuta", emoji: "🚨", tone: "bad" };
}
