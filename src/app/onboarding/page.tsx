"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot, MascotBubble, type Mood } from "@/components/Mascot";
import { celebrate, haptic } from "@/components/confetti";
import { actions, useAppState } from "@/lib/store";
import { clamp, computeTargets, type Activity, type Goal, type Profile, type Sex } from "@/lib/nutrition";
import { InstallGate, detectGate, type GateKind } from "./InstallGate";
import { BigTextInput, NumberStepper, OnboardingKeyframes, OptionCard, StatTile, useCountUp } from "./parts";

type Step = "welcome" | "name" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "invite" | "plan";

const FLOW: Step[] = ["welcome", "name", "sex", "age", "height", "weight", "activity", "goal", "invite", "plan"];

const RANGE = {
  age: { min: 18, max: 99, unit: "rokov", def: 25 },
  height: { min: 120, max: 230, unit: "cm", def: 175 },
  weight: { min: 35, max: 250, unit: "kg", def: 75 },
} as const;

const SEX_OPTIONS: { key: Sex; label: string; emoji: string }[] = [
  { key: "male", label: "Chlap", emoji: "👨" },
  { key: "female", label: "Baba", emoji: "👩" },
];

const ACTIVITY_OPTIONS: { key: Activity; label: string; desc: string; emoji: string }[] = [
  { key: "sedentary", label: "Gauč", desc: "Kancel, auto, gauč. Hanba.", emoji: "🛋️" },
  { key: "light", label: "Trochu", desc: "Šport 1–3× do týždňa", emoji: "🚶" },
  { key: "moderate", label: "Aktívny", desc: "Šport 3–5× do týždňa", emoji: "🚴" },
  { key: "very", label: "Drina", desc: "Tréning 6–7× do týždňa", emoji: "🏋️" },
  { key: "extreme", label: "Beast mode", desc: "Fyzická robota + tréning", emoji: "🦍" },
];

const GOAL_OPTIONS: { key: Goal; label: string; desc: string; emoji: string }[] = [
  { key: "lose", label: "Schudnúť", desc: "Konečne.", emoji: "📉" },
  { key: "maintain", label: "Udržať", desc: "Ani deko navyše.", emoji: "⚖️" },
  { key: "gain", label: "Nabrať svaly", desc: "Svaly, nie sadlo.", emoji: "💪" },
];

const isNum = (v: number, k: keyof typeof RANGE) => Number.isFinite(v) && v >= RANGE[k].min && v <= RANGE[k].max;

export default function OnboardingPage() {
  const router = useRouter();
  const { profile: saved, settings } = useAppState();

  // undefined = not decided yet (server render + first client paint) → render nothing.
  const [gate, setGate] = useState<GateKind | null | undefined>(undefined);
  useEffect(() => {
    setGate(saved ? null : detectGate());
    // Decide once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");

  const [name, setName] = useState(saved?.name ?? "");
  const [sex, setSex] = useState<Sex | null>(saved?.sex ?? null);
  const [age, setAge] = useState<number>(saved?.age ?? RANGE.age.def);
  const [heightCm, setHeight] = useState<number>(saved?.heightCm ?? RANGE.height.def);
  const [weightKg, setWeight] = useState<number>(saved?.weightKg ?? RANGE.weight.def);
  const [activity, setActivity] = useState<Activity | null>(saved?.activity ?? null);
  const [goal, setGoal] = useState<Goal | null>(saved?.goal ?? null);
  const [invite, setInvite] = useState(settings.inviteCode ?? "");
  const [finishing, setFinishing] = useState(false);

  const idx = FLOW.indexOf(step);
  const progress = Math.round((idx / (FLOW.length - 1)) * 100);
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  const profile: Profile | null =
    sex && activity && goal
      ? {
          name: name.trim(),
          sex,
          age: clamp(Math.round(age || RANGE.age.def), RANGE.age.min, RANGE.age.max),
          heightCm: clamp(Math.round(heightCm || RANGE.height.def), RANGE.height.min, RANGE.height.max),
          weightKg: clamp(Math.round(weightKg || RANGE.weight.def), RANGE.weight.min, RANGE.weight.max),
          activity,
          goal,
          pace: "normal",
        }
      : null;

  const canContinue = (() => {
    switch (step) {
      case "sex":
        return !!sex;
      case "age":
        return isNum(age, "age");
      case "height":
        return isNum(heightCm, "height");
      case "weight":
        return isNum(weightKg, "weight");
      case "activity":
        return !!activity;
      case "goal":
        return !!goal;
      case "invite":
        return invite.trim().length > 0;
      case "plan":
        return !!profile && !finishing;
      default:
        return true;
    }
  })();

  const go = (to: Step, d: "fwd" | "back") => {
    setDir(d);
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (!canContinue) return;
    haptic(12);
    if (step === "plan") return finish();
    const n = FLOW[idx + 1];
    if (n) go(n, "fwd");
  };

  const back = () => {
    haptic(6);
    const p = FLOW[idx - 1];
    if (p) go(p, "back");
  };

  const skipInvite = () => {
    setInvite("");
    haptic(8);
    go("plan", "fwd");
  };

  const finish = () => {
    if (!profile) return;
    setFinishing(true);
    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      /* ignore */
    }
    actions.setSettings({ inviteCode: invite.trim() });
    actions.setProfile(profile);
    router.replace("/");
  };

  // Plan reveal.
  useEffect(() => {
    if (step !== "plan" || gate) return;
    const t = setTimeout(() => {
      celebrate(true);
      haptic(30);
    }, 350);
    return () => clearTimeout(t);
  }, [step, gate]);

  const bubble = bubbleFor(step, { firstName, activity, goal });

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-kp-bg"
      style={{
        paddingTop: "calc(var(--kp-safe-top) + 8px)",
        paddingLeft: "var(--kp-safe-left)",
        paddingRight: "var(--kp-safe-right)",
      }}
    >
      <OnboardingKeyframes />

      {gate === undefined ? null : gate ? (
        <InstallGate kind={gate} onSkip={() => setGate(null)} />
      ) : (
        <>
          {step !== "welcome" ? (
            <header className="flex items-center gap-2 px-2" style={{ minHeight: "var(--kp-topbar-h)" }}>
              <button
                type="button"
                onClick={back}
                aria-label="Späť"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-kp-muted transition-transform active:scale-90"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className="progress-3d flex-1"
                role="progressbar"
                aria-label="Priebeh výsluchu"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                style={{ ["--_fill" as string]: step === "plan" ? "var(--kp-siren)" : "var(--kp-blue)" }}
              >
                <span style={{ "--value": `${progress}%` } as CSSProperties} />
              </div>
              <span className="kp-overline kp-num w-12 shrink-0 text-center text-kp-muted">
                {step === "plan" ? "🚨" : `${idx}/${FLOW.length - 2}`}
              </span>
            </header>
          ) : null}

          <main key={step} className={`flex flex-1 flex-col px-4 pb-4 ${dir === "fwd" ? "kpob-screen-fwd" : "kpob-screen-back"}`}>
            {step === "welcome" ? (
              <Welcome />
            ) : step === "plan" && profile ? (
              <PlanReveal profile={profile} firstName={firstName} />
            ) : (
              <>
                {bubble ? (
                  <MascotBubble mood={bubble.mood} size={92} className="mt-2 mb-6">
                    <p className="font-extrabold text-kp-ink">{bubble.text}</p>
                    {bubble.sub ? <p className="kp-caption mt-1">{bubble.sub}</p> : null}
                  </MascotBubble>
                ) : null}

                <div className="flex flex-col gap-2.5">
                  {step === "name" ? (
                    <BigTextInput
                      value={name}
                      onChange={setName}
                      placeholder="Meno alebo prezývka"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      maxLength={24}
                      icon="🪪"
                      onEnter={next}
                    />
                  ) : null}

                  {step === "sex" ? (
                    <div role="radiogroup" aria-label="Pohlavie" className="grid grid-cols-2 gap-3">
                      {SEX_OPTIONS.map((o, i) => (
                        <OptionCard key={o.key} tall index={i} emoji={o.emoji} label={o.label} selected={sex === o.key} onSelect={() => setSex(o.key)} />
                      ))}
                    </div>
                  ) : null}

                  {step === "age" ? (
                    <NumberStepper value={age} onChange={setAge} min={RANGE.age.min} max={RANGE.age.max} unit={RANGE.age.unit} onEnter={next} />
                  ) : null}
                  {step === "height" ? (
                    <NumberStepper value={heightCm} onChange={setHeight} min={RANGE.height.min} max={RANGE.height.max} unit={RANGE.height.unit} onEnter={next} />
                  ) : null}
                  {step === "weight" ? (
                    <NumberStepper value={weightKg} onChange={setWeight} min={RANGE.weight.min} max={RANGE.weight.max} unit={RANGE.weight.unit} onEnter={next} />
                  ) : null}

                  {step === "activity" ? (
                    <div role="radiogroup" aria-label="Aktivita" className="flex flex-col gap-2.5">
                      {ACTIVITY_OPTIONS.map((o, i) => (
                        <OptionCard key={o.key} index={i} emoji={o.emoji} label={o.label} desc={o.desc} selected={activity === o.key} onSelect={() => setActivity(o.key)} />
                      ))}
                    </div>
                  ) : null}

                  {step === "goal" ? (
                    <div role="radiogroup" aria-label="Cieľ" className="flex flex-col gap-2.5">
                      {GOAL_OPTIONS.map((o, i) => (
                        <OptionCard key={o.key} index={i} emoji={o.emoji} label={o.label} desc={o.desc} selected={goal === o.key} onSelect={() => setGoal(o.key)} />
                      ))}
                    </div>
                  ) : null}

                  {step === "invite" ? (
                    <BigTextInput
                      value={invite}
                      onChange={(v) => setInvite(v.replace(/\s+/g, ""))}
                      placeholder="Kód od kamoša"
                      autoCapitalize="characters"
                      autoComplete="off"
                      maxLength={40}
                      icon="🎟️"
                      mono
                      onEnter={next}
                    />
                  ) : null}
                </div>
              </>
            )}
          </main>

          <footer className="kp-footer-cta z-10 flex flex-col items-stretch gap-1">
            {step === "welcome" ? (
              <button type="button" className="btn-3d btn-3d--block btn-3d--lg" onClick={next}>
                Rozkaz, šéfe
              </button>
            ) : step === "plan" ? (
              <button type="button" className="btn-3d btn-3d--block btn-3d--lg btn-3d--danger" onClick={next} disabled={!canContinue}>
                Jasné, nebudem žrať 🚓
              </button>
            ) : (
              <>
                <button type="button" className="btn-3d btn-3d--block" onClick={next} disabled={!canContinue}>
                  {step === "name" && !name.trim() ? "Bez mena, anonym" : "Ďalej"}
                </button>
                {step === "invite" && !invite.trim() ? (
                  <button type="button" className="btn-ghost" onClick={skipInvite}>
                    Nemám kód
                  </button>
                ) : null}
              </>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function bubbleFor(
  step: Step,
  ctx: { firstName: string; activity: Activity | null; goal: Goal | null },
): { mood: Mood; text: ReactNode; sub?: ReactNode } | null {
  const { firstName, activity, goal } = ctx;
  const ask = (q: string) => (firstName ? `${firstName}, ${q}` : cap(q));
  switch (step) {
    case "name":
      return { mood: "watching", text: "Meno. Nech viem, koho budem zatýkať." };
    case "sex":
      return { mood: "grumpy", text: firstName ? `${firstName}. Hm. Chlap alebo baba?` : "Anonym, hm. Chlap alebo baba?" };
    case "age":
      return { mood: "watching", text: ask("koľko máš rokov? A neklam.") };
    case "height":
      return { mood: "grumpy", text: "Koľko meriaš? Nenaťahuj sa, kurva." };
    case "weight":
      return { mood: "watching", text: "Koľko vážiš? Váha neklame. Ty áno." };
    case "activity": {
      const react: Record<Activity, { mood: Mood; sub: string }> = {
        sedentary: { mood: "angry", sub: "Gauč. Jasné. Do riti." },
        light: { mood: "grumpy", sub: "Slabota. Ale budiž." },
        moderate: { mood: "watching", sub: "To si ešte overím." },
        very: { mood: "approve", sub: "Hm. Nie je to zlé." },
        extreme: { mood: "approve", sub: "Dobre, rešpekt. Neochotne." },
      };
      const r = activity ? react[activity] : null;
      return { mood: r?.mood ?? "grumpy", text: "Koľko sa hýbeš? Cesta k chladničke sa nepočíta.", sub: r?.sub };
    }
    case "goal": {
      const react: Record<Goal, { mood: Mood; sub: string }> = {
        lose: { mood: "approve", sub: "Konečne rozumné slovo." },
        maintain: { mood: "grumpy", sub: "Udržať. Dúfam, že nie to brucho." },
        gain: { mood: "watching", sub: "Svaly. Nie pivo a burgre „na objem“." },
      };
      const r = goal ? react[goal] : null;
      return { mood: r?.mood ?? "watching", text: ask("čo chceš?"), sub: r?.sub };
    }
    case "invite":
      return { mood: "watching", text: "Máš kód od kamoša? Bez neho ti nič nespočítam.", sub: "Nemáš? V profile si dáš vlastný API kľúč." };
    default:
      return null;
  }
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

/* ------------------------------------------------------------------------ */

function Welcome() {
  return (
    <div className="flex flex-1 flex-col items-center pt-8 text-center">
      <div className="relative">
        <span aria-hidden className="absolute inset-x-6 bottom-1 h-5 rounded-[50%] bg-kp-sunken" />
        <div className="kpob-hero relative">
          <Mascot mood="grumpy" size={200} bob />
        </div>
      </div>

      <h1 className="kp-h1 kp-pop-in kp-stagger mt-5 text-balance" style={{ "--i": 2 } as CSSProperties}>
        Som Strážmajster Paťo.
      </h1>
      <p className="kp-body-lg kp-pop-in kp-stagger mt-2 text-balance text-kp-ink-2" style={{ "--i": 3 } as CSSProperties}>
        Odfotíš, čo žerieš. Ja sledujem, či nepriberáš.
      </p>

      <div className="kp-pop-in kp-stagger mt-7 w-full" style={{ "--i": 4 } as CSSProperties}>
        <div className="card-3d px-4 py-3.5">
          <div className="kp-overline text-kp-siren-ink">Hľadanosť</div>
          <div aria-label="Päť hviezd hľadanosti" role="img" className="mt-1 flex justify-center gap-1 text-[30px] leading-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                aria-hidden
                className="kpob-star"
                style={{ "--i": i, color: i === 4 ? "var(--kp-siren)" : "var(--kp-gold)" } as CSSProperties}
              >
                ★
              </span>
            ))}
          </div>
          <p className="mt-2 text-[0.9375rem] leading-snug font-bold text-kp-ink-2 text-balance">
            Keď žerieš zle alebo nezapisuješ, stúpa ti hľadanosť. Pri piatich hviezdach ideš do basy.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function PlanReveal({ profile, firstName }: { profile: Profile; firstName: string }) {
  const t = useMemo(() => computeTargets(profile), [profile]);
  const kcal = useCountUp(t.kcal, 1400, 300);

  return (
    <div className="flex flex-1 flex-col">
      <MascotBubble mood="arrest" size={92} className="mt-2 mb-5">
        <p className="font-extrabold text-kp-ink">
          {firstName ? `${firstName}, toto je tvoj limit.` : "Toto je tvoj limit."} Prekročíš a ideš sedieť.
        </p>
      </MascotBubble>

      <div className="kp-pop-in kp-stagger" style={{ "--i": 1 } as CSSProperties}>
        <section className="card-3d relative overflow-hidden px-5 pt-6 pb-5 text-center" aria-label="Denný limit kalórií">
          <span aria-hidden className="absolute inset-x-0 top-0 h-2 bg-kp-kcal" />
          <span aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-kp-kcal-tint" />
          <span aria-hidden className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-kp-siren-tint" />
          <div className="relative">
            <div className="kp-overline text-kp-ink-2">🔥 Denne max</div>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="kp-display kp-num" style={{ fontSize: 72, color: "var(--kp-kcal)" }} aria-live="off">
                {kcal.toLocaleString("sk-SK")}
              </span>
              <span className="kp-h2 text-kp-ink-2">kcal</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile index={3} emoji="🥩" label="Bielkoviny" value={t.proteinG} unit="g" color="var(--kp-protein)" tint="var(--kp-protein-tint)" hint="minimum" />
        <StatTile index={4} emoji="🍬" label="Cukor" value={t.freeSugarMaxG} unit="g" color="var(--kp-sugar)" tint="var(--kp-sugar-tint)" hint="maximum" />
      </div>
    </div>
  );
}
