"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/lib/store";
import { RANKS, XP, badges, bestStreak, rankFor, streak, totalXp } from "@/lib/game";
import { dayKey, lastDays, weekdayShort } from "@/lib/dates";
import { Mascot } from "@/components/Mascot";

// Farby pre získané odznaky (base / lip / tint), rotujú sa podľa poradia.
const BADGE_TONES = [
  { bg: "var(--kp-gold)", lip: "var(--kp-gold-lip)", tint: "var(--kp-gold-tint)" },
  { bg: "var(--kp-blue)", lip: "var(--kp-blue-lip)", tint: "var(--kp-blue-tint)" },
  { bg: "var(--kp-mint)", lip: "var(--kp-mint-lip)", tint: "var(--kp-mint-tint)" },
  { bg: "var(--kp-siren)", lip: "var(--kp-siren-lip)", tint: "var(--kp-siren-tint)" },
  { bg: "var(--kp-sugar)", lip: "var(--kp-sugar-lip)", tint: "var(--kp-sugar-tint)" },
  { bg: "var(--kp-carbs)", lip: "var(--kp-carbs-lip)", tint: "var(--kp-carbs-tint)" },
  { bg: "var(--kp-kcal)", lip: "var(--kp-kcal-lip)", tint: "var(--kp-kcal-tint)" },
];

const XP_RULES: { key: keyof typeof XP; label: string; emoji: string }[] = [
  { key: "meal", label: "Každé zapísané jedlo", emoji: "📸" },
  { key: "firstMealOfDay", label: "Prvé jedlo dňa (bonus)", emoji: "🌞" },
  { key: "proteinGoal", label: "Splnený cieľ bielkovín", emoji: "🥩" },
  { key: "fiberGoal", label: "Splnený cieľ vlákniny", emoji: "🥦" },
  { key: "kcalOnTarget", label: "Deň v kalorickom cieli ±10 % (ráta sa po dni)", emoji: "🎯" },
  { key: "waterGoal", label: "Vypitý denný cieľ vody", emoji: "💧" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="kp-h3 mb-3 mt-7 px-1">{children}</h2>;
}

export default function BadgesPage() {
  const { profile, meals, water } = useAppState();
  const [openBadge, setOpenBadge] = useState<string | null>(null);
  const [showLadder, setShowLadder] = useState(false);

  const data = useMemo(() => {
    if (!profile) return null;
    const xp = totalXp(meals, profile, water);
    const rank = rankFor(xp);
    const st = streak(meals);
    const best = Math.max(bestStreak(meals.filter((m) => m.status !== "error")), st.count);
    const loggedDays = new Set(meals.filter((m) => m.status !== "error").map((m) => m.dayKey));
    const week = lastDays(7).map((d) => ({ day: d, label: weekdayShort(d), hit: loggedDays.has(d) }));
    const list = badges(meals, profile, water);
    return { xp, rank, st, best, week, list };
  }, [profile, meals, water]);

  if (!profile || !data) return null;

  const { xp, rank, st, best, week, list } = data;
  const today = dayKey();
  const earnedCount = list.filter((b) => b.earned).length;
  const toNext = rank.next ? rank.next.xp - xp : 0;
  const flameLit = st.count > 0;

  return (
    <div className="pb-6">
      <header className="mb-4 flex items-center justify-between px-1 pt-2">
        <h1 className="kp-h1">Odznaky</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-kp-gold bg-kp-gold-tint px-3 py-1 text-sm font-black text-kp-gold-ink kp-num">
          ⚡ {xp} XP
        </span>
      </header>

      {/* ---------- Hodnosť ---------- */}
      <section className="card-3d overflow-hidden">
        <div
          className="relative px-5 pb-5 pt-5"
          style={{ background: "linear-gradient(160deg, var(--kp-blue) 0%, #2E49D6 100%)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="kp-pop-in grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full border-4 border-white/70 bg-kp-gold text-[44px]"
              style={{ boxShadow: "0 5px 0 0 var(--kp-gold-lip)" }}
              aria-hidden
            >
              {rank.emoji}
            </div>
            <div className="min-w-0 text-white">
              <div className="kp-overline opacity-80">Level {rank.level} · hodnosť</div>
              <div className="kp-h2 truncate">{rank.name}</div>
              <div className="mt-0.5 text-sm font-extrabold opacity-90 kp-num">{xp} XP celkovo</div>
            </div>
          </div>

          <div className="mt-5">
            <div
              className="progress-3d"
              style={{ height: 22, ["--_fill" as string]: "var(--kp-gold)", background: "rgba(255,255,255,.22)" }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(rank.progress * 100)}
            >
              <span style={{ ["--value" as string]: `${Math.max(0, Math.min(100, rank.progress * 100))}%`, minWidth: 22 }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-extrabold text-white">
              {rank.next ? (
                <>
                  <span>
                    ešte <span className="kp-num">{toNext}</span> XP do {rank.next.name}
                  </span>
                  <span className="text-lg" aria-hidden>
                    {rank.next.emoji}
                  </span>
                </>
              ) : (
                <span>Najvyššia hodnosť! Si legenda. 🦸</span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLadder((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left font-black text-kp-blue"
          aria-expanded={showLadder}
        >
          <span>Rebríček hodností</span>
          <span className={`transition-transform duration-200 ${showLadder ? "rotate-180" : ""}`} aria-hidden>
            ▾
          </span>
        </button>

        {showLadder && (
          <ol className="space-y-2 px-4 pb-4">
            {RANKS.map((r, i) => {
              const reached = xp >= r.xp;
              const current = i + 1 === rank.level;
              return (
                <li
                  key={r.name}
                  className={`kp-pop-in kp-stagger flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${
                    current
                      ? "border-kp-blue bg-kp-blue-tint"
                      : reached
                        ? "border-kp-line bg-kp-surface"
                        : "border-kp-line bg-kp-sunken"
                  }`}
                  style={{ ["--i" as string]: i }}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl ${
                      reached ? "bg-kp-gold-tint" : "bg-kp-line"
                    }`}
                    style={reached ? undefined : { filter: "grayscale(1)", opacity: 0.5 }}
                    aria-hidden
                  >
                    {r.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-black ${reached ? "text-kp-ink" : "text-kp-muted"}`}>
                      {i + 1}. {r.name}
                    </div>
                    <div className="kp-caption kp-num">{r.xp} XP</div>
                  </div>
                  {current ? (
                    <span className="rounded-full bg-kp-blue px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">Ty</span>
                  ) : reached ? (
                    <span className="text-kp-mint" aria-label="Dosiahnuté">✓</span>
                  ) : (
                    <span aria-label="Zamknuté">🔒</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---------- Séria ---------- */}
      <section className="card-3d mt-4 p-5">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full text-[44px] ${
              flameLit ? "bg-kp-siren-tint kp-siren" : "bg-kp-sunken"
            }`}
            style={flameLit ? undefined : { filter: "grayscale(1)", opacity: 0.55 }}
            aria-hidden
          >
            🔥
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`kp-display kp-num ${flameLit ? "text-kp-siren" : "text-kp-muted"}`}>{st.count}</span>
              <span className="kp-h3">{st.count === 1 ? "deň" : st.count >= 2 && st.count <= 4 ? "dni" : "dní"} v sérii</span>
            </div>
            <div className="kp-caption">
              {st.count === 0
                ? "Odfoť jedlo a zapáľ sériu!"
                : st.aliveToday
                  ? "Dnes máš splnené. Pokračuj zajtra!"
                  : "Dnes ešte nič — zapíš jedlo, nech séria nezhasne!"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const isToday = d.day === today;
            return (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <span className={`text-[11px] font-black uppercase ${isToday ? "text-kp-siren" : "text-kp-muted"}`}>{d.label}</span>
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full border-2 text-lg ${
                    d.hit ? "border-transparent bg-kp-siren text-white" : isToday ? "border-dashed border-kp-siren bg-kp-surface" : "border-kp-line bg-kp-sunken"
                  }`}
                  style={d.hit ? { boxShadow: "0 3px 0 0 var(--kp-siren-lip)" } : undefined}
                  aria-label={`${d.label}: ${d.hit ? "zapísané" : "bez zápisu"}`}
                >
                  {d.hit ? "🔥" : ""}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-kp-gold-tint px-4 py-3">
          <span className="font-extrabold text-kp-gold-ink">🏆 Najdlhšia séria</span>
          <span className="font-black text-kp-gold-ink kp-num">
            {best} {best === 1 ? "deň" : best >= 2 && best <= 4 ? "dni" : "dní"}
          </span>
        </div>
      </section>

      {/* ---------- Odznaky ---------- */}
      <div className="mb-3 mt-7 flex items-baseline justify-between px-1">
        <h2 className="kp-h3">Moje odznaky</h2>
        <span className="text-sm font-black text-kp-ink-2 kp-num">
          {earnedCount}/{list.length} získaných
        </span>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-kp-sunken">
        <div
          className="h-full rounded-full bg-kp-gold transition-[width] duration-700"
          style={{ width: `${list.length ? (earnedCount / list.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-4">
        {list.map((b, i) => {
          const tone = BADGE_TONES[i % BADGE_TONES.length];
          const open = openBadge === b.id;
          return (
            <div key={b.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenBadge(open ? null : b.id)}
                aria-expanded={open}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl px-1 py-2 transition-transform active:scale-95 ${
                  b.earned ? "kp-pop-in kp-stagger" : ""
                } ${open ? "bg-kp-surface" : ""}`}
                style={b.earned ? { ["--i" as string]: i } : undefined}
              >
                <span
                  className="relative grid h-[76px] w-[76px] place-items-center rounded-full border-4 text-[36px]"
                  style={
                    b.earned
                      ? { background: tone.bg, borderColor: tone.tint, boxShadow: `0 5px 0 0 ${tone.lip}` }
                      : { background: "var(--kp-disabled)", borderColor: "var(--kp-bg-sunken)", boxShadow: "0 5px 0 0 var(--kp-disabled-lip)" }
                  }
                >
                  <span style={b.earned ? undefined : { filter: "grayscale(1)", opacity: 0.4 }} aria-hidden>
                    {b.emoji}
                  </span>
                  {!b.earned && (
                    <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-kp-line bg-kp-surface text-[13px]" aria-hidden>
                      🔒
                    </span>
                  )}
                  {b.earned && (
                    <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-kp-mint text-[13px] font-black text-white" aria-hidden>
                      ✓
                    </span>
                  )}
                </span>
                <span className={`text-center text-[13px] font-black leading-tight ${b.earned ? "text-kp-ink" : "text-kp-muted"}`}>{b.name}</span>
                {!b.earned && !open && <span className="line-clamp-2 text-center text-[11px] font-bold leading-snug text-kp-muted">{b.desc}</span>}
              </button>

              {open && (
                <div
                  className={`absolute top-full z-10 mt-1 w-[180px] ${
                    i % 3 === 0 ? "left-0" : i % 3 === 2 ? "right-0" : "left-1/2 -translate-x-1/2"
                  }`}
                  role="dialog"
                  aria-label={b.name}
                >
                  <div
                    className="kp-pop-in rounded-2xl border-2 border-kp-line bg-kp-surface p-3 text-center"
                    style={{ boxShadow: "var(--kp-shadow-float)", transformOrigin: i % 3 === 0 ? "0 0" : i % 3 === 2 ? "100% 0" : "50% 0" }}
                  >
                  <div className="text-sm font-black text-kp-ink">{b.name}</div>
                  <div className="kp-caption mt-1">{b.desc}</div>
                  <div className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${b.earned ? "bg-kp-mint-tint text-kp-mint-ink" : "bg-kp-sunken text-kp-muted"}`}>
                    {b.earned ? "Získané" : "Zamknuté"}
                  </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Ako získať XP ---------- */}
      <SectionTitle>Ako získať XP</SectionTitle>
      <section className="card-3d p-2">
        <ul className="divide-y-2 divide-kp-line">
          {XP_RULES.map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-3 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kp-sunken text-xl" aria-hidden>
                {r.emoji}
              </span>
              <span className="flex-1 font-extrabold leading-snug">{r.label}</span>
              <span className="shrink-0 rounded-full bg-kp-gold px-2.5 py-1 text-sm font-black text-kp-ink kp-num" style={{ boxShadow: "0 2px 0 0 var(--kp-gold-lip)" }}>
                +{XP[r.key]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex items-center gap-3 px-1">
        <Mascot mood="celebrate" size={56} bob />
        <p className="kp-caption">XP sa počítajú z tvojich zápisov — keď upravíš jedlo, odmeny sa prepočítajú samy.</p>
      </div>

      {openBadge && <button type="button" aria-label="Zavrieť" className="fixed inset-0 z-[5] cursor-default" onClick={() => setOpenBadge(null)} />}
    </div>
  );
}
