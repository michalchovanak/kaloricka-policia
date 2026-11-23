"use client";

// Lokálne úložisko v telefóne (IndexedDB). Žiadne účty, každý má dáta u seba.
import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { AppState, Meal } from "./types";
import type { Profile } from "./nutrition";

const KEY = "kp-state-v1";

const initial: AppState = {
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
    if (saved) state = { ...initial, ...saved, settings: { ...initial.settings, ...saved.settings } };
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

export const actions = {
  setProfile(profile: Profile) {
    update((s) => ({ ...s, profile, onboardedAt: s.onboardedAt ?? new Date().toISOString() }));
  },
  setSettings(patch: Partial<AppState["settings"]>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  addMeal(meal: Meal) {
    update((s) => ({ ...s, meals: [meal, ...s.meals] }));
  },
  updateMeal(id: string, patch: Partial<Meal>) {
    update((s) => ({ ...s, meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  deleteMeal(id: string) {
    update((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
  },
  addWater(day: string, ml: number) {
    update((s) => ({ ...s, water: { ...s.water, [day]: Math.max(0, (s.water[day] ?? 0) + ml) } }));
  },
  resetAll() {
    update(() => initial);
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

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
