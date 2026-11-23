"use client";

import { useMemo, useRef, useState } from "react";
import { actions, getState, useAppState } from "@/lib/store";
import { dayKey } from "@/lib/dates";
import { ACTIVITY_LABELS, GOAL_LABELS, computeTargets, type Activity, type Goal, type Pace, type Profile, type Sex } from "@/lib/nutrition";
import type { Meal, Settings } from "@/lib/types";
import { AuthForm } from "@/components/AuthForm";
import { deleteEverything, signOut, syncNow } from "@/lib/sync";
import { MASCOT_SHORT, g } from "@/lib/voice";

/* ---------- malé stavebné kocky ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="kp-h3 mb-3 mt-8 px-1">{children}</h2>;
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

function NumberField({ id, label, unit, value, onChange, invalid }: { id: string; label: string; unit: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
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
      className={`option-3d !min-h-[48px] !justify-center !gap-1.5 !px-2 !py-2 text-center !text-[14px] ${selected ? "is-selected" : ""}`}
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
  pace: Pace; // v UI sa nezobrazuje, len sa zachováva
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

const LIMITS = { age: [14, 100], heightCm: [120, 230], weightKg: [35, 300] } as const;

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

const sameProfile = (a: Profile, b: Profile) => (Object.keys(a) as (keyof Profile)[]).every((k) => a[k] === b[k]);

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

  return (
    <section className="card-3d space-y-4 p-4">
      <div>
        <FieldLabel htmlFor="kp-name">Meno</FieldLabel>
        <input
          id="kp-name"
          type="text"
          autoComplete="nickname"
          maxLength={40}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={`Ako ťa má ${MASCOT_SHORT[draft.sex]} volať?`}
          className={`${inputCls} ${bad.name ? "!border-kp-siren" : ""}`}
          style={{ fontSize: 17 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pohlavie">
        <Chip selected={draft.sex === "female"} onClick={() => set("sex", "female")}>
          Žena
        </Chip>
        <Chip selected={draft.sex === "male"} onClick={() => set("sex", "male")}>
          Muž
        </Chip>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField id="kp-age" label="Vek" unit="r." value={draft.age} onChange={(v) => set("age", v)} invalid={bad.age} />
        <NumberField id="kp-height" label="Výška" unit="cm" value={draft.heightCm} onChange={(v) => set("heightCm", v)} invalid={bad.heightCm} />
        <NumberField id="kp-weight" label="Váha" unit="kg" value={draft.weightKg} onChange={(v) => set("weightKg", v)} invalid={bad.weightKg} />
      </div>
      {(bad.age || bad.heightCm || bad.weightKg) && <p className="-mt-2 text-sm font-extrabold text-kp-siren-ink">{g(draft.sex, "Tieto čísla si si vymyslel. Oprav to.", "Tieto čísla nesedia. Skontroluj ich.")}</p>}

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
                className={`option-3d !min-h-[48px] !py-2 ${sel ? "is-selected" : ""}`}
              >
                <span className="text-xl" aria-hidden>
                  {l.emoji}
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-black leading-tight">
                  {g(draft.sex, l.label, l.labelF)} <span className={`text-[12px] font-bold ${sel ? "text-kp-blue-ink/80" : "text-kp-ink-2"}`}>· {l.desc}</span>
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
              <span aria-hidden>{GOAL_LABELS[g].emoji}</span> {GOAL_LABELS[g].label}
            </Chip>
          ))}
        </div>
      </div>

      <p className="kp-num rounded-2xl bg-kp-sunken px-4 py-3 text-center text-[15px] font-black">
        🔥 {targets.kcal.toLocaleString("sk-SK")} kcal · 🥩 {targets.proteinG} g bielkovín denne
      </p>

      <button type="button" onClick={save} disabled={!next || (!dirty && !saved)} className={`btn-3d btn-3d--block ${saved && !dirty ? "btn-3d--success" : ""}`}>
        {saved && !dirty ? "Uložené ✓" : "Uložiť"}
      </button>
    </section>
  );
}

/* ---------- AI prístup ---------- */

function AiAccess({ settings }: { settings: Settings }) {
  const [code, setCode] = useState(settings.inviteCode);
  const [key, setKey] = useState(settings.ownApiKey);
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);
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
      <p className="kp-caption !text-[14px]">
        Stačí kód od kamoša. S vlastným Claude kľúčom (console.anthropic.com) ide analýza na tvoj účet. Kľúč ostáva v telefóne.
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
        {keyLooksOff && <p className="mt-1.5 text-[13px] font-extrabold text-kp-gold-ink">Kľúč od Anthropicu začína „sk-ant-“. Toto nie je on.</p>}
      </div>

      <button type="button" onClick={save} disabled={!dirty && !saved} className={`btn-3d btn-3d--block ${saved && !dirty ? "btn-3d--success" : ""}`}>
        {saved && !dirty ? "Uložené ✓" : "Uložiť prístup"}
      </button>
    </section>
  );
}

/* ---------- dáta ---------- */

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

function isProfile(p: unknown): p is Profile {
  return isObj(p) && typeof p.name === "string" && typeof p.sex === "string" && typeof p.age === "number" && typeof p.heightCm === "number" && typeof p.weightKg === "number" && typeof p.activity === "string" && typeof p.goal === "string";
}

function isMeal(m: unknown): m is Meal {
  return isObj(m) && typeof m.id === "string" && typeof m.dayKey === "string" && typeof m.createdAt === "string" && typeof m.status === "string" && Array.isArray(m.items);
}

function importBackup(raw: string): number {
  const data: unknown = JSON.parse(raw);
  if (!isObj(data) || !isProfile(data.profile) || !Array.isArray(data.meals) || !data.meals.every(isMeal)) {
    throw new Error("bad backup");
  }
  const profile: Profile = { ...data.profile, pace: data.profile.pace ?? "normal" };
  const meals = data.meals as Meal[];
  actions.resetAll(true);
  actions.setProfile(profile);
  if (isObj(data.settings)) {
    const s = data.settings;
    actions.setSettings({
      inviteCode: typeof s.inviteCode === "string" ? s.inviteCode : "",
      ownApiKey: typeof s.ownApiKey === "string" ? s.ownApiKey : "",
    });
  }
  // addMeal pridáva na začiatok → ideme od najstaršieho, aby najnovšie skončilo prvé.
  for (const m of [...meals].reverse()) actions.addMeal(m);
  return meals.length;
}

function AccountSection() {
  const { sync, profile } = useAppState();
  const [busy, setBusy] = useState(false);
  const pending = Object.keys(sync.dirtyMeals).length + sync.deletedMeals.length + (sync.profileDirty ? 1 : 0);

  if (!sync.userId) {
    return (
      <section className="card-3d space-y-3 p-4">
        <p className="text-[15px] font-extrabold leading-snug text-kp-ink-2">
          Bez účtu sú dáta len v tomto telefóne. Prihlás sa a nič nestratíš, ani keď zmeníš mobil.
        </p>
        <AuthForm submitLabel="Prihlásiť / založiť účet" onDone={() => {}} />
      </section>
    );
  }

  const logout = async () => {
    if (!window.confirm("Odhlásiť? Dáta ostanú v účte, z telefónu zmiznú.")) return;
    setBusy(true);
    await signOut();
    location.href = "/onboarding";
  };

  return (
    <section className="card-3d space-y-3 p-4">
      <div>
        <div className="kp-overline text-kp-muted">{g(profile?.sex, "Prihlásený", "Prihlásená")}</div>
        <div className="break-all text-[17px] font-black">{sync.email}</div>
        <button type="button" onClick={() => void syncNow()} className="kp-caption mt-1 text-left">
          {pending ? `☁️ Čaká na odoslanie: ${pending}` : "✅ Všetko je uložené v účte"}
        </button>
      </div>
      <button type="button" onClick={logout} disabled={busy} className="btn-3d btn-3d--secondary btn-3d--sm btn-3d--block">
        {busy ? "Odhlasujem…" : "Odhlásiť"}
      </button>
    </section>
  );
}

function DataSection() {
  const { sync } = useAppState();
  const [confirming, setConfirming] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Import prepíše všetko, čo je teraz v telefóne. Ideme?")) return;
    try {
      const n = importBackup(await file.text());
      setMsg({ ok: true, text: `Hotovo. Načítaných ${n} jedál.` });
    } catch {
      setMsg({ ok: false, text: "Toto nie je záloha Kalorickej polície. Skús iný súbor." });
    }
  };

  const wipe = async () => {
    setWiping(true);
    await deleteEverything().catch(() => actions.resetAll());
    // Krátka pauza, aby sa stihol uložiť prázdny stav do IndexedDB.
    setTimeout(() => {
      location.href = "/onboarding";
    }, 300);
  };

  return (
    <section className="card-3d space-y-3 p-4">
      <p className="text-[15px] font-extrabold leading-snug text-kp-ink-2">Záloha do súboru, keby niečo.</p>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={exportData} className="btn-3d btn-3d--secondary btn-3d--sm">
          Export JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-3d btn-3d--secondary btn-3d--sm">
          Import JSON
        </button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      {msg && <p className={`text-[14px] font-extrabold ${msg.ok ? "text-kp-mint-ink" : "text-kp-siren-ink"}`}>{msg.text}</p>}

      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="btn-3d btn-3d--danger btn-3d--block">
          Vymazať všetko
        </button>
      ) : (
        <div className="kp-shake rounded-2xl border-2 border-kp-siren bg-kp-siren-tint p-3">
          <p className="mb-3 text-[15px] font-extrabold leading-snug text-kp-siren-ink">{sync.userId ? "Zmaže sa všetko, aj v účte." : "Zmaže sa úplne všetko."} Späť to nejde.</p>
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
  const { profile, settings, onboardedAt } = useAppState();
  if (!profile) return null;
  // onboardedAt sa mení pri importe → formuláre sa načítajú nanovo.

  return (
    <div className="pb-6 pt-2">
      <h1 className="kp-h1">Ja</h1>

      <SectionTitle>Účet</SectionTitle>
      <AccountSection />

      <SectionTitle>Moje údaje</SectionTitle>
      <ProfileForm key={`p-${onboardedAt}`} profile={profile} />

      <SectionTitle>AI prístup</SectionTitle>
      <AiAccess key={`a-${onboardedAt}`} settings={settings} />

      <SectionTitle>Dáta</SectionTitle>
      <DataSection />

      <p className="kp-caption mt-8 px-2 text-center">Odhady AI nie sú lekárska rada.</p>
    </div>
  );
}
