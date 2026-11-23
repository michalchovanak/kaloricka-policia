// Policajný radar ako v GTA: zlé správanie zvyšuje hľadanosť (0–5 ★), dobré dni ju znižujú.
// Pri 5 ★ ťa večer (od 19:00) zavrú do basy a do 7:00 sa nežerie.
// Všetko sa počíta z dát, takže úprava alebo zmazanie jedla stav hneď prepočíta.
import { addDays, dayKey } from "./dates";
import { dayTotals } from "./meals";
import { computeTargets, type Profile, type Targets } from "./nutrition";
import type { Meal } from "./types";

export const MAX_STARS = 5;
export const ARREST_HOUR = 19;
export const RELEASE_HOUR = 7;

export interface Offense {
  text: string;
  stars: number;
}

export interface Wanted {
  stars: number; // 0–5 celé hviezdy
  heat: number; // presná hodnota pred zaokrúhlením
  offenses: Offense[]; // dnešné priestupky
  history: number; // hviezdy prenesené z minulých dní
  jailed: boolean;
  jailUntil: Date | null;
  warrant: boolean; // 5 ★ cez deň → o 19:00 ide do basy
}

const clamp = (x: number) => Math.min(MAX_STARS, Math.max(0, x));

function pastDayDelta(meals: Meal[], day: string, t: Targets): number {
  const done = meals.filter((m) => m.dayKey === day && m.status === "done");
  if (done.length === 0) return 1.5; // nič nezapísané = podozrivé
  const tot = dayTotals(meals, day);
  const over = tot.kcal / t.kcal - 1;
  let d = 0;
  if (over > 0.25) d += 2;
  else if (over > 0.1) d += 1;
  if (tot.addedSugarG > t.freeSugarMaxG) d += 0.5;
  if (done.length === 1 && tot.kcal < t.kcal * 0.5) d += 0.5; // jedno jedlo za deň? jasné…
  if (d === 0) d = done.length >= 2 && Math.abs(over) <= 0.1 ? -1.5 : -0.75; // dobrý deň chladí radar
  return d;
}

function todayOffenses(meals: Meal[], today: string, t: Targets, now: Date): Offense[] {
  const done = meals.filter((m) => m.dayKey === today && m.status === "done");
  const tot = dayTotals(meals, today);
  const list: Offense[] = [];
  const over = tot.kcal / t.kcal - 1;
  if (over > 0.25) list.push({ text: `Prežratý o ${Math.round(tot.kcal - t.kcal)} kcal`, stars: 2 });
  else if (over > 0.1) list.push({ text: `Nad plánom o ${Math.round(tot.kcal - t.kcal)} kcal`, stars: 1 });
  if (tot.addedSugarG > t.freeSugarMaxG) list.push({ text: `Cukor ${Math.round(tot.addedSugarG)} g, limit ${t.freeSugarMaxG} g`, stars: 1 });
  if (done.length === 0 && now.getHours() >= 13) list.push({ text: "Je poobede a nič si nezapísal", stars: 1 });
  return list;
}

export function computeWanted(meals: Meal[], profile: Profile, onboardedAt?: string, now = new Date()): Wanted {
  const t = computeTargets(profile);
  const today = dayKey(now);
  const firstLog = meals.reduce<string | null>((min, m) => (!min || m.dayKey < min ? m.dayKey : min), null);
  const start = [firstLog, onboardedAt ? dayKey(new Date(onboardedAt)) : null].filter(Boolean).sort()[0] ?? today;

  // História: prejdi minulé dni. Kto večer skončil na 5 ★, odsedel si noc a začína na 2 ★.
  let heat = 0;
  let jailedLastNight = false;
  for (let d = start; d < today; d = addDays(d, 1)) {
    heat = clamp(heat + pastDayDelta(meals, d, t));
    jailedLastNight = heat >= MAX_STARS;
    if (jailedLastNight && addDays(d, 1) < today) heat = 2;
  }

  // Včerajšiu basu si už odsedel (je po 7:00) → začína na 2 ★.
  if (jailedLastNight && now.getHours() >= RELEASE_HOUR) heat = 2;

  const offenses = todayOffenses(meals, today, t, now);
  const history = Math.floor(heat);
  const total = clamp(heat + offenses.reduce((s, o) => s + o.stars, 0));
  const stars = Math.floor(total + 1e-9);
  const h = now.getHours();

  let jailUntil: Date | null = null;
  if (h < RELEASE_HOUR && jailedLastNight) {
    jailUntil = new Date(now);
    jailUntil.setHours(RELEASE_HOUR, 0, 0, 0);
  } else if (stars >= MAX_STARS && h >= ARREST_HOUR) {
    jailUntil = new Date(now);
    jailUntil.setDate(jailUntil.getDate() + 1);
    jailUntil.setHours(RELEASE_HOUR, 0, 0, 0);
  }

  return {
    stars: jailUntil && h < RELEASE_HOUR ? MAX_STARS : stars,
    heat: total,
    offenses,
    history,
    jailed: !!jailUntil,
    jailUntil,
    warrant: !jailUntil && stars >= MAX_STARS,
  };
}

export function wantedLine(w: Wanted, mealsToday: number): { mood: "grumpy" | "watching" | "angry" | "approve" | "arrest"; text: string } {
  if (w.jailed) return { mood: "arrest", text: "Si v base, kamoš. Do rána žereš akurát tak vzduch." };
  if (w.warrant) return { mood: "angry", text: `Zatykač je vydaný. O ${ARREST_HOUR}:00 si pre teba prídem, ty žrút.` };
  if (w.stars >= 4) return { mood: "angry", text: "Ešte jeden rezeň a nasadím ti putá. Vážne." };
  if (w.stars === 3) return { mood: "angry", text: "Do riti, čo to tu žerieš? Radar už pípa." };
  if (w.stars === 2) return { mood: "grumpy", text: "Mám ťa na muške. Ešte jedna sprostosť a máš problém." };
  if (w.stars === 1) return { mood: "grumpy", text: "Jedna hviezda. Ešte ťa nezatýkam, ale nepáčiš sa mi." };
  if (mealsToday === 0) return { mood: "watching", text: "Čo si dnes žral? Odfoť to, nech ťa nemusím hľadať." };
  return { mood: "approve", text: "Čistý ako ľalia. Zatiaľ. Nevyser to." };
}
