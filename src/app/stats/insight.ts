// Týždenný verdikt maskota: 1 krátka veta z priemerov vs. cieľov.
import type { Mood } from "@/components/Mascot";
import type { Sex, Targets } from "@/lib/nutrition";

export interface StatDay {
  day: string;
  meals: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  addedSugarG: number;
}

export interface Averages {
  kcal: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  addedSugarG: number;
}

type Line = { mood: Mood; line: string };

export function buildInsight(loggedDays: number, avg: Averages, t: Targets, sex: Sex): Line {
  const f = sex === "female";
  if (loggedDays < 4) {
    return f
      ? { mood: "grumpy", line: `${loggedDays} z 7 dní so zápisom. Zvyšok týždňa je utajený spis, kvak.` }
      : { mood: "angry", line: `${loggedDays} z 7 dní so zápisom. Zvyšok si žral potajomky, čo?` };
  }
  const dev = (avg.kcal - t.kcal) / t.kcal;
  const over = Math.round(avg.kcal - t.kcal);
  if (dev > 0.1) {
    return f
      ? { mood: "angry", line: `Priemer +${over} kcal nad plán. Víkend sa nám natiahol na celý týždeň, čo?` }
      : { mood: "angry", line: `Priemer +${over} kcal nad plán. Toto nie je diéta, to je bufet, do riti.` };
  }
  if (dev < -0.25) {
    // Málo jedla nikdy nechválime.
    return f
      ? { mood: "grumpy", line: "Si hlboko pod plánom. S prázdnou nádržou nič neodcvičíš, jedz poriadne." }
      : { mood: "grumpy", line: "Si hlboko pod plánom. Jedz normálne, nehraj sa na hrdinu." };
  }
  if (avg.proteinG < t.proteinG * 0.85) {
    return f
      ? { mood: "watching", line: "Kalórie sedia, bielkoviny nie. Skyr, tvaroh alebo vajíčka, vyber si." }
      : { mood: "approve", line: "Kalórie sedia, bielkoviny nie. Kúp si tvaroh, dopekla." };
  }
  if (avg.fiberG < t.fiberG * 0.6) {
    return f
      ? { mood: "watching", line: "Vláknina chýba. Hrsť zeleniny alebo strukovín k obedu a máš to." }
      : { mood: "watching", line: "Vláknina skoro nulová. Zelenina ťa nezabije, dopekla." };
  }
  return f
    ? { mood: "approve", line: "Všetko v pláne. Úprimne? Klobúk dole. Takto ďalej." }
    : { mood: "approve", line: "Všetko v pláne. Nebudem ťa chváliť, ale pokutu tento týždeň nedostaneš." };
}
