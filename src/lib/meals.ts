import { EMPTY_TOTALS, type Totals } from "./nutrition";
import type { FoodItem, Meal } from "./types";

export function itemTotals(items: FoodItem[], portion = 1): Totals {
  const t = { ...EMPTY_TOTALS };
  for (const i of items) {
    t.kcal += i.kcal * portion;
    t.proteinG += i.proteinG * portion;
    t.carbsG += i.carbsG * portion;
    t.sugarG += i.sugarG * portion;
    t.addedSugarG += i.addedSugarG * portion;
    t.fatG += i.fatG * portion;
    t.satFatG += i.satFatG * portion;
    t.fiberG += i.fiberG * portion;
    t.sodiumMg += i.sodiumMg * portion;
  }
  return t;
}

export function mealTotals(m: Meal): Totals {
  if (m.status !== "done") return { ...EMPTY_TOTALS };
  return itemTotals(m.items, m.portion);
}

export function sumTotals(list: Totals[]): Totals {
  const t = { ...EMPTY_TOTALS };
  for (const x of list) {
    for (const k of Object.keys(t) as (keyof Totals)[]) t[k] += x[k];
  }
  return t;
}

export function dayTotals(meals: Meal[], day: string): Totals {
  return sumTotals(meals.filter((m) => m.dayKey === day).map(mealTotals));
}

export function mealsByDay(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const m of meals) {
    const arr = map.get(m.dayKey) ?? [];
    arr.push(m);
    map.set(m.dayKey, arr);
  }
  return map;
}

/** Sanity check výstupu AI: kcal vs. makrá, sat ≤ fat, sugar ≤ carbs. */
export function sanitizeItem(i: FoodItem): FoodItem {
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const it: FoodItem = {
    ...i,
    grams: Math.round(n(i.grams)),
    kcal: n(i.kcal),
    proteinG: n(i.proteinG),
    carbsG: n(i.carbsG),
    sugarG: n(i.sugarG),
    addedSugarG: n(i.addedSugarG),
    fatG: n(i.fatG),
    satFatG: n(i.satFatG),
    fiberG: n(i.fiberG),
    sodiumMg: n(i.sodiumMg),
    confidence: Math.min(1, n(i.confidence)),
  };
  it.satFatG = Math.min(it.satFatG, it.fatG);
  it.sugarG = Math.min(it.sugarG, it.carbsG);
  it.addedSugarG = Math.min(it.addedSugarG, it.sugarG);
  const macroKcal = it.proteinG * 4 + it.carbsG * 4 + it.fatG * 9;
  if (macroKcal > 0 && (it.kcal === 0 || Math.abs(it.kcal - macroKcal) / Math.max(it.kcal, 1) > 0.15)) {
    it.kcal = macroKcal;
  }
  it.kcal = Math.round(it.kcal);
  return it;
}

export const r0 = (v: number) => Math.round(v);
export const r1 = (v: number) => Math.round(v * 10) / 10;
