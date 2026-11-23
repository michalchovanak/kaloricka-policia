"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { Sex } from "@/lib/nutrition";
import { useAppState } from "@/lib/store";
import { MASCOT_NAME } from "@/lib/voice";

/** grumpy = predvolený (ruky/krídla prekrížené), watching = vyšetruje lupou,
 *  angry = reve / je rozhorčená, approve = palec (krídlo) hore,
 *  arrest = zatýka (putá, „stoj“), jail = točí kľúčmi od basy / zapečatenej kuchyne.
 *  Muži: /mascot/{mood}.webp (Paťo), ženy: /mascot/kacka/{mood}.webp (Kačka). */
export type Mood = "grumpy" | "watching" | "angry" | "approve" | "arrest" | "jail";

function src(mood: Mood, sex: Sex) {
  return sex === "female" ? `/mascot/kacka/${mood}.webp` : `/mascot/${mood}.webp`;
}

export function Mascot({
  mood = "grumpy",
  size = 96,
  className = "",
  bob = false,
  sex,
  whenMissing = "pato",
}: {
  mood?: Mood;
  size?: number;
  className?: string;
  bob?: boolean;
  sex?: Sex;
  /** Čo ukázať, kým chýba obrázok Kačky: Paťa, alebo nič. */
  whenMissing?: "pato" | "hide";
}) {
  const { profile } = useAppState();
  const who: Sex = sex ?? profile?.sex ?? "male";
  // Kým nie sú nahraté obrázky Kačky, ukáž Paťa (žiadny rozbitý obrázok).
  const [missing, setMissing] = useState<string | null>(null);
  const url = src(mood, who);
  if (missing === url && whenMissing === "hide") return null;
  return (
    <img
      src={missing === url ? src(mood, "male") : url}
      onError={() => who === "female" && setMissing(url)}
      alt={MASCOT_NAME[who]}
      width={size}
      height={size}
      className={`${bob ? "kp-bob" : ""} ${className} select-none`}
      draggable={false}
    />
  );
}

/** Maskot so speech bubble (Duolingo-style). */
export function MascotBubble({ mood = "grumpy", size = 88, children, className = "", sex }: { mood?: Mood; size?: number; children: React.ReactNode; className?: string; sex?: Sex }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascot mood={mood} size={size} sex={sex} bob className="shrink-0" />
      <div className="relative mb-4 flex-1 rounded-[20px] border-2 border-kp-line bg-kp-surface px-4 py-3 kp-body-lg kp-pop-in" style={{ boxShadow: "var(--kp-shadow-bubble)" }}>
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-kp-line bg-kp-surface" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
