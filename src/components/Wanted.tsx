"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/lib/store";
import { g } from "@/lib/voice";
import { MAX_STARS, type Wanted } from "@/lib/wanted";
import { useCapture } from "./CaptureProvider";
import { Mascot } from "./Mascot";

/** GTA-style hviezdy hľadanosti. */
export function WantedStars({ stars, size = 22 }: { stars: number; size?: number }) {
  return (
    <div
      className={`flex gap-0.5 rounded-full px-2.5 py-1.5 ${stars >= 4 ? "kp-siren" : ""}`}
      style={{ background: "var(--kp-ink)", boxShadow: "0 3px 0 #0E1230" }}
      aria-label={`Hľadanosť ${stars} z ${MAX_STARS}`}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const on = i < stars;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={on ? "kp-pop-in" : ""} style={{ animationDelay: `${i * 60}ms` }}>
            <path
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
              fill={on ? "#FFFFFF" : "rgba(255,255,255,.08)"}
              stroke={on ? "#FFFFFF" : "rgba(255,255,255,.35)"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

function useCountdown(until: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return "";
  const ms = Math.max(0, until.getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Basa: mreže cez celú obrazovku, odpočet do 7:00. */
export function JailOverlay({ wanted }: { wanted: Wanted }) {
  const left = useCountdown(wanted.jailUntil);
  const { openCamera } = useCapture();
  const [hidden, setHidden] = useState(false);
  const { profile } = useAppState();
  const sex = profile?.sex;
  if (!wanted.jailed || hidden) return null;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center text-white" style={{ zIndex: "var(--kp-z-overlay)", background: "#1E2446" }}>
      <div className="kp-jail-bars pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="kp-overline text-kp-siren">{g(sex, "Zatknutý", "Zatknutá")}</div>
        <h1 className="mt-1 text-5xl font-black tracking-tight">BASA</h1>
        <Mascot mood="jail" size={170} className="mx-auto mt-4" />
        <p className="kp-body-lg mt-4 font-extrabold">
          {g(sex, "Prežral si sa na 5 hviezd. Do 7:00 nežerieš, len voda.", "Päť hviezd, kuchyňa je zapečatená. Do 7:00 len čaj a voda.")}
        </p>
        <div className="kp-num mt-6 text-5xl font-black text-kp-gold">{left}</div>
        <div className="kp-caption mt-1 !text-white/60">do prepustenia</div>
        <button className="btn-3d btn-3d--secondary mt-8" onClick={() => setHidden(true)}>Ok, sedím</button>
        <button className="btn-ghost mt-2 block w-full !text-white/50" onClick={openCamera}>{g(sex, "Aj tak som niečo zjedol 🐷", "Aj tak som niečo zjedla 🙈")}</button>
      </div>
    </div>
  );
}
