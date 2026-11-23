/** Ikony spodného menu: hrubé obrysy a ploché farby ako maskot Paťo.
 *  Neaktívna = sivá, aktívna = plné farby značky. */

type IconProps = { active?: boolean; size?: number };

const line = (on: boolean) => (on ? "var(--kp-ink)" : "var(--kp-muted)");
const fill = (on: boolean, color: string) => (on ? color : "var(--kp-bg-sunken)");
const common = { strokeWidth: 2.25, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** „Dnes“: služobňa s majákom na streche. */
export function StationIcon({ active = false, size = 30 }: IconProps) {
  const s = line(active);
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      {active && (
        <g stroke="var(--kp-siren)" {...common}>
          <path d="M7.5 3.5l1.6 1.2M20.5 3.5l-1.6 1.2M14 0.9v0.6" />
        </g>
      )}
      <path d="M4.5 13.5L14 6.2l9.5 7.3V22a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 22z" fill={fill(active, "var(--kp-blue)")} stroke={s} {...common} />
      {active && <path d="M8 13.4l6-4.6" stroke="#FFFFFF" strokeOpacity=".4" {...common} />}
      <path d="M11.5 24.5V19a2.5 2.5 0 0 1 5 0v5.5" fill={fill(active, "var(--kp-gold)")} stroke={s} {...common} />
      <path d="M11 6.6V5.4a3 3 0 0 1 6 0v1.2z" fill={fill(active, "var(--kp-siren)")} stroke={s} {...common} />
    </svg>
  );
}

/** „Štatistiky“: tri stĺpce vo farbách makier. */
export function StatsIcon({ active = false, size = 30 }: IconProps) {
  const s = line(active);
  const bars = [
    { x: 4, h: 9, c: "var(--kp-carbs)" },
    { x: 11.25, h: 15, c: "var(--kp-kcal)" },
    { x: 18.5, h: 12, c: "var(--kp-protein)" },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={24 - b.h} width={5.5} height={b.h} rx={2} fill={fill(active, b.c)} stroke={s} {...common} />
      ))}
      {active && (
        <path d="M14 3.2l.9 1.8 2 .3-1.45 1.4.35 2L14 7.75l-1.8.95.35-2L11.1 5.3l2-.3z" fill="var(--kp-gold)" stroke="var(--kp-ink)" strokeWidth={1.25} strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Stredné tlačidlo: biely foťák s modrým objektívom a zlatým bleskom. */
export function CameraIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden>
      <path
        d="M12.5 9.5l1.6-2.7A2 2 0 0 1 15.8 5.8h4.4a2 2 0 0 1 1.7 1l1.6 2.7H28a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V13.5a4 4 0 0 1 4-4z"
        fill="#FFFFFF"
      />
      <circle cx="18" cy="19.5" r="7" fill="var(--kp-blue-lip)" />
      <circle cx="18" cy="19.5" r="4.4" fill="var(--kp-blue-hover)" />
      <circle cx="16.2" cy="17.7" r="1.4" fill="#FFFFFF" fillOpacity=".85" />
      <rect x="25.5" y="12" width="3.5" height="2.6" rx="1.3" fill="var(--kp-gold)" />
    </svg>
  );
}
