"use client";
import { useEffect } from "react";

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0" style={{ zIndex: "var(--kp-z-sheet)" }}>
      <div className="absolute inset-0" style={{ background: "var(--kp-scrim)" }} onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-kp-bg no-scrollbar"
        style={{ animation: "kp-slide-up var(--kp-dur-slow) var(--kp-ease-out)", paddingBottom: "calc(var(--kp-safe-bottom) + 16px)", boxShadow: "var(--kp-shadow-float)" }}
      >
        <div className="sticky top-0 z-10 flex justify-center bg-kp-bg pt-2 pb-1">
          <button aria-label="Zavrieť" onClick={onClose} className="h-1.5 w-12 rounded-full bg-kp-line-strong" />
        </div>
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}
