"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo } from "react";
import { MacroRow } from "@/components/Bar";
import { useCapture } from "@/components/CaptureProvider";
import { haptic } from "@/components/confetti";
import { MascotBubble, type Mood } from "@/components/Mascot";
import { Ring } from "@/components/Ring";
import { dayKey, mealSlot, timeLabel } from "@/lib/dates";
import { dailyQuests, rankFor, streak, totalXp } from "@/lib/game";
import { dayTotals, mealTotals } from "@/lib/meals";
import { computeTargets, qualityScore, scoreGrade, type Targets, type Totals } from "@/lib/nutrition";
import { actions, useAppState } from "@/lib/store";
import type { Meal } from "@/lib/types";

function mascotLine(meals: Meal[], tot: Totals, t: Targets, name: string): { mood: Mood; text: string } {
  const h = new Date().getHours();
  const done = meals.filter((m) => m.status === "done");
  if (meals.some((m) => m.status === "analyzing")) return { mood: "thinking", text: "Práve vyšetrujem tvoje jedlo… 🔎" };
  if (done.length === 0) {
    if (h < 11) return { mood: "sleepy", text: `Dobré ráno${name ? `, ${name}` : ""}! Raňajky ešte nemám v spise. 📸` };
    return { mood: "sleepy", text: "Dnes zatiaľ žiadne dôkazy. Odfoť, čo ješ, a ja to spočítam!" };
  }
  if (tot.kcal > t.kcal * 1.1) return { mood: "strict", text: `Hm, dnes sme nad plánom o ${Math.round(tot.kcal - t.kcal)} kcal. Žiadna pokuta, zajtra to dorovnáme. 😉` };
  if (tot.addedSugarG > t.freeSugarMaxG) return { mood: "strict", text: "🚨 Cukrová hliadka hlási prekročenie! Skús na zvyšok dňa vodu a ovocie." };
  if (tot.proteinG >= t.proteinG) return { mood: "celebrate", text: "Bielkoviny splnené! Svaly ti posielajú poďakovanie. 💪" };
  const left = Math.round(t.proteinG - tot.proteinG);
  if (h >= 17 && left > 30) return { mood: "happy", text: `Ešte ${left} g bielkovín. Tvaroh, vajíčka alebo kuracie na večeru?` };
  return { mood: "happy", text: `Dobrá práca! Zostáva ${Math.max(0, Math.round(t.kcal - tot.kcal))} kcal a ${Math.max(0, left)} g bielkovín.` };
}

export default function TodayPage() {
  const { profile, meals, water } = useAppState();
  const { openCamera, openGallery, showMeal } = useCapture();
  const today = dayKey();

  const data = useMemo(() => {
    if (!profile) return null;
    const t = computeTargets(profile);
    const todays = meals.filter((m) => m.dayKey === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const tot = dayTotals(meals, today);
    const xp = totalXp(meals, profile, water);
    return {
      t,
      todays,
      tot,
      score: qualityScore(tot, t, false),
      rank: rankFor(xp),
      xp,
      st: streak(meals, today),
      quests: dailyQuests(meals, profile, water, today),
    };
  }, [profile, meals, water, today]);

  if (!profile || !data) return null;
  const { t, todays, tot, score, rank, st, quests } = data;
  const left = Math.round(t.kcal - tot.kcal);
  const grade = scoreGrade(score);
  const line = mascotLine(todays, tot, t, profile.name);
  const w = water[today] ?? 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Top bar: séria, XP, hodnosť */}
      <header className="flex items-center justify-between pt-1">
        <Link href="/badges" className="flex items-center gap-1.5 rounded-full border-2 border-kp-line bg-kp-surface px-3 py-1.5 font-black" style={{ boxShadow: "0 3px 0 var(--kp-line)" }}>
          <span className={st.aliveToday && st.count > 0 ? "kp-siren" : "grayscale opacity-60"}>🔥</span>
          <span className="kp-num" style={{ color: st.aliveToday ? "var(--kp-siren)" : "var(--kp-muted)" }}>{st.count}</span>
        </Link>
        <Link href="/badges" className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <span className="text-xl">{rank.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-black uppercase tracking-wide text-kp-ink-2">{rank.name} · lvl {rank.level}</div>
            <div className="progress-3d mt-1" style={{ height: 10, ["--_fill" as string]: "var(--kp-gold)" }}>
              <span style={{ ["--value" as string]: `${Math.round(rank.progress * 100)}%`, minWidth: 10 }} />
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-kp-gold-tint px-3 py-1.5 font-black text-kp-gold-ink">
          ⭐ <span className="kp-num">{data.xp}</span>
        </div>
      </header>

      <MascotBubble mood={line.mood} size={84}>{line.text}</MascotBubble>

      {/* Kcal ring + skóre */}
      <section className="card-3d p-4">
        <div className="flex items-center gap-4">
          <Ring value={tot.kcal} max={t.kcal} size={156} stroke={16}>
            <div>
              <div className="kp-num text-[34px] font-black leading-none" style={{ color: left < 0 ? "var(--kp-siren)" : "var(--kp-ink)" }}>
                {Math.abs(left)}
              </div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-wide text-kp-muted">{left < 0 ? "kcal navyše" : "kcal zostáva"}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="kp-overline text-kp-muted">Zjedené</div>
              <div className="kp-num text-xl font-black">
                {Math.round(tot.kcal)} <span className="text-sm text-kp-muted">/ {t.kcal}</span>
              </div>
            </div>
            <div>
              <div className="kp-overline text-kp-muted">Skóre dňa</div>
              <div className="flex items-baseline gap-1.5">
                <span className="kp-num text-xl font-black" style={{ color: tot.kcal ? "var(--kp-blue)" : "var(--kp-muted)" }}>{tot.kcal ? score : "–"}</span>
                {tot.kcal > 0 && (new Date().getHours() >= 18 ? <span className="text-xs font-extrabold text-kp-ink-2">{grade.emoji} {grade.label}</span> : <span className="text-xs font-extrabold text-kp-muted">priebežne</span>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <MacroRow label="Bielkoviny" emoji="🥩" value={tot.proteinG} max={t.proteinG} unit="g" color="var(--kp-protein)" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Mini label="Sacharidy" v={tot.carbsG} max={t.carbsG} color="var(--kp-carbs)" />
            <Mini label="Tuky" v={tot.fatG} max={t.fatG} color="var(--kp-fat)" />
            <Mini label="Pridaný cukor" v={tot.addedSugarG} max={t.freeSugarMaxG} color="var(--kp-sugar)" limit />
            <Mini label="Vláknina" v={tot.fiberG} max={t.fiberG} color="var(--kp-fiber)" />
          </div>
        </div>
        <Link href="/stats" className="btn-ghost mt-2 flex w-full items-center justify-center">Detaily a trendy →</Link>
      </section>

      {/* Jedlá */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="kp-h2">Dnešný spis</h2>
          <button className="btn-ghost !min-h-9 !px-2 text-xs" onClick={openGallery}>🖼️ Z galérie</button>
        </div>
        {todays.length === 0 ? (
          <div className="card-3d p-5 text-center">
            <div className="text-4xl">🍽️</div>
            <p className="kp-body-lg mt-1 text-kp-ink-2">Zatiaľ prázdno. Jedno cvaknutie a máš to.</p>
            <button className="btn-3d btn-3d--lg btn-3d--block mt-4" onClick={openCamera}>📸 Odfotiť jedlo</button>
          </div>
        ) : (
          <ul className="space-y-2">
            {todays.map((m) => (
              <MealCard key={m.id} meal={m} onClick={() => showMeal(m.id)} />
            ))}
            <li>
              <button className="option-3d justify-center !border-dashed text-kp-blue" onClick={openCamera}>＋ Pridať ďalšie jedlo</button>
            </li>
          </ul>
        )}
      </section>

      {/* Voda */}
      <section className="card-3d p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="kp-h3">💧 Pitný režim</h3>
            <div className="kp-caption kp-num">{(w / 1000).toFixed(2).replace(".", ",")} / {(t.waterMl / 1000).toFixed(1).replace(".", ",")} l</div>
          </div>
          <div className="flex gap-2">
            <button aria-label="Uber pohár" className="btn-3d btn-3d--secondary btn-3d--sm !w-11 !px-0" onClick={() => actions.addWater(today, -250)} disabled={w <= 0}>−</button>
            <button className="btn-3d btn-3d--sm" onClick={() => { haptic(); actions.addWater(today, 250); }}>+ pohár</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: Math.ceil(t.waterMl / 250) }, (_, i) => (
            <span key={i} className={`text-xl transition-all ${i < w / 250 ? "" : "opacity-25 grayscale"}`}>🥛</span>
          ))}
        </div>
      </section>

      {/* Denné úlohy */}
      <section className="card-3d p-4">
        <h3 className="kp-h3 mb-3">🎯 Denné úlohy</h3>
        <ul className="space-y-3">
          {quests.map((q) => (
            <li key={q.id} className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${q.progress >= 1 ? "bg-kp-mint-tint" : "bg-kp-sunken"}`}>{q.progress >= 1 ? "✅" : q.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-sm font-extrabold">
                  <span>{q.label}</span>
                  <span className="kp-num text-kp-muted">{q.detail}</span>
                </div>
                <div className="progress-3d mt-1" style={{ height: 12, ["--_fill" as string]: q.progress >= 1 ? "var(--kp-mint)" : "var(--kp-gold)" }}>
                  <span style={{ ["--value" as string]: `${q.progress * 100}%`, minWidth: q.progress > 0 ? 12 : 0 }} />
                </div>
              </div>
              <span className="shrink-0 text-xs font-black text-kp-gold-ink">+{q.xp}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Mini({ label, v, max, color, limit }: { label: string; v: number; max: number; color: string; limit?: boolean }) {
  const pct = max ? v / max : 0;
  let fill = color;
  if (limit && pct >= 1) fill = "var(--kp-siren)";
  else if (!limit && pct >= 1) fill = "var(--kp-mint)";
  return (
    <div>
      <div className="flex justify-between text-xs font-extrabold">
        <span>{label}</span>
        <span className="kp-num text-kp-muted">{Math.round(v)}/{max} g</span>
      </div>
      <div className="progress-3d mt-1" style={{ height: 10, ["--_fill" as string]: fill }}>
        <span style={{ ["--value" as string]: `${Math.min(100, pct * 100)}%`, minWidth: pct > 0 ? 10 : 0 }} />
      </div>
    </div>
  );
}

function MealCard({ meal, onClick }: { meal: Meal; onClick: () => void }) {
  const tot = mealTotals(meal);
  return (
    <li>
      <button onClick={onClick} className="option-3d !gap-3 !p-2.5 kp-pop-in">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-kp-sunken">
          {meal.photo && <img src={meal.photo} alt="" className="h-full w-full object-cover" />}
          {meal.status === "analyzing" && <div className="kp-scan absolute inset-x-0 h-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-black">{meal.emoji} {meal.title}</div>
          <div className="kp-caption">
            {mealSlot(meal.createdAt)} · {timeLabel(meal.createdAt)}
            {meal.status === "done" && ` · B ${Math.round(tot.proteinG)} g`}
            {meal.portion !== 1 && meal.status === "done" && ` · ${meal.portion}×`}
          </div>
          {meal.status === "error" && <div className="text-xs font-extrabold text-kp-siren">Ťukni pre opakovanie</div>}
        </div>
        <div className="shrink-0 pr-1 text-right">
          {meal.status === "done" ? (
            <>
              <div className="kp-num text-lg font-black text-kp-kcal">{Math.round(tot.kcal)}</div>
              <div className="text-[10px] font-black uppercase text-kp-muted">kcal</div>
            </>
          ) : meal.status === "analyzing" ? (
            <span className="inline-block animate-spin text-xl">🔎</span>
          ) : (
            <span className="text-xl">⚠️</span>
          )}
        </div>
      </button>
    </li>
  );
}
