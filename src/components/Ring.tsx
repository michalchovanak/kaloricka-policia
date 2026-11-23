export function Ring({ value, max, size = 180, stroke = 18, color = "var(--kp-kcal)", track = "var(--kp-bg-sunken)", over = "var(--kp-siren)", children }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; over?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const shown = Math.min(1, pct);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pct > 1.1 ? over : color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          style={{ transition: "stroke-dashoffset var(--kp-dur-fill) var(--kp-ease-out), stroke 200ms" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
