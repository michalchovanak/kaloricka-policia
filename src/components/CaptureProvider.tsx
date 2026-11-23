"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { captureMeal } from "@/lib/capture";
import { haptic } from "./confetti";
import { MealSheet } from "./MealSheet";

interface Ctx {
  openCamera: () => void;
  openGallery: () => void;
  /** Ponuka „Odfotiť / Z galérie“ nad tlačidlom foťáku. */
  openPicker: () => void;
  showMeal: (id: string) => void;
}

const noop = () => {};
const CaptureCtx = createContext<Ctx>({ openCamera: noop, openGallery: noop, openPicker: noop, showMeal: noop });
export const useCapture = () => useContext(CaptureCtx);

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [mealId, setMealId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  const [picker, setPicker] = useState(false);
  const router = useRouter();
  const path = usePathname();

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, fromGallery: boolean) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      haptic(15);
      try {
        const id = await captureMeal(file, { fromGallery });
        setFresh(true);
        setMealId(id);
        if (path !== "/") router.push("/");
      } catch (err) {
        console.error(err);
        alert("Fotku sa nepodarilo načítať. Skús to znova.");
      }
    },
    [path, router],
  );

  useEffect(() => {
    if (!picker) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicker(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picker]);

  const openCamera = () => {
    setPicker(false);
    cam.current?.click();
  };
  const openGallery = () => {
    setPicker(false);
    gal.current?.click();
  };

  const ctx: Ctx = {
    openCamera,
    openGallery,
    openPicker: () => {
      haptic(8);
      setPicker((p) => !p);
    },
    showMeal: (id) => {
      setFresh(false);
      setMealId(id);
    },
  };

  return (
    <CaptureCtx.Provider value={ctx}>
      {children}
      {picker && (
        <div className="fixed inset-0" style={{ zIndex: "var(--kp-z-sheet)" }}>
          <button type="button" aria-label="Zavrieť" className="absolute inset-0 cursor-default" style={{ background: "var(--kp-scrim)" }} onClick={() => setPicker(false)} />
          <div
            role="menu"
            aria-label="Pridať jedlo"
            className="absolute inset-x-0 mx-auto flex w-[min(92vw,360px)] flex-col gap-2 kp-pop-in"
            style={{ bottom: "calc(var(--kp-safe-bottom) + 112px)" }}
          >
            <button type="button" role="menuitem" autoFocus className="btn-3d btn-3d--lg btn-3d--block" onClick={openCamera}>
              📸 Odfotiť jedlo
            </button>
            <button type="button" role="menuitem" className="btn-3d btn-3d--secondary btn-3d--lg btn-3d--block" onClick={openGallery}>
              🖼️ Vybrať z galérie
            </button>
          </div>
        </div>
      )}
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e, false)} />
      <input ref={gal} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e, true)} />
      <MealSheet id={mealId} fresh={fresh} onClose={() => setMealId(null)} />
    </CaptureCtx.Provider>
  );
}
