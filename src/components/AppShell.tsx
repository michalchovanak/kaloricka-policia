"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { loadState, useAppState } from "@/lib/store";
import { CaptureProvider } from "./CaptureProvider";
import { TabBar } from "./TabBar";
import { Mascot } from "./Mascot";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { loaded, profile } = useAppState();
  const isOnboarding = path.startsWith("/onboarding");

  useEffect(() => {
    void loadState();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (loaded && !profile && !isOnboarding) router.replace("/onboarding");
  }, [loaded, profile, isOnboarding, router]);

  if (!loaded || (!profile && !isOnboarding)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Mascot mood="grumpy" size={120} bob />
      </div>
    );
  }

  if (isOnboarding) return <>{children}</>;

  return (
    <CaptureProvider>
      <main className="kp-screen mx-auto max-w-[520px]">{children}</main>
      <TabBar />
    </CaptureProvider>
  );
}
