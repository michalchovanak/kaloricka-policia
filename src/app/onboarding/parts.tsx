"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { haptic } from "@/components/confetti";
import { clamp } from "@/lib/nutrition";

/* --------------------------------------------------------------------------
   Option card (emoji + label + desc). Pop-in sits on the wrapper so the
   animation's fill-mode never overrides the button's :active press.
   -------------------------------------------------------------------------- */
export function OptionCard({
  emoji,
  label,
  desc,
  selected,
  onSelect,
  index = 0,
  tall = false,
}: {
  emoji: string;
  label: string;
  desc?: string;
  selected: boolean;
  onSelect: () => void;
  index?: number;
  tall?: boolean;
}) {
  return (
    <div className="kp-pop-in kp-stagger" style={{ "--i": index + 1 } as CSSProperties}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => {
          haptic(8);
          onSelect();
        }}
        className={`option-3d ${selected ? "is-selected" : ""} ${tall ? "flex-col justify-center" : ""}`}
        style={tall ? { textAlign: "center", minHeight: 148, gap: 6, padding: "18px 12px" } : { minHeight: 72 }}
      >
        <span
          aria-hidden
          className={`grid shrink-0 place-items-center rounded-2xl transition-transform ${selected ? "bg-kp-surface" : "bg-kp-sunken"}`}
          style={{
            width: tall ? 72 : 48,
            height: tall ? 72 : 48,
            fontSize: tall ? 42 : 28,
            lineHeight: 1,
            transform: selected ? "scale(1.08) rotate(-4deg)" : "none",
            transitionTimingFunction: "var(--kp-ease-pop)",
            transitionDuration: "var(--kp-dur-base)",
          }}
        >
          {emoji}
        </span>
        <span className={`min-w-0 ${tall ? "" : "flex-1"}`}>
          <span className="block font-black">{label}</span>
          {desc ? (
            <span className={`block text-[0.875rem] leading-snug font-bold ${selected ? "text-kp-blue-ink/80" : "text-kp-ink-2"}`}>
              {desc}
            </span>
          ) : null}
        </span>
        {!tall ? (
          <span
            aria-hidden
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-black transition-all ${
              selected ? "border-kp-blue bg-kp-blue text-white" : "border-kp-line bg-kp-surface text-transparent"
            }`}
            style={{ transform: selected ? "scale(1)" : "scale(0.85)", transitionTimingFunction: "var(--kp-ease-pop)" }}
          >
            ✓
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Big friendly number stepper with press-and-hold repeat.
   -------------------------------------------------------------------------- */
const parse = (t: string) => (t === "" ? NaN : Number(t));

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  unit,
  onEnter,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
  onEnter?: () => void;
}) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : "");
  const [prev, setPrev] = useState(value);
  if (!Object.is(prev, value)) {
    setPrev(value);
    if (!Object.is(parse(text), value)) setText(Number.isFinite(value) ? String(value) : "");
  }

  const [bump, setBump] = useState(0);
  const valueRef = useRef(value);
  const lastValid = useRef(Number.isFinite(value) ? clamp(value, min, max) : min);
  useEffect(() => {
    valueRef.current = value;
    if (Number.isFinite(value) && value >= min && value <= max) lastValid.current = value;
  }, [value, min, max]);

  const timers = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
  const stop = () => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
  };
  useEffect(() => stop, []);

  const step = (d: number) => {
    const base = Number.isFinite(valueRef.current) ? valueRef.current : lastValid.current;
    const next = clamp(Math.round(base) + d, min, max);
    if (next === min || next === max) stop();
    if (next === valueRef.current) return;
    valueRef.current = next;
    onChange(next);
    setBump((b) => b + 1);
    haptic(5);
  };

  const holdProps = (d: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      step(d);
      stop();
      let n = 0;
      timers.current.t = setTimeout(() => {
        timers.current.i = setInterval(() => {
          n++;
          step(n > 12 ? d * 5 : d);
        }, 90);
      }, 380);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    // Keyboard activation (Enter/Space) produces a click with detail 0.
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) step(d);
    },
  });

  const out = !Number.isFinite(value) || value < min || value > max;

  return (
    <div className="kp-pop-in kp-stagger" style={{ "--i": 1 } as CSSProperties}>
      <div className="card-3d flex items-center justify-between gap-2 px-3 py-5">
        <button
          type="button"
          aria-label={`Menej (−1 ${unit})`}
          className="btn-3d btn-3d--secondary"
          style={{ width: 64, height: 64, minHeight: 64, padding: 0, fontSize: 34, borderRadius: 20 }}
          disabled={Number.isFinite(value) && value <= min}
          {...holdProps(-1)}
        >
          −
        </button>

        <label className="flex min-w-0 flex-1 flex-col items-center">
          <span className="sr-only">Hodnota v {unit}</span>
          <span key={bump} className="flex items-baseline justify-center gap-1.5" style={{ animation: bump ? "kpob-tick 220ms var(--kp-ease-pop)" : undefined }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              autoComplete="off"
              value={text}
              aria-invalid={out}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const t = e.target.value.replace(/\D/g, "").slice(0, 3);
                setText(t);
                onChange(parse(t));
              }}
              onBlur={() => {
                const v = parse(text);
                const fixed = Number.isFinite(v) ? clamp(v, min, max) : lastValid.current;
                setText(String(fixed));
                onChange(fixed);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  step(1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  step(-1);
                } else if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                  onEnter?.();
                }
              }}
              className={`kp-display kp-num w-[3.6ch] bg-transparent text-center outline-none ${out ? "text-kp-siren" : "text-kp-ink"}`}
              style={{ fontSize: 56, lineHeight: 1, caretColor: "var(--kp-blue)" }}
            />
            <span className="kp-h3 text-kp-muted">{unit}</span>
          </span>
          <span className="mt-2 h-1.5 w-16 rounded-full bg-kp-sunken" aria-hidden />
        </label>

        <button
          type="button"
          aria-label={`Viac (+1 ${unit})`}
          className="btn-3d"
          style={{ width: 64, height: 64, minHeight: 64, padding: 0, fontSize: 34, borderRadius: 20 }}
          disabled={Number.isFinite(value) && value >= max}
          {...holdProps(1)}
        >
          +
        </button>
      </div>
      <p className={`kp-caption mt-1 text-center ${out ? "text-kp-siren-ink!" : ""}`}>
        {out ? `Zadaj číslo od ${min} do ${max} ${unit}` : `Podrž + alebo − pre rýchlejšie · ${min}–${max} ${unit}`}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Big text input in the same chunky language.
   -------------------------------------------------------------------------- */
export function BigTextInput({
  value,
  onChange,
  placeholder,
  onEnter,
  autoCapitalize,
  autoComplete,
  maxLength = 32,
  icon,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnter?: () => void;
  autoCapitalize?: string;
  autoComplete?: string;
  maxLength?: number;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="kp-pop-in kp-stagger" style={{ "--i": 1 } as CSSProperties}>
      <label className="card-3d flex items-center gap-3 px-4 transition-colors focus-within:border-kp-blue" style={{ minHeight: 72 }}>
        {icon ? (
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-kp-sunken text-2xl">
            {icon}
          </span>
        ) : null}
        <span className="sr-only">{placeholder}</span>
        <input
          type="text"
          value={value}
          autoFocus
          maxLength={maxLength}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter?.();
          }}
          className={`min-w-0 flex-1 bg-transparent py-4 text-kp-ink outline-none placeholder:text-kp-muted ${mono ? "uppercase tracking-[0.12em]" : ""}`}
          style={{ fontSize: 22, fontWeight: 800 }}
        />
        {value ? (
          <button
            type="button"
            aria-label="Vymazať"
            onClick={() => onChange("")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kp-sunken text-sm font-black text-kp-ink-2 active:scale-90"
          >
            ✕
          </button>
        ) : null}
      </label>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Count-up for the plan reveal.
   -------------------------------------------------------------------------- */
export function useCountUp(target: number, duration = 1300, delay = 250) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setV(target));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const to = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(to);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return v;
}

/* --------------------------------------------------------------------------
   Plan stat tile.
   -------------------------------------------------------------------------- */
export function StatTile({
  emoji,
  label,
  value,
  unit,
  color,
  tint,
  index,
  hint,
}: {
  emoji: string;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  tint: string;
  index: number;
  hint?: string;
}) {
  return (
    <div className="kp-pop-in kp-stagger" style={{ "--i": index } as CSSProperties}>
      <div className="card-3d relative h-full overflow-hidden px-3.5 pt-3.5 pb-3">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <div className="flex items-center gap-2">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl text-xl" style={{ background: tint }}>
            {emoji}
          </span>
          <span className="kp-overline text-kp-ink-2">{label}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="kp-h1 kp-num" style={{ color: "var(--kp-ink)" }}>
            {value}
          </span>
          <span className="font-extrabold text-kp-muted">{unit}</span>
        </div>
        {hint ? <div className="kp-caption mt-0.5">{hint}</div> : null}
      </div>
    </div>
  );
}

/** Keyframes local to onboarding (tokens.css is shared; we don't edit it). */
export function OnboardingKeyframes() {
  return (
    <style>{`
@keyframes kpob-in-fwd { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
@keyframes kpob-in-back { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
@keyframes kpob-tick { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
@keyframes kpob-hero { 0% { transform: scale(0.4) rotate(-12deg); opacity: 0; } 60% { transform: scale(1.1) rotate(4deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
@keyframes kpob-badge { 0%, 100% { transform: rotate(-3deg) scale(1); } 50% { transform: rotate(3deg) scale(1.04); } }
.kpob-screen-fwd { animation: kpob-in-fwd 340ms var(--kp-ease-out) both; }
.kpob-screen-back { animation: kpob-in-back 340ms var(--kp-ease-out) both; }
.kpob-hero { animation: kpob-hero 700ms var(--kp-ease-pop) both; }
.kpob-badge { animation: kpob-badge 2.8s var(--kp-ease-in-out) infinite; }
`}</style>
  );
}
