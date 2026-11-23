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

/* ---------- dátum fotky (EXIF) ---------- */

/** Dátum odfotenia z EXIF (DateTimeOriginal, inak DateTime). Len JPEG, inak null. */
async function exifDate(file: Blob): Promise<Date | null> {
  try {
    const v = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (v.getUint16(0) !== 0xffd8) return null;
    let o = 2;
    while (o + 10 < v.byteLength) {
      const marker = v.getUint16(o);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null; // začali obrazové dáta
      if (marker === 0xffe1 && v.getUint32(o + 4) === 0x45786966) return readTiffDate(v, o + 10);
      o += 2 + v.getUint16(o + 2);
    }
  } catch {
    /* poškodený / iný formát */
  }
  return null;
}

function readTiffDate(v: DataView, tiff: number): Date | null {
  const le = v.getUint16(tiff) === 0x4949;
  const u16 = (p: number) => v.getUint16(p, le);
  const u32 = (p: number) => v.getUint32(p, le);
  const ascii = (e: number) => {
    const n = u32(e + 4);
    const at = n > 4 ? tiff + u32(e + 8) : e + 8;
    let out = "";
    for (let i = 0; i < n - 1; i++) out += String.fromCharCode(v.getUint8(at + i));
    return out;
  };
  const scan = (ifd: number, fn: (tag: number, entry: number) => void) => {
    const count = u16(tiff + ifd);
    for (let i = 0; i < count; i++) fn(u16(tiff + ifd + 2 + i * 12), tiff + ifd + 2 + i * 12);
  };
  let date = "";
  let exifIfd = 0;
  scan(u32(tiff + 4), (tag, e) => {
    if (tag === 0x0132) date = ascii(e);
    if (tag === 0x8769) exifIfd = u32(e + 8);
  });
  if (exifIfd) scan(exifIfd, (tag, e) => { if (tag === 0x9003) date = ascii(e); });
  const m = date.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MAX_BACK_MS = 30 * 86_400_000;

/** Kedy bolo jedlo odfotené. Pri fotke z galérie skúsi EXIF, potom dátum súboru, inak teraz. */
async function takenAt(file: File, fromGallery: boolean): Promise<Date> {
  const now = Date.now();
  const plausible = (t: number) => t <= now + 5 * 60_000 && t >= now - MAX_BACK_MS;
  if (!fromGallery) return new Date(now);
  const exif = await exifDate(file);
  if (exif && plausible(exif.getTime())) return new Date(Math.min(exif.getTime(), now));
  // iOS dáva lastModified = čas výberu, Android často skutočný čas fotky.
  if (file.lastModified && plausible(file.lastModified) && now - file.lastModified > 5 * 60_000) return new Date(file.lastModified);
  return new Date(now);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Jeden klik: fotka → okamžite uložené jedlo → analýza na pozadí. Vráti id jedla. */
export async function captureMeal(file: File, opts: { caption?: string; fromGallery?: boolean } = {}): Promise<string> {
  const { caption, fromGallery = false } = opts;
  const [img, now] = await Promise.all([loadImage(file), takenAt(file, fromGallery)]);
  const full = toJpeg(img, 1280, 0.82);
  const thumb = toJpeg(img, 720, 0.72); // náhľad, slúži aj na opakovanú analýzu
  const id = uid();
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
  const { settings, profile } = getState();
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.ownApiKey ? { "x-user-api-key": settings.ownApiKey } : {}),
      },
      body: JSON.stringify({ image: base64, mediaType: "image/jpeg", caption, inviteCode: settings.inviteCode, sex: profile?.sex }),
    });
    const data = (await res.json().catch(() => ({}))) as { result?: AnalysisResult; error?: string };
    if (!res.ok || !data.result) throw new Error(data.error ?? `Chyba ${res.status}`);
    const r = data.result;
    if (!r.isFood || r.items.length === 0) {
      actions.updateMeal(id, {
        status: "error",
        title: "Toto nie je jedlo",
        emoji: "🤨",
        error: r.verdict || "Čo mi to posielaš? Odfoť jedlo.",
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
      title: "Nevyšlo to",
      emoji: "⚠️",
      error: e instanceof Error ? e.message : "Neznáma chyba",
    });
  }
}
