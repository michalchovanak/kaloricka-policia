"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapture } from "./CaptureProvider";

const TABS = [
  { href: "/", label: "Dnes", icon: "🏠" },
  { href: "#camera", label: "", icon: "" },
  { href: "/stats", label: "Štatistiky", icon: "📊" },
];

export function TabBar() {
  const path = usePathname();
  const { openCamera } = useCapture();
  return (
    <nav className="kp-tabbar" aria-label="Navigácia">
      {TABS.map((t) =>
        t.href === "#camera" ? (
          <div key="cam" className="relative flex justify-center">
            <button
              onClick={openCamera}
              aria-label="Odfotiť jedlo"
              className="btn-3d btn-3d--lg absolute -top-7 !h-[72px] !w-[72px] !min-h-0 !rounded-full !p-0 text-3xl"
              style={{ ["--_depth" as string]: "6px" }}
            >
              📸
            </button>
          </div>
        ) : (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-wide transition-transform active:scale-95 ${
              path === t.href ? "text-kp-blue" : "text-kp-muted"
            }`}
          >
            <span className={`grid h-9 w-12 place-items-center rounded-xl text-[22px] ${path === t.href ? "bg-kp-blue-tint" : ""}`}>{t.icon}</span>
            {t.label}
          </Link>
        ),
      )}
    </nav>
  );
}
