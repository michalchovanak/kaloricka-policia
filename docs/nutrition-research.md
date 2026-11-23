# Kalorická polícia: nutrition spec

These are casual estimates for healthy adults (18+). They are not medical advice, so the app should say so once during onboarding.
Sources: WHO sugars 2015 [1], WHO sodium 2012 [2], WHO fats 2023 [3], EFSA DRVs 2010 [4], ISSN protein 2017 [5], ISSN diets 2017 [6], Mifflin-St Jeor validation [7], NHLBI obesity guideline [8], self-monitoring reviews [9][10].

## 1. Onboarding (7 questions max)

| # | Question (SK) | Input | Why it matters |
|---|---|---|---|
| 1 | Pohlavie | muž / žena | Mifflin-St Jeor has a sex constant (+5 / −161). It also sets the kcal floor. |
| 2 | Vek | years, 18–99 | BMR drops about 5 kcal per year of age. The formula is only validated for adults. |
| 3 | Výška | cm | Feeds BMR. Gives BMI for the protein reference weight. |
| 4 | Váha | kg | Feeds BMR, protein g/kg and water ml/kg. |
| 5 | Ako veľa sa hýbeš? | 5 levels (§2) | TDEE = BMR × activity factor. This is the biggest swing in the result (±40 %). |
| 6 | Cieľ | schudnúť / udržať / pribrať | Sets the sign of the kcal adjustment and the protein g/kg. |
| 7 | Tempo | pomaly / normálne / rýchlo | Sets the size of the deficit or surplus. Skip it if the goal is "udržať". |

Do not ask for goal weight, body fat or meal times. Let users edit everything later in Settings.

## 2. Energy formulas

**BMR (Mifflin-St Jeor).** Among common equations it most often lands within ±10 % of measured RMR (about 82 % of non-obese adults; less accurate with obesity) [7].
```
BMR = 10·kg + 6.25·cm − 5·age + (male ? +5 : −161)
```

**Activity multipliers.** TDEE = BMR × factor.

| key | factor | SK label | SK description |
|---|---|---|---|
| sedentary | 1.2 | Gauč | Kancel, auto, takmer žiadny šport |
| light | 1.375 | Ľahko aktívny | Prechádzky, šport 1–3× týždenne |
| moderate | 1.55 | Aktívny | Šport 3–5× týždenne alebo veľa chôdze |
| very | 1.725 | Veľmi aktívny | Tvrdý tréning 6–7× týždenne |
| extreme | 1.9 | Beast mode | Fyzická práca + denný tréning |

**Goal adjustment.** These are fixed kcal/day offsets. 7 700 kcal is roughly 1 kg of fat, so the offsets map to the weekly pace shown.

| goal | pomaly | normálne | rýchlo |
|---|---|---|---|
| lose | −250 (~0.25 kg/týž) | −500 (~0.5 kg/týž) | −750 (~0.75 kg/týž) |
| maintain | 0 | 0 | 0 |
| gain | +150 | +300 | +500 |

The −500 to −750 range matches the deficit used in NHLBI lifestyle programs [8].

**Safety rails, applied in this order:**
1. Cap the deficit at 25 % of TDEE: `deficit = min(|offset|, 0.25·TDEE)`.
2. kcal floor: **1 200 kcal for women and 1 500 kcal for men**, but never above TDEE. These are the lower ends of the NHLBI low-calorie diet ranges (women 1 200–1 500, men 1 500–1 800) [8]. When the floor kicks in, show the note "Bezpečné minimum".
3. Round the final kcal to the nearest **10**. Round macros to whole grams.

## 3. Daily targets

| Metric | Type | Formula | Source |
|---|---|---|---|
| Energy | GOAL (±band) | §2 result. Count ±10 % as "on target". | [7][8] |
| Protein | GOAL (reach) | lose 1.6 g/kg · maintain 1.2 g/kg · gain 1.8 g/kg × refKg | [5][6] |
| Fat | GOAL (range) | 30 % of kcal ÷ 9. Healthy range 20–35 %. | WHO ≤30 % [3], EFSA 20–35 % [4] |
| Carbs | REMAINDER | (kcal − protein·4 − fat·9) ÷ 4. Floor 130 g, then trim fat (min 20 %). | EFSA 45–60 % [4] |
| Fiber | GOAL (reach) | max(25, 14 g per 1 000 kcal) | EFSA 25 g [4] |
| Free/added sugar | LIMIT | < 10 % kcal ÷ 4. Show a bonus badge under 5 %. | WHO [1] |
| Total sugar (fallback) | LIMIT | < 18 % kcal ÷ 4 (90 g at 2 000 kcal, the EU Reference Intake) | EU 1169/2011 |
| Saturated fat | LIMIT | < 10 % kcal ÷ 9 | WHO 2023 [3] |
| Sodium | LIMIT | < 2 000 mg. Salt (g) = Na mg × 2.5 ÷ 1 000, so the limit is < 5 g salt. | WHO [2] |
| Water (drinks) | GOAL (reach) | 33 ml/kg, clamped to 1 500–3 500 ml, +500 ml if activity is "very" or "extreme" | EFSA total water AI 2.0 L ♀ / 2.5 L ♂ [4] |

- **refKg** is the body weight used for protein. If BMI is over 30, use the weight at BMI 27 (`27·m²`) so obese users don't get huge protein targets.
- Protein ranges in the sources: ISSN gives 1.4–2.0 g/kg for exercisers [5], and 2.3–3.1 g/kg FFM in a deficit for trained lifters [6]. 1.6 g/kg is a safe casual middle. Cap protein at 35 % of kcal.
- WHO's sugar limit covers *free* sugars only, not the sugars in fruit, vegetables or milk [1]. The AI therefore returns `addedSugarG` separately (§5). If it is missing, fall back to total sugar against the 18 % limit.
- Water: EFSA's adequate intakes count water from food as well (about 20–30 % of the total), so 33 ml/kg of *drinks* lands about right.

## 4. What to show

**Primary (home screen, 4 items):**
1. **Kcal ring.** Show "zostáva X kcal". It is the single number the whole app is about.
2. **Protein bar.** It is the easiest macro to act on, it keeps you full and protects muscle in a deficit. Show it as "reach the goal", which is a positive framing.
3. **Food quality score 0–100.** One number that rolls up sugar, fiber, salt and saturated fat, so casual users don't have to read six bars.
4. **Streak 🔥.** Consistency predicts results better than perfect accuracy [9][10].

**Secondary (tap to expand, "Detaily"):** carbs, fat, fiber, sugar, saturated fat, sodium/salt, water. Show limits as a bar that turns orange at 80 % and red at 100 %. Show goals as a bar that turns green when reached. Never say "zlyhal si" ("you failed").

**Food quality score.** All parts are clamped to 0–1. `d` is the relative kcal deviation and `over(x, L)` is how far x goes over limit L.

```
kcalPts  = 25 · clamp(1 − max(0, |kcal − T|/T − 0.10) / 0.30)   // ±10 % = full, ±40 % = 0
protPts  = 25 · clamp(protein / proteinT)
fiberPts = 20 · clamp(fiber / fiberT)
sugarPts = 15 · clamp(1 − max(0, sugar/sugarL − 1))             // 2× limit = 0
sodPts   = 10 · clamp(1 − max(0, sodium/sodiumL − 1))
satPts   =  5 · clamp(1 − max(0, satFat/satFatL − 1))
score    = round(sum)                                            // 0–100
```

- **During the day** (`final = false`), only overshoot counts against kcalPts, so a morning with one coffee doesn't score badly. The score freezes at midnight.
- **Grade labels:** 85+ "Vzorný občan" · 70–84 "Bez priestupku" · 50–69 "Napomenutie" · <50 "Pokuta". Keep the police theme light and never punitive.

## 5. AI photo analysis: return schema

Return JSON only. Every number is for the **portion visible in the photo**, not per 100 g.

```jsonc
{
  "items": [{
    "name": "Bryndzové halušky",   // Slovak, user-facing
    "grams": 350,                 // estimated edible weight
    "kcal": 620,
    "proteinG": 18, "carbsG": 72, "sugarG": 3, "addedSugarG": 0,
    "fatG": 28, "satFatG": 14, "fiberG": 4, "sodiumMg": 1400,
    "confidence": 0.7,            // 0–1, how sure about identity + portion
    "assumptions": "1 porcia, slanina navrch, ~10 g masti"  // short SK note
  }],
  "mealConfidence": 0.65,
  "notes": "Omáčka môže skrývať ďalšie kalórie."  // optional SK hint for the user
}
```

Validate the output in code. Each macro must be ≥ 0, and `|kcal − (4P + 4C + 9F)| / kcal < 0.15`; if it fails, recompute kcal from the macros. Also require `satFat ≤ fat`, `sugar ≤ carbs` and `addedSugar ≤ sugar`.

**Prompting tips for portion estimation:**
- **Scale anchors.** Ask the model to name a reference object it can see (fork about 19 cm, standard dinner plate about 26–27 cm, can 330 ml, hand, phone) and to estimate size from it before estimating grams.
- **Think in volume, then convert.** Ask for each item's area × height, then multiply by a typical density. Give a hint such as "rice/pasta cooked ≈ 0.6–0.8 g/ml, meat ≈ 1.0, salad ≈ 0.2".
- **Hidden calories.** Tell the model to always add a cooking-fat line or an assumption: fried and pan-cooked foods +5–15 g oil, dressings, butter on bread, sugar in drinks, the cream base of sauces. These are the biggest source of underestimation.
- **Prefer local, typical recipes.** Give it Slovak/Central European context (halušky, rezeň, kofola, chlebíčky) and say that restaurant portions are bigger than home ones.
- **One item per distinct food.** Don't merge "rezeň s hranolkami" into a single row. Users want to edit each part separately.
- **Ask the user, don't guess.** If confidence is below 0.5, return a short Slovak question ("Bola to cola zero?") and let the UI offer quick chips (½ / 1 / 1½ porcie).
- **Use the user's caption.** Pass any caption text in, because it beats vision.
- **Hold the model to the rules.** Use temperature 0 and a strict JSON schema (tool or structured output). Add 2–3 short few-shot examples with known gram weights.
- **Bias.** Models and people both under-estimate big portions and over-estimate small ones. Tell the model to round toward the typical serving.

## 6. Gamification hooks

- **Streaks with grace.** A day counts if ≥1 meal is logged. Give 1 free "freeze" per week so a single slip doesn't reset the streak, since loss aversion causes churn. Frequent, consistent logging predicts weight loss; perfect logging does not [9][10].
- **Reward logging, not eating.** Give points per logged meal regardless of kcal, so honest logging of pizza is still a win.
- **Positive framing.** Celebrate goals reached (protein ✓, fiber ✓, water ✓) and phrase limits neutrally ("zostáva 4 g soli"). Never use red-shame copy.
- **Small wins.** Use daily mini-badges such as "Prvé raňajky", "3 dni zeleniny" or "Pod 5 % cukru". Use variable rewards like a random witty police quote after logging.
- **Social, among friends.** A weekly friends board ranks *consistency* (days logged, average quality score), not weight or kcal, which avoids unhealthy competition. Add simple kudos/reactions.
- **Lower the friction.** One photo → done, with editing optional. Use a gentle reminder at a user-chosen time, with at most 1 nudge per day.
- **Weekly recap.** Show trends (7-day kcal average vs target) instead of daily judgment, because single days are noisy.

## 7. TypeScript reference

```ts
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Pace = 'slow' | 'normal' | 'fast';
export interface Profile { sex: Sex; age: number; heightCm: number; weightKg: number; activity: Activity; goal: Goal; pace: Pace }

export const ACTIVITY: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extreme: 1.9 };
export const GOAL_OFFSET: Record<Goal, Record<Pace, number>> = {
  lose: { slow: -250, normal: -500, fast: -750 },
  maintain: { slow: 0, normal: 0, fast: 0 },
  gain: { slow: 150, normal: 300, fast: 500 },
};
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
export const MAX_DEFICIT_PCT = 0.25;
export const PROTEIN_G_PER_KG: Record<Goal, number> = { lose: 1.6, maintain: 1.2, gain: 1.8 };
export const FAT_PCT = 0.30, FAT_MIN_PCT = 0.20, PROTEIN_MAX_PCT = 0.35, CARB_MIN_G = 130;
export const FREE_SUGAR_PCT = 0.10, FREE_SUGAR_IDEAL_PCT = 0.05, TOTAL_SUGAR_PCT = 0.18, SAT_FAT_PCT = 0.10;
export const SODIUM_MAX_MG = 2000, FIBER_MIN_G = 25, FIBER_PER_1000KCAL = 14;
export const WATER_ML_PER_KG = 33, WATER_MIN_ML = 1500, WATER_MAX_ML = 3500, WATER_ACTIVE_BONUS_ML = 500;

export interface Targets {
  bmr: number; tdee: number; kcal: number; floorApplied: boolean;
  proteinG: number; fatG: number; carbsG: number; fiberG: number;        // goals
  freeSugarMaxG: number; freeSugarIdealG: number; totalSugarMaxG: number; // limits
  satFatMaxG: number; sodiumMaxMg: number; saltMaxG: number; waterMl: number;
}

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

export function computeTargets(p: Profile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[p.activity];
  let offset = GOAL_OFFSET[p.goal][p.pace];
  if (offset < 0) offset = -Math.min(-offset, tdee * MAX_DEFICIT_PCT);
  const raw = tdee + offset;
  const floor = Math.min(KCAL_FLOOR[p.sex], tdee);   // never force eating above maintenance
  const floorApplied = raw < floor;
  const kcal = Math.round(Math.max(raw, floor) / 10) * 10;

  const hM = p.heightCm / 100;
  const refKg = p.weightKg / (hM * hM) > 30 ? 27 * hM * hM : p.weightKg;
  const proteinG = Math.round(Math.min(refKg * PROTEIN_G_PER_KG[p.goal], (kcal * PROTEIN_MAX_PCT) / 4));
  let fatG = Math.round((kcal * FAT_PCT) / 9);
  let carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  if (carbsG < CARB_MIN_G) {               // trim fat down to its 20 % floor to protect carbs
    const minFatG = Math.round((kcal * FAT_MIN_PCT) / 9);
    fatG = Math.max(minFatG, fatG - Math.ceil(((CARB_MIN_G - carbsG) * 4) / 9));
    carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  }
  const active = p.activity === 'very' || p.activity === 'extreme';
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, floorApplied,
    proteinG, fatG, carbsG,
    fiberG: Math.round(Math.max(FIBER_MIN_G, (kcal / 1000) * FIBER_PER_1000KCAL)),
    freeSugarMaxG: Math.round((kcal * FREE_SUGAR_PCT) / 4),
    freeSugarIdealG: Math.round((kcal * FREE_SUGAR_IDEAL_PCT) / 4),
    totalSugarMaxG: Math.round((kcal * TOTAL_SUGAR_PCT) / 4),
    satFatMaxG: Math.round((kcal * SAT_FAT_PCT) / 9),
    sodiumMaxMg: SODIUM_MAX_MG, saltMaxG: (SODIUM_MAX_MG * 2.5) / 1000,
    waterMl: Math.round(clamp(p.weightKg * WATER_ML_PER_KG, WATER_MIN_ML, WATER_MAX_ML) + (active ? WATER_ACTIVE_BONUS_ML : 0)),
  };
}

export interface Totals { kcal: number; proteinG: number; fiberG: number; sugarG: number; addedSugarG?: number; satFatG: number; sodiumMg: number }

/** 0–100. final=false → kcal undershoot not penalised (live, mid-day view). */
export function qualityScore(t: Totals, g: Targets, final = true): number {
  const dev = (t.kcal - g.kcal) / g.kcal;
  const kcalDev = final ? Math.abs(dev) : Math.max(0, dev);
  const overPts = (v: number, lim: number) => clamp(1 - Math.max(0, v / lim - 1));
  const sugar = t.addedSugarG != null ? overPts(t.addedSugarG, g.freeSugarMaxG) : overPts(t.sugarG, g.totalSugarMaxG);
  const score =
    25 * clamp(1 - Math.max(0, kcalDev - 0.10) / 0.30) +
    25 * clamp(t.proteinG / g.proteinG) +
    20 * clamp(t.fiberG / g.fiberG) +
    15 * sugar +
    10 * overPts(t.sodiumMg, g.sodiumMaxMg) +
     5 * overPts(t.satFatG, g.satFatMaxG);
  return t.kcal <= 0 ? 0 : Math.round(score);
}
```

Worked example: a man, 30 y, 180 cm, 85 kg, moderate activity, losing at normal pace.
BMR 1 830 → TDEE 2 837 → **2 340 kcal**. Targets: P 136 g · F 78 g · C 274 g · fiber 33 g · free sugar < 59 g (ideal < 29 g) · sat fat < 26 g · Na < 2 000 mg · water 2 805 ml.

## References
1. WHO (2015) *Guideline: Sugars intake for adults and children*. https://www.ncbi.nlm.nih.gov/books/NBK285538/
2. WHO, *Salt reduction* fact sheet (<2 000 mg Na / <5 g salt). https://www.who.int/news-room/fact-sheets/detail/salt-reduction
3. WHO (2023) *Updated guidelines on fats and carbohydrates* (SFA ≤10 %, total fat ≤30 %). https://www.who.int/news/item/17-07-2023-who-updates-guidelines-on-fats-and-carbohydrates
4. EFSA (2010) *DRVs for carbohydrates, fibre, fats and water*. https://www.efsa.europa.eu/en/press/news/nda100326
5. Jäger et al. (2017) *ISSN Position Stand: protein and exercise*. https://pubmed.ncbi.nlm.nih.gov/28642676/
6. Aragon et al. (2017) *ISSN Position Stand: diets and body composition*. https://pubmed.ncbi.nlm.nih.gov/28630601/
7. Frankenfield et al. (2005) RMR equations review; Academy EAL. https://www.andeal.org/topic.cfm?cat=4556
8. NHLBI / AHA-ACC-TOS (2013) obesity guideline, low-calorie diet ranges. https://pmc.ncbi.nlm.nih.gov/articles/PMC5771240
9. Burke et al. (2011) *Self-monitoring in weight loss: systematic review*. https://pubmed.ncbi.nlm.nih.gov/21185970/
10. Patel et al. (2022) app-based dietary self-monitoring adherence and weight loss. https://pubmed.ncbi.nlm.nih.gov/35664248/
