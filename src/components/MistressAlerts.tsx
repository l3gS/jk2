import { useEffect, useRef, useState } from "react";
import { Bell, Mail, Phone, Send, CheckCircle, Loader2, Clock, X, Repeat } from "lucide-react";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────
const TEASES = [
  "You've been such a good boy 🌸 Mistress is thinking about you right now…",
  "Don't touch yourself until Mistress says so 💋 That's an order.",
  "I know what you're looking at. Keep edging for me, sweetheart 🔥",
  "Your Mistress wants you hard and desperate. No cumming yet 🍆",
  "Stroke it slow for me, baby. I'm watching 👀",
  "Mistress says: hands off for the next 10 minutes. Then you may resume~",
  "You're such a good little gooner 🌸 Keep it up until I say stop.",
  "Edge. Now. That's not a request 💅",
  "I've been thinking about you all day. Are you being obedient? 👀",
  "You belong to Mistress now. Don't you dare cum without permission 💋",
];

const HENTAI_TEASES = [
  "Your Mistress compiled today's hentai picks just for you 🌸",
  "New batch of forbidden art waiting on Nacre's Hub 👀 Mistress knows your taste~",
  "Don't keep Mistress waiting — your daily dose of filth is ready 💋",
  "You've been summoned. Nacre's Hub has something special today 🔥",
  "Mistress reminder: edge session scheduled, no excuses 🍆",
  "Time to goon. Drop everything. Open Nacre's Hub. Now. 💅",
  "Your cock belongs to me today. Don't you dare touch it without logging on 🌸",
];

const OWNER_EMAIL = "l3g3ndary.sam@gmail.com";

const CARRIERS: { label: string; domain: string }[] = [
  { label: "AT&T",        domain: "txt.att.net" },
  { label: "Verizon",     domain: "vtext.com" },
  { label: "T-Mobile",    domain: "tmomail.net" },
  { label: "Sprint",      domain: "messaging.sprintpcs.com" },
  { label: "US Cellular", domain: "email.uscc.net" },
  { label: "Boost",       domain: "sms.myboostmobile.com" },
  { label: "Cricket",     domain: "mms.cricketwireless.net" },
  { label: "Metro PCS",   domain: "mymetropcs.com" },
  { label: "Google Fi",   domain: "msg.fi.google.com" },
  { label: "Straight Talk (V)", domain: "vtext.com.st" },
];

const INTERVALS = [
  { label: "30 min", ms: 30 * 60_000 },
  { label: "1 hr",   ms: 60 * 60_000 },
  { label: "2 hr",   ms: 2 * 60 * 60_000 },
  { label: "4 hr",   ms: 4 * 60 * 60_000 },
  { label: "8 hr",   ms: 8 * 60 * 60_000 },
  { label: "Daily",  ms: 24 * 60 * 60_000 },
];

const SUB_KEY = "mistress-sub-v1";

interface Sub { active: boolean; intervalMs: number; nextSend: number }

function loadSub(): Sub {
  try { return JSON.parse(localStorage.getItem(SUB_KEY) || "null") || { active: false, intervalMs: 3600000, nextSend: 0 }; }
  catch { return { active: false, intervalMs: 3600000, nextSend: 0 }; }
}
function saveSub(s: Sub) { localStorage.setItem(SUB_KEY, JSON.stringify(s)); }

// Fetch a few hentai image URLs from our gallery API and include them in emails
async function fetchImageUrls(n = 4): Promise<string[]> {
  try {
    const cats = ["waifu", "neko", "ahegao", "ass", "boobs"];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const r = await fetch(`/api/gallery?cat=${cat}&page=${1 + Math.floor(Math.random() * 5)}&n=${n}&pics=1`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.files || []).slice(0, n);
  } catch { return []; }
}

async function sendEmailViaFormsubmit(to: string, tease: string, imageUrls: string[] = []) {
  const imgBlock = imageUrls.length
    ? "\n\n🔥 Today's filth from Mistress:\n" + imageUrls.map((u, i) => `Pic ${i + 1}: ${u}`).join("\n")
    : "";
  const body = JSON.stringify({
    name: "Nacre's Hub 💋",
    email: "mistress@nacresthub.com",
    _subject: "🔥 Your Mistress Has A Message For You~",
    message: tease + imgBlock + "\n\nStay obedient 🌸\n— Your Mistress",
    _template: "table",
    _captcha: "false",
  });
  const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  const data = await r.json();
  return data.success === "true" || data.success === true;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function MistressAlerts() {
  const [phone, setPhone]     = useState("");
  const [carrier, setCarrier] = useState(CARRIERS[0].domain);
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [tab, setTab]         = useState<"sms" | "email" | "sub">("sms");
  const [sub, setSub]         = useState<Sub>(loadSub);
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS[1].ms);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Subscription scheduler ────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const s = loadSub();
      if (!s.active) return;
      if (Date.now() < s.nextSend) return;
      const tease = HENTAI_TEASES[Math.floor(Math.random() * HENTAI_TEASES.length)];
      const imgs = await fetchImageUrls(4);
      const ok = await sendEmailViaFormsubmit(OWNER_EMAIL, tease, imgs).catch(() => false);
      const next: Sub = { ...s, nextSend: Date.now() + s.intervalMs };
      saveSub(next);
      setSub(next);
      if (ok) toast.success("Mistress scheduled reminder sent 💋");
    };
    check();
    timerRef.current = setInterval(check, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── SMS via carrier email-to-SMS gateway ──────────────────────
  const handleSendSMS = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { toast.error("Enter a valid phone number 💋"); return; }
    setSmsStatus("sending");
    const smsEmail = `${digits}@${carrier}`;
    const tease = TEASES[Math.floor(Math.random() * TEASES.length)];
    try {
      const ok = await sendEmailViaFormsubmit(smsEmail, tease);
      if (ok) {
        setSmsStatus("sent");
        toast.success("Mistress SMS sent 💋");
        setTimeout(() => setSmsStatus("idle"), 5000);
      } else {
        throw new Error("rejected");
      }
    } catch {
      setSmsStatus("error");
      toast.error("First-time? Check your phone for an activation link, then re-send 💌");
      setTimeout(() => setSmsStatus("idle"), 6000);
    }
  };

  // ── Direct email ──────────────────────────────────────────────
  const handleSendEmail = async () => {
    setEmailStatus("sending");
    try {
      const tease = HENTAI_TEASES[Math.floor(Math.random() * HENTAI_TEASES.length)];
      const imgs = await fetchImageUrls(4);
      const ok = await sendEmailViaFormsubmit(OWNER_EMAIL, tease, imgs);
      if (ok) {
        setEmailStatus("sent");
        toast.success("Freaky email + pics sent to Mistress 📬");
        setTimeout(() => setEmailStatus("idle"), 5000);
      } else {
        throw new Error("formsubmit rejected");
      }
    } catch {
      setEmailStatus("error");
      toast.error("Email failed — check inbox for activation link first 💌");
      setTimeout(() => setEmailStatus("idle"), 5000);
    }
  };

  // ── Subscription toggle ───────────────────────────────────────
  const toggleSub = () => {
    const next: Sub = sub.active
      ? { ...sub, active: false }
      : { active: true, intervalMs: selectedInterval, nextSend: Date.now() + selectedInterval };
    saveSub(next);
    setSub(next);
    toast.success(next.active ? `Reminders every ${INTERVALS.find(i => i.ms === selectedInterval)?.label} 🔔` : "Reminders cancelled 🔕");
  };

  const subLabel = INTERVALS.find(i => i.ms === sub.intervalMs)?.label || "1 hr";
  const nextSendStr = sub.active
    ? new Date(sub.nextSend).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 via-black to-rose-950/40 p-5 shadow-lg shadow-pink-900/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-pink-600/20 flex items-center justify-center border border-pink-500/30">
          <Bell className="w-4 h-4 text-pink-400" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-pink-400 font-bold">Mistress Alerts</p>
          <p className="text-xs text-zinc-400">Kinky reminders &amp; teases</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-xl">
        {(["sms", "email", "sub"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
              tab === t ? "bg-pink-600 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "sms"   && <><Phone className="w-3 h-3" /> SMS</>}
            {t === "email" && <><Mail className="w-3 h-3" /> Email</>}
            {t === "sub"   && <><Repeat className="w-3 h-3" /> Schedule</>}
          </button>
        ))}
      </div>

      {/* ── SMS tab ── */}
      {tab === "sms" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Enter your number + carrier and Mistress will SMS you a{" "}
            <span className="text-pink-300">kinky tease</span> 🌸
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="tel"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendSMS()}
                className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-colors"
              />
            </div>
          </div>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50 transition-colors"
          >
            {CARRIERS.map((c) => (
              <option key={c.domain} value={c.domain}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={handleSendSMS}
            disabled={smsStatus === "sending" || smsStatus === "sent"}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs tracking-widest uppercase transition-all"
          >
            {smsStatus === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
             : smsStatus === "sent"  ? <CheckCircle className="w-3.5 h-3.5" />
             : <Send className="w-3.5 h-3.5" />}
            {smsStatus === "sent" ? "Sent!" : "Send Tease"}
          </button>
          <p className="text-[10px] text-zinc-600">
            Via carrier email gateway · First send requires phone activation
          </p>
        </div>
      )}

      {/* ── Email tab ── */}
      {tab === "email" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Send a{" "}
            <span className="text-rose-300">freaky email + hentai pic links</span>{" "}
            straight to{" "}
            <span className="text-pink-400 font-semibold">{OWNER_EMAIL}</span> 🌸
          </p>
          <button
            onClick={handleSendEmail}
            disabled={emailStatus === "sending" || emailStatus === "sent"}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm tracking-widest uppercase transition-all"
          >
            {emailStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" />
             : emailStatus === "sent"  ? <CheckCircle className="w-4 h-4" />
             : <Mail className="w-4 h-4" />}
            {emailStatus === "sent" ? "Sent + pics 💋"
             : emailStatus === "sending" ? "Fetching pics…"
             : "Send Freaky Email + Pics"}
          </button>
          <p className="text-[10px] text-zinc-600">
            Includes 4 random hentai pic links · Powered by FormSubmit
          </p>
        </div>
      )}

      {/* ── Schedule tab ── */}
      {tab === "sub" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Mistress will email you automatically on a schedule — pics and all 🔥
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv.ms}
                onClick={() => setSelectedInterval(iv.ms)}
                disabled={sub.active}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedInterval === iv.ms
                    ? "bg-pink-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 disabled:opacity-40"
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
          <button
            onClick={toggleSub}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
              sub.active
                ? "bg-rose-700/80 hover:bg-rose-600 text-white"
                : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white"
            }`}
          >
            {sub.active
              ? <><X className="w-4 h-4" /> Cancel Reminders</>
              : <><Clock className="w-4 h-4" /> Start Reminders</>}
          </button>
          {sub.active && nextSendStr && (
            <p className="text-[10px] text-pink-400 text-center">
              🔔 Every {subLabel} · Next: {nextSendStr}
            </p>
          )}
          <p className="text-[10px] text-zinc-600">
            Tab must be open to receive · Sends to {OWNER_EMAIL}
          </p>
        </div>
      )}
    </div>
  );
}
