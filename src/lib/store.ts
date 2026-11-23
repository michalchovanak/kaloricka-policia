"use client";

// Lokálne úložisko v telefóne (IndexedDB). Ak je človek prihlásený, sync.ts zmeny posiela do Supabase.
import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { AppState, Meal, SyncMeta } from "./types";
import type { Profile } from "./nutrition";

const KEY = "kp-state-v1";

const emptySync: SyncMeta = { dirtyMeals: {}, deletedMeals: [], profileDirty: 0 };

const initial: AppState = {
  sync: emptySync,
  profile: null,
  meals: [],
  water: {},
  settings: { inviteCode: "", ownApiKey: "" },
};

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

async function persist() {
  try {
    await set(KEY, state);
  } catch (e) {
    console.error("persist failed", e);
  }
}

export async function loadState(): Promise<void> {
  if (loaded) return;
  try {
    const saved = (await get(KEY)) as AppState | undefined;
    if (saved) state = { ...initial, ...saved, settings: { ...initial.settings, ...saved.settings }, sync: { ...emptySync, ...saved.sync } };
  } catch (e) {
    console.error("load failed", e);
  }
  loaded = true;
  // Analýzy prerušené zatvorením appky označ ako chybu, aby sa dali zopakovať.
  state = {
    ...state,
    meals: state.meals.map((m) =>
      m.status === "analyzing" && Date.now() - new Date(m.createdAt).getTime() > 120_000
        ? { ...m, status: "error", error: "Analýza sa prerušila. Skús znova." }
        : m,
    ),
  };
  emit();
}

function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  emit();
  void persist();
}

let version = 0;
const bump = () => ++version;

/** Označí jedlo ako zmenené lokálne (pošle sa pri ďalšej synchronizácii). */
function dirty(s: AppState, id: string): SyncMeta {
  return { ...s.sync, dirtyMeals: { ...s.sync.dirtyMeals, [id]: bump() } };
}

export const actions = {
  setProfile(profile: Profile) {
    update((s) => ({ ...s, profile, onboardedAt: s.onboardedAt ?? new Date().toISOString(), sync: { ...s.sync, profileDirty: bump() } }));
  },
  setSettings(patch: Partial<AppState["settings"]>) {
    update((s) => ({
      ...s,
      settings: { ...s.settings, ...patch },
      sync: "inviteCode" in patch ? { ...s.sync, profileDirty: bump() } : s.sync,
    }));
  },
  addMeal(meal: Meal) {
    update((s) => ({ ...s, meals: [meal, ...s.meals], sync: dirty(s, meal.id) }));
  },
  updateMeal(id: string, patch: Partial<Meal>) {
    update((s) => ({ ...s, meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)), sync: dirty(s, id) }));
  },
  deleteMeal(id: string) {
    update((s) => {
      const dirtyMeals = { ...s.sync.dirtyMeals };
      delete dirtyMeals[id];
      return {
        ...s,
        meals: s.meals.filter((m) => m.id !== id),
        sync: { ...s.sync, dirtyMeals, deletedMeals: [...s.sync.deletedMeals, id] },
      };
    });
  },
  addWater(day: string, ml: number) {
    update((s) => ({ ...s, water: { ...s.water, [day]: Math.max(0, (s.water[day] ?? 0) + ml) } }));
  },
  /** Zmaže lokálne dáta. Prihlásenie (sync.userId) ostáva, ak keepAccount. */
  resetAll(keepAccount = false) {
    update((s) => ({ ...initial, sync: keepAccount ? { ...emptySync, userId: s.sync.userId, email: s.sync.email, lastPull: undefined } : emptySync }));
  },
};

/** Pre sync.ts: zmeny zo servera, ktoré sa nemajú posielať späť. */
export function applyRemote(fn: (s: AppState) => AppState) {
  update(fn);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const subscribeState = subscribe;

export function useAppState(): AppState & { loaded: boolean } {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
  const isLoaded = useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false,
  );
  return { ...s, loaded: isLoaded };
}

export function getState() {
  return state;
}
