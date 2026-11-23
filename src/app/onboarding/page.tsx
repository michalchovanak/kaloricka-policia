"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot, MascotBubble, type Mood } from "@/components/Mascot";
import { celebrate, haptic } from "@/components/confetti";
import { AuthForm } from "@/components/AuthForm";
import { actions, getState, useAppState } from "@/lib/store";
import { clamp, computeTargets, type Activity, type Goal, type Profile, type Sex } from "@/lib/nutrition";
import { g } from "@/lib/voice";
import { InstallGate, detectGate, type GateKind } from "./InstallGate";
import { BigTextInput, NumberStepper, OnboardingKeyframes, OptionCard, StatTile, useCountUp } from "./parts";

type Step = "welcome" | "name" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "invite" | "plan" | "account" | "login";

const FLOW: Step[] = ["welcome", "name", "sex", "age", "height", "weight", "activity", "goal", "invite", "plan"];

const RANGE = {
  age: { min: 18, max: 99, unit: "rokov", def: 25 },
  height: { min: 120, max: 230, unit: "cm", def: 175 },
  weight: { min: 35, max: 250, unit: "kg", def: 75 },
} as const;

const SEX_OPTIONS: { key: Sex; label: string; emoji: string }[] = [
  { key: "male", label: "Chlap", emoji: "👨" },
  { key: "female", label: "Žena", emoji: "👩" },
];

type Opt<K> = { key: K; label: string; desc: string; emoji: string };

const ACTIVITY_OPTIONS: Opt<Activity>[] = [
  { key: "sedentary", label: "Gauč", desc: "Kancel, auto, gauč. Hanba.", emoji: "🛋️" },
  { key: "light", label: "Trochu", desc: "Šport 1–3× do týždňa", emoji: "🚶" },
  { key: "moderate", label: "Aktívny", desc: "Šport 3–5× do týždňa", emoji: "🚴" },
  { key: "very", label: "Drina", desc: "Tréning 6–7× do týždňa", emoji: "🏋️" },
  { key: "extreme", label: "Beast mode", desc: "Fyzická robota + tréning", emoji: "🦍" },
];

const GOAL_OPTIONS: Opt<Goal>[] = [
  { key: "lose", label: "Schudnúť", desc: "Konečne.", emoji: "📉" },
  { key: "maintain", label: "Udržať", desc: "Ani deko navyše.", emoji: "⚖️" },
  { key: "gain", label: "Nabrať svaly", desc: "Svaly, nie sadlo.", emoji: "💪" },
];

// Kačka: o pohybe ako o sile a energii, bez hanby a bez reči o tele.
const ACTIVITY_OPTIONS_F: Opt<Activity>[] = [
  { key: "sedentary", label: "Skôr sedím", desc: "Kancel, auto, gauč", emoji: "🛋️" },
  { key: "light", label: "Trochu", desc: "Pohyb 1–3× do týždňa", emoji: "🚶‍♀️" },
  { key: "moderate", label: "Aktívna", desc: "Tréning 3–5× do týždňa", emoji: "🚴‍♀️" },
  { key: "very", label: "Drina", desc: "Tréning 6–7× do týždňa", emoji: "🏋️‍♀️" },
  { key: "extreme", label: "Beast mode", desc: "Fyzická robota + tréning", emoji: "🦍" },
];

const GOAL_OPTIONS_F: Opt<Goal>[] = [
  { key: "lose", label: "Schudnúť", desc: "Postupne a bez hladoviek.", emoji: "📉" },
  { key: "maintain", label: "Udržať", desc: "Držať formu a energiu.", emoji: "⚖️" },
  { key: "gain", label: "Nabrať svaly", desc: "Sila, nie len čísla na váhe.", emoji: "💪" },
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
    if (step === "plan") return go("account", "fwd");
    const n = FLOW[idx + 1];
    if (n) go(n, "fwd");
  };

  const back = () => {
    haptic(6);
    if (step === "login") return go("welcome", "back");
    if (step === "account") return go("plan", "back");
    const p = FLOW[idx - 1];
    if (p) go(p, "back");
  };

  const skipInvite = () => {
    setInvite("");
    haptic(8);
    go("plan", "fwd");
  };

  const saveLocal = () => {
    if (!profile) return;
    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      /* ignore */
    }
    actions.setSettings({ inviteCode: invite.trim() });
    actions.setProfile(profile);
  };

  const finish = () => {
    if (!profile) return;
    setFinishing(true);
    saveLocal();
    router.replace("/");
  };

  // Prihlásenie z úvodu: ak má účet profil, rovno dnu, inak pokračuj výsluchom.
  const afterLogin = () => {
    if (getState().profile) router.replace("/");
    else go("name", "fwd");
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

  const bubble = bubbleFor(step, { firstName, activity, goal, sex });
  const voice: Sex = sex ?? "male";
  const activityOptions = g(sex, ACTIVITY_OPTIONS, ACTIVITY_OPTIONS_F);
  const goalOptions = g(sex, GOAL_OPTIONS, GOAL_OPTIONS_F);

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
              {step === "login" || step === "account" ? <div className="flex-1" /> : <div
                className="progress-3d flex-1"
                role="progressbar"
                aria-label="Priebeh výsluchu"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                style={{ ["--_fill" as string]: step === "plan" ? "var(--kp-siren)" : "var(--kp-blue)" }}
              >
                <span style={{ "--value": `${progress}%` } as CSSProperties} />
              </div>}
              <span className="kp-overline kp-num w-12 shrink-0 text-center text-kp-muted">
                {step === "plan" ? "🚨" : idx > 0 ? `${idx}/${FLOW.length - 2}` : ""}
              </span>
            </header>
          ) : null}

          <main key={step} className={`flex flex-1 flex-col px-4 pb-4 ${dir === "fwd" ? "kpob-screen-fwd" : "kpob-screen-back"}`}>
            {step === "welcome" ? (
              <Welcome />
            ) : step === "plan" && profile ? (
              <PlanReveal profile={profile} firstName={firstName} />
            ) : step === "login" ? (
              <>
                <MascotBubble mood="watching" size={92} sex="male" className="mt-2 mb-6">
                  <p className="font-extrabold text-kp-ink">Ukáž preukaz. Email a heslo.</p>
                  <p className="kp-caption mt-1">Stiahnem ti celý spis.</p>
                </MascotBubble>
                <AuthForm submitLabel="Prihlásiť" onDone={afterLogin} />
              </>
            ) : step === "account" && profile ? (
              <>
                <MascotBubble mood="grumpy" size={92} sex={voice} className="mt-2 mb-6">
                  <p className="font-extrabold text-kp-ink">Založ si spis. Email a heslo.</p>
                  <p className="kp-caption mt-1">Keď zmažeš appku alebo zmeníš mobil, nič nestratíš.</p>
                </MascotBubble>
                <AuthForm newAccount submitLabel="Uložiť spis" beforeSubmit={saveLocal} onDone={() => router.replace("/")} />
              </>
            ) : (
              <>
                {bubble ? (
                  <MascotBubble key={`${bubble.sex}-${step}`} mood={bubble.mood} size={92} sex={bubble.sex} className="mt-2 mb-6">
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
                      {activityOptions.map((o, i) => (
                        <OptionCard key={o.key} index={i} emoji={o.emoji} label={o.label} desc={o.desc} selected={activity === o.key} onSelect={() => setActivity(o.key)} />
                      ))}
                    </div>
                  ) : null}

                  {step === "goal" ? (
                    <div role="radiogroup" aria-label="Cieľ" className="flex flex-col gap-2.5">
                      {goalOptions.map((o, i) => (
                        <OptionCard key={o.key} index={i} emoji={o.emoji} label={o.label} desc={o.desc} selected={goal === o.key} onSelect={() => setGoal(o.key)} />
                      ))}
                    </div>
                  ) : null}

                  {step === "invite" ? (
                    <BigTextInput
                      value={invite}
                      onChange={(v) => setInvite(v.replace(/\s+/g, ""))}
                      placeholder={g(sex, "Kód od kamoša", "Pozývací kód")}
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
              <>
                <button type="button" className="btn-3d btn-3d--block btn-3d--lg" onClick={next}>
                  Rozkaz, šéfe
                </button>
                <button type="button" className="btn-ghost" onClick={() => go("login", "fwd")}>
                  Už mám účet
                </button>
              </>
            ) : step === "login" ? null : step === "account" ? (
              <button type="button" className="btn-ghost" onClick={finish} disabled={finishing}>
                Neskôr
              </button>
            ) : step === "plan" ? (
              <button type="button" className="btn-3d btn-3d--block btn-3d--lg btn-3d--danger" onClick={next} disabled={!canContinue}>
                {g(sex, "Jasné, nebudem žrať 🚓", "Platí, ideme na to 🚓")}
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
  ctx: { firstName: string; activity: Activity | null; goal: Goal | null; sex: Sex | null },
): { mood: Mood; text: ReactNode; sub?: ReactNode; sex: Sex } | null {
  const { firstName, activity, goal, sex } = ctx;
  const ask = (q: string) => (firstName ? `${firstName}, ${q}` : cap(q));
  // Do výberu pohlavia vypočúva Paťo. Ženy potom preberá Kačka.
  const f = sex === "female";
  const who: Sex = f ? "female" : "male";
  switch (step) {
    case "name":
      return { mood: "watching", sex: "male", text: "Meno. Nech viem, koho budem zatýkať." };
    case "sex":
      if (f) return { mood: "approve", sex: "female", text: "Kvak. Tak toto je môj prípad.", sub: "Som Strážmajsterka Kačka. Odteraz ťa strážim ja." };
      return {
        mood: sex ? "approve" : "grumpy",
        sex: "male",
        text: firstName ? `${firstName}. Hm. Chlap alebo žena?` : "Anonym, hm. Chlap alebo žena?",
        sub: sex ? "Chlap. Dobre, ostávaš u mňa." : undefined,
      };
    case "age":
      return { mood: "watching", sex: who, text: ask(f ? "koľko máš rokov? Ostane to medzi nami." : "koľko máš rokov? A neklam.") };
    case "height":
      return { mood: "grumpy", sex: who, text: f ? "Koľko meriaš? Bez podpätkov, prosím." : "Koľko meriaš? Nenaťahuj sa, kurva." };
    case "weight":
      return f
        ? { mood: "watching", sex: who, text: "Koľko vážiš? Je to len číslo do výpočtu, nie známka.", sub: "Nikomu to nepoviem. Ani váhe." }
        : { mood: "watching", sex: who, text: "Koľko vážiš? Váha neklame. Ty áno." };
    case "activity": {
      const react: Record<Activity, { mood: Mood; sub: string }> = f
        ? {
            sedentary: { mood: "grumpy", sub: "Dobre, začneme pomaly. Aj prechádzka sa ráta." },
            light: { mood: "watching", sub: "Dobrý základ. Na tom sa dá stavať." },
            moderate: { mood: "approve", sub: "Pekný rytmus. To sa mi páči." },
            very: { mood: "approve", sub: "Frajerka. Rešpekt." },
            extreme: { mood: "approve", sub: "Beast mode. Tak to ťa treba poriadne kŕmiť." },
          }
        : {
            sedentary: { mood: "angry", sub: "Gauč. Jasné. Do riti." },
            light: { mood: "grumpy", sub: "Slabota. Ale budiž." },
            moderate: { mood: "watching", sub: "To si ešte overím." },
            very: { mood: "approve", sub: "Hm. Nie je to zlé." },
            extreme: { mood: "approve", sub: "Dobre, rešpekt. Neochotne." },
          };
      const r = activity ? react[activity] : null;
      return {
        mood: r?.mood ?? "grumpy",
        sex: who,
        text: f ? "Koľko sa hýbeš? Beh za autobusom sa ráta, ale málo." : "Koľko sa hýbeš? Cesta k chladničke sa nepočíta.",
        sub: r?.sub,
      };
    }
    case "goal": {
      const react: Record<Goal, { mood: Mood; sub: string }> = f
        ? {
            lose: { mood: "approve", sub: "Dobre. Pomaly, s bielkovinami a bez hladoviek." },
            maintain: { mood: "watching", sub: "Držať formu. Postrážim to." },
            gain: { mood: "approve", sub: "Sila! Svaly sa robia v posilke aj v kuchyni." },
          }
        : {
            lose: { mood: "approve", sub: "Konečne rozumné slovo." },
            maintain: { mood: "grumpy", sub: "Udržať. Dúfam, že nie to brucho." },
            gain: { mood: "watching", sub: "Svaly. Nie pivo a burgre „na objem“." },
          };
      const r = goal ? react[goal] : null;
      return { mood: r?.mood ?? "watching", sex: who, text: ask(f ? "čo chceš dosiahnuť?" : "čo chceš?"), sub: r?.sub };
    }
    case "invite":
      return {
        mood: "watching",
        sex: who,
        text: f ? "Máš pozývací kód? Bez neho ti nič nespočítam." : "Máš kód od kamoša? Bez neho ti nič nespočítam.",
        sub: "Nemáš? V profile si dáš vlastný API kľúč.",
      };
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
          <div className="flex items-end">
            <Mascot mood="grumpy" size={180} sex="male" bob />
            <Mascot mood="approve" size={150} sex="female" whenMissing="hide" bob className="-ml-10" />
          </div>
        </div>
      </div>

      <h1 className="kp-h1 kp-pop-in kp-stagger mt-5 text-balance" style={{ "--i": 2 } as CSSProperties}>
        Kalorická polícia hlási službu.
      </h1>
      <p className="kp-body-lg kp-pop-in kp-stagger mt-2 text-balance text-kp-ink-2" style={{ "--i": 3 } as CSSProperties}>
        Odfotíš jedlo, my strážime plán. Chlapov má na starosti Paťo, ženy Kačka.
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
            Keď ješ mimo plánu alebo nezapisuješ, stúpa ti hľadanosť. Pri piatich hviezdach ideš do basy.
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
      {profile.sex === "female" ? (
        <MascotBubble mood="approve" size={92} sex="female" className="mt-2 mb-5">
          <p className="font-extrabold text-kp-ink">
            {firstName ? `${firstName}, toto je tvoj denný plán.` : "Toto je tvoj denný plán."} Ty dodáš fotky, ja dohľad.
          </p>
        </MascotBubble>
      ) : (
        <MascotBubble mood="arrest" size={92} sex="male" className="mt-2 mb-5">
          <p className="font-extrabold text-kp-ink">
            {firstName ? `${firstName}, toto je tvoj limit.` : "Toto je tvoj limit."} Prekročíš a ideš sedieť.
          </p>
        </MascotBubble>
      )}

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
