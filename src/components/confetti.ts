"use client";
import confetti from "canvas-confetti";

const COLORS = ["#3B5BF6", "#FFC21A", "#FF4F64", "#1FC77E", "#B85CF5", "#FF7A1A"];

export function celebrate(big = false) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const base = { colors: COLORS, zIndex: 9999, disableForReducedMotion: true } as const;
  confetti({ ...base, particleCount: big ? 160 : 80, spread: big ? 100 : 70, origin: { y: 0.65 }, startVelocity: 45, scalar: 1.1 });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 180);
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 260);
  }
}

export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms); } catch { /* iOS nemá */ }
}
