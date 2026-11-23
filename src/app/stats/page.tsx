"use client";

import { useMemo, useState } from "react";
import { MacroRow } from "@/components/Bar";
import { Mascot, MascotBubble } from "@/components/Mascot";
import { useCapture } from "@/components/CaptureProvider";
import { dayKey, lastDays, parseDayKey } from "@/lib/dates";
import { bestStreak, streak } from "@/lib/game";
import { dayTotals } from "@/lib/meals";
import { computeTargets, EMPTY_TOTALS, qualityScore, scoreGrade, type Totals } from "@/lib/nutrition";
import { useAppState } from "@/lib/store";
import { KcalChart, ProteinChart, ScoreChart, toneColor } from "./Charts";
import { buildInsight, type StatDay } from "./insight";

type Range = 7 | 30;

const WEEKDAY_LONG = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
const fmt = (v: number) => Math.round(v).toLocaleString("sk-SK");

function longDate(key: string) {
  const d = parseDayKey(key);
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

function averageTotals(days: StatDay[]): Totals {
  const t = { ...EMPTY_TOTALS };
  if (!days.length) return t;
  for (const d of days) for (const k of Object.keys(t) as (keyof Totals)[]) t[k] += d.totals[k];
  for (const k of Object.keys(t) as (keyof Totals)[]) t[k] /= days.length;
  return t;
}

export default function StatsPage() {
  const { profile, meals, water } = useAppState();
  const { openCamera } = useCapture();
  const [range, setRange] = useState<Range>(7);
  const [picked, setPicked] = useState<string | null>(null);

  const today = dayKey();
  const done = useMemo(() => meals.filter((m) => m.status === "done"), [meals]);
  const targets = useMemo(() => (profile ? computeTargets(profile) : null), [profile]);

  const days: StatDay[] = useMemo(() => {
    if (!targets) return [];
    return lastDays(range, today).map((day) => {
      const totals = dayTotals(done, day);
      return {
        day,
        meals: done.filter((m) => m.dayKey === day).length,
        totals,
        waterMl: water[day] ?? 0,
        score: qualityScore(totals, targets, day < today),
      };
    });
  }, [done, water, range, today, targets]);

  if (!profile || !targets) return null;
  const t = targets;

  if (done.length === 0) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="kp-h1">Štatistiky</h1>
        <div className="card-3d flex flex-col items-center gap-4 px-6 py-10 text-center kp-pop-in">
          <Mascot mood="sleepy" size={140} bob />
          <p className="kp-h2">Zatiaľ žiadne dôkazy.</p>
          <p className="kp-body-lg text-kp-ink-2">Odfoť prvé jedlo!</p>
          <button type="button" className="btn-3d btn-3d--block" onClick={openCamera}>
            📸 Odfotiť jedlo
          </button>
        </div>
      </div>
    );
  }

  const logged = days.filter((d) => d.meals > 0);
  const avgT = averageTotals(logged);
  const avgWater = logged.length ? logged.reduce((a, d) => a + d.waterMl, 0) / logged.length : 0;
  const avgScore = logged.length ? logged.reduce((a, d) => a + d.score, 0) / logged.length : 0;
  const grade = scoreGrade(avgScore);
  const st = streak(meals, today);
  const best = Math.max(bestStreak(done), st.count);
  const insight = buildInsight(logged, avgT, avgWater, avgScore, t, range);
  const proteinHitDays = logged.filter((d) => d.totals.proteinG >= t.proteinG).length;

  const selectedKey =
    picked && days.some((d) => d.day === picked) ? picked : (logged[logged.length - 1]?.day ?? today);
  const sel = days.find((d) => d.day === selectedKey) ?? days[days.length - 1];

  const kcalPct = avgT.kcal / t.kcal;
  const kcalTone = !logged.length ? "text-kp-muted" : kcalPct > 1.1 ? "text-kp-siren-ink" : Math.abs(kcalPct - 1) <= 0.1 ? "text-kp-mint-ink" : "text-kp-ink-2";

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-center justify-between gap-3">
        <h1 className="kp-h1">Štatistiky</h1>
        <div role="radiogroup" aria-label="Obdobie" className="grid grid-cols-2 gap-2">
          {([7, 30] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => {
                setRange(r);
                setPicked(null);
              }}
              className={`option-3d min-h-[44px]! justify-center px-3! py-1.5! text-center text-[15px]! whitespace-nowrap ${range === r ? "is-selected" : ""}`}
            >
              {r} dní
            </button>
          ))}
        </div>
      </header>

      <MascotBubble mood={insight.mood} size={76} key={`${range}-${insight.lines.join()}`}>
        <div className="space-y-1.5">
          {insight.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      </MascotBubble>

      {/* Súhrnné dlaždice */}
      <section className="grid grid-cols-2 gap-3">
        <Tile emoji="🔥" label="Priemer kcal/deň" bg="var(--kp-kcal-tint)">
          <span className="kp-num kp-h1 text-kp-ink">{logged.length ? fmt(avgT.kcal) : "–"}</span>
          <span className={`kp-caption font-extrabold ${kcalTone}`}>cieľ {fmt(t.kcal)} kcal</span>
        </Tile>
        <Tile emoji="🥩" label="Priemer bielkovín" bg="var(--kp-protein-tint)">
          <span className="kp-num kp-h1 text-kp-ink">
            {logged.length ? Math.round(avgT.proteinG) : "–"}
            <span className="kp-h3 text-kp-ink-2"> g</span>
          </span>
          <span className={`kp-caption font-extrabold ${avgT.proteinG >= t.proteinG ? "text-kp-mint-ink" : ""}`}>
            {avgT.proteinG >= t.proteinG ? "cieľ splnený ✓" : `cieľ ${t.proteinG} g`}
          </span>
        </Tile>
        <Tile emoji="📅" label="Dni so zápisom" bg="var(--kp-blue-tint)">
          <span className="kp-num kp-h1 text-kp-ink">
            {logged.length}
            <span className="kp-h3 text-kp-ink-2">/{range}</span>
          </span>
          <span className="kp-caption font-extrabold">{logged.length === range ? "plný počet 🎉" : "každý zápis sa ráta"}</span>
        </Tile>
        <Tile emoji="🚨" label="Aktuálna séria" bg="var(--kp-siren-tint)">
          <span className="kp-num kp-h1 text-kp-ink">
            {st.count} <span className={st.count > 0 ? "kp-siren inline-block" : "inline-block grayscale"}>🔥</span>
          </span>
          <span className="kp-caption font-extrabold">najlepšia: {best} {best === 1 ? "deň" : best >= 2 && best <= 4 ? "dni" : "dní"}</span>
        </Tile>
      </section>

      {/* Kalórie */}
      <section className="card-3d p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="kp-h3">Kalórie po dňoch</h2>
          <span className="kp-caption">ťukni na stĺpec</span>
        </div>
        <KcalChart days={days} target={t.kcal} selected={sel.day} onSelect={setPicked} />
        <Legend
          items={[
            ["var(--kp-kcal)", "kcal"],
            ["var(--kp-siren)", "nad +10 %"],
            ["var(--kp-bg-sunken)", "bez zápisu"],
          ]}
        />
        <DayDetail d={sel} kcalTarget={t.kcal} proteinTarget={t.proteinG} today={today} />
      </section>

      {/* Bielkoviny */}
      <section className="card-3d p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="kp-h3">🥩 Bielkoviny</h2>
          <span className="kp-caption font-extrabold">
            {proteinHitDays > 0 ? `cieľ splnený ${proteinHitDays}× 💪` : `cieľ ${t.proteinG} g/deň`}
          </span>
        </div>
        <ProteinChart days={days} target={t.proteinG} />
      </section>

      {/* Skóre kvality */}
      <section className="card-3d p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="kp-h3">Skóre kvality</h2>
            <p className="kp-caption">priemer za {range} dní</p>
          </div>
          {logged.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border-2 px-3 py-1.5" style={{ borderColor: toneColor(avgScore) }}>
              <span className="kp-num kp-h2" style={{ color: toneColor(avgScore) }}>
                {Math.round(avgScore)}
              </span>
              <span className="text-sm font-black leading-tight">
                {grade.emoji} {grade.label}
              </span>
            </div>
          )}
        </div>
        <ScoreChart days={days} />
      </section>

      {/* Detaily */}
      <section className="card-3d space-y-4 p-4">
        <div>
          <h2 className="kp-h3">Detaily</h2>
          <p className="kp-caption">denný priemer · počítajú sa len dni so zápisom ({logged.length})</p>
        </div>
        <MacroRow label="Sacharidy" emoji="🍞" value={avgT.carbsG} max={t.carbsG} unit="g" color="var(--kp-carbs)" />
        <MacroRow label="Tuky" emoji="🥑" value={avgT.fatG} max={t.fatG} unit="g" color="var(--kp-fat)" />
        <MacroRow label="Vláknina" emoji="🥦" value={avgT.fiberG} max={t.fiberG} unit="g" color="var(--kp-fiber)" />
        <MacroRow label="Pridaný cukor" emoji="🍬" value={avgT.addedSugarG} max={t.freeSugarMaxG} unit="g" color="var(--kp-sugar)" kind="limit" />
        <MacroRow label="Nasýtené tuky" emoji="🧈" value={avgT.satFatG} max={t.satFatMaxG} unit="g" color="var(--kp-fat)" kind="limit" />
        <MacroRow label="Sodík" emoji="🧂" value={avgT.sodiumMg} max={t.sodiumMaxMg} unit="mg" color="var(--kp-ink-2)" kind="limit" />
        <MacroRow label="Voda" emoji="💧" value={avgWater} max={t.waterMl} unit="ml" color="var(--kp-carbs)" />
      </section>
    </div>
  );
}

function Tile({ emoji, label, bg, children }: { emoji: string; label: string; bg: string; children: React.ReactNode }) {
  return (
    <div className="card-3d flex flex-col gap-1 p-3.5" style={{ background: bg }}>
      <span className="kp-overline text-kp-ink-2">
        {emoji} {label}
      </span>
      {children}
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map(([c, l]) => (
        <span key={l} className="kp-caption inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[4px] border border-kp-line-strong" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

function DayDetail({ d, kcalTarget, proteinTarget, today }: { d: StatDay; kcalTarget: number; proteinTarget: number; today: string }) {
  const g = scoreGrade(d.score);
  return (
    <div key={d.day} className="mt-4 rounded-[16px] border-2 border-kp-line bg-kp-bg p-3.5 kp-pop-in">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-black">{d.day === today ? "Dnes" : longDate(d.day)}</span>
        <span className="kp-caption">
          {d.meals} {d.meals === 1 ? "jedlo" : d.meals >= 2 && d.meals <= 4 ? "jedlá" : "jedál"}
        </span>
      </div>
      {d.meals === 0 ? (
        <p className="kp-caption">Tento deň bez zápisu 💤 Nevadí — ráta sa pravidelnosť, nie dokonalosť.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat value={fmt(d.totals.kcal)} unit="kcal" color="var(--kp-kcal)" sub={`/ ${fmt(kcalTarget)}`} />
          <Stat
            value={String(Math.round(d.totals.proteinG))}
            unit="g bielk."
            color={d.totals.proteinG >= proteinTarget ? "var(--kp-mint)" : "var(--kp-protein)"}
            sub={d.totals.proteinG >= proteinTarget ? "✓" : `/ ${proteinTarget}`}
          />
          <Stat value={String(Math.round(d.totals.carbsG))} unit="g sach." color="var(--kp-carbs)" />
          <Stat value={String(Math.round(d.totals.fatG))} unit="g tuky" color="var(--kp-fat)" />
          <div className="col-span-4 mt-1 flex items-center justify-center gap-2 rounded-xl bg-kp-surface py-1.5 text-sm font-black">
            <span style={{ color: toneColor(d.score) }}>skóre {d.score}</span>
            <span>
              {g.emoji} {g.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, unit, color, sub }: { value: string; unit: string; color: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="kp-num text-lg font-black leading-tight" style={{ color }}>
        {value}
      </span>
      <span className="text-[11px] font-extrabold leading-tight text-kp-ink-2">{unit}</span>
      {sub && <span className="text-[11px] font-bold leading-tight text-kp-muted">{sub}</span>}
    </div>
  );
}
