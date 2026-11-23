"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapture } from "./CaptureProvider";
import { CameraIcon, StationIcon, StatsIcon } from "./TabIcons";

const TABS = [
  { href: "/", label: "Dnes", Icon: StationIcon },
  { href: "#camera", label: "", Icon: null },
  { href: "/stats", label: "Štatistiky", Icon: StatsIcon },
];

export function TabBar() {
  const path = usePathname();
  const { openPicker } = useCapture();
  return (
    <nav className="kp-tabbar" aria-label="Navigácia">
      {TABS.map(({ href, label, Icon }) =>
        !Icon ? (
          <div key="cam" className="relative flex justify-center">
            <button
              onClick={openPicker}
              aria-label="Pridať jedlo: odfotiť alebo z galérie"
              aria-haspopup="menu"
              className="btn-3d btn-3d--lg absolute -top-7 !h-[72px] !w-[72px] !min-h-0 !rounded-full !p-0"
              style={{ ["--_depth" as string]: "6px" }}
            >
              <CameraIcon size={44} />
            </button>
          </div>
        ) : (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-wide transition-transform active:scale-95 ${
              path === href ? "text-kp-blue" : "text-kp-muted"
            }`}
          >
            <span className={`grid h-9 w-14 place-items-center rounded-xl transition-colors ${path === href ? "bg-kp-blue-tint" : ""}`}>
              <span key={String(path === href)} className={path === href ? "kp-pop-in" : ""}>
                <Icon active={path === href} />
              </span>
            </span>
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
