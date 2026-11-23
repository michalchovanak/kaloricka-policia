export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Posledných n dní vrátane dneška, od najstaršieho. */
export function lastDays(n: number, today = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

const WEEKDAYS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];
export function weekdayShort(key: string): string {
  return WEEKDAYS[parseDayKey(key).getDay()];
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
}

export function mealSlot(iso: string): string {
  const h = new Date(iso).getHours();
  if (h < 10) return "Raňajky";
  if (h < 12) return "Desiata";
  if (h < 15) return "Obed";
  if (h < 18) return "Olovrant";
  return "Večera";
}
