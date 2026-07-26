import { useEffect, useRef, useState, useCallback } from "react";
import { X, Heart, MessageCircle } from "lucide-react";

// Floating "DM-style" chat bubbles that pop into the bottom-right corner
// every so often, faking incoming kinky messages from anime girls. Pure UI
// fluff — no real chat — but it makes the home page feel alive.
//
// Pops a fresh bubble every BUBBLE_INTERVAL_MS (with jitter), keeps at most
// MAX_BUBBLES on screen, auto-dismisses each after AUTO_DISMISS_MS, and
// can be clicked away. Personalised with the boyName so it reads as if
// the waifu is actually texting Sam (or whoever).

const MAX_BUBBLES = 3;
const AUTO_DISMISS_MS = 9000;
const FIRST_DELAY_MS = 12_000;
const MIN_GAP_MS = 22_000;
const MAX_GAP_MS = 48_000;

// Curated cast of fake senders. `accent` is a tailwind gradient suffix used
// for the avatar bubble; it keeps the senders visually distinct.
const SENDERS: { name: string; accent: string; emoji: string }[] = [
  { name: "Mei",     accent: "from-pink-500 to-rose-500",     emoji: "♡" },
  { name: "Yui",     accent: "from-purple-500 to-pink-500",   emoji: "✿" },
  { name: "Hinata",  accent: "from-fuchsia-500 to-purple-500", emoji: "❀" },
  { name: "Aiko",    accent: "from-rose-500 to-red-500",      emoji: "✦" },
  { name: "Sakura",  accent: "from-pink-400 to-rose-400",     emoji: "✿" },
  { name: "Rei",     accent: "from-violet-500 to-fuchsia-500", emoji: "♡" },
  { name: "Kaori",   accent: "from-pink-500 to-purple-500",   emoji: "❤" },
  { name: "Nana",    accent: "from-rose-400 to-pink-500",     emoji: "ღ" },
];

// Templates use {name} for the recipient. They stay within "kinky / flirty"
// without crossing into anything more graphic — keeps the home-page widget
// SFW-adjacent for the brief moment a bubble is visible.
const MESSAGES: string[] = [
  "{name}-kun~ I've been thinking about you all day 💕",
  "you left me all wet last night, {name}~",
  "{name}~ come to bed already, I miss you 😘",
  "my room. tonight. don't keep me waiting, {name}-kun",
  "I bought new lingerie for you {name}~ wanna see? 🎀",
  "you're the only one I want, {name}-kun ♡",
  "I can't stop thinking about your hands on me {name}~",
  "{name}~ I'm bored... entertain me? 😈",
  "wish you were here cuddling me right now {name}-kun",
  "{name}~ I had the naughtiest dream about you last night 💋",
  "answer your phone, {name}~ I need you",
  "{name}-kun~ I'm wearing nothing but the hoodie you gave me",
  "hurry home {name}~ I've been a very bad girl today 💕",
  "save me {name}-kun, I'm so lonely without you 🥺",
  "thinking about you in the shower {name}~ ✨",
  "{name}~ are you ignoring me?? come pay attention to me 😤",
  "I want you all to myself tonight, {name}-kun ♡",
  "remember last weekend? do that to me again {name}~ 💞",
  "{name}-kun~ kiss me when you get back okay?",
  "I miss your touch {name}~ when can I see you again? ♡",
  "{name}~ promise me you're only mine tonight 💗",
  "I picked your favourite outfit just for you {name}-kun~",
  "come over {name}~ I have a surprise for you 😉",
  "{name}-kun, you're driving me crazy and you're not even here ♡",
];

interface Bubble {
  id: number;
  sender: typeof SENDERS[number];
  text: string;
}

function pickSender() {
  return SENDERS[Math.floor(Math.random() * SENDERS.length)];
}

function pickMessage(name: string) {
  const tpl = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return tpl.replace(/\{name\}/g, name || "Sam");
}

interface KinkyChatBubblesProps {
  boyName: string;
  /**
   * If true, the widget is suspended (no new bubbles, no rendering). Used
   * during age-gate / login screens so the bubbles only show on the real
   * app surface.
   */
  paused?: boolean;
}

export default function KinkyChatBubbles({ boyName, paused = false }: KinkyChatBubblesProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const pushBubble = useCallback(() => {
    const sender = pickSender();
    const text = pickMessage(boyName || "Sam");
    const id = ++idRef.current;
    setBubbles((prev) => {
      const next = [...prev, { id, sender, text }];
      // Cap so the corner doesn't grow into a wall — drop the oldest.
      return next.length > MAX_BUBBLES ? next.slice(next.length - MAX_BUBBLES) : next;
    });
    window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [boyName, dismiss]);

  // Schedule the next bubble. Uses jittered intervals so it never feels
  // robotically periodic.
  useEffect(() => {
    if (paused) return;
    const schedule = (delay: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        // Don't pile up while the tab is hidden — it'd dump 5 bubbles at
        // once when the user comes back, which is jarring.
        if (!document.hidden) pushBubble();
        const next = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
        schedule(next);
      }, delay);
    };
    schedule(FIRST_DELAY_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [paused, pushBubble]);

  if (paused || bubbles.length === 0) return null;

  return (
    <div
      className="fixed z-40 right-3 sm:right-5 flex flex-col-reverse gap-2 pointer-events-none"
      style={{
        // Sit above the mobile bottom nav (h-16 = 64px) and well clear of
        // the corner background-control button on the left side.
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
      }}
    >
      {bubbles.map((b) => (
        <ChatBubble key={b.id} bubble={b} onDismiss={() => dismiss(b.id)} />
      ))}
    </div>
  );
}

function ChatBubble({ bubble, onDismiss }: { bubble: Bubble; onDismiss: () => void }) {
  const { sender, text } = bubble;
  return (
    <div
      className="pointer-events-auto w-[18rem] max-w-[80vw] rounded-2xl border border-pink-400/40 bg-gradient-to-br from-black/85 via-pink-950/60 to-purple-950/70 backdrop-blur-md shadow-[0_8px_30px_rgba(236,72,153,0.35)] overflow-hidden animate-bubble-in"
      role="status"
    >
      <div className="flex items-start gap-3 p-3">
        {/* Avatar */}
        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${sender.accent} grid place-items-center text-white font-display text-base shadow-lg`}>
          {sender.name.charAt(0)}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-pink-500 border-2 border-black grid place-items-center">
            <Heart className="w-2 h-2 text-white fill-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-pink-200 font-bold text-sm truncate">
              {sender.name}
            </span>
            <span className="text-pink-300/70 text-xs">{sender.emoji}</span>
            <span className="ml-auto text-[10px] text-pink-200/50 tracking-wider uppercase flex items-center gap-1">
              <MessageCircle className="w-2.5 h-2.5" /> dm
            </span>
          </div>
          <p className="text-pink-50/95 text-[13px] leading-snug break-words">
            {text}
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-white/40 hover:text-white p-1 -m-1 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 bg-pink-500/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-rose-400 animate-bubble-progress"
          style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
        />
      </div>
    </div>
  );
}
