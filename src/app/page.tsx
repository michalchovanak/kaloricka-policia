"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "@/components/Bar";
import { useCapture } from "@/components/CaptureProvider";
import { MascotBubble } from "@/components/Mascot";
import { Ring } from "@/components/Ring";
import { JailOverlay, WantedStars } from "@/components/Wanted";
import { dayKey, timeLabel } from "@/lib/dates";
import { dayTotals, mealTotals } from "@/lib/meals";
import { computeTargets } from "@/lib/nutrition";
import { useAppState } from "@/lib/store";
import type { Meal } from "@/lib/types";
import { computeWanted, wantedLine } from "@/lib/wanted";

/** Prepočet každú minútu, aby zatknutie o 19:00 a prepustenie o 7:00 prebehli samé. */
function useMinuteTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  return tick;
}

export default function TodayPage() {
  const { profile, meals, onboardedAt } = useAppState();
  const { openCamera, showMeal } = useCapture();
  const tick = useMinuteTick();
  const today = dayKey();

  const data = useMemo(() => {
    if (!profile) return null;
    void tick;
    const t = computeTargets(profile);
    const todays = meals.filter((m) => m.dayKey === today).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { t, todays, tot: dayTotals(meals, today), wanted: computeWanted(meals, profile, onboardedAt) };
  }, [profile, meals, onboardedAt, today, tick]);

  if (!profile || !data) return null;
  const { t, todays, tot, wanted } = data;
  const left = Math.round(t.kcal - tot.kcal);
  const line = todays.some((m) => m.status === "analyzing")
    ? { mood: "watching" as const, text: "Ukáž, čo si to tam natlačil… vyšetrujem." }
    : wantedLine(wanted, todays.filter((m) => m.status === "done").length);

  return (
    <div className="space-y-4 pb-6">
      <JailOverlay wanted={wanted} />

      <header className="flex items-center justify-between pt-1">
        <WantedStars stars={wanted.stars} />
        <Link href="/profile" aria-label="Profil" className="grid h-10 w-10 place-items-center rounded-full border-2 border-kp-line bg-kp-surface text-lg" style={{ boxShadow: "0 3px 0 var(--kp-line)" }}>
          👤
        </Link>
      </header>

      <MascotBubble mood={line.mood} size={92}>
        <div className="font-extrabold">{line.text}</div>
        {wanted.offenses.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-sm font-bold text-kp-siren-ink">
            {wanted.offenses.map((o) => (
              <li key={o.text}>🚨 {o.text}</li>
            ))}
          </ul>
        )}
      </MascotBubble>

      <section className="card-3d p-4">
        <div className="flex justify-center">
          <Ring value={tot.kcal} max={t.kcal} size={190} stroke={18}>
            <div>
              <div className="kp-num text-[44px] font-black leading-none" style={{ color: left < 0 ? "var(--kp-siren)" : "var(--kp-ink)" }}>
                {Math.abs(left)}
              </div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-kp-muted">{left < 0 ? "kcal navyše" : "kcal zostáva"}</div>
            </div>
          </Ring>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Stat label="Bielkoviny" value={tot.proteinG} max={t.proteinG} color="var(--kp-protein)" />
          <Stat label="Cukor" value={tot.addedSugarG} max={t.freeSugarMaxG} color="var(--kp-sugar)" limit />
        </div>
      </section>

      <section>
        {todays.length === 0 ? (
          <button className="btn-3d btn-3d--lg btn-3d--block" onClick={openCamera}>📸 Odfotiť jedlo</button>
        ) : (
          <ul className="space-y-2">
            {todays.map((m) => (
              <MealCard key={m.id} meal={m} onClick={() => showMeal(m.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, max, color, limit }: { label: string; value: number; max: number; color: string; limit?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-extrabold">{label}</span>
        <span className="kp-num text-sm font-black text-kp-ink-2">
          {Math.round(value)}<span className="text-kp-muted">/{max} g</span>
        </span>
      </div>
      <div className="mt-1.5">
        <Bar value={value} max={max} color={color} kind={limit ? "limit" : "goal"} height={12} />
      </div>
    </div>
  );
}

function MealCard({ meal, onClick }: { meal: Meal; onClick: () => void }) {
  const tot = mealTotals(meal);
  return (
    <li>
      <button onClick={onClick} className="option-3d !gap-3 !p-2.5 kp-pop-in">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-kp-sunken">
          {meal.photo && <img src={meal.photo} alt="" className="h-full w-full object-cover" />}
          {meal.status === "analyzing" && <div className="kp-scan absolute inset-x-0 h-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-black">{meal.title}</div>
          <div className="kp-caption">
            {timeLabel(meal.createdAt)}
            {meal.status === "error" && <span className="font-extrabold text-kp-siren"> · ťukni a skús znova</span>}
          </div>
        </div>
        <div className="shrink-0 pr-1 text-right">
          {meal.status === "done" ? (
            <div className="kp-num text-lg font-black text-kp-kcal">{Math.round(tot.kcal)}<span className="ml-0.5 text-xs text-kp-muted">kcal</span></div>
          ) : meal.status === "analyzing" ? (
            <span className="inline-block animate-pulse text-xl">🔎</span>
          ) : (
            <span className="text-xl">⚠️</span>
          )}
        </div>
      </button>
    </li>
  );
}
