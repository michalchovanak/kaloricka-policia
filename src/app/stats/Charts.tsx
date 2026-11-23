"use client";
// 7-dňový stĺpcový graf kcal s čiarou cieľa — bez knižníc.
import { weekdayShort } from "@/lib/dates";
import type { StatDay } from "./insight";

export function KcalChart({
  days,
  target,
  selected,
  onSelect,
}: {
  days: StatDay[];
  target: number;
  selected: string;
  onSelect: (day: string) => void;
}) {
  const maxVal = Math.max(target * 1.3, ...days.map((d) => d.kcal));
  return (
    <div>
      <div className="relative h-44">
        <div className="pointer-events-none absolute inset-x-0 z-10" style={{ bottom: `${(target / maxVal) * 100}%` }}>
          <div className="border-t-2 border-dashed border-kp-ink-2/50" />
          <span className="absolute -top-5 right-0 rounded-md bg-kp-surface/90 px-1 text-[11px] font-black uppercase tracking-wide text-kp-ink-2">
            cieľ {target}
          </span>
        </div>
        <div className="absolute inset-0 flex items-end gap-2">
          {days.map((d) => {
            const empty = d.meals === 0;
            const over = d.kcal > target * 1.1;
            const sel = d.day === selected;
            const fill = empty ? "var(--kp-bg-sunken)" : over ? "var(--kp-siren)" : "var(--kp-kcal)";
            const lip = empty ? "var(--kp-line-strong)" : over ? "var(--kp-siren-lip)" : "var(--kp-kcal-lip)";
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => onSelect(d.day)}
                aria-pressed={sel}
                aria-label={`${d.day}: ${empty ? "bez zápisu" : `${Math.round(d.kcal)} kcal`}`}
                className="flex h-full flex-1 cursor-pointer flex-col justify-end"
              >
                <span
                  className="block w-full rounded-t-[10px] rounded-b-[4px] transition-[height,outline-color] duration-500"
                  style={{
                    height: empty ? 10 : `${Math.max(4, (d.kcal / maxVal) * 100)}%`,
                    background: fill,
                    boxShadow: `inset 0 -4px 0 ${lip}`,
                    outline: sel ? "3px solid var(--kp-blue)" : "3px solid transparent",
                    outlineOffset: 2,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-2">
        {days.map((d) => (
          <span key={d.day} className={`flex-1 text-center text-[11px] font-black ${d.day === selected ? "text-kp-blue" : "text-kp-muted"}`}>
            {weekdayShort(d.day)}
          </span>
        ))}
      </div>
    </div>
  );
}
