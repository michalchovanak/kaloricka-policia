"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { captureMeal } from "@/lib/capture";
import { haptic } from "./confetti";
import { MealSheet } from "./MealSheet";

interface Ctx {
  openCamera: () => void;
  openGallery: () => void;
  showMeal: (id: string) => void;
}

const CaptureCtx = createContext<Ctx>({ openCamera: () => {}, openGallery: () => {}, showMeal: () => {} });
export const useCapture = () => useContext(CaptureCtx);

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [mealId, setMealId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  const router = useRouter();
  const path = usePathname();

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      haptic(15);
      try {
        const id = await captureMeal(file);
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

  const ctx: Ctx = {
    openCamera: () => cam.current?.click(),
    openGallery: () => gal.current?.click(),
    showMeal: (id) => {
      setFresh(false);
      setMealId(id);
    },
  };

  return (
    <CaptureCtx.Provider value={ctx}>
      {children}
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={gal} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <MealSheet id={mealId} fresh={fresh} onClose={() => setMealId(null)} />
    </CaptureCtx.Provider>
  );
}
