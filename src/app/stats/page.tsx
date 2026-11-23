"use client";

import { useMemo, useState } from "react";
import { Mascot, MascotBubble } from "@/components/Mascot";
import { useCapture } from "@/components/CaptureProvider";
import { dayKey, lastDays, parseDayKey } from "@/lib/dates";
import { dayTotals } from "@/lib/meals";
import { computeTargets } from "@/lib/nutrition";
import { useAppState } from "@/lib/store";
import { g } from "@/lib/voice";
import { KcalChart } from "./Charts";
import { buildInsight, type Averages, type StatDay } from "./insight";

const WEEKDAY_LONG = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
const fmt = (v: number) => Math.round(v).toLocaleString("sk-SK");

function longDate(key: string) {
  const d = parseDayKey(key);
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

export default function StatsPage() {
  const { profile, meals } = useAppState();
  const { openCamera, openGallery } = useCapture();
  const [picked, setPicked] = useState<string | null>(null);

  const today = dayKey();
  const targets = useMemo(() => (profile ? computeTargets(profile) : null), [profile]);

  const days: StatDay[] = useMemo(() => {
    const done = meals.filter((m) => m.status === "done");
    return lastDays(7, today).map((day) => {
      const t = dayTotals(done, day);
      return {
        day,
        meals: done.filter((m) => m.dayKey === day).length,
        kcal: t.kcal,
        proteinG: t.proteinG,
        fatG: t.fatG,
        fiberG: t.fiberG,
        addedSugarG: t.addedSugarG,
      };
    });
  }, [meals, today]);

  if (!profile || !targets) return null;

  const logged = days.filter((d) => d.meals > 0);

  if (logged.length === 0) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="kp-h1">Štatistiky</h1>
        <div className="card-3d flex flex-col items-center gap-4 px-6 py-10 text-center kp-pop-in">
          <Mascot mood="grumpy" size={140} bob />
          <p className="kp-h2">{g(profile.sex, "Žiadne dôkazy. Odfoť, čo žerieš.", "Žiadne dôkazy. Odfoť, čo ješ, a spravím ti prehľad.")}</p>
          <button type="button" className="btn-3d btn-3d--block" onClick={openCamera}>
            📸 Odfotiť jedlo
          </button>
          <button type="button" className="btn-ghost -mt-2" onClick={openGallery}>
            🖼️ Nahrať z galérie
          </button>
        </div>
      </div>
    );
  }

  const avgOf = (k: keyof Averages) => logged.reduce((a, d) => a + d[k], 0) / logged.length;
  const avg: Averages = {
    kcal: avgOf("kcal"),
    proteinG: avgOf("proteinG"),
    fatG: avgOf("fatG"),
    fiberG: avgOf("fiberG"),
    addedSugarG: avgOf("addedSugarG"),
  };
  const insight = buildInsight(logged.length, avg, targets, profile.sex);
  const sel = days.find((d) => d.day === picked) ?? logged[logged.length - 1];

  return (
    <div className="space-y-5 pt-2">
      <h1 className="kp-h1">Štatistiky</h1>

      <MascotBubble mood={insight.mood} size={76} key={insight.line}>
        <p>{insight.line}</p>
      </MascotBubble>

      <section>
        <h2 className="kp-overline mb-2 px-1 text-kp-ink-2">Denný priemer</h2>
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Kalórie" value={fmt(avg.kcal)} sub={`cieľ ${fmt(targets.kcal)}`} bad={avg.kcal > targets.kcal * 1.1} />
          <Tile label="Bielkoviny" value={`${Math.round(avg.proteinG)} g`} sub={`cieľ ${targets.proteinG} g`} good={avg.proteinG >= targets.proteinG} />
          <Tile label="Tuky" value={`${Math.round(avg.fatG)} g`} sub={`cieľ ~${targets.fatG} g`} good={Math.abs(avg.fatG / targets.fatG - 1) <= 0.15} bad={avg.fatG > targets.fatG * 1.25} />
          <Tile label="Vláknina" value={`${Math.round(avg.fiberG)} g`} sub={`min ${targets.fiberG} g`} good={avg.fiberG >= targets.fiberG} bad={avg.fiberG < targets.fiberG * 0.6} />
          <Tile label="Cukor" value={`${Math.round(avg.addedSugarG)} g`} sub={`max ${targets.freeSugarMaxG} g`} good={avg.addedSugarG <= targets.freeSugarMaxG} bad={avg.addedSugarG > targets.freeSugarMaxG} />
          <Tile label="Dni so zápisom" value={`${logged.length}/7`} sub="tento týždeň" bad={logged.length < 4} />
        </div>
      </section>

      <section className="card-3d p-4">
        <KcalChart days={days} target={targets.kcal} selected={sel.day} onSelect={setPicked} />
        <p className="mt-3 text-center text-sm font-black">
          {sel.day === today ? "Dnes" : longDate(sel.day)}:{" "}
          <span className="kp-num">{sel.meals ? `${fmt(sel.kcal)} kcal` : "nič nezapísané"}</span>
        </p>
        {sel.meals > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
            <Macro label="bielk." value={sel.proteinG} color="var(--kp-protein)" tint="var(--kp-protein-tint)" />
            <Macro label="tuky" value={sel.fatG} color="var(--kp-fat-lip)" tint="var(--kp-fat-tint)" />
            <Macro label="vláknina" value={sel.fiberG} color="var(--kp-fiber-lip)" tint="var(--kp-fiber-tint)" />
            <Macro label="cukor" value={sel.addedSugarG} color="var(--kp-sugar)" tint="var(--kp-sugar-tint)" />
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, sub, good, bad }: { label: string; value: string; sub: string; good?: boolean; bad?: boolean }) {
  const tone = bad ? "text-kp-siren-ink" : good ? "text-kp-mint-ink" : "text-kp-ink-2";
  return (
    <div className="card-3d flex min-w-0 flex-col gap-0.5 p-3">
      <span className="text-[11px] font-black uppercase leading-tight tracking-wide text-kp-ink-2">{label}</span>
      <span className="kp-num kp-h2 truncate text-kp-ink">{value}</span>
      <span className={`text-[12px] font-extrabold leading-tight ${tone}`}>{sub}</span>
    </div>
  );
}

function Macro({ label, value, color, tint }: { label: string; value: number; color: string; tint: string }) {
  return (
    <div className="rounded-xl px-1 py-1.5" style={{ background: tint }}>
      <div className="kp-num text-base font-black" style={{ color }}>
        {Math.round(value)}
        <span className="text-[11px]">g</span>
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-kp-ink-2">{label}</div>
    </div>
  );
}
