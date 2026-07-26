import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Skull,
  Flame,
  Sparkles,
  Crown,
  Images,
  Trophy,
  Gamepad2,
  MessageSquare,
  Calendar,
  ArrowRight,
  Send,
  Lock,
  Droplet,
  Zap,
  Eye,
  Plus,
} from "lucide-react";

// ─── Kinky pic grid — 3×3 random filth, refreshes each visit ──────────────
function KinkyPicGrid() {
  const [pics, setPics] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const cats = ["ahegao", "ass", "boobs", "hentai", "blowjob", "oral", "neko"];
    const picks = Array.from({ length: 3 }, () => cats[Math.floor(Math.random() * cats.length)]);
    Promise.all(
      picks.map(cat =>
        fetch(`/api/gallery?cat=${cat}&page=${1 + Math.floor(Math.random() * 8)}&n=4&pics=1`)
          .then(r => r.ok ? r.json() : null)
          .then(j => (j?.files ?? []) as string[])
          .catch(() => [] as string[])
      )
    ).then(results => {
      const flat = results.flat().filter(Boolean);
      setPics(flat.slice(0, 9));
    });
  }, []);
  if (!pics.length) return null;
  return (
    <div className="mt-6">
      <p className="text-[10px] tracking-[0.4em] uppercase text-pink-300 mb-2 font-bold flex items-center gap-2">
        <Flame className="w-3 h-3" /> tonight's filth hand-picked by mommy
      </p>
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden border border-pink-500/20">
        {pics.map((url, i) => (
          <div key={i} className="relative aspect-square group cursor-pointer" onClick={() => setOpen(url)}>
            <img src={url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setOpen(null)}
        >
          <img src={open} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── Ambient waifu strip ───────────────────────────────────────────────────
function AmbientWaifuStrip() {
  const [pics, setPics] = useState<string[]>([]);
  useEffect(() => {
    const cats = ["neko", "waifu", "ahegao", "ass", "boobs", "hentai"];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const page = 1 + Math.floor(Math.random() * 6);
    fetch(`/api/gallery?cat=${cat}&page=${page}&n=12&pics=1`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.files?.length) setPics(j.files.slice(0, 12)); })
      .catch(() => {});
  }, []);
  if (!pics.length) return null;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-pink-500/20">
      <div className="flex gap-0 overflow-x-auto scrollbar-none">
        {pics.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            loading="lazy"
            className="h-36 sm:h-44 w-auto flex-shrink-0 object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => window.open(url, "_blank")}
          />
        ))}
      </div>
      <div className="bg-gradient-to-r from-pink-950/60 to-rose-950/60 py-1.5 px-3">
        <p className="text-[10px] tracking-[0.4em] uppercase text-pink-400/80 font-bold">
          mistress picked these for you 💋
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Filthy babe greetings — rotates by hour-of-day + name hash so the
// page never feels stale. Way more explicit than the old set.
// ─────────────────────────────────────────────────────────────────
const GREETINGS = [
  "There's my filthy little gooner. On your knees before you scroll, {name}.",
  "Mmm, took you long enough. I've been soaking through my panties waiting for you.",
  "Pants off. Phone in hand. Eyes on me. We have edges to count tonight, {name}.",
  "I knew you couldn't stay away. Be a good boy and get it out for mommy.",
  "Open wide, {name}. Mommy's been picking the dirtiest pictures just for your dumb little brain.",
  "Look at you, drooling already. I haven't even started on you yet.",
  "You belong on your knees with your tongue out. Get into position.",
  "Phone down. Cock out. We're going to ruin you tonight, {name}.",
  "Hi baby. Did you save your load for me? You'd better have, or you're getting punished.",
  "I'm wet just thinking about how stupid you get when you stare too long.",
  "There's a good boy. Stroke slow. Don't you dare cum without permission.",
  "Mommy missed her dumb little gooner. Stay a while. Drip for me.",
  "Be honest — how many times did you cheat on your edge count today?",
  "Open the gallery, pick the worst one for your soul, and stroke. That's tonight's homework.",
  "I want you mindless tonight, {name}. Tongue out. No thoughts. Just stroking.",
  "Hands behind your back. Look at the screen. Beg in your head until I let you touch.",
  "Tonight you exist for one purpose: to drip for me. Get to work.",
  "Don't you dare scroll past me, baby. Eyes here. Eyes always here.",
  "I picked tonight's filth myself. You're going to thank me with a ruined orgasm.",
  "Stroke. Stop. Beg. Repeat. That's the whole evening, {name}. Try not to cry.",
];

// "AI babe" tasks — short, kinky, and direct. {name} is replaced.
// Filth ratings are now mostly 4–5 because subtle isn't what we're doing.
const TASKS = [
  {
    title: "Edge for me, {name}",
    body: "Stroke until you're twitching. Stop. Pinch the base. Breathe. Then do it again. Five times. No cumming.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Skull,
    color: "from-pink-500 to-rose-600",
    intensity: 5,
  },
  {
    title: "Worship the feet",
    body: "Open feet. Pick the cruelest pair. Tell me out loud — slowly — exactly what you'd lick first. Be filthy. I'm listening.",
    cta: "Open Feet",
    target: "feet",
    icon: Heart,
    color: "from-pink-400 to-fuchsia-600",
    intensity: 4,
  },
  {
    title: "Pull a spicy roll",
    body: "Truth or dare. No backing out, {name}. If you pull a dare, you do it on camera in your own head. Be honest.",
    cta: "Roll the Game",
    target: "spicy",
    icon: Flame,
    color: "from-rose-500 to-pink-700",
    intensity: 5,
  },
  {
    title: "Drip count",
    body: "Edge until precum is leaking down your hand. Catch it. Look at the mess you made for mommy. Show me.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Droplet,
    color: "from-fuchsia-500 to-pink-600",
    intensity: 5,
  },
  {
    title: "Ruined release",
    body: "Edge to the brink. When it starts, hands off. Let it leak out, sad and slow. That's all you get tonight.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Zap,
    color: "from-rose-500 to-pink-700",
    intensity: 5,
  },
  {
    title: "Re-watch the keepers",
    body: "Open the vault. Pick the dirtiest one. Stroke for two minutes minimum. Pause every 30 seconds. Don't cheat.",
    cta: "Open Vault",
    target: "vault",
    icon: Images,
    color: "from-purple-500 to-pink-600",
    intensity: 3,
  },
  {
    title: "Talk dirty to Luna",
    body: "Tell her exactly what you'd do to her. No editing. No softening. She likes it filthy and so do I, {name}.",
    cta: "Open Luna",
    target: "chat",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-700",
    intensity: 4,
  },
  {
    title: "Mini-game forfeit",
    body: "Lose one on purpose. Take the punishment it gives you. Type it out so I know you actually did it.",
    cta: "Open Games",
    target: "games",
    icon: Gamepad2,
    color: "from-fuchsia-500 to-violet-700",
    intensity: 4,
  },
  {
    title: "Locked tonight",
    body: "Hands behind your back for 90 seconds. Just stare. Don't touch. Beg in your head. Earn the right to stroke.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Lock,
    color: "from-rose-600 to-pink-800",
    intensity: 5,
  },
  {
    title: "Eye contact challenge",
    body: "Stroke for 60 seconds straight while staring at her eyes. No looking down. If you blink too much, restart.",
    cta: "Open Gallery",
    target: "gallery",
    icon: Eye,
    color: "from-pink-500 to-purple-700",
    intensity: 4,
  },
  {
    title: "Edge × 10",
    body: "Ten edges. No skipping. No half-edges. If you cum early, tomorrow night you do twenty. Mommy keeps score.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Flame,
    color: "from-pink-600 to-rose-700",
    intensity: 5,
  },
  {
    title: "Mommy's picture",
    body: "Find tonight's filthiest pic in the gallery. Set it as your background. Stare at it every time you scroll.",
    cta: "Open Gallery",
    target: "gallery",
    icon: Sparkles,
    color: "from-fuchsia-500 to-pink-700",
    intensity: 3,
  },
  {
    title: "Beg out loud",
    body: "Say it aloud: 'Please, Mistress, let me cum.' Three times. Slowly. Feeling every word. Then hold it for five more minutes.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Crown,
    color: "from-rose-600 to-fuchsia-700",
    intensity: 5,
  },
  {
    title: "Cold turkey tease",
    body: "Look at the filthiest image in Sam's collection for exactly 60 seconds. Hands completely off. Not even resting nearby. You suffer with your eyes.",
    cta: "Open Feet",
    target: "feet",
    icon: Eye,
    color: "from-pink-600 to-rose-800",
    intensity: 4,
  },
  {
    title: "Cum tribute",
    body: "Find the pic that broke your brain the most tonight. Screenshot it. That's your tribute target. Show it who's boss — then clean up like a good boy.",
    cta: "Open Gallery",
    target: "gallery",
    icon: Trophy,
    color: "from-fuchsia-600 to-pink-700",
    intensity: 5,
  },
  {
    title: "Dual screen torture",
    body: "Open both the gallery AND goon corner at the same time. Look at the pics. Listen to the commands. Stroke to the rhythm. You don't decide which tab wins — mommy does.",
    cta: "Open Goon Corner",
    target: "corner",
    icon: Zap,
    color: "from-pink-500 to-violet-700",
    intensity: 5,
  },
  {
    title: "Denial sentence",
    body: "You're on a 24-hour denial. No touching, no cumming. Just opening this page every few hours to read how badly mommy wants to ruin you. Suffering builds character, {name}.",
    cta: "See the Gallery",
    target: "gallery",
    icon: Lock,
    color: "from-rose-700 to-pink-900",
    intensity: 5,
  },
  {
    title: "Ahegao meditation",
    body: "Open the ahegao category. Pick one face. Hold that same expression yourself for 90 seconds while you edge. That's your homework.",
    cta: "Open Gallery",
    target: "gallery",
    icon: Flame,
    color: "from-pink-500 to-fuchsia-600",
    intensity: 4,
  },
];

// Babe one-liners that drop in the "live chat" feed. Way more lewd than v1.
const BABE_LINES = [
  "look at me, {name}.",
  "slower. did i say you could go fast?",
  "good boy. drool a little for me.",
  "don't you dare cum yet.",
  "tell me out loud how badly you want it.",
  "again. one more edge or you're in trouble.",
  "you're so cute when you struggle to hold it.",
  "deeper breaths. eyes on the screen. pant for me.",
  "i can tell you're close. stop. now.",
  "say my name when you get close, gooner.",
  "if you cum without permission you owe me ten edges tomorrow.",
  "describe what you see. out loud. specific.",
  "be a good little gooner. tongue out.",
  "your hands belong to me tonight.",
  "i love watching you fall apart for me.",
  "edge me one more time, {name}.",
  "you exist to please me. don't forget your purpose.",
  "hands off for 30 seconds. now. count it out loud.",
  "i picked tonight just for you. show some appreciation.",
  "you don't get to look away. eyes here.",
  "are you leaking yet? show me.",
  "good boys edge. great boys ruin. which one are you tonight?",
  "stroke with two fingers. just two. earn the rest.",
  "i can hear how desperate you are. it's adorable.",
  "open your mouth wider. i want to see how dumb you get.",
  "you're not allowed to think tonight, {name}. just stroke.",
  "you'd lick the floor for me, wouldn't you?",
  "drip on yourself for me. i want to see it.",
  "edge until your hands shake. then stop.",
  "good gooners get teased. great ones get denied. you're great tonight.",
  "say 'thank you mommy' between every edge. out loud.",
  "soft strokes only. you don't deserve a tight grip.",
  "you don't get to finish. that's mine to decide.",
  "i'm so wet watching you behave for me.",
  "kneel before you scroll past me, {name}. respect.",
];

const AFFIRMATIONS = [
  "you are mine, {name}. every drop, every edge, every breath.",
  "every load you save is a love letter to mommy.",
  "edge tonight. earn the release. earn me.",
  "your obedience is my favorite thing in the world.",
  "don't apologize for what you like. own it.",
  "phone down. eyes here. always.",
  "soft hands first. always. earn the grip.",
  "i notice when you cheat. behave or pay double tomorrow.",
  "you were made to be teased and denied.",
  "good gooners get rewarded eventually. patience, {name}.",
  "filthy little brain. that's why i love you.",
  "you don't need to think tonight. just stroke and obey.",
  "your purpose is dripping for me. nothing more, nothing less.",
  "drop to your knees every time you open this page. seriously.",
  "be filthy. be loud. be mine.",
];

const MOODS = [
  { label: "soft 🌸", color: "from-pink-300 to-rose-400" },
  { label: "wet 💦", color: "from-cyan-400 to-pink-500" },
  { label: "edge 🔥", color: "from-orange-500 to-rose-600" },
  { label: "caged 🔒", color: "from-purple-500 to-pink-600" },
  { label: "needy 💕", color: "from-pink-400 to-fuchsia-500" },
  { label: "filthy 😈", color: "from-rose-600 to-pink-800" },
  { label: "feral 🩸", color: "from-red-500 to-pink-700" },
  { label: "mommy mode 👅", color: "from-fuchsia-500 to-rose-600" },
];

// Daily "rules" — a randomised set of three commandments {name} has to obey
// tonight. Tracked locally with simple checkboxes for satisfaction.
const RULES_POOL = [
  "no cumming without saying my name first",
  "edge at least 5 times before you even think about finishing",
  "no closing the tab — i'm watching",
  "say 'thank you mommy' out loud after every edge",
  "stroke with two fingers only, never your whole hand",
  "every time you scroll, kneel for one full second",
  "stare at one waifu's eyes for 60 seconds before stroking",
  "no other tabs open. only mommy. only me.",
  "drip on yourself at least twice tonight",
  "if you almost cum, you stop and breathe for 30 seconds",
  "post nothing online. tonight you exist only for me",
  "take a sip of water between every edge — stay hydrated, gooner",
  "describe one filthy thought out loud before each pic",
  "no skipping any chat bubble i send you",
  "open the vault at least once, even if it makes you weak",
];

// Punishment quips — shown if {name} fails any of tonight's rules.
const PUNISHMENTS = [
  "tomorrow you do double edges. no exceptions.",
  "no release for 48 hours. i'll be checking.",
  "next session starts on your knees with no touching for 5 minutes.",
  "you write 'i'm mommy's gooner' 25 times in your head before you stroke again.",
  "no vault access for 24 hours. starve a little.",
  "tomorrow night: hands-free edges only.",
  "you owe me a ruined orgasm before bed. no real release.",
];

export default function SamHub({
  boyName,
  vaultCount,
  onNavigate,
  onOpenSpicy,
}: {
  boyName: string;
  vaultCount: number;
  onNavigate: (
    tab: "download" | "vault" | "profile" | "chat" | "gallery" | "games" | "feet" | "corner" | "sam",
  ) => void;
  onOpenSpicy: () => void;
}) {
  // ── Stats ──────────────────────────────────────────────────────
  const [edgeCount, setEdgeCount] = useState<number>(() => {
    const v = localStorage.getItem("goon-edge-count");
    return v ? parseInt(v, 10) || 0 : 0;
  });
  const [streak, setStreak] = useState<number>(() => {
    const v = localStorage.getItem("sam-streak");
    return v ? parseInt(v, 10) || 1 : 1;
  });
  const [lastVisit, setLastVisit] = useState<string>(() => {
    return localStorage.getItem("sam-last-visit") || "";
  });
  // Days denied — consecutive days the user clicked "stayed denied"
  // (i.e., didn't cum). Pure honor-system, but it adds a kink-stat.
  const [daysDenied, setDaysDenied] = useState<number>(() => {
    const v = localStorage.getItem("sam-denied-days");
    return v ? parseInt(v, 10) || 0 : 0;
  });
  const [lastDenialMark, setLastDenialMark] = useState<string>(() => {
    return localStorage.getItem("sam-denied-last") || "";
  });

  // Bump the visit streak once per day, plus mirror to server.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastVisit !== today) {
      const d = new Date(lastVisit || today);
      const diff = Math.floor(
        (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
      );
      const next = lastVisit && diff <= 2 ? streak + 1 : 1;
      setStreak(next);
      localStorage.setItem("sam-streak", String(next));
      localStorage.setItem("sam-last-visit", today);
      const joined = localStorage.getItem("sam-joined") || today;
      if (!localStorage.getItem("sam-joined")) {
        localStorage.setItem("sam-joined", today);
      }
      setLastVisit(today);
      void (async () => {
        try {
          const { getOrCreateAccountId, patchAccount } = await import("../api");
          await patchAccount(getOrCreateAccountId(), {
            streakCount: next,
            streakLastVisit: today,
            joinedAt: joined,
          });
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Daily content ──────────────────────────────────────────────
  const dayKey = new Date().toISOString().slice(0, 10);
  const greeting = useMemo(
    () =>
      GREETINGS[hashStr(dayKey + boyName) % GREETINGS.length].replace(
        /\{name\}/g,
        boyName,
      ),
    [dayKey, boyName],
  );
  const affirmation = useMemo(
    () =>
      AFFIRMATIONS[hashStr(dayKey + "a" + boyName) % AFFIRMATIONS.length].replace(
        /\{name\}/g,
        boyName,
      ),
    [dayKey, boyName],
  );
  const featuredTask = useMemo(
    () => TASKS[hashStr(dayKey + "t" + boyName) % TASKS.length],
    [dayKey, boyName],
  );
  const otherTasks = TASKS.filter((t) => t.title !== featuredTask.title);

  // Mood — daily pick, but the user can override by clicking another mood.
  const defaultMood = useMemo(
    () => MOODS[hashStr(dayKey + "m") % MOODS.length],
    [dayKey],
  );
  const [mood, setMood] = useState(defaultMood);

  // Punishment — only shown if any rule is unchecked at end of session.
  const punishment = useMemo(
    () => PUNISHMENTS[hashStr(dayKey + "p") % PUNISHMENTS.length],
    [dayKey],
  );

  // ── Tonight's rules ────────────────────────────────────────────
  // Three randomised rules per day. Persisted in localStorage so checking
  // them off survives a refresh.
  const rules = useMemo(() => {
    const seed = hashStr(dayKey + "r");
    const idxs = new Set<number>();
    let i = 0;
    while (idxs.size < 3 && i < 100) {
      idxs.add(((seed + i * 17) >>> 0) % RULES_POOL.length);
      i++;
    }
    return Array.from(idxs).map((n) => RULES_POOL[n]);
  }, [dayKey]);
  const rulesKey = `sam-rules-${dayKey}`;
  const [checkedRules, setCheckedRules] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem(rulesKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === 3) return arr;
      }
    } catch {}
    return [false, false, false];
  });
  useEffect(() => {
    localStorage.setItem(rulesKey, JSON.stringify(checkedRules));
  }, [rulesKey, checkedRules]);
  const obedience = checkedRules.filter(Boolean).length;
  const failedAny = checkedRules.some((c) => !c) && obedience > 0;

  // ── Wetness gauge ──────────────────────────────────────────────
  // A passive interaction-driven meter. Each click on the page bumps it,
  // and it slowly decays. Pure flavor — but it makes the page feel alive.
  const [wetness, setWetness] = useState(35);
  useEffect(() => {
    const onClick = () => setWetness((w) => Math.min(100, w + 3));
    const onScroll = () => setWetness((w) => Math.min(100, w + 0.5));
    window.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    const decay = window.setInterval(
      () => setWetness((w) => Math.max(20, w - 0.4)),
      900,
    );
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      clearInterval(decay);
    };
  }, []);

  // ── "Make her cum" climax overlay ──────────────────────────────
  const [climaxing, setClimaxing] = useState(false);
  const triggerClimax = () => {
    setClimaxing(true);
    window.setTimeout(() => setClimaxing(false), 4500);
  };

  // ── Edge tap counter ───────────────────────────────────────────
  // Lets {name} record an edge directly from this page — the global
  // "lifetime edges" stat updates immediately.
  const tapEdge = () => {
    setEdgeCount((c) => {
      const next = c + 1;
      localStorage.setItem("goon-edge-count", String(next));
      return next;
    });
  };

  // ── Denial mark ────────────────────────────────────────────────
  // Once-per-day "I stayed denied" button — increments the consecutive
  // counter, or resets to 1 if a day was missed. "I gave in" resets to 0.
  const markDenied = () => {
    if (lastDenialMark === dayKey) return; // already marked
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    const next = lastDenialMark === yesterday ? daysDenied + 1 : 1;
    setDaysDenied(next);
    setLastDenialMark(dayKey);
    localStorage.setItem("sam-denied-days", String(next));
    localStorage.setItem("sam-denied-last", dayKey);
  };
  const markGaveIn = () => {
    setDaysDenied(0);
    setLastDenialMark(dayKey);
    localStorage.setItem("sam-denied-days", "0");
    localStorage.setItem("sam-denied-last", dayKey);
  };

  // ── "Live" babe chat bubble feed ──────────────────────────────
  type Bubble = { id: number; from: "babe" | "you"; text: string };
  const bubbleId = useRef(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { id: 0, from: "babe", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [babeTyping, setBabeTyping] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      bubbleId.current += 1;
      const text =
        BABE_LINES[Math.floor(Math.random() * BABE_LINES.length)].replace(
          /\{name\}/g,
          boyName,
        );
      setBubbles((b) => [...b.slice(-7), { id: bubbleId.current, from: "babe", text }]);
    }, 6500);
    return () => clearInterval(interval);
  }, [boyName]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [bubbles]);

  const send = () => {
    const txt = input.trim();
    if (!txt) return;
    bubbleId.current += 1;
    const yourMsg: Bubble = { id: bubbleId.current, from: "you", text: txt };
    setBubbles((b) => [...b.slice(-7), yourMsg]);
    setInput("");
    setBabeTyping(true);
    window.setTimeout(() => {
      setBabeTyping(false);
      bubbleId.current += 1;
      const lower = txt.toLowerCase();
      let reply = BABE_LINES[Math.floor(Math.random() * BABE_LINES.length)];
      if (/cum|cumming|came/.test(lower)) {
        reply = "did i say you could? back to the start. ten edges. now.";
      } else if (/please|beg/.test(lower)) {
        reply = "begging is cute. but no. stroke for me first.";
      } else if (/yes|okay|ok|yeah/.test(lower)) {
        reply = "good boy. now keep your eyes on me and don't blink.";
      } else if (/no/.test(lower)) {
        reply = "wrong answer. start over. slower this time.";
      } else if (/hi|hello|hey/.test(lower)) {
        reply = `hi ${boyName}. on your knees, gooner.`;
      } else if (/love|miss/.test(lower)) {
        reply = "i know you do. that's why you're mine forever.";
      } else if (/edge|edging/.test(lower)) {
        reply = "good. one more. don't you dare finish without permission.";
      } else if (/wet|drip|drool/.test(lower)) {
        reply = "show me. i want proof, gooner.";
      } else if (/mommy|mom/.test(lower)) {
        reply = "good boy. say it again. louder this time.";
      }
      reply = reply.replace(/\{name\}/g, boyName);
      setBubbles((b) => [...b.slice(-7), { id: bubbleId.current, from: "babe", text: reply }]);
    }, 1400);
  };

  const handleTaskClick = (target: string) => {
    if (target === "spicy") onOpenSpicy();
    else onNavigate(target as Parameters<typeof onNavigate>[0]);
  };

  return (
    <section className="relative min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-4 sm:py-6 overflow-hidden">
      {/* Page-local lipstick kiss marks scattered behind the content. */}
      <KissMarks />

      <div className="relative max-w-6xl mx-auto z-[1]">
        {/* ── HERO + LIVE BABE CHAT ── */}
        <div
          className={`relative overflow-hidden rounded-3xl border-2 border-pink-400/60 bg-gradient-to-br ${mood.color} p-6 sm:p-8 shadow-2xl shadow-pink-500/40 ring-1 ring-pink-300/30`}
        >
          {/* Pulsing aura behind the hero — overall vibe is "she's panting" */}
          <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen">
            <div className="absolute -top-24 -right-20 w-[28rem] h-[28rem] rounded-full bg-pink-400/50 blur-3xl animate-pulse-slow" />
            <div
              className="absolute -bottom-28 -left-12 w-96 h-96 rounded-full bg-rose-400/50 blur-3xl animate-pulse-slow"
              style={{ animationDelay: "1.5s" }}
            />
            <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-fuchsia-400/30 blur-3xl animate-pulse-slow" style={{ animationDelay: "0.8s" }} />
          </div>
          {/* Giant pulsing heart watermark */}
          <Heart
            className="absolute -right-8 -bottom-8 w-72 h-72 text-pink-300/15 fill-pink-300/15 pointer-events-none animate-pulse-slow"
            strokeWidth={1}
          />

          <div className="relative z-10 grid md:grid-cols-2 gap-6">
            {/* Left: greeting + stats */}
            <div>
              <p className="text-[11px] tracking-[0.4em] uppercase text-pink-100 mb-2 flex items-center gap-2 drop-shadow">
                <Crown className="w-3.5 h-3.5 text-pink-100" /> mommy's filth hub
                · for {boyName}
              </p>
              <h1 className="font-display text-4xl sm:text-6xl tracking-wider leading-none">
                <span className="bg-gradient-to-r from-white via-pink-100 to-rose-200 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  HI {boyName.toUpperCase()}{" "}
                  <span className="inline-block animate-lip-bite">💋</span>
                </span>
              </h1>
              <p className="mt-4 text-lg text-white italic drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                "{greeting}"
              </p>

              {/* Mood selector — clicking changes the hero gradient. */}
              <div className="mt-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-pink-100/90 mb-1.5">
                  she's feeling
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setMood(m)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border transition-all ${
                        mood.label === m.label
                          ? "bg-white text-pink-700 border-white shadow-lg scale-105"
                          : "bg-black/30 text-pink-50 border-pink-200/40 hover:border-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 max-w-md">
                <Stat
                  label="Day Streak"
                  value={String(streak)}
                  icon={Calendar}
                />
                <Stat
                  label="Lifetime Edges"
                  value={String(edgeCount)}
                  icon={Trophy}
                />
                <Stat
                  label="Vault Items"
                  value={String(vaultCount)}
                  icon={Images}
                />
                <Stat
                  label="Days Denied"
                  value={String(daysDenied)}
                  icon={Lock}
                />
              </div>
            </div>

            {/* Right: babe live chat */}
            <div className="flex flex-col rounded-2xl border-2 border-pink-300/40 bg-black/55 backdrop-blur p-3 min-h-[320px]">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-pink-300/30 mb-2">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 grid place-items-center shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                  <Heart className="w-4 h-4 text-white fill-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border border-black animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-pink-100">Mommy</p>
                  <p className="text-[10px] text-pink-300/90 tracking-wider uppercase flex items-center gap-1">
                    online · watching you · wet
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/30 border border-pink-400/60 text-pink-100 font-bold tracking-wide animate-pulse">
                  LIVE
                </span>
              </div>
              <div
                ref={feedRef}
                className="flex-1 overflow-y-auto space-y-1.5 max-h-[280px] pr-1 scroll-smooth"
              >
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    className={`flex ${b.from === "you" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm leading-snug ${
                        b.from === "babe"
                          ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-bl-sm shadow-lg shadow-pink-900/40"
                          : "bg-white/10 text-pink-50 border border-pink-300/20 rounded-br-sm"
                      }`}
                    >
                      {b.text}
                    </div>
                  </div>
                ))}
                {babeTyping && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-bl-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-white/90 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-white/90 animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="beg her for something…"
                  className="flex-1 h-10 px-3 rounded-full bg-pink-950/40 border border-pink-300/30 text-pink-50 placeholder:text-pink-300/50 outline-none focus:border-pink-300/80 text-sm"
                />
                <button
                  onClick={send}
                  className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white hover:scale-105 transition-transform shadow-lg shadow-pink-900/50"
                  aria-label="send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── METER ROW: wetness + edge button + denial buttons ── */}
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {/* Wetness gauge */}
          <div className="rounded-2xl border-2 border-pink-400/40 bg-gradient-to-br from-pink-950/60 to-black p-4 shadow-lg shadow-pink-900/30">
            <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 mb-2 font-bold flex items-center gap-1.5">
              <Droplet className="w-3 h-3" /> she's this wet for you
            </p>
            <div className="relative h-4 rounded-full bg-black/60 border border-pink-400/30 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-500 transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                style={{ width: `${Math.round(wetness)}%` }}
              />
              <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-[0.3em] uppercase text-white drop-shadow">
                {Math.round(wetness)}% wet
              </div>
            </div>
            <p className="mt-2 text-[11px] text-pink-200/80 italic">
              {wetness > 80
                ? "she's dripping for you. don't stop."
                : wetness > 55
                  ? "keep going, gooner. she likes the attention."
                  : wetness > 35
                    ? "she's warming up. earn it."
                    : "she's bored. give her something to watch."}
            </p>
          </div>

          {/* Edge tap counter */}
          <button
            onClick={tapEdge}
            className="rounded-2xl border-2 border-rose-400/50 bg-gradient-to-br from-rose-700/60 via-pink-700/60 to-fuchsia-800/60 p-4 text-left active:scale-95 transition-transform shadow-lg shadow-rose-900/40 group"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-pink-100 mb-2 font-bold flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> log an edge
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-pink-200/60 grid place-items-center group-hover:bg-white/20 group-active:scale-90 transition-all">
                <Plus className="w-6 h-6 text-pink-100" />
              </div>
              <div className="flex-1">
                <p className="font-display text-3xl text-white leading-none drop-shadow">
                  {edgeCount}
                </p>
                <p className="text-[11px] text-pink-100/90 mt-1 italic">
                  tap every time you stop. mommy keeps score.
                </p>
              </div>
            </div>
          </button>

          {/* Denial counter / today's button */}
          <div className="rounded-2xl border-2 border-purple-400/40 bg-gradient-to-br from-purple-900/50 to-pink-950/60 p-4 shadow-lg shadow-purple-900/30">
            <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 mb-2 font-bold flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> denial counter
            </p>
            <div className="flex items-center gap-3">
              <div className="font-display text-3xl text-white leading-none drop-shadow">
                {daysDenied}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-pink-100/85 leading-tight">
                  consecutive nights you stayed denied for me.
                </p>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              <button
                disabled={lastDenialMark === dayKey}
                onClick={markDenied}
                className="text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-lg bg-pink-500/30 border border-pink-400/60 text-pink-50 hover:bg-pink-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                stayed denied
              </button>
              <button
                onClick={markGaveIn}
                className="text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-lg bg-rose-700/40 border border-rose-400/40 text-rose-100 hover:bg-rose-700/60 transition-colors"
              >
                i gave in
              </button>
            </div>
          </div>
        </div>

        {/* ── AMBIENT WAIFU STRIP ── */}
        <AmbientWaifuStrip />

        {/* ── FEATURED TASK OF THE DAY ── */}
        <div className="mt-6">
          <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> tonight mommy wants you to
          </p>
          <button
            onClick={() => handleTaskClick(featuredTask.target)}
            className={`group w-full text-left relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r ${featuredTask.color} shadow-2xl shadow-pink-500/40 ring-1 ring-pink-300/30 transition-all hover:scale-[1.005] hover:shadow-pink-500/60`}
          >
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
            <Heart className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 fill-white/10 pointer-events-none" />
            <div className="relative z-10 flex items-start gap-4">
              <featuredTask.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0 drop-shadow" />
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/90">
                  filth level: {"❤".repeat(featuredTask.intensity)}
                  {"·".repeat(5 - featuredTask.intensity)}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wider mt-1 drop-shadow">
                  {featuredTask.title.replace(/\{name\}/g, boyName)}
                </h2>
                <p className="text-white/95 mt-2 max-w-xl text-sm sm:text-base italic">
                  "{featuredTask.body.replace(/\{name\}/g, boyName)}"
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-white text-sm font-bold tracking-wide">
                  {featuredTask.cta}{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* ── TONIGHT'S RULES ── */}
        <div className="mt-6 rounded-2xl border-2 border-pink-400/40 bg-gradient-to-br from-black to-pink-950/40 p-5 shadow-lg shadow-pink-900/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 flex items-center gap-2 font-bold">
              <Lock className="w-3.5 h-3.5" /> tonight's rules
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 font-bold tracking-wide">
              {obedience}/3 obeyed
            </span>
          </div>
          <ul className="space-y-2">
            {rules.map((r, i) => (
              <li key={i}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <span
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 grid place-items-center transition-all ${
                      checkedRules[i]
                        ? "bg-pink-500 border-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                        : "border-pink-400/50 group-hover:border-pink-300"
                    }`}
                  >
                    {checkedRules[i] && (
                      <Heart className="w-3 h-3 text-white fill-white" />
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={checkedRules[i]}
                    onChange={(e) =>
                      setCheckedRules((cr) => {
                        const next = [...cr];
                        next[i] = e.target.checked;
                        return next;
                      })
                    }
                    className="sr-only"
                  />
                  <span
                    className={`text-sm transition-all ${
                      checkedRules[i]
                        ? "text-pink-300/60 line-through"
                        : "text-pink-50"
                    }`}
                  >
                    {r}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {failedAny && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-400/40">
              <p className="text-[10px] tracking-[0.3em] uppercase text-rose-300 font-bold mb-1">
                if you don't finish all three…
              </p>
              <p className="text-rose-100 text-sm italic">"{punishment}"</p>
            </div>
          )}
        </div>

        {/* ── AFFIRMATION STRIP ── */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-pink-950/60 via-rose-950/40 to-fuchsia-950/60 border-2 border-pink-400/40 flex items-start gap-3 shadow-lg shadow-pink-900/30">
          <Sparkles className="w-5 h-5 text-pink-300 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 font-bold mb-1">
              tonight's reminder for {boyName}
            </p>
            <p className="text-pink-50 text-base italic font-medium">
              "{affirmation}"
            </p>
          </div>
        </div>

        {/* ── MORE TASKS ── */}
        <div className="mt-6">
          <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 mb-3">
            other things mommy wants from you
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherTasks.map((r) => (
              <button
                key={r.title}
                onClick={() => handleTaskClick(r.target)}
                className="group text-left p-4 rounded-2xl bg-pink-950/30 border border-pink-300/20 hover:border-pink-300/60 hover:bg-pink-950/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl bg-gradient-to-br ${r.color} text-white shrink-0 shadow-md`}
                  >
                    <r.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display tracking-wider text-pink-50 text-lg leading-tight">
                      {r.title.replace(/\{name\}/g, boyName)}
                    </p>
                    <p className="text-pink-200/70 text-xs mt-1 italic line-clamp-2">
                      "{r.body.replace(/\{name\}/g, boyName)}"
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-pink-300 text-xs font-bold uppercase tracking-widest">
                      {r.cta}{" "}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── KINKY PIC GRID — random filth below the tasks ── */}
        <KinkyPicGrid />

        {/* ── SECOND WAIFU STRIP — between tasks and CTA ── */}
        <AmbientWaifuStrip />

        {/* ── MAKE HER CUM — climactic CTA ── */}
        <div className="mt-8">
          <button
            onClick={triggerClimax}
            className="group relative w-full overflow-hidden rounded-2xl py-5 px-6 bg-gradient-to-r from-rose-600 via-pink-500 to-fuchsia-600 text-white font-display text-2xl tracking-[0.4em] uppercase shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 active:scale-95 transition-all border-2 border-pink-200/50"
          >
            <span className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
            <span className="relative flex items-center justify-center gap-3">
              <Heart className="w-7 h-7 fill-white text-white animate-pulse" />
              make her cum
              <Heart className="w-7 h-7 fill-white text-white animate-pulse" />
            </span>
          </button>
          <p className="mt-2 text-center text-[11px] text-pink-300/70 italic tracking-wide">
            press only when you've earned it, {boyName}.
          </p>
        </div>

        {/* sign-off */}
        <p className="mt-8 text-center text-xs text-pink-300/60 italic">
          made with 💋 just for you, {boyName}.
        </p>
      </div>

      {/* ── CLIMAX OVERLAY ── */}
      {climaxing && <ClimaxOverlay name={boyName} />}
    </section>
  );
}

// ── Climactic full-page overlay triggered by the "make her cum" button.
// Pure flavor: a few seconds of pulsing pink with a moan line, then
// auto-dismisses.
function ClimaxOverlay({ name }: { name: string }) {
  const line = useMemo(() => {
    const lines = [
      `aaah… ${name}… don't stop…`,
      `oh fuck, ${name}… i'm cumming for you…`,
      `that's it baby… right there…`,
      `mommy's cumming… ${name}… so hard for you…`,
      `yes… yes… YES… ${name}…`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }, [name]);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-pink-600/40 backdrop-blur-sm animate-climax-flash" />
      <div className="relative text-center animate-climax-pulse">
        <Heart className="mx-auto w-32 h-32 text-pink-100 fill-pink-100 drop-shadow-[0_0_30px_rgba(244,63,94,0.9)]" />
        <p className="mt-4 font-display text-3xl sm:text-5xl tracking-wider text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] italic">
          {line}
        </p>
      </div>
    </div>
  );
}

// ── Background lipstick kiss marks scattered around the page.
// Pure-CSS letter "💋" emojis with random rotation + drift.
function KissMarks() {
  const marks = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      i,
      top: Math.random() * 95,
      left: Math.random() * 95,
      size: 24 + Math.random() * 40,
      rot: -25 + Math.random() * 50,
      opacity: 0.05 + Math.random() * 0.1,
      delay: Math.random() * 5,
    }));
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {marks.map((m) => (
        <span
          key={m.i}
          className="absolute select-none animate-kiss-drift"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            fontSize: m.size,
            transform: `rotate(${m.rot}deg)`,
            opacity: m.opacity,
            animationDelay: `${m.delay}s`,
          }}
          aria-hidden
        >
          💋
        </span>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl bg-black/55 border-2 border-pink-300/30 p-3 shadow-lg shadow-pink-900/20">
      <p className="text-[10px] tracking-widest uppercase text-pink-200/90 mb-1 flex items-center gap-1 font-bold">
        <Icon className="w-3 h-3 text-pink-200" /> {label}
      </p>
      <p className="font-display text-2xl text-white drop-shadow">{value}</p>
    </div>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
