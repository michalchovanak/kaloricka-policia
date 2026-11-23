// Gamifikácia: XP, hodnosti, séria (streak), odznaky. Všetko sa počíta z dát,
// takže nič sa nerozbije a úprava jedla prepočíta odmeny.
import { addDays, dayKey } from "./dates";
import { dayTotals, mealsByDay } from "./meals";
import { computeTargets, qualityScore, type Profile } from "./nutrition";
import type { Meal } from "./types";

export const XP = {
  meal: 10,
  firstMealOfDay: 5,
  proteinGoal: 20,
  fiberGoal: 10,
  kcalOnTarget: 15,
  waterGoal: 10,
};

export const RANKS = [
  { name: "Kadet", xp: 0, emoji: "🧢" },
  { name: "Strážnik", xp: 100, emoji: "🛡️" },
  { name: "Hliadkar", xp: 250, emoji: "🚓" },
  { name: "Seržant", xp: 500, emoji: "🎖️" },
  { name: "Inšpektor", xp: 900, emoji: "🔎" },
  { name: "Poručík", xp: 1400, emoji: "⭐" },
  { name: "Kapitán", xp: 2100, emoji: "🌟" },
  { name: "Major", xp: 3000, emoji: "🏵️" },
  { name: "Plukovník", xp: 4200, emoji: "👑" },
  { name: "Šéf kalorickej polície", xp: 6000, emoji: "🦸" },
];

export function rankFor(xp: number) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) idx = i;
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { ...cur, level: idx + 1, next, progress };
}

export interface DayXp {
  day: string;
  xp: number;
  meals: number;
  proteinHit: boolean;
  fiberHit: boolean;
  kcalOnTarget: boolean;
  waterHit: boolean;
  score: number;
}

export function dayXp(
  meals: Meal[],
  day: string,
  profile: Profile,
  water: Record<string, number>,
  today = dayKey(),
): DayXp {
  const t = computeTargets(profile);
  const done = meals.filter((m) => m.dayKey === day && m.status === "done");
  const tot = dayTotals(meals, day);
  const proteinHit = tot.proteinG >= t.proteinG;
  const fiberHit = tot.fiberG >= t.fiberG;
  const isPast = day < today;
  const kcalOnTarget = isPast && done.length > 0 && Math.abs(tot.kcal - t.kcal) / t.kcal <= 0.1;
  const waterHit = (water[day] ?? 0) >= t.waterMl;
  let xp = done.length * XP.meal + (done.length > 0 ? XP.firstMealOfDay : 0);
  if (proteinHit) xp += XP.proteinGoal;
  if (fiberHit) xp += XP.fiberGoal;
  if (kcalOnTarget) xp += XP.kcalOnTarget;
  if (waterHit) xp += XP.waterGoal;
  return {
    day,
    xp,
    meals: done.length,
    proteinHit,
    fiberHit,
    kcalOnTarget,
    waterHit,
    score: qualityScore(tot, t, isPast),
  };
}

export function totalXp(meals: Meal[], profile: Profile, water: Record<string, number>): number {
  const days = new Set([...meals.map((m) => m.dayKey), ...Object.keys(water)]);
  let xp = 0;
  for (const d of days) xp += dayXp(meals, d, profile, water).xp;
  return xp;
}

/** Séria dní s aspoň jedným jedlom. Dnes bez jedla sériu ešte neláme. */
export function streak(meals: Meal[], today = dayKey()): { count: number; aliveToday: boolean } {
  const days = new Set(meals.filter((m) => m.status !== "error").map((m) => m.dayKey));
  const aliveToday = days.has(today);
  let cursor = aliveToday ? today : addDays(today, -1);
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return { count, aliveToday };
}

export function bestStreak(meals: Meal[]): number {
  const days = [...new Set(meals.map((m) => m.dayKey))].sort();
  let best = 0;
  let cur = 0;
  let prev = "";
  for (const d of days) {
    cur = prev && addDays(prev, 1) === d ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  earned: boolean;
}

export function badges(meals: Meal[], profile: Profile, water: Record<string, number>): Badge[] {
  const done = meals.filter((m) => m.status === "done");
  const byDay = mealsByDay(done);
  const days = [...byDay.keys()];
  const dxs = days.map((d) => dayXp(meals, d, profile, water));
  const t = computeTargets(profile);
  const best = bestStreak(done);
  const lowSugarDay = days.some((d) => {
    const tot = dayTotals(meals, d);
    return tot.kcal > t.kcal * 0.6 && tot.addedSugarG <= t.freeSugarIdealG;
  });
  const breakfast = done.some((m) => new Date(m.createdAt).getHours() < 10);
  const nightOwl = done.some((m) => new Date(m.createdAt).getHours() >= 22);
  const list: Omit<Badge, "earned">[] = [];
  const earned: Record<string, boolean> = {};
  const add = (b: Omit<Badge, "earned">, ok: boolean) => {
    list.push(b);
    earned[b.id] = ok;
  };
  add({ id: "first", name: "Prvý zápis", desc: "Odfoť prvé jedlo", emoji: "📸" }, done.length >= 1);
  add({ id: "breakfast", name: "Ranné vtáča", desc: "Zapíš raňajky pred 10:00", emoji: "🌅" }, breakfast);
  add({ id: "ten", name: "Fotoreportér", desc: "10 zapísaných jedál", emoji: "🎞️" }, done.length >= 10);
  add({ id: "fifty", name: "Archivár", desc: "50 zapísaných jedál", emoji: "🗂️" }, done.length >= 50);
  add({ id: "streak3", name: "Rozbeh", desc: "Séria 3 dni", emoji: "🔥" }, best >= 3);
  add({ id: "streak7", name: "Týždeň v službe", desc: "Séria 7 dní", emoji: "📅" }, best >= 7);
  add({ id: "streak30", name: "Mesiac bez priestupku", desc: "Séria 30 dní", emoji: "🏆" }, best >= 30);
  add({ id: "protein", name: "Bielkovinový boss", desc: "Splň cieľ bielkovín", emoji: "🥩" }, dxs.some((d) => d.proteinHit));
  add({ id: "protein5", name: "Mäsiarsky majster", desc: "Cieľ bielkovín 5 dní", emoji: "💪" }, dxs.filter((d) => d.proteinHit).length >= 5);
  add({ id: "fiber", name: "Vláknina hrdina", desc: "Splň cieľ vlákniny", emoji: "🥦" }, dxs.some((d) => d.fiberHit));
  add({ id: "sugar", name: "Cukrový detektív", desc: "Deň pod 5 % pridaného cukru", emoji: "🍬" }, lowSugarDay);
  add({ id: "target", name: "Presná muška", desc: "Deň v kalorickom cieli ±10 %", emoji: "🎯" }, dxs.some((d) => d.kcalOnTarget));
  add({ id: "water", name: "Hydro hliadka", desc: "Vypi denný cieľ vody", emoji: "💧" }, Object.keys(water).some((d) => (water[d] ?? 0) >= t.waterMl));
  add({ id: "score", name: "Vzorný občan", desc: "Skóre dňa 85+", emoji: "🏅" }, dxs.some((d) => d.score >= 85 && d.day < dayKey()));
  add({ id: "night", name: "Nočná hliadka", desc: "Jedlo po 22:00 (aj to sa počíta!)", emoji: "🌙" }, nightOwl);
  return list.map((b) => ({ ...b, earned: earned[b.id] }));
}

export interface Quest {
  id: string;
  label: string;
  emoji: string;
  progress: number; // 0–1
  detail: string;
  xp: number;
}

export function dailyQuests(
  meals: Meal[],
  profile: Profile,
  water: Record<string, number>,
  day = dayKey(),
): Quest[] {
  const t = computeTargets(profile);
  const tot = dayTotals(meals, day);
  const count = meals.filter((m) => m.dayKey === day && m.status === "done").length;
  const w = water[day] ?? 0;
  return [
    { id: "meals", label: "Zapíš 3 jedlá", emoji: "📸", progress: Math.min(1, count / 3), detail: `${Math.min(count, 3)}/3`, xp: 3 * XP.meal },
    { id: "protein", label: "Cieľ bielkovín", emoji: "🥩", progress: Math.min(1, tot.proteinG / t.proteinG), detail: `${Math.round(tot.proteinG)}/${t.proteinG} g`, xp: XP.proteinGoal },
    { id: "fiber", label: "Cieľ vlákniny", emoji: "🥦", progress: Math.min(1, tot.fiberG / t.fiberG), detail: `${Math.round(tot.fiberG)}/${t.fiberG} g`, xp: XP.fiberGoal },
    { id: "water", label: "Pitný režim", emoji: "💧", progress: Math.min(1, w / t.waterMl), detail: `${(w / 1000).toFixed(1)}/${(t.waterMl / 1000).toFixed(1)} l`, xp: XP.waterGoal },
  ];
}
