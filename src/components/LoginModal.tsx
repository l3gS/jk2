import { useEffect, useRef, useState } from "react";
import { X, Loader2, Lock, User as UserIcon, Check, AlertCircle } from "lucide-react";
import {
  authLogin,
  authSignup,
  checkUsername,
  setAccountSession,
} from "../api";
import { toast } from "sonner";

// LoginModal — handles both signup and login. The signup tab does a
// debounced live availability check against the server so the user
// finds out the handle is taken before they submit. On success we
// just close + tell the parent — no page reload needed; App.tsx
// re-hydrates the profile + vault from the new account_id.
export default function LoginModal({
  open,
  onClose,
  onAuthed,
}: {
  open: boolean;
  onClose: () => void;
  onAuthed: (username: string, accountId: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live username-availability state. We only run the check in signup mode.
  // 'idle'      — input empty
  // 'invalid'   — fails the format rule
  // 'checking'  — request in flight
  // 'taken'     — already exists
  // 'available' — free to use
  type AvailState = "idle" | "invalid" | "checking" | "taken" | "available";
  const [avail, setAvail] = useState<AvailState>("idle");
  const checkTimer = useRef<number | null>(null);
  const checkSeq = useRef(0); // protects against out-of-order responses

  // Reset transient state every time the modal opens or the mode changes
  // so a stale "taken" pill doesn't bleed into a fresh attempt.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
  }, [open]);

  useEffect(() => {
    setError(null);
    setAvail("idle");
  }, [mode]);

  // Debounced availability check (signup only). Skips API call if the
  // username doesn't match the format rule.
  useEffect(() => {
    if (mode !== "signup") {
      setAvail("idle");
      return;
    }
    if (checkTimer.current) window.clearTimeout(checkTimer.current);
    const u = username.trim().toLowerCase();
    if (!u) {
      setAvail("idle");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(u)) {
      setAvail("invalid");
      return;
    }
    setAvail("checking");
    const seq = ++checkSeq.current;
    checkTimer.current = window.setTimeout(async () => {
      const res = await checkUsername(u);
      // Bail if a newer request superseded this one.
      if (seq !== checkSeq.current) return;
      if (!res.valid) setAvail("invalid");
      else setAvail(res.available ? "available" : "taken");
    }, 350);
    return () => {
      if (checkTimer.current) window.clearTimeout(checkTimer.current);
    };
  }, [username, mode]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    const u = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(u)) {
      setError("Username: 3–32 chars, letters/numbers/_.- only.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (mode === "signup" && avail === "taken") {
      setError("That username is taken — pick another.");
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await authLogin(u, password)
          : await authSignup(u, password);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      // Persist the session so subsequent reloads stay logged in.
      setAccountSession(res.accountId, res.username);
      toast.success(
        mode === "login"
          ? `Welcome back, ${res.username} 💕`
          : `Account created for ${res.username} 💋`,
      );
      onAuthed(res.username, res.accountId);
      onClose();
      // Reset local form so re-opening doesn't show stale values.
      setUsername("");
      setPassword("");
      setAvail("idle");
    } finally {
      setBusy(false);
    }
  };

  // Visual + textual hint for the username field.
  const availHint = (() => {
    if (mode !== "signup" || !username.trim()) return null;
    switch (avail) {
      case "checking":
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: "checking…",
          cls: "text-pink-300/70",
        };
      case "available":
        return {
          icon: <Check className="w-3 h-3" />,
          text: "available",
          cls: "text-emerald-300",
        };
      case "taken":
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: "already taken",
          cls: "text-rose-300",
        };
      case "invalid":
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: "bad format",
          cls: "text-rose-300",
        };
      default:
        return null;
    }
  })();

  // Disable the submit button while we know the chosen handle is taken so
  // the user can't pointlessly hammer the API.
  const submitDisabled =
    busy || (mode === "signup" && (avail === "taken" || avail === "checking"));

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-pink-400/40 bg-gradient-to-br from-pink-950 via-black to-pink-950 p-6 shadow-2xl shadow-pink-500/30"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-pink-300/70 hover:text-white hover:bg-white/10"
          aria-label="close"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 mb-1">
          goonit account
        </p>
        <h2 className="font-display text-3xl tracking-wider text-white mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-sm text-pink-200/70 mb-5">
          {mode === "login"
            ? "Sign in to keep your vault, name, and stats across devices."
            : "Pick a username and a password. We'll keep your current vault and name attached to it."}
        </p>

        <div className="space-y-2">
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase text-pink-300/80">
                Username
              </span>
              {availHint && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold ${availHint.cls}`}
                >
                  {availHint.icon}
                  {availHint.text}
                </span>
              )}
            </div>
            <div
              className={`mt-1 flex items-center gap-2 px-3 h-11 rounded-lg bg-pink-950/50 border focus-within:border-pink-400/70 ${
                mode === "signup" && avail === "taken"
                  ? "border-rose-400/60"
                  : mode === "signup" && avail === "available"
                  ? "border-emerald-400/50"
                  : "border-pink-300/30"
              }`}
            >
              <UserIcon className="w-4 h-4 text-pink-300" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoComplete="username"
                placeholder="your_handle"
                className="flex-1 bg-transparent outline-none text-pink-50 placeholder:text-pink-300/40 text-sm lowercase"
                maxLength={32}
                spellCheck={false}
                autoCapitalize="none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] tracking-widest uppercase text-pink-300/80">
              Password
            </span>
            <div className="mt-1 flex items-center gap-2 px-3 h-11 rounded-lg bg-pink-950/50 border border-pink-300/30 focus-within:border-pink-400/70">
              <Lock className="w-4 h-4 text-pink-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-pink-50 placeholder:text-pink-300/40 text-sm"
              />
            </div>
            {mode === "signup" && (
              <p className="mt-1 text-[10px] text-pink-300/60">
                At least 4 characters. There's no recovery — write it down.
              </p>
            )}
          </label>
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-200 bg-rose-500/15 border border-rose-400/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <button
          onClick={submit}
          disabled={submitDisabled}
          className="mt-5 w-full h-11 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pink-500/40 transition-all"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
          }}
          className="mt-3 w-full text-xs text-pink-300/80 hover:text-pink-200"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-4 text-[10px] text-pink-300/50 text-center leading-relaxed">
          We only store your username + a hashed password.<br />
          Your vault, name, and stats sync to this account.
        </p>
      </div>
    </div>
  );
}
