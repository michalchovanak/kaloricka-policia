"use client";

import { useMemo, useState } from "react";
import { actions, getState, useAppState } from "@/lib/store";
import { rankFor, totalXp } from "@/lib/game";
import { dayKey } from "@/lib/dates";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  PACE_LABELS,
  computeTargets,
  type Activity,
  type Goal,
  type Pace,
  type Profile,
  type Sex,
} from "@/lib/nutrition";
import type { Settings } from "@/lib/types";
import { Mascot } from "@/components/Mascot";

/* ---------- malé stavebné kocky ---------- */

function SectionTitle({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <h2 className="kp-h3 mb-3 mt-8 flex items-center gap-2 px-1">
      {emoji && <span aria-hidden>{emoji}</span>}
      {children}
    </h2>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="kp-overline mb-2 block text-kp-ink-2">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-[12px] border-2 border-kp-line bg-kp-surface px-4 py-3 text-base font-extrabold text-kp-ink outline-none transition-colors placeholder:font-bold placeholder:text-kp-muted focus:border-kp-blue";

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className={`${inputCls} kp-num pr-10 ${invalid ? "!border-kp-siren bg-kp-siren-tint" : ""}`}
          style={{ fontSize: 17 }}
          aria-invalid={invalid}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-kp-muted">{unit}</span>
      </div>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`option-3d !min-h-[52px] !justify-center !gap-2 !px-2 !py-2 text-center !text-[15px] ${selected ? "is-selected" : ""}`}
    >
      {children}
    </button>
  );
}

/* ---------- formulár profilu ---------- */

type Draft = {
  name: string;
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activity: Activity;
  goal: Goal;
  pace: Pace;
};

const toDraft = (p: Profile): Draft => ({
  name: p.name,
  sex: p.sex,
  age: String(p.age),
  heightCm: String(p.heightCm),
  weightKg: String(p.weightKg).replace(".", ","),
  activity: p.activity,
  goal: p.goal,
  pace: p.pace,
});

const num = (s: string) => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const LIMITS = {
  age: [14, 100],
  heightCm: [120, 230],
  weightKg: [35, 300],
} as const;

function validate(d: Draft) {
  const age = num(d.age);
  const heightCm = num(d.heightCm);
  const weightKg = num(d.weightKg);
  const bad = {
    age: !(age >= LIMITS.age[0] && age <= LIMITS.age[1]),
    heightCm: !(heightCm >= LIMITS.heightCm[0] && heightCm <= LIMITS.heightCm[1]),
    weightKg: !(weightKg >= LIMITS.weightKg[0] && weightKg <= LIMITS.weightKg[1]),
    name: d.name.trim().length === 0,
  };
  const ok = !bad.age && !bad.heightCm && !bad.weightKg && !bad.name;
  const profile: Profile | null = ok
    ? {
        name: d.name.trim(),
        sex: d.sex,
        age: Math.round(age),
        heightCm: Math.round(heightCm),
        weightKg: Math.round(weightKg * 10) / 10,
        activity: d.activity,
        goal: d.goal,
        pace: d.pace,
      }
    : null;
  return { bad, profile };
}

function sameProfile(a: Profile, b: Profile) {
  return (Object.keys(a) as (keyof Profile)[]).every((k) => a[k] === b[k]);
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  const { bad, profile: next } = validate(draft);
  const targets = useMemo(() => computeTargets(next ?? profile), [next, profile]);
  const dirty = next ? !sameProfile(next, profile) : true;

  const save = () => {
    if (!next || !dirty) return;
    actions.setProfile(next);
    setDraft(toDraft(next));
    setSaved(true);
  };

  const paceDesc = (p: Pace) => (draft.goal === "gain" ? PACE_LABELS[p].gain : PACE_LABELS[p].lose);

  return (
    <>
      <section className="card-3d space-y-5 p-4">
        <div>
          <FieldLabel htmlFor="kp-name">Meno / prezývka</FieldLabel>
          <input
            id="kp-name"
            type="text"
            autoComplete="nickname"
            maxLength={40}
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ako ťa má Paťo volať?"
            className={`${inputCls} ${bad.name ? "!border-kp-siren" : ""}`}
            style={{ fontSize: 17 }}
          />
        </div>

        <div>
          <FieldLabel>Pohlavie</FieldLabel>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pohlavie">
            <Chip selected={draft.sex === "female"} onClick={() => set("sex", "female")}>
              <span aria-hidden>👩</span> Žena
            </Chip>
            <Chip selected={draft.sex === "male"} onClick={() => set("sex", "male")}>
              <span aria-hidden>👨</span> Muž
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <NumberField id="kp-age" label="Vek" unit="r." value={draft.age} onChange={(v) => set("age", v)} invalid={bad.age} />
          <NumberField id="kp-height" label="Výška" unit="cm" value={draft.heightCm} onChange={(v) => set("heightCm", v)} invalid={bad.heightCm} />
          <NumberField id="kp-weight" label="Váha" unit="kg" value={draft.weightKg} onChange={(v) => set("weightKg", v)} invalid={bad.weightKg} />
        </div>
        {(bad.age || bad.heightCm || bad.weightKg) && (
          <p className="-mt-2 text-sm font-extrabold text-kp-siren-ink">
            🚨 Skontroluj čísla: vek {LIMITS.age[0]}–{LIMITS.age[1]}, výška {LIMITS.heightCm[0]}–{LIMITS.heightCm[1]} cm, váha {LIMITS.weightKg[0]}–{LIMITS.weightKg[1]} kg.
          </p>
        )}

        <div>
          <FieldLabel>Aktivita</FieldLabel>
          <div className="space-y-2" role="radiogroup" aria-label="Aktivita">
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => {
              const l = ACTIVITY_LABELS[a];
              const sel = draft.activity === a;
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => set("activity", a)}
                  className={`option-3d !min-h-[56px] !py-2 ${sel ? "is-selected" : ""}`}
                >
                  <span className="text-2xl" aria-hidden>
                    {l.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black leading-tight">{l.label}</span>
                    <span className={`block text-[13px] font-bold leading-snug ${sel ? "text-kp-blue-ink/80" : "text-kp-ink-2"}`}>{l.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Cieľ</FieldLabel>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cieľ">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <Chip key={g} selected={draft.goal === g} onClick={() => set("goal", g)}>
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-xl" aria-hidden>
                    {GOAL_LABELS[g].emoji}
                  </span>
                  <span className="text-[13px] font-black">{GOAL_LABELS[g].label}</span>
                </span>
              </Chip>
            ))}
          </div>
        </div>

        {draft.goal !== "maintain" && (
          <div className="kp-pop-in">
            <FieldLabel>Tempo</FieldLabel>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tempo">
              {(Object.keys(PACE_LABELS) as Pace[]).map((p) => (
                <Chip key={p} selected={draft.pace === p} onClick={() => set("pace", p)}>
                  <span className="flex flex-col items-center leading-tight">
                    <span className="text-xl" aria-hidden>
                      {PACE_LABELS[p].emoji}
                    </span>
                    <span className="text-[13px] font-black">{PACE_LABELS[p].label}</span>
                    <span className="text-[11px] font-bold opacity-75">{paceDesc(p)}</span>
                  </span>
                </Chip>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ---------- živé ciele ---------- */}
      <section className="card-3d mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="kp-h3">Tvoje denné ciele</h3>
          {dirty && next && <span className="rounded-full bg-kp-gold-tint px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-kp-gold-ink">náhľad</span>}
        </div>

        <div className="mb-3 flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--kp-kcal-tint)" }}>
          <span className="text-3xl" aria-hidden>
            🔥
          </span>
          <div className="flex-1">
            <div className="kp-overline" style={{ color: "var(--kp-kcal-lip)" }}>
              Energia
            </div>
            <div className="kp-h2 kp-num">
              {targets.kcal.toLocaleString("sk-SK")} <span className="text-base font-extrabold text-kp-ink-2">kcal</span>
            </div>
          </div>
          <div className="text-right text-[11px] font-bold leading-snug text-kp-ink-2 kp-num">
            BMR {targets.bmr}
            <br />
            výdaj {targets.tdee}
          </div>
        </div>
        {targets.floorApplied && <p className="kp-caption mb-3">Paťo nedovolí ísť pod bezpečné minimum, preto je cieľ zaokrúhlený nahor.</p>}

        <div className="grid grid-cols-2 gap-2">
          <TargetTile emoji="🥩" label="Bielkoviny" value={`${targets.proteinG} g`} tint="var(--kp-protein-tint)" ink="var(--kp-protein-lip)" />
          <TargetTile emoji="🍞" label="Sacharidy" value={`${targets.carbsG} g`} tint="var(--kp-carbs-tint)" ink="var(--kp-carbs-lip)" />
          <TargetTile emoji="🧈" label="Tuky" value={`${targets.fatG} g`} tint="var(--kp-fat-tint)" ink="var(--kp-fat-lip)" />
          <TargetTile emoji="🥦" label="Vláknina" value={`${targets.fiberG} g+`} tint="var(--kp-fiber-tint)" ink="var(--kp-fiber-lip)" />
          <TargetTile emoji="🍬" label="Limit cukru" value={`max ${targets.freeSugarMaxG} g`} sub={`ideál ${targets.freeSugarIdealG} g`} tint="var(--kp-sugar-tint)" ink="var(--kp-sugar-lip)" />
          <TargetTile emoji="🧂" label="Soľ" value="max 5 g" tint="var(--kp-bg-sunken)" ink="var(--kp-ink-2)" />
          <div className="col-span-2">
            <TargetTile
              emoji="💧"
              label="Voda"
              value={`${(targets.waterMl / 1000).toLocaleString("sk-SK", { maximumFractionDigits: 2 })} l`}
              tint="var(--kp-carbs-tint)"
              ink="var(--kp-carbs-lip)"
            />
          </div>
        </div>
      </section>

      <div className="mt-4">
        <button type="button" onClick={save} disabled={!next || (!dirty && !saved)} className={`btn-3d btn-3d--block ${saved ? "btn-3d--success" : ""}`}>
          {saved && !dirty ? "Uložené ✓" : "Uložiť údaje"}
        </button>
      </div>
    </>
  );
}

function TargetTile({ emoji, label, value, sub, tint, ink }: { emoji: string; label: string; value: string; sub?: string; tint: string; ink: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: tint }}>
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-black uppercase tracking-wide" style={{ color: ink }}>
          {label}
        </div>
        <div className="font-black leading-tight text-kp-ink kp-num">{value}</div>
        {sub && <div className="text-[11px] font-bold text-kp-ink-2 kp-num">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- AI prístup ---------- */

function aiMode(s: Settings): { label: string; cls: string; emoji: string } {
  if (s.ownApiKey.trim()) return { label: "Používa sa: tvoj kľúč", cls: "bg-kp-mint-tint text-kp-mint-ink border-kp-mint", emoji: "🔑" };
  if (s.inviteCode.trim()) return { label: "Používa sa: kód od kamoša", cls: "bg-kp-blue-tint text-kp-blue-ink border-kp-blue", emoji: "🎟️" };
  return { label: "Používa sa: nič — zadaj kód alebo kľúč", cls: "bg-kp-siren-tint text-kp-siren-ink border-kp-siren", emoji: "⚠️" };
}

function AiAccess({ settings }: { settings: Settings }) {
  const [code, setCode] = useState(settings.inviteCode);
  const [key, setKey] = useState(settings.ownApiKey);
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);
  const mode = aiMode(settings);
  const dirty = code.trim() !== settings.inviteCode || key.trim() !== settings.ownApiKey;
  const keyLooksOff = key.trim().length > 0 && !key.trim().startsWith("sk-ant-");

  const save = () => {
    if (!dirty) return;
    actions.setSettings({ inviteCode: code.trim(), ownApiKey: key.trim() });
    setCode(code.trim());
    setKey(key.trim());
    setSaved(true);
  };

  return (
    <section className="card-3d space-y-4 p-4">
      <div className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-sm font-black ${mode.cls}`}>
        <span aria-hidden>{mode.emoji}</span>
        <span>{mode.label}</span>
      </div>

      <p className="kp-caption !text-[14px]">
        Normálne appka analyzuje fotky cez server majiteľa — stačí <b className="text-kp-ink">kód od kamoša</b>. Ak zadáš{" "}
        <b className="text-kp-ink">vlastný Claude API kľúč</b>, fotky sa budú analyzovať na tvoj účet.
      </p>

      <div>
        <FieldLabel htmlFor="kp-invite">Kód od kamoša</FieldLabel>
        <input
          id="kp-invite"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setSaved(false);
          }}
          placeholder="napr. hliadka2026"
          className={inputCls}
        />
      </div>

      <div>
        <FieldLabel htmlFor="kp-key">Vlastný Claude API kľúč</FieldLabel>
        <div className="relative">
          <input
            id="kp-key"
            type={reveal ? "text" : "password"}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setSaved(false);
            }}
            placeholder="sk-ant-…"
            className={`${inputCls} pr-20 font-mono`}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[12px] font-black uppercase tracking-wide text-kp-blue active:scale-95"
          >
            {reveal ? "Skryť" : "Ukázať"}
          </button>
        </div>
        {keyLooksOff && <p className="mt-1.5 text-[13px] font-extrabold text-kp-gold-ink">Hmm, kľúče od Anthropicu zvyčajne začínajú „sk-ant-“.</p>}
        <ul className="kp-caption mt-2 space-y-1">
          <li>🔑 Kľúč získaš na console.anthropic.com → API Keys.</li>
          <li>📱 Kľúč ostáva len v tomto telefóne a posiela sa iba spolu s analýzou tvojej fotky.</li>
        </ul>
      </div>

      <button type="button" onClick={save} disabled={!dirty && !saved} className={`btn-3d btn-3d--block ${saved && !dirty ? "btn-3d--success" : ""}`}>
        {saved && !dirty ? "Uložené ✓" : "Uložiť prístup"}
      </button>
    </section>
  );
}

/* ---------- inštalácia ---------- */

function InstallGuide() {
  const steps = [
    { os: "iPhone", app: "Safari", emoji: "🍎", path: ["Zdieľať", "Pridať na plochu"], icon: "⬆️" },
    { os: "Android", app: "Chrome", emoji: "🤖", path: ["⋮ menu", "Pridať na plochu"], icon: "⋮" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {steps.map((s) => (
        <div key={s.os} className="card-3d flex items-center gap-3 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-kp-sunken text-2xl" aria-hidden>
            {s.emoji}
          </span>
          <div className="min-w-0">
            <div className="font-black">
              {s.os} <span className="font-bold text-kp-ink-2">· {s.app}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-extrabold">
              {s.path.map((p, i) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-kp-muted">→</span>}
                  <span className="rounded-lg border-2 border-kp-line bg-kp-surface px-2 py-0.5">{p}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="kp-caption px-1">Potom sa Kalorická polícia otvára ako normálna appka — na celú obrazovku, bez lišty prehliadača.</p>
    </div>
  );
}

/* ---------- dáta ---------- */

function DataSection() {
  const [confirming, setConfirming] = useState(false);
  const [wiping, setWiping] = useState(false);

  const exportData = () => {
    const state = getState();
    const blob = new Blob([JSON.stringify({ app: "kaloricka-policia", exportedAt: new Date().toISOString(), ...state }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaloricka-policia-${dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const wipe = () => {
    setWiping(true);
    actions.resetAll();
    // Krátka pauza, aby sa stihol uložiť prázdny stav do IndexedDB.
    setTimeout(() => {
      location.href = "/onboarding";
    }, 300);
  };

  return (
    <section className="card-3d space-y-3 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-kp-mint-tint px-3 py-3">
        <span className="text-2xl" aria-hidden>
          🔒
        </span>
        <p className="text-[15px] font-extrabold leading-snug text-kp-mint-ink">Všetky dáta sú len v tvojom telefóne.</p>
      </div>

      <button type="button" onClick={exportData} className="btn-3d btn-3d--secondary btn-3d--block">
        📦 Exportovať dáta
      </button>

      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="btn-3d btn-3d--danger btn-3d--block">
          🗑️ Vymazať všetko
        </button>
      ) : (
        <div className="kp-shake rounded-2xl border-2 border-kp-siren bg-kp-siren-tint p-3">
          <p className="mb-3 text-[15px] font-extrabold leading-snug text-kp-siren-ink">
            Naozaj? Zmažú sa všetky jedlá, voda, profil aj nastavenia. Toto sa nedá vrátiť.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="btn-3d btn-3d--secondary btn-3d--sm" disabled={wiping}>
              Nie, späť
            </button>
            <button type="button" onClick={wipe} className="btn-3d btn-3d--danger btn-3d--sm" disabled={wiping}>
              {wiping ? "Mažem…" : "Áno, vymazať"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- stránka ---------- */

export default function ProfilePage() {
  const { profile, meals, water, settings } = useAppState();
  const rank = useMemo(() => (profile ? rankFor(totalXp(meals, profile, water)) : null), [profile, meals, water]);

  if (!profile || !rank) return null;

  return (
    <div className="pb-6">
      <header className="card-3d mt-2 flex items-center gap-4 overflow-hidden p-4" style={{ background: "linear-gradient(160deg, var(--kp-blue-tint), var(--kp-surface) 70%)" }}>
        <Mascot mood="happy" size={84} bob className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="kp-overline text-kp-ink-2">Služobný preukaz</div>
          <h1 className="kp-h1 truncate">{profile.name || "Ja"}</h1>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-kp-gold px-3 py-1 text-sm font-black text-kp-ink" style={{ boxShadow: "0 3px 0 0 var(--kp-gold-lip)" }}>
            <span aria-hidden>{rank.emoji}</span> {rank.name} <span className="opacity-70">· lvl {rank.level}</span>
          </div>
        </div>
      </header>

      <SectionTitle emoji="📋">Moje údaje</SectionTitle>
      <ProfileForm profile={profile} />

      <SectionTitle emoji="🤖">AI prístup</SectionTitle>
      <AiAccess settings={settings} />

      <SectionTitle emoji="📲">Ako nainštalovať na plochu</SectionTitle>
      <InstallGuide />

      <SectionTitle emoji="💾">Dáta</SectionTitle>
      <DataSection />

      <p className="kp-caption mt-8 px-2 text-center">⚕️ Odhady AI nie sú lekárska rada.</p>
    </div>
  );
}
