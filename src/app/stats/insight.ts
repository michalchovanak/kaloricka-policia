// Priateľská týždenná hláška maskota, počítaná z priemerov vs. cieľov.
// Pozitívne rámcovanie (docs/nutrition-research.md §6): najprv pochvala, potom 1 tip.
import type { Mood } from "@/components/Mascot";
import { parseDayKey } from "@/lib/dates";
import type { Targets, Totals } from "@/lib/nutrition";

export interface StatDay {
  day: string;
  meals: number;
  totals: Totals;
  waterMl: number;
  score: number;
}

const WEEKDAY_IN = ["v nedeľu", "v pondelok", "v utorok", "v stredu", "vo štvrtok", "v piatok", "v sobotu"];

export function dayPhrase(key: string): string {
  const d = parseDayKey(key);
  return `${WEEKDAY_IN[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function buildInsight(
  logged: StatDay[],
  avgT: Totals,
  avgWater: number,
  avgScore: number,
  t: Targets,
  rangeDays: number,
): { mood: Mood; lines: string[] } {
  const positives: string[] = [];
  const tips: string[] = [];

  if (logged.length === 0) {
    return { mood: "sleepy", lines: ["V tomto období žiadne dôkazy. Odfoť jedlo a ja to rozlúsknem! 📸"] };
  }

  // Konzistentnosť zápisu je najdôležitejšia.
  if (logged.length >= rangeDays) positives.push("Zápis každý deň — vzorná služba! 🚓");
  else if (logged.length >= Math.ceil(rangeDays * 0.7)) positives.push(`${logged.length} z ${rangeDays} dní so zápisom — výborná pravidelnosť!`);

  const kcalDev = (avgT.kcal - t.kcal) / t.kcal;
  if (Math.abs(kcalDev) <= 0.1) positives.push(`Priemer ${Math.round(avgT.kcal)} kcal je presne v cieli 🎯`);

  // Najlepší bielkovinový deň.
  const bestProt = logged.reduce((a, b) => (b.totals.proteinG > a.totals.proteinG ? b : a));
  if (avgT.proteinG >= t.proteinG) positives.push(`Bielkoviny máš v priemere splnené 💪 Rekord ${dayPhrase(bestProt.day)}: ${Math.round(bestProt.totals.proteinG)} g.`);
  else if (bestProt.totals.proteinG >= t.proteinG) positives.push(`Bielkovinový deň ${dayPhrase(bestProt.day)} — ${Math.round(bestProt.totals.proteinG)} g, cieľ splnený! 🥩`);

  if (avgT.fiberG >= t.fiberG) positives.push("Vláknina v cieli — tvoje črevá salutujú 🥦");

  // Trend pridaného cukru: prvá vs. druhá polovica zapísaných dní.
  if (logged.length >= 4) {
    const half = Math.floor(logged.length / 2);
    const first = avg(logged.slice(0, half).map((d) => d.totals.addedSugarG));
    const second = avg(logged.slice(-half).map((d) => d.totals.addedSugarG));
    if (first > 5 && second < first * 0.85) positives.push("Pridaného cukru ti ubúda — paráda 🍬📉");
    else if (second > first * 1.25 && second > t.freeSugarIdealG) tips.push("Pridaného cukru v posledných dňoch pribúda — skús ovocie namiesto sladkostí 🍓");
  }

  if (avgScore >= 85) positives.push(`Priemerné skóre ${Math.round(avgScore)} — vzorný občan 🏅`);

  // Tipy (neutrálne, nikdy nie hanbiace).
  if (avgT.proteinG < t.proteinG * 0.85) tips.push(`Do cieľa bielkovín ti chýba v priemere ${Math.round(t.proteinG - avgT.proteinG)} g — pomôže tvaroh, vajíčka alebo strukoviny.`);
  if (avgT.fiberG < t.fiberG * 0.8) tips.push("Chýba ti vláknina — skús strukoviny, ovsené vločky alebo viac zeleniny 🫘");
  if (avgT.addedSugarG > t.freeSugarMaxG) tips.push("Pridaného cukru je v priemere viac, než je limit — hlavný podozrivý bývajú sladké nápoje 🥤");
  if (avgT.sodiumMg > t.sodiumMaxMg * 1.1) tips.push("Soli je viac, než treba — skús menej údenín a hotových jedál 🧂");
  if (avgWater < t.waterMl * 0.6) tips.push("Pitný režim zaostáva — pohár vody ku každému jedlu robí zázraky 💧");
  if (kcalDev > 0.15) tips.push("Kalórie sú trochu nad cieľom — menšia porcia večere to rýchlo vyrovná.");
  if (kcalDev < -0.25 && logged.length >= 3) tips.push("Ješ menej, než je tvoj cieľ — nezabúdaj, že aj telo potrebuje palivo 🔋");

  const lines: string[] = [];
  if (positives[0]) lines.push(positives[0]);
  if (tips[0]) lines.push(tips[0]);
  else if (positives[1]) lines.push(positives[1]);
  if (!lines.length) lines.push("Dobrá práca, že si zapisuješ! Každý zápis sa ráta 📝");

  const mood: Mood = tips.length === 0 ? "celebrate" : positives.length ? "happy" : "thinking";
  return { mood, lines };
}
