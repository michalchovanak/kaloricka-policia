/* eslint-disable @next/next/no-img-element */
/** grumpy = predvolený (ruky prekrížené), watching = vyšetruje lupou,
 *  angry = reve a ukazuje prstom, approve = neochotný palec hore,
 *  arrest = zatýka (putá, „stoj“), jail = spokojne točí kľúčmi od basy. */
export type Mood = "grumpy" | "watching" | "angry" | "approve" | "arrest" | "jail";

export function Mascot({ mood = "grumpy", size = 96, className = "", bob = false }: { mood?: Mood; size?: number; className?: string; bob?: boolean }) {
  return (
    <img
      src={`/mascot/${mood}.webp`}
      alt="Strážmajster Paťo"
      width={size}
      height={size}
      className={`${bob ? "kp-bob" : ""} ${className} select-none`}
      draggable={false}
    />
  );
}

/** Maskot so speech bubble (Duolingo-style). */
export function MascotBubble({ mood = "grumpy", size = 88, children, className = "" }: { mood?: Mood; size?: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascot mood={mood} size={size} bob className="shrink-0" />
      <div className="relative mb-4 flex-1 rounded-[20px] border-2 border-kp-line bg-kp-surface px-4 py-3 kp-body-lg kp-pop-in" style={{ boxShadow: "var(--kp-shadow-bubble)" }}>
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-kp-line bg-kp-surface" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
