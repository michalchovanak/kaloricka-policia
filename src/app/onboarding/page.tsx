"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot, MascotBubble, type Mood } from "@/components/Mascot";
import { celebrate, haptic } from "@/components/confetti";
import { actions, useAppState } from "@/lib/store";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  PACE_LABELS,
  clamp,
  computeTargets,
  type Activity,
  type Goal,
  type Pace,
  type Profile,
  type Sex,
} from "@/lib/nutrition";
import { BigTextInput, NumberStepper, OnboardingKeyframes, OptionCard, StatTile, useCountUp } from "./parts";

type Step = "welcome" | "name" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "pace" | "invite" | "plan";

const ALL_STEPS: Step[] = ["welcome", "name", "sex", "age", "height", "weight", "activity", "goal", "pace", "invite", "plan"];

const RANGE = {
  age: { min: 18, max: 99, unit: "rokov", def: 25 },
  height: { min: 120, max: 230, unit: "cm", def: 175 },
  weight: { min: 35, max: 250, unit: "kg", def: 75 },
} as const;

const SEX_OPTIONS: { key: Sex; label: string; emoji: string }[] = [
  { key: "male", label: "Muž", emoji: "👨" },
  { key: "female", label: "Žena", emoji: "👩" },
];

const HOW_IT_WORKS = [
  { emoji: "📸", title: "Odfoť", desc: "Tanier, desiata, aj tá tajná čokoláda." },
  { emoji: "🤖", title: "AI spočíta", desc: "Kalórie, bielkoviny, cukor aj vlákninu." },
  { emoji: "🏆", title: "Zbieraj XP a sériu", desc: "Každý deň bez priestupku sa počíta." },
];

const isNum = (v: number, k: keyof typeof RANGE) => Number.isFinite(v) && v >= RANGE[k].min && v <= RANGE[k].max;
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "").replace(".", ",");

export default function OnboardingPage() {
  const router = useRouter();
  const { profile: saved, settings } = useAppState();

  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");

  const [name, setName] = useState(saved?.name ?? "");
  const [sex, setSex] = useState<Sex | null>(saved?.sex ?? null);
  const [age, setAge] = useState<number>(saved?.age ?? RANGE.age.def);
  const [heightCm, setHeight] = useState<number>(saved?.heightCm ?? RANGE.height.def);
  const [weightKg, setWeight] = useState<number>(saved?.weightKg ?? RANGE.weight.def);
  const [activity, setActivity] = useState<Activity | null>(saved?.activity ?? null);
  const [goal, setGoal] = useState<Goal | null>(saved?.goal ?? null);
  const [pace, setPace] = useState<Pace | null>(saved?.pace ?? null);
  const [invite, setInvite] = useState(settings.inviteCode ?? "");
  const [finishing, setFinishing] = useState(false);

  const flow = useMemo(() => ALL_STEPS.filter((s) => !(s === "pace" && goal === "maintain")), [goal]);
  const idx = flow.indexOf(step);
  const progress = Math.round((idx / (flow.length - 1)) * 100);
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
          pace: goal === "maintain" ? "normal" : (pace ?? "normal"),
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
      case "pace":
        return !!pace;
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
    const n = flow[idx + 1];
    if (n) go(n, "fwd");
  };

  const back = () => {
    haptic(6);
    const p = flow[idx - 1];
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
    actions.setSettings({ inviteCode: invite.trim() });
    actions.setProfile(profile);
    router.replace("/");
  };

  // Plan reveal party.
  useEffect(() => {
    if (step !== "plan") return;
    const t = setTimeout(() => {
      celebrate(true);
      haptic(30);
    }, 350);
    return () => clearTimeout(t);
  }, [step]);

  const bubble = bubbleFor(step, { firstName, sex, activity, goal, pace });

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
            aria-label="Priebeh nastavenia"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ ["--_fill" as string]: step === "plan" ? "var(--kp-mint)" : "var(--kp-blue)" }}
          >
            <span style={{ "--value": `${progress}%` } as CSSProperties} />
          </div>
          <span className="kp-overline kp-num w-12 shrink-0 text-center text-kp-muted">
            {step === "plan" ? "🎉" : `${idx}/${flow.length - 2}`}
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
                  placeholder="Tvoje meno"
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
                  {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((k, i) => (
                    <OptionCard
                      key={k}
                      index={i}
                      emoji={ACTIVITY_LABELS[k].emoji}
                      label={ACTIVITY_LABELS[k].label}
                      desc={ACTIVITY_LABELS[k].desc}
                      selected={activity === k}
                      onSelect={() => setActivity(k)}
                    />
                  ))}
                </div>
              ) : null}

              {step === "goal" ? (
                <div role="radiogroup" aria-label="Cieľ" className="flex flex-col gap-2.5">
                  {(Object.keys(GOAL_LABELS) as Goal[]).map((k, i) => (
                    <OptionCard
                      key={k}
                      index={i}
                      emoji={GOAL_LABELS[k].emoji}
                      label={GOAL_LABELS[k].label}
                      desc={GOAL_LABELS[k].desc}
                      selected={goal === k}
                      onSelect={() => setGoal(k)}
                    />
                  ))}
                </div>
              ) : null}

              {step === "pace" ? (
                <div role="radiogroup" aria-label="Tempo" className="flex flex-col gap-2.5">
                  {(Object.keys(PACE_LABELS) as Pace[]).map((k, i) => (
                    <OptionCard
                      key={k}
                      index={i}
                      emoji={PACE_LABELS[k].emoji}
                      label={PACE_LABELS[k].label}
                      desc={goal === "gain" ? PACE_LABELS[k].gain : PACE_LABELS[k].lose}
                      selected={pace === k}
                      onSelect={() => setPace(k)}
                    />
                  ))}
                </div>
              ) : null}

              {step === "invite" ? (
                <>
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
                  <p className="kp-caption kp-pop-in kp-stagger mt-1 px-1" style={{ "--i": 2 } as CSSProperties}>
                    Bez kódu si môžeš neskôr v profile zadať vlastný Claude API kľúč.
                  </p>
                </>
              ) : null}
            </div>
          </>
        )}
      </main>

      <footer className="kp-footer-cta z-10 flex flex-col items-stretch gap-1">
        {step === "welcome" ? (
          <button type="button" className="btn-3d btn-3d--block btn-3d--lg" onClick={next}>
            Začnime
          </button>
        ) : step === "plan" ? (
          <button type="button" className="btn-3d btn-3d--block btn-3d--lg btn-3d--success" onClick={next} disabled={!canContinue}>
            Idem na to 🚓
          </button>
        ) : (
          <>
            <button type="button" className="btn-3d btn-3d--block" onClick={next} disabled={!canContinue}>
              Pokračovať
            </button>
            {step === "invite" && !invite.trim() ? (
              <button type="button" className="btn-ghost" onClick={skipInvite}>
                Nemám kód, preskočiť
              </button>
            ) : null}
            {step === "name" && !name.trim() ? <p className="kp-caption text-center">Meno je nepovinné, môžeš ísť ďalej.</p> : null}
          </>
        )}
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function bubbleFor(
  step: Step,
  ctx: { firstName: string; sex: Sex | null; activity: Activity | null; goal: Goal | null; pace: Pace | null },
): { mood: Mood; text: ReactNode; sub?: ReactNode } | null {
  const { firstName, activity, goal, pace } = ctx;
  const ask = (q: string) => (firstName ? `${firstName}, ${q}` : cap(q));
  switch (step) {
    case "name":
      return { mood: "happy", text: "Najprv sa zoznámime. Ako ti môžem hovoriť?", sub: "Stačí prezývka. Nikam ju neposielam." };
    case "sex":
      return {
        mood: "thinking",
        text: firstName ? `Teší ma, ${firstName}! Si muž alebo žena?` : "Teší ma! Si muž alebo žena?",
        sub: "Potrebujem to len do vzorca na metabolizmus (Mifflin-St Jeor).",
      };
    case "age":
      return { mood: "thinking", text: ask("koľko máš rokov?"), sub: "S vekom metabolizmus mierne spomaľuje, asi o 5 kcal ročne." };
    case "height":
      return { mood: "happy", text: "A koľko meriaš?", sub: "Výška ide rovno do výpočtu tvojho bazálneho metabolizmu." };
    case "weight":
      return { mood: "happy", text: "Koľko vážiš? Ostane to medzi nami 🤐", sub: "Z váhy rátam aj bielkoviny a pitný režim." };
    case "activity":
      return {
        mood: activity === "extreme" ? "celebrate" : activity === "sedentary" ? "sleepy" : "thinking",
        text: "Ako veľa sa hýbeš počas bežného týždňa?",
        sub:
          activity === "extreme"
            ? "Beast mode! Rešpekt 🫡"
            : activity === "sedentary"
              ? "Gaučová hliadka, rozumiem. Žiadne súdenie 😄"
              : "Buď úprimný, toto najviac ovplyvní výsledok.",
      };
    case "goal":
      return {
        mood: "happy",
        text: ask("aký je tvoj cieľ?"),
        sub: goal === "lose" ? "Pôjdeme na to s rozumom, bez hladovky." : goal === "gain" ? "Viac jedla, viac bielkovín. Paráda 💪" : goal === "maintain" ? "Prehľad bez stresu. Super voľba." : undefined,
      };
    case "pace":
      return {
        mood: pace === "fast" ? "strict" : "thinking",
        text: goal === "gain" ? "Ako rýchlo chceš priberať?" : "Ako rýchlo chceš chudnúť?",
        sub: pace === "fast" ? "Rýchlo, ale bezpečne. Na minimum dohliadnem ja 🚨" : "Pomalšie tempo sa ľahšie udrží.",
      };
    case "invite":
      return { mood: "thinking", text: "Máš pozývací kód od kamoša?", sub: "S ním ti AI vyšetrovanie jedál funguje hneď." };
    default:
      return null;
  }
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

/* ------------------------------------------------------------------------ */

function Welcome() {
  return (
    <div className="flex flex-1 flex-col items-center pt-6 text-center">
      <div className="relative">
        <span aria-hidden className="absolute inset-x-4 bottom-1 h-5 rounded-[50%] bg-kp-sunken" />
        <div className="kpob-hero relative">
          <Mascot mood="celebrate" size={172} bob />
        </div>
        <span
          aria-hidden
          className="kpob-badge absolute -top-1 -right-6 rounded-xl bg-kp-gold px-2.5 py-1 kp-overline text-kp-ink"
          style={{ boxShadow: "0 3px 0 var(--kp-gold-lip)" }}
        >
          Hliadka
        </span>
      </div>

      <h1 className="kp-h1 kp-pop-in kp-stagger mt-5 text-balance" style={{ "--i": 2 } as CSSProperties}>
        Ahoj! Som Paťo z Kalorickej polície 👮
      </h1>
      <p className="kp-body-lg kp-pop-in kp-stagger mt-2 text-kp-ink-2" style={{ "--i": 3 } as CSSProperties}>
        Odfotíš jedlo, ja vyšetrím kalórie.
      </p>

      <ol className="mt-7 flex w-full flex-col gap-2.5 text-left">
        {HOW_IT_WORKS.map((s, i) => (
          <li key={s.title} className="kp-pop-in kp-stagger" style={{ "--i": 4 + i } as CSSProperties}>
            <div className="card-3d flex items-center gap-3 px-3.5 py-3">
              <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-kp-blue-tint text-[26px]">
                {s.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="kp-overline kp-num text-kp-blue">{i + 1}.</span>
                  <span className="kp-h3">{s.title}</span>
                </span>
                <span className="kp-caption block">{s.desc}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className="kp-caption kp-pop-in kp-stagger mt-3 text-kp-muted" style={{ "--i": 8 } as CSSProperties}>
        Nastavenie trvá asi minútu. Dáta ostávajú v tvojom telefóne.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function PlanReveal({ profile, firstName }: { profile: Profile; firstName: string }) {
  const t = useMemo(() => computeTargets(profile), [profile]);
  const kcal = useCountUp(t.kcal, 1400, 300);
  const diff = t.kcal - t.tdee;

  return (
    <div className="flex flex-1 flex-col">
      <MascotBubble mood="celebrate" size={92} className="mt-2 mb-5">
        <p className="font-extrabold text-kp-ink">{firstName ? `${firstName}, tvoj plán je hotový! 🎉` : "Tvoj plán je hotový! 🎉"}</p>
        <p className="kp-caption mt-1">Toto je tvoj denný rozpočet. Ja dohliadnem, ty jedz.</p>
      </MascotBubble>

      <div className="kp-pop-in kp-stagger" style={{ "--i": 1 } as CSSProperties}>
        <section className="card-3d relative overflow-hidden px-5 pt-5 pb-4 text-center" aria-label="Denný cieľ kalórií">
          <span aria-hidden className="absolute inset-x-0 top-0 h-2 bg-kp-kcal" />
          <span aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-kp-kcal-tint" />
          <span aria-hidden className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-kp-gold-tint" />
          <div className="relative">
            <div className="kp-overline text-kp-ink-2">🔥 Denný cieľ</div>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="kp-display kp-num" style={{ fontSize: 64, color: "var(--kp-kcal)" }} aria-live="off">
                {kcal.toLocaleString("sk-SK")}
              </span>
              <span className="kp-h2 text-kp-ink-2">kcal</span>
            </div>
            <p className="kp-caption mt-1">
              Spáliš cca <b className="kp-num text-kp-ink">{t.tdee.toLocaleString("sk-SK")} kcal</b> denne
              {diff !== 0 ? (
                <>
                  {" · "}
                  <b className="kp-num text-kp-ink">
                    {diff > 0 ? "+" : "−"}
                    {Math.abs(diff)} kcal
                  </b>{" "}
                  {diff > 0 ? "na rast" : "na chudnutie"}
                </>
              ) : null}
            </p>
          </div>
        </section>
      </div>

      {t.floorApplied ? (
        <div className="kp-pop-in kp-stagger mt-1" style={{ "--i": 2 } as CSSProperties}>
          <div className="flex items-start gap-3 rounded-[20px] border-2 border-kp-gold bg-kp-gold-tint px-4 py-3">
            <span aria-hidden className="text-2xl leading-none">🛡️</span>
            <p className="text-[0.9375rem] leading-snug text-kp-gold-ink">
              <b className="font-black">Bezpečné minimum.</b> Menej by už nebolo zdravé, tak som cieľ nechal na {t.kcal} kcal.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <StatTile index={3} emoji="🥩" label="Bielkoviny" value={t.proteinG} unit="g" color="var(--kp-protein)" tint="var(--kp-protein-tint)" hint="cieľ dosiahnuť" />
        <StatTile index={4} emoji="🍞" label="Sacharidy" value={t.carbsG} unit="g" color="var(--kp-carbs)" tint="var(--kp-carbs-tint)" hint="zvyšok energie" />
        <StatTile index={5} emoji="🥑" label="Tuky" value={t.fatG} unit="g" color="var(--kp-fat)" tint="var(--kp-fat-tint)" hint="okolo 30 % kcal" />
        <StatTile index={6} emoji="🥦" label="Vláknina" value={t.fiberG} unit="g" color="var(--kp-fiber)" tint="var(--kp-fiber-tint)" hint="aspoň toľko" />
        <StatTile index={7} emoji="🍬" label="Cukor max" value={t.freeSugarMaxG} unit="g" color="var(--kp-sugar)" tint="var(--kp-sugar-tint)" hint="pridaný cukor, limit" />
        <StatTile index={8} emoji="💧" label="Voda" value={fmt1(t.waterMl / 1000)} unit="l" color="var(--kp-blue)" tint="var(--kp-blue-tint)" hint="počas dňa" />
      </div>

      <p className="kp-caption kp-pop-in kp-stagger mt-4 text-center text-kp-muted" style={{ "--i": 9 } as CSSProperties}>
        Odhady, nie lekárska rada. Všetko zmeníš neskôr v profile.
      </p>
    </div>
  );
}
