"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { retryMeal } from "@/lib/capture";
import { timeLabel, mealSlot } from "@/lib/dates";
import { XP } from "@/lib/game";
import { itemTotals, mealTotals } from "@/lib/meals";
import { actions, useAppState } from "@/lib/store";
import { celebrate, haptic } from "./confetti";
import { Mascot, MascotBubble } from "./Mascot";
import { Sheet } from "./Sheet";

const THINKING = [
  "Kontrolujem doklady tvojho jedla…",
  "Vypočúvam omáčku. Mlčí.",
  "Hľadám skryté kalórie v oleji…",
  "Porovnávam s databázou podozrivých…",
  "Vážim porciu okom zákona…",
  "Spisujem zápisnicu…",
];

const PORTIONS = [
  { v: 0.5, l: "½" },
  { v: 1, l: "1×" },
  { v: 1.5, l: "1½" },
  { v: 2, l: "2×" },
];

export function MealSheet({ id, fresh, onClose }: { id: string | null; fresh: boolean; onClose: () => void }) {
  const { meals } = useAppState();
  const meal = meals.find((m) => m.id === id) ?? null;
  const [line, setLine] = useState(0);
  const [caption, setCaption] = useState("");
  const [editing, setEditing] = useState(false);
  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    if (meal?.status !== "analyzing") return;
    const t = setInterval(() => setLine((l) => (l + 1) % THINKING.length), 2200);
    return () => clearInterval(t);
  }, [meal?.status]);

  useEffect(() => {
    if (!meal) {
      prevStatus.current = null;
      return;
    }
    if (prevStatus.current === "analyzing" && meal.status === "done") {
      celebrate();
      haptic(30);
    }
    prevStatus.current = meal.status;
  }, [meal]);

  useEffect(() => {
    setCaption("");
    setEditing(false);
  }, [id]);

  if (!meal) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const tot = mealTotals(meal);

  return (
    <Sheet open={!!meal} onClose={onClose}>
      {meal.photo && (
        <div className="relative mt-1 overflow-hidden rounded-[20px] border-2 border-kp-line">
          <img src={meal.photo} alt="" className={`aspect-[4/3] w-full object-cover ${meal.status === "analyzing" ? "brightness-90" : ""}`} />
          {meal.status === "analyzing" && <div className="kp-scan absolute inset-x-0 h-16" />}
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold">
            {mealSlot(meal.createdAt)} · {timeLabel(meal.createdAt)}
          </div>
        </div>
      )}

      {meal.status === "analyzing" && (
        <div className="py-6 text-center">
          <Mascot mood="thinking" size={110} bob className="mx-auto" />
          <h2 className="kp-h2 mt-2">Vyšetrujem…</h2>
          <p key={line} className="kp-body-lg kp-pop-in mt-1 text-kp-ink-2">{THINKING[line]}</p>
          <p className="kp-caption mt-4">Pokojne zavri, jedlo sa uloží samo.</p>
          <button className="btn-3d btn-3d--secondary btn-3d--block mt-4" onClick={onClose}>Ok, zatvoriť</button>
        </div>
      )}

      {meal.status === "error" && (
        <div className="py-5">
          <MascotBubble mood="strict">
            <b>{meal.title}</b>
            <div className="text-kp-ink-2">{meal.error}</div>
          </MascotBubble>
          <CaptionInput value={caption} onChange={setCaption} />
          <button className="btn-3d btn-3d--block mt-3" onClick={() => retryMeal(meal.id, caption || undefined)}>Skúsiť znova</button>
          <button className="btn-ghost mt-1 w-full !text-kp-siren" onClick={() => { actions.deleteMeal(meal.id); onClose(); }}>Zmazať</button>
        </div>
      )}

      {meal.status === "done" && (
        <div className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="kp-overline text-kp-muted">Zápisnica</div>
              <h2 className="kp-h1">{meal.emoji} {meal.title}</h2>
            </div>
            {fresh && (
              <div className="kp-pop-in shrink-0 rounded-full bg-kp-gold px-3 py-1.5 text-sm font-black text-kp-ink" style={{ boxShadow: "0 3px 0 var(--kp-gold-lip)" }}>
                +{XP.meal} XP
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <Chip label="kcal" value={tot.kcal} color="var(--kp-kcal)" tint="var(--kp-kcal-tint)" big />
            <Chip label="bielk." value={tot.proteinG} unit="g" color="var(--kp-protein)" tint="var(--kp-protein-tint)" />
            <Chip label="sach." value={tot.carbsG} unit="g" color="var(--kp-carbs)" tint="var(--kp-carbs-tint)" />
            <Chip label="tuky" value={tot.fatG} unit="g" color="var(--kp-fat)" tint="var(--kp-fat-tint)" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-extrabold">
            <Pill bg="var(--kp-sugar-tint)" fg="var(--kp-sugar-lip)">🍬 cukor {Math.round(tot.sugarG)} g (pridaný {Math.round(tot.addedSugarG)} g)</Pill>
            <Pill bg="var(--kp-fiber-tint)" fg="var(--kp-fiber-lip)">🥦 vláknina {Math.round(tot.fiberG)} g</Pill>
            <Pill bg="var(--kp-carbs-tint)" fg="var(--kp-carbs-lip)">🧂 soľ {((tot.sodiumMg * 2.5) / 1000).toFixed(1)} g</Pill>
          </div>

          {meal.verdict && (
            <MascotBubble mood={tot.addedSugarG > 25 ? "strict" : "celebrate"} size={72} className="mt-4">
              {meal.verdict}
            </MascotBubble>
          )}

          <div className="kp-overline mt-2 text-kp-muted">Porcia</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {PORTIONS.map((p) => (
              <button
                key={p.v}
                onClick={() => { haptic(); actions.updateMeal(meal.id, { portion: p.v }); }}
                className={`option-3d !min-h-12 justify-center !p-0 text-lg ${meal.portion === p.v ? "is-selected" : ""}`}
              >
                {p.l}
              </button>
            ))}
          </div>

          <div className="kp-overline mt-4 text-kp-muted">Čo som našiel</div>
          <ul className="mt-2 space-y-2">
            {meal.items.map((it, idx) => {
              const t = itemTotals([it], meal.portion);
              return (
                <li key={idx} className="card-3d flex items-start gap-3 !mb-1 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold">{it.name}</div>
                    <div className="kp-caption">
                      ~{Math.round(it.grams * meal.portion)} g · B {Math.round(t.proteinG)} · S {Math.round(t.carbsG)} · T {Math.round(t.fatG)}
                    </div>
                    {it.assumptions && <div className="kp-caption mt-0.5 !text-kp-muted">{it.assumptions}</div>}
                  </div>
                  <div className="kp-num shrink-0 text-right font-black text-kp-kcal">{Math.round(t.kcal)}<div className="text-[11px] text-kp-muted">kcal</div></div>
                  {meal.items.length > 1 && (
                    <button
                      aria-label={`Odstrániť ${it.name}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kp-sunken text-kp-muted"
                      onClick={() => actions.updateMeal(meal.id, { items: meal.items.filter((_, i) => i !== idx) })}
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {(meal.question || meal.notes) && (
            <div className="mt-3 rounded-2xl bg-kp-blue-tint p-3 text-sm font-bold text-kp-blue-ink">
              💡 {meal.question || meal.notes}
            </div>
          )}

          {editing ? (
            <div className="mt-3">
              <CaptionInput value={caption} onChange={setCaption} autoFocus />
              <button className="btn-3d btn-3d--block mt-3" disabled={!caption.trim()} onClick={() => retryMeal(meal.id, caption)}>
                Prepočítať
              </button>
            </div>
          ) : (
            <button className="btn-ghost mt-2 w-full" onClick={() => setEditing(true)}>✏️ Spresniť popisom</button>
          )}

          <button className="btn-3d btn-3d--success btn-3d--block mt-3" onClick={onClose}>Hotovo</button>
          <button
            className="btn-ghost w-full !text-kp-siren"
            onClick={() => { if (confirm("Zmazať toto jedlo?")) { actions.deleteMeal(meal.id); onClose(); } }}
          >
            Zmazať jedlo
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Chip({ label, value, unit = "", color, tint, big }: { label: string; value: number; unit?: string; color: string; tint: string; big?: boolean }) {
  return (
    <div className="rounded-2xl px-1 py-2" style={{ background: tint }}>
      <div className={`kp-num font-black ${big ? "text-2xl" : "text-xl"}`} style={{ color }}>
        {Math.round(value)}
        <span className="text-xs">{unit}</span>
      </div>
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-kp-ink-2">{label}</div>
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return <span className="rounded-full px-2.5 py-1" style={{ background: bg, color: fg }}>{children}</span>;
}

function CaptionInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <textarea
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder="Napr. „cola zero, polovičná porcia, bez dresingu“"
      className="mt-3 w-full rounded-2xl border-2 border-kp-line bg-kp-surface p-3 font-bold outline-none focus:border-kp-blue"
    />
  );
}
