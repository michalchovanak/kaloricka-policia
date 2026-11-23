"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot } from "@/components/Mascot";
import { haptic } from "@/components/confetti";

/* --------------------------------------------------------------------------
   Install gate. iOS Safari and the Home Screen app have SEPARATE storage, so
   onboarding done in the browser is lost once the user opens the installed
   app. We push people to install first and only then onboard.
   -------------------------------------------------------------------------- */

export type GateKind = { os: "ios"; safari: boolean; ipad: boolean } | { os: "android" };

const SKIP_KEY = "kp-install-gate-skip";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Client-only: call from useEffect. Returns null when no gate is needed. */
export function detectGate(): GateKind | null {
  if (typeof window === "undefined") return null;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return null;
  try {
    if (sessionStorage.getItem(SKIP_KEY) === "1") return null;
  } catch {
    /* private mode etc. */
  }
  const ua = navigator.userAgent;
  const ipadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || ipadOs) {
    return {
      os: "ios",
      safari: !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|Instagram|FBAN|FBAV|Line\//.test(ua),
      ipad: /iPad/.test(ua) || ipadOs,
    };
  }
  if (/Android/i.test(ua)) return { os: "android" };
  return null; // desktop → no gate
}

export function InstallGate({ kind, onSkip }: { kind: GateKind; onSkip: () => void }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? ((window as unknown as { __kpInstall?: BeforeInstallPromptEvent }).__kpInstall ?? null) : null),
  );
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (kind.os !== "android") return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [kind.os]);

  const install = async () => {
    if (!prompt) return;
    haptic(12);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
    } catch {
      /* ignore */
    }
    setPrompt(null);
  };

  const skip = () => {
    haptic(6);
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
    onSkip();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      haptic(10);
    } catch {
      /* ignore */
    }
  };

  const iosNotSafari = kind.os === "ios" && !kind.safari;

  return (
    <>
      <main className="kpob-screen-fwd flex flex-1 flex-col items-center px-4 pt-4 pb-4 text-center">
        <div className="kpob-hero">
          <Mascot mood={installed ? "approve" : "angry"} size={136} bob />
        </div>

        <h1 className="kp-h1 kp-pop-in kp-stagger mt-3 text-balance" style={{ "--i": 1 } as CSSProperties}>
          {installed ? "No konečne." : "Najprv ma daj na plochu."}
        </h1>
        <p className="kp-body-lg kp-pop-in kp-stagger mt-2 text-balance text-kp-ink-2" style={{ "--i": 2 } as CSSProperties}>
          {installed
            ? "Teraz zavri prehliadač a otvor appku z plochy. Tam ťa vyšetrím."
            : "Prehliadač a appka na ploche majú oddelenú pamäť, takže čo nastavíš tu, v appke nebude."}
        </p>

        {installed ? null : kind.os === "ios" ? (
          <ol className="mt-6 flex w-full flex-col gap-2.5 text-left">
            {iosNotSafari ? (
              <Step i={3} n="!" tone="siren">
                Toto nie je Safari, do riti. Otvor tento odkaz v <b>Safari</b>.
                <button type="button" onClick={copyLink} className="btn-3d btn-3d--sm btn-3d--secondary mt-2">
                  {copied ? "Skopírované ✓" : "Skopírovať odkaz"}
                </button>
              </Step>
            ) : null}
            <Step i={4} n={1}>
              Ťukni na <b>Zdieľať</b> <ShareIcon /> {kind.ipad ? "hore" : "dole"} v Safari.
              <span className="kp-caption block">Nevidíš? Je pod ⋯</span>
            </Step>
            <Step i={5} n={2}>
              Vyber <b>„Pridať na plochu“</b>.
            </Step>
            <Step i={6} n={3}>
              Otvor appku <b>z plochy</b>. Nie tu.
            </Step>
          </ol>
        ) : (
          <div className="mt-6 flex w-full flex-col gap-2.5 text-left">
            {prompt ? null : (
              <Step i={4} n={1}>
                Ťukni na <b>⋮</b> vpravo hore → <b>„Pridať na plochu“</b> / <b>„Inštalovať aplikáciu“</b>.
              </Step>
            )}
            <Step i={5} n={prompt ? 1 : 2}>
              Potom otvor appku <b>z plochy</b>. Nie tu.
            </Step>
          </div>
        )}
      </main>

      <footer className="kp-footer-cta z-10 flex flex-col items-stretch gap-1">
        {kind.os === "android" && prompt && !installed ? (
          <button type="button" className="btn-3d btn-3d--block btn-3d--lg" onClick={install}>
            Nainštalovať appku
          </button>
        ) : null}
        <button type="button" className="btn-ghost" onClick={skip} style={{ color: "var(--kp-muted)" }}>
          Pokračovať v prehliadači
        </button>
      </footer>
    </>
  );
}

function Step({ n, i, tone, children }: { n: number | string; i: number; tone?: "siren"; children: ReactNode }) {
  const siren = tone === "siren";
  return (
    <li className="kp-pop-in kp-stagger list-none" style={{ "--i": i } as CSSProperties}>
      <div
        className="card-3d flex items-start gap-3 px-3.5 py-3"
        style={siren ? { borderColor: "var(--kp-siren)", background: "var(--kp-siren-tint)" } : undefined}
      >
        <span
          aria-hidden
          className="kp-num grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg font-black text-white"
          style={{ background: siren ? "var(--kp-siren)" : "var(--kp-blue)" }}
        >
          {n}
        </span>
        <div className="min-w-0 flex-1 pt-1 font-bold text-kp-ink">{children}</div>
      </div>
    </li>
  );
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="(ikona štvorček so šípkou hore)"
      className="inline-block align-[-3px] text-kp-blue"
    >
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
