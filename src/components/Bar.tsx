/** kind="goal": zelená keď splnené. kind="limit": oranžová od 80 %, červená od 100 %. */
export function Bar({ value, max, color, kind = "goal", height = 14 }: { value: number; max: number; color: string; kind?: "goal" | "limit"; height?: number }) {
  const pct = max > 0 ? value / max : 0;
  let fill = color;
  if (kind === "goal" && pct >= 1) fill = "var(--kp-mint)";
  if (kind === "limit" && pct >= 1) fill = "var(--kp-siren)";
  else if (kind === "limit" && pct >= 0.8) fill = "var(--kp-kcal)";
  return (
    <div className="progress-3d" style={{ height, ["--_fill" as string]: fill }}>
      <span style={{ ["--value" as string]: `${Math.min(100, pct * 100)}%`, minWidth: pct > 0 ? height : 0 }} />
    </div>
  );
}

export function MacroRow({ label, emoji, value, max, unit, color, kind = "goal" }: { label: string; emoji: string; value: number; max: number; unit: string; color: string; kind?: "goal" | "limit" }) {
  const pct = max > 0 ? value / max : 0;
  const hint = kind === "goal" ? (pct >= 1 ? "Splnené ✓" : `chýba ${Math.max(0, Math.round(max - value))} ${unit}`) : pct >= 1 ? `nad limit o ${Math.round(value - max)} ${unit}` : `zostáva ${Math.max(0, Math.round(max - value))} ${unit}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-extrabold">{emoji} {label}</span>
        <span className="kp-num text-sm font-extrabold text-kp-ink-2">
          {Math.round(value)}<span className="text-kp-muted"> / {Math.round(max)} {unit}</span>
        </span>
      </div>
      <Bar value={value} max={max} color={color} kind={kind} />
      <div className="kp-caption">{kind === "limit" ? "limit · " : "cieľ · "}{hint}</div>
    </div>
  );
}
