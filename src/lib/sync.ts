"use client";

// Účet a synchronizácia cez Supabase. Appka funguje aj bez účtu (len lokálne);
// po prihlásení sa každá zmena pošle na server a pri štarte sa stiahne, čo je nové.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { actions, applyRemote, getState, subscribeState } from "./store";
import type { Profile } from "./nutrition";
import type { Meal } from "./types";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  }
  return client;
}

/* ---------------- prihlásenie ---------------- */

export type AuthResult = { ok: true; created: boolean } | { ok: false; error: string };

/** Jeden formulár: existujúci účet prihlási, nový email zaregistruje. */
export async function signInOrUp(emailRaw: string, password: string): Promise<AuthResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Toto nie je email, šéfko." };
  if (password.length < 6) return { ok: false, error: "Heslo aspoň 6 znakov." };
  const sb = supabase();

  const signIn = await sb.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) {
    await onSignedIn(signIn.data.user.id, email);
    return { ok: true, created: false };
  }
  if (signIn.error && signIn.error.code !== "invalid_credentials") return { ok: false, error: humanError(signIn.error.message) };

  const signUp = await sb.auth.signUp({ email, password });
  if (signUp.error) {
    if (signUp.error.code === "user_already_exists") return { ok: false, error: "Zlé heslo. Skús znova." };
    return { ok: false, error: humanError(signUp.error.message) };
  }
  // Bez potvrdzovania emailu dostaneme session hneď. Pri existujúcom emaile ju Supabase nevráti.
  if (!signUp.data.session || !signUp.data.user) return { ok: false, error: "Zlé heslo. Skús znova." };
  await onSignedIn(signUp.data.user.id, email);
  return { ok: true, created: true };
}

function humanError(msg: string) {
  if (/fetch|network/i.test(msg)) return "Nejde internet. Skús o chvíľu.";
  if (/rate|too many/i.test(msg)) return "Priveľa pokusov. Počkaj chvíľu.";
  return "Prihlásenie nevyšlo. Skús znova.";
}

async function onSignedIn(userId: string, email: string) {
  const s = getState();
  const switched = s.sync.userId && s.sync.userId !== userId;
  if (switched) actions.resetAll();
  // Prvé prihlásenie na tomto zariadení: všetko, čo je v telefóne, pošli do účtu.
  applyRemote((st) => ({
    ...st,
    sync: {
      ...st.sync,
      userId,
      email,
      lastPull: undefined,
      dirtyMeals: Object.fromEntries(st.meals.map((m) => [m.id, 1])),
    },
  }));
  firstSync = true;
  await syncNow();
}

/** Odošle čo treba, odhlási a zmaže dáta z telefónu (ostanú v účte). */
export async function signOut() {
  try {
    await syncNow();
  } catch {
    /* aj tak odhlásiť */
  }
  await supabase().auth.signOut().catch(() => {});
  actions.resetAll();
}

/** Zmaže dáta aj v účte a odhlási. */
export async function deleteEverything() {
  const { userId } = getState().sync;
  if (userId) {
    const sb = supabase();
    await sb.from("meals").delete().eq("user_id", userId);
    await sb.from("profiles").delete().eq("user_id", userId);
    await sb.auth.signOut().catch(() => {});
  }
  actions.resetAll();
}

/* ---------------- synchronizácia ---------------- */

let running = false;
let again = false;
let firstSync = false;
let started = false;

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const sb = supabase();
  void sb.auth.getSession().then(({ data }) => {
    const st = getState();
    if (data.session && st.sync.userId === data.session.user.id) void syncNow();
    else if (data.session && !st.sync.userId) void onSignedIn(data.session.user.id, data.session.user.email ?? "");
    else if (!data.session && st.sync.userId) {
      // Session vypršala/zmizla: necháme dáta, len zabudneme účet, nech sa dá prihlásiť znova.
      applyRemote((s) => ({ ...s, sync: { ...s.sync, userId: undefined } }));
    }
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastDirty = "";
  subscribeState(() => {
    const { sync } = getState();
    if (!sync.userId) return;
    const sig = `${Object.values(sync.dirtyMeals).join(",")}|${sync.deletedMeals.length}|${sync.profileDirty}`;
    if (sig === lastDirty) return;
    lastDirty = sig;
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), 1500);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });
  window.addEventListener("online", () => void syncNow());
}

export async function syncNow(): Promise<void> {
  if (!getState().sync.userId) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    await push();
    await pull();
  } catch (e) {
    console.warn("sync failed", e);
  } finally {
    running = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

type MealRow = { id: string; data: Omit<Meal, "photo">; photo: string | null; deleted: boolean; updated_at: string };
type ProfileRow = { profile: Profile | null; onboarded_at: string | null; settings: { inviteCode?: string } | null; updated_at: string };

async function push() {
  const sb = supabase();
  const s = getState();
  const userId = s.sync.userId!;

  if (s.sync.profileDirty && s.profile) {
    const v = s.sync.profileDirty;
    const { error } = await sb.from("profiles").upsert({
      user_id: userId,
      profile: s.profile,
      onboarded_at: s.onboardedAt ?? null,
      settings: { inviteCode: s.settings.inviteCode },
    });
    if (error) throw error;
    applyRemote((st) => (st.sync.profileDirty === v ? { ...st, sync: { ...st.sync, profileDirty: 0 } } : st));
  }

  const dirty = Object.entries(s.sync.dirtyMeals);
  const ready = dirty
    .map(([id, v]) => ({ v, meal: s.meals.find((m) => m.id === id) }))
    .filter((x) => !x.meal || x.meal.status !== "analyzing");
  for (let i = 0; i < ready.length; i += 10) {
    const chunk = ready.slice(i, i + 10).filter((x) => x.meal);
    if (chunk.length) {
      const rows = await Promise.all(
        chunk.map(async ({ meal }) => {
          const { photo, ...data } = meal!;
          return { user_id: userId, id: meal!.id, data, photo: photo ? await shrink(photo) : null, deleted: false };
        }),
      );
      const { error } = await sb.from("meals").upsert(rows);
      if (error) throw error;
    }
    const sent = new Map(ready.slice(i, i + 10).map((x) => [x.meal?.id, x.v]));
    applyRemote((st) => {
      const dirtyMeals = { ...st.sync.dirtyMeals };
      for (const [id, v] of Object.entries(dirtyMeals)) if (sent.get(id) === v || !st.meals.some((m) => m.id === id)) delete dirtyMeals[id];
      return { ...st, sync: { ...st.sync, dirtyMeals } };
    });
  }

  const deleted = s.sync.deletedMeals;
  if (deleted.length) {
    const { error } = await sb.from("meals").upsert(deleted.map((id) => ({ user_id: userId, id, data: {}, photo: null, deleted: true })));
    if (error) throw error;
    applyRemote((st) => ({ ...st, sync: { ...st.sync, deletedMeals: st.sync.deletedMeals.filter((id) => !deleted.includes(id)) } }));
  }
}

async function pull() {
  const sb = supabase();
  const s = getState();
  const isFirst = firstSync;

  const { data: prof, error: pErr } = await sb.from("profiles").select("profile, onboarded_at, settings, updated_at").maybeSingle<ProfileRow>();
  if (pErr) throw pErr;

  const rows: MealRow[] = [];
  for (let from = 0; ; from += 500) {
    let q = sb.from("meals").select("id, data, photo, deleted, updated_at").order("updated_at").order("id").range(from, from + 499);
    if (s.sync.lastPull) q = q.gte("updated_at", s.sync.lastPull);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...(data as MealRow[]));
    if (!data || data.length < 500) break;
  }
  firstSync = false;

  applyRemote((st) => {
    let next = st;
    // Profil: účet má prednosť pri prvom prihlásení, inak len ak tu nečaká lokálna zmena.
    if (prof?.profile && (isFirst || !st.sync.profileDirty || !st.profile)) {
      next = {
        ...next,
        profile: prof.profile,
        onboardedAt: prof.onboarded_at ?? next.onboardedAt,
        settings: { ...next.settings, inviteCode: prof.settings?.inviteCode || next.settings.inviteCode },
        sync: { ...next.sync, profileDirty: 0 },
      };
    } else if (!prof?.profile && next.profile && !next.sync.profileDirty) {
      next = { ...next, sync: { ...next.sync, profileDirty: 1 } };
    }

    if (rows.length) {
      const byId = new Map(next.meals.map((m) => [m.id, m]));
      for (const r of rows) {
        if (next.sync.dirtyMeals[r.id] || next.sync.deletedMeals.includes(r.id)) continue; // lokálna zmena vyhráva
        if (r.deleted) byId.delete(r.id);
        else byId.set(r.id, { ...(r.data as Meal), photo: byId.get(r.id)?.photo ?? r.photo ?? undefined });
      }
      const meals = [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      next = { ...next, meals, sync: { ...next.sync, lastPull: rows[rows.length - 1].updated_at } };
    }
    return next;
  });
}

/** Do účtu ide menší náhľad fotky, nech databáza nenapuchne. */
async function shrink(dataUrl: string): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    if (scale === 1 && dataUrl.length < 60_000) return dataUrl;
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.62);
  } catch {
    return dataUrl;
  }
}
