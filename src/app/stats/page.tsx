"use client";

import { useMemo, useState } from "react";
import { Mascot, MascotBubble } from "@/components/Mascot";
import { useCapture } from "@/components/CaptureProvider";
import { dayKey, lastDays, parseDayKey } from "@/lib/dates";
import { dayTotals } from "@/lib/meals";
import { computeTargets } from "@/lib/nutrition";
import { useAppState } from "@/lib/store";
import { KcalChart } from "./Charts";
import { buildInsight, type StatDay } from "./insight";

const WEEKDAY_LONG = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
const fmt = (v: number) => Math.round(v).toLocaleString("sk-SK");

function longDate(key: string) {
  const d = parseDayKey(key);
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

export default function StatsPage() {
  const { profile, meals } = useAppState();
  const { openCamera } = useCapture();
  const [picked, setPicked] = useState<string | null>(null);

  const today = dayKey();
  const targets = useMemo(() => (profile ? computeTargets(profile) : null), [profile]);

  const days: StatDay[] = useMemo(() => {
    const done = meals.filter((m) => m.status === "done");
    return lastDays(7, today).map((day) => {
      const t = dayTotals(done, day);
      return { day, meals: done.filter((m) => m.dayKey === day).length, kcal: t.kcal, proteinG: t.proteinG };
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
          <p className="kp-h2">Žiadne dôkazy. Odfoť, čo žerieš.</p>
          <button type="button" className="btn-3d btn-3d--block" onClick={openCamera}>
            📸 Odfotiť jedlo
          </button>
        </div>
      </div>
    );
  }

  const avgKcal = logged.reduce((a, d) => a + d.kcal, 0) / logged.length;
  const avgProtein = logged.reduce((a, d) => a + d.proteinG, 0) / logged.length;
  const insight = buildInsight(logged.length, avgKcal, avgProtein, targets);
  const sel = days.find((d) => d.day === picked) ?? logged[logged.length - 1];

  const kcalOver = avgKcal > targets.kcal * 1.1;
  const proteinOk = avgProtein >= targets.proteinG;

  return (
    <div className="space-y-5 pt-2">
      <h1 className="kp-h1">Štatistiky</h1>

      <MascotBubble mood={insight.mood} size={76} key={insight.line}>
        <p>{insight.line}</p>
      </MascotBubble>

      <section className="grid grid-cols-3 gap-2">
        <Tile label="Priemer kcal" value={fmt(avgKcal)} sub={`cieľ ${fmt(targets.kcal)}`} bad={kcalOver} />
        <Tile label="Priemer bielkovín" value={`${Math.round(avgProtein)} g`} sub={`cieľ ${targets.proteinG} g`} good={proteinOk} />
        <Tile label="Dni so zápisom" value={`${logged.length}/7`} sub="tento týždeň" bad={logged.length < 4} />
      </section>

      <section className="card-3d p-4">
        <KcalChart days={days} target={targets.kcal} selected={sel.day} onSelect={setPicked} />
        <p className="mt-3 text-center text-sm font-black">
          {sel.day === today ? "Dnes" : longDate(sel.day)}:{" "}
          <span className="kp-num">{sel.meals ? `${fmt(sel.kcal)} kcal` : "nič nezapísané"}</span>
        </p>
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
