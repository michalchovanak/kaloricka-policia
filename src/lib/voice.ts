// Hlas appky podľa pohlavia. Mužov stráži Strážmajster Paťo (drsný, vulgárny policajt),
// ženy Strážmajsterka Kačka (ostrá, vtipná kačica-policajtka). Pravidlá v docs/tone-of-voice.md.
import type { Sex } from "./nutrition";

/** Vyber text podľa pohlavia používateľa. Bez profilu platí mužský hlas (Paťo). */
export const g = <T,>(sex: Sex | null | undefined, male: T, female: T): T => (sex === "female" ? female : male);

export const MASCOT_NAME: Record<Sex, string> = {
  male: "Strážmajster Paťo",
  female: "Strážmajsterka Kačka",
};

export const MASCOT_SHORT: Record<Sex, string> = { male: "Paťo", female: "Kačka" };
