"use client";

import { dayKey } from "./dates";
import { sanitizeItem } from "./meals";
import { actions, getState } from "./store";
import type { AnalysisResult, Meal } from "./types";

async function loadImage(file: Blob): Promise<HTMLImageElement | ImageBitmap> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fallback nižšie */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function toJpeg(src: HTMLImageElement | ImageBitmap, maxSide: number, quality: number): string {
  const w = src.width;
  const h = src.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Jeden klik: fotka → okamžite uložené jedlo → analýza na pozadí. Vráti id jedla. */
export async function captureMeal(file: File, caption?: string): Promise<string> {
  const img = await loadImage(file);
  const full = toJpeg(img, 1280, 0.82);
  const thumb = toJpeg(img, 720, 0.72); // náhľad, slúži aj na opakovanú analýzu
  const id = uid();
  const now = new Date();
  const meal: Meal = {
    id,
    createdAt: now.toISOString(),
    dayKey: dayKey(now),
    photo: thumb,
    caption,
    status: "analyzing",
    title: "Vyšetrujem…",
    emoji: "🔎",
    items: [],
    portion: 1,
  };
  actions.addMeal(meal);
  void runAnalysis(id, full.split(",")[1], caption);
  return id;
}

export async function retryMeal(id: string, caption?: string) {
  const m = getState().meals.find((x) => x.id === id);
  if (!m?.photo) return;
  actions.updateMeal(id, { status: "analyzing", error: undefined, title: "Vyšetrujem…", emoji: "🔎" });
  // Pôvodnú veľkú fotku neukladáme (šetríme miesto), opakovanie ide z náhľadu.
  if (caption !== undefined) actions.updateMeal(id, { caption });
  await runAnalysis(id, m.photo.split(",")[1], caption ?? m.caption);
}

async function runAnalysis(id: string, base64: string, caption?: string) {
  const { settings } = getState();
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.ownApiKey ? { "x-user-api-key": settings.ownApiKey } : {}),
      },
      body: JSON.stringify({ image: base64, mediaType: "image/jpeg", caption, inviteCode: settings.inviteCode }),
    });
    const data = (await res.json().catch(() => ({}))) as { result?: AnalysisResult; error?: string };
    if (!res.ok || !data.result) throw new Error(data.error ?? `Chyba ${res.status}`);
    const r = data.result;
    if (!r.isFood || r.items.length === 0) {
      actions.updateMeal(id, {
        status: "error",
        title: "Toto nie je jedlo 🤨",
        emoji: "🤨",
        error: r.verdict || "Na fotke som nenašiel jedlo.",
      });
      return;
    }
    actions.updateMeal(id, {
      status: "done",
      title: r.mealTitle,
      emoji: r.emoji || "🍽️",
      items: r.items.map(sanitizeItem),
      notes: r.notes || undefined,
      question: r.question || undefined,
      verdict: r.verdict,
      mealConfidence: r.mealConfidence,
    });
    window.dispatchEvent(new CustomEvent("kp:meal-done", { detail: { id } }));
  } catch (e) {
    actions.updateMeal(id, {
      status: "error",
      title: "Analýza zlyhala",
      emoji: "⚠️",
      error: e instanceof Error ? e.message : "Neznáma chyba",
    });
  }
}
