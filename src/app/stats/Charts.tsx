"use client";
// Jednoduché grafy z divov/SVG — bez knižníc.
import { parseDayKey, weekdayShort } from "@/lib/dates";
import { scoreGrade } from "@/lib/nutrition";
import type { StatDay } from "./insight";

/** Popisok osi X: pri 7 dňoch skratka dňa, pri 30 dátum každý 5. deň. */
export function axisLabel(day: string, i: number, n: number): string {
  if (n <= 7) return weekdayShort(day);
  return (n - 1 - i) % 5 === 0 ? `${parseDayKey(day).getDate()}.` : "";
}

export function toneColor(score: number): string {
  const tone = scoreGrade(score).tone;
  if (tone === "great") return "var(--kp-mint)";
  if (tone === "good") return "var(--kp-blue)";
  if (tone === "warn") return "var(--kp-gold)";
  return "var(--kp-kcal)";
}

function TargetLine({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ bottom: `${pct}%` }}>
      <div className="border-t-2 border-dashed border-kp-ink-2/50" />
      <span className="absolute -top-5 right-0 rounded-md bg-kp-surface/90 px-1 text-[11px] font-black uppercase tracking-wide text-kp-ink-2">
        {label}
      </span>
    </div>
  );
}

function Axis({ days, selected }: { days: StatDay[]; selected?: string | null }) {
  return (
    <div className="mt-1.5 flex gap-[3px]">
      {days.map((d, i) => {
        const sel = d.day === selected;
        return (
          <span
            key={d.day}
            className={`flex-1 text-center text-[11px] font-black ${sel ? "text-kp-blue" : "text-kp-muted"}`}
          >
            {axisLabel(d.day, i, days.length) || (sel ? "•" : " ")}
          </span>
        );
      })}
    </div>
  );
}

export function KcalChart({
  days,
  target,
  selected,
  onSelect,
}: {
  days: StatDay[];
  target: number;
  selected: string | null;
  onSelect: (day: string) => void;
}) {
  const maxVal = Math.max(target * 1.3, ...days.map((d) => d.totals.kcal));
  const thin = days.length > 7;
  return (
    <div>
      <div className="relative h-44">
        <TargetLine pct={(target / maxVal) * 100} label={`cieľ ${target}`} />
        <div className={`absolute inset-0 flex items-end ${thin ? "gap-[3px]" : "gap-2"}`}>
          {days.map((d) => {
            const k = d.totals.kcal;
            const empty = d.meals === 0;
            const over = k > target * 1.1;
            const sel = d.day === selected;
            const fill = empty ? "var(--kp-bg-sunken)" : over ? "var(--kp-siren)" : "var(--kp-kcal)";
            const lip = empty ? "var(--kp-line-strong)" : over ? "var(--kp-siren-lip)" : "var(--kp-kcal-lip)";
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => onSelect(d.day)}
                aria-pressed={sel}
                aria-label={`${d.day}: ${empty ? "bez zápisu" : `${Math.round(k)} kcal`}`}
                className="flex h-full flex-1 cursor-pointer flex-col justify-end"
              >
                <span
                  className={`block w-full transition-[height,outline-color] duration-500 ${thin ? "rounded-t-[4px]" : "rounded-t-[10px] rounded-b-[4px]"}`}
                  style={{
                    height: empty ? (thin ? 6 : 10) : `${Math.max(4, (k / maxVal) * 100)}%`,
                    background: fill,
                    boxShadow: `inset 0 -${thin ? 2 : 4}px 0 ${lip}`,
                    outline: sel ? `3px solid var(--kp-blue)` : "3px solid transparent",
                    outlineOffset: 2,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <Axis days={days} selected={selected} />
    </div>
  );
}

export function ProteinChart({ days, target }: { days: StatDay[]; target: number }) {
  const maxVal = Math.max(target * 1.3, ...days.map((d) => d.totals.proteinG));
  const thin = days.length > 7;
  return (
    <div>
      <div className="relative h-24">
        <TargetLine pct={(target / maxVal) * 100} label={`${target} g`} />
        <div className={`absolute inset-0 flex items-end ${thin ? "gap-[3px]" : "gap-2"}`}>
          {days.map((d) => {
            const p = d.totals.proteinG;
            const empty = d.meals === 0;
            const hit = p >= target;
            return (
              <span
                key={d.day}
                title={`${Math.round(p)} g`}
                className={`block flex-1 ${thin ? "rounded-t-[3px]" : "rounded-t-[8px] rounded-b-[3px]"}`}
                style={{
                  height: empty ? 6 : `${Math.max(5, (p / maxVal) * 100)}%`,
                  background: empty ? "var(--kp-bg-sunken)" : hit ? "var(--kp-mint)" : "var(--kp-protein)",
                  boxShadow: empty ? undefined : `inset 0 -3px 0 ${hit ? "var(--kp-mint-lip)" : "var(--kp-protein-lip)"}`,
                  transition: "height 500ms var(--kp-ease-out)",
                }}
              />
            );
          })}
        </div>
      </div>
      <Axis days={days} />
    </div>
  );
}

export function ScoreChart({ days }: { days: StatDay[] }) {
  const W = 320;
  const H = 150;
  const padL = 24;
  const padR = 8;
  const padT = 10;
  const padB = 22;
  const n = days.length;
  const x = (i: number) => padL + (n <= 1 ? (W - padL - padR) / 2 : (i / (n - 1)) * (W - padL - padR));
  const y = (s: number) => padT + (1 - s / 100) * (H - padT - padB);
  const pts = days.map((d, i) => ({ d, i })).filter(({ d }) => d.meals > 0);
  const path = pts.map(({ d, i }, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(d.score).toFixed(1)}`).join(" ");
  const r = n > 7 ? 4 : 7;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Trend skóre kvality">
      {[85, 70, 50].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="var(--kp-line)" strokeWidth={1.5} strokeDasharray="4 4" />
          <text x={padL - 5} y={y(g) + 3.5} textAnchor="end" fontSize={10} fontWeight={800} fill="var(--kp-muted)">
            {g}
          </text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--kp-line-strong)" strokeWidth={2} />
      {pts.length > 1 && (
        <path d={path} fill="none" stroke="var(--kp-blue)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
      )}
      {days.map((d, i) =>
        d.meals > 0 ? (
          <circle key={d.day} cx={x(i)} cy={y(d.score)} r={r} fill={toneColor(d.score)} stroke="#fff" strokeWidth={2.5}>
            <title>{`${d.day}: ${d.score}`}</title>
          </circle>
        ) : (
          <circle key={d.day} cx={x(i)} cy={y(0)} r={n > 7 ? 1.5 : 3} fill="var(--kp-line-strong)" />
        ),
      )}
      {days.map((d, i) => {
        const l = axisLabel(d.day, i, n);
        return l ? (
          <text key={d.day} x={x(i)} y={H - 5} textAnchor="middle" fontSize={11} fontWeight={900} fill="var(--kp-muted)">
            {l}
          </text>
        ) : null;
      })}
    </svg>
  );
}
