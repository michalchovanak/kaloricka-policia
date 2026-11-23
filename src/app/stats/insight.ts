// Týždenný verdikt Strážmajstra Paťa: 1 krátka veta z priemerov vs. cieľov.
import type { Mood } from "@/components/Mascot";
import type { Targets } from "@/lib/nutrition";

export interface StatDay {
  day: string;
  meals: number;
  kcal: number;
  proteinG: number;
}

export function buildInsight(loggedDays: number, avgKcal: number, avgProtein: number, t: Targets): { mood: Mood; line: string } {
  if (loggedDays < 4) {
    return { mood: "angry", line: `${loggedDays} z 7 dní so zápisom. Zvyšok si žral potajomky, čo?` };
  }
  const dev = (avgKcal - t.kcal) / t.kcal;
  if (dev > 0.1) {
    return { mood: "angry", line: `Priemer +${Math.round(avgKcal - t.kcal)} kcal nad plán. Toto nie je diéta, to je bufet, do riti.` };
  }
  if (dev < -0.25) {
    return { mood: "grumpy", line: "Si hlboko pod plánom. Jedz normálne, nehraj sa na hrdinu." };
  }
  if (avgProtein < t.proteinG * 0.85) {
    return { mood: "approve", line: "Kalórie sedia, bielkoviny nie. Kúp si tvaroh, dopekla." };
  }
  return { mood: "approve", line: "Všetko v pláne. Nebudem ťa chváliť, ale pokutu tento týždeň nedostaneš." };
}
