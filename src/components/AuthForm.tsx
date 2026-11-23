"use client";
import { useState } from "react";
import { signInOrUp } from "@/lib/sync";
import { haptic } from "./confetti";

const inputCls =
  "w-full rounded-[14px] border-2 border-kp-line bg-kp-surface px-4 py-3.5 text-[17px] font-extrabold text-kp-ink outline-none placeholder:font-bold placeholder:text-kp-muted focus:border-kp-blue";

/** Email + heslo. Nový email = nový účet, existujúci = prihlásenie. */
export function AuthForm({
  newAccount,
  submitLabel,
  beforeSubmit,
  onDone,
}: {
  newAccount?: boolean;
  beforeSubmit?: () => void;
  submitLabel: string;
  onDone: (created: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    haptic(10);
    setBusy(true);
    setError("");
    beforeSubmit?.();
    const r = await signInOrUp(email, password);
    setBusy(false);
    if (r.ok) onDone(r.created);
    else setError(r.error);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <input
        type="password"
        autoComplete={newAccount ? "new-password" : "current-password"}
        placeholder="Heslo (aspoň 6 znakov)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
      />
      {error && <p className="px-1 text-[15px] font-extrabold text-kp-siren-ink">{error}</p>}
      <button type="submit" className="btn-3d btn-3d--block mt-1" disabled={busy || !email || password.length < 6}>
        {busy ? "Overujem…" : submitLabel}
      </button>
    </form>
  );
}
