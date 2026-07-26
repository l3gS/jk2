import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trophy,
  Zap,
  Flame,
  Heart,
  SkipForward,
  Mic,
  MicOff,
  Star,
  Dice5,
  Eye,
  MessageCircle,
  Sparkles,
  Target,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { pickGoonerTagline } from "../lib/goonerTaglines";
import {
  STROKE_PATTERNS,
  KINK_COMMANDS,
  PUNISHMENTS,
  REWARDS,
  WHISPERS,
  ACHIEVEMENTS,
  HYPNO_TRIGGERS,
  pickFrom,
} from "../lib/chamberKinks";

// ────────────────────────────────────────────────────────────────────
// GOON CHAMBER — full-immersion gooner mode.
//
// Layout: a 6-tile auto-cycling image wall pulled from the public
// hentai gallery API (each tile refreshes on its own staggered timer),
// a center pulsing orb that beats at the chosen BPM, an audible click
// (Web Audio sine, optional), a rotating mantra overlay, an in-page
// edge tap counter, a session timer, and a fullscreen toggle that
// hides everything else for true immersion.
// ────────────────────────────────────────────────────────────────────

const TILE_COUNT = 6;

const PRESETS: { label: string; bpm: number; cls: string }[] = [
  { label: "WARM",    bpm: 30,  cls: "from-pink-500 to-rose-500" },
  { label: "BUILD",   bpm: 60,  cls: "from-rose-500 to-pink-500" },
  { label: "POUND",   bpm: 100, cls: "from-red-500 to-rose-600" },
  { label: "FRENZY",  bpm: 140, cls: "from-fuchsia-500 to-red-500" },
  { label: "BEAST",   bpm: 200, cls: "from-violet-600 to-fuchsia-600" },
  { label: "HYPER",   bpm: 250, cls: "from-red-600 to-violet-700" },
  { label: "MACHINE", bpm: 300, cls: "from-zinc-900 to-red-700" },
  { label: "STOP",    bpm: 0,   cls: "from-amber-500 to-orange-500" },
];

const CATS = [
  { value: "hentai",         label: "Hentai" },
  { value: "blowjob",        label: "Blowjob" },
  { value: "trap",           label: "Trap" },
  { value: "neko",           label: "Neko" },
  { value: "feet",           label: "Feet" },
  // Position-based filters — let the chamber lock onto a single pose.
  { value: "doggystyle",     label: "Doggy" },
  { value: "cowgirl",        label: "Cowgirl" },
  { value: "reversecowgirl", label: "Reverse Cowgirl" },
  { value: "missionary",     label: "Missionary" },
  { value: "spitroast",      label: "Spitroast" },
  { value: "standing",       label: "Standing" },
  { value: "spread",         label: "Spread" },
  { value: "bent_over",      label: "Bent Over" },
  { value: "facesit",        label: "Facesitting" },
  { value: "mating",         label: "Mating Press" },
  { value: "prone",          label: "Prone Bone" },
  { value: "anal",           label: "Anal" },
  { value: "ahegao",         label: "Ahegao" },
  { value: "paizuri",        label: "Paizuri" },
  { value: "futanari",       label: "Futa" },
] as const;
type Cat = (typeof CATS)[number]["value"];

// ─── Moan audio source ──────────────────────────────────────────────
// Real long-form hentai audio is pulled live from our /api/gif/random
// endpoint — redgifs hentai clips are 10-60s mp4s with native audio,
// which an HTMLAudioElement happily streams. The clip loops while it's
// playing so the user gets continuous moaning instead of a 1-second
// SFX-then-silence experience; "Skip" fetches a new clip on demand.

// ─── Goon-game level milestones — driven purely by stroke count.
// Hitting a milestone bumps BPM up a notch and fires a celebratory toast.
const LEVELS: { strokes: number; bpm: number; title: string }[] = [
  { strokes: 0,    bpm: 30,  title: "Warm-up"    },
  { strokes: 25,   bpm: 50,  title: "Easing in"  },
  { strokes: 75,   bpm: 70,  title: "Building"   },
  { strokes: 150,  bpm: 90,  title: "Hard"       },
  { strokes: 250,  bpm: 110, title: "Pounding"   },
  { strokes: 400,  bpm: 140, title: "Frenzy"     },
  { strokes: 600,  bpm: 175, title: "Beast Mode" },
  { strokes: 900,  bpm: 210, title: "Goon God"   },
  { strokes: 1300, bpm: 250, title: "Hyper"      },
  { strokes: 1800, bpm: 300, title: "MACHINE"    },
];

interface Props {
  boyName: string;
}

export default function GoonChamber({ boyName }: Props) {
  const [bpm, setBpm] = useState(60);
  const [running, setRunning] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [cat, setCat] = useState<Cat>("hentai");
  const [tiles, setTiles] = useState<(string | null)[]>(
    Array(TILE_COUNT).fill(null),
  );
  const [edgeCount, setEdgeCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("goon-edge-count") || "0", 10) || 0;
    } catch {
      return 0;
    }
  });
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tagline, setTagline] = useState<string>(() =>
    pickGoonerTagline(boyName),
  );
  const [pulse, setPulse] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [level, setLevel] = useState(0);
  const [autoLevel, setAutoLevel] = useState(true);
  // ─── Moan player state.
  const [moanOn, setMoanOn] = useState(false);
  const [moanUrl, setMoanUrl] = useState<string | null>(null);
  const [moanLabel, setMoanLabel] = useState<string>("Tap on to play");
  const [moanVol, setMoanVol] = useState(0.7);
  // ─── Kink content state.
  const [pattern, setPattern] = useState<string>("steady");
  const [patternStep, setPatternStep] = useState(0);
  const [command, setCommand] = useState<string>(() => pickFrom(KINK_COMMANDS));
  // Bumped every time a fresh command is issued so the UI can pulse/animate
  // the new order — gives the game a "she's talking to me" feel.
  const [commandTick, setCommandTick] = useState(0);
  const [commandCountdown, setCommandCountdown] = useState(10);
  const [verdict, setVerdict] = useState<{ kind: "punish" | "reward"; text: string } | null>(null);
  const [whisper, setWhisper] = useState<string>(() => pickFrom(WHISPERS));
  const [hypno, setHypno] = useState(false);
  const [hypnoWord, setHypnoWord] = useState<string>(() => pickFrom(HYPNO_TRIGGERS));
  const [gifs, setGifs] = useState<(string | null)[]>([null, null, null]);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("goon-achievements");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moanRef = useRef<HTMLAudioElement | null>(null);

  // ── Initial tile fill on mount + on category change.
  useEffect(() => {
    setTiles(Array(TILE_COUNT).fill(null));
    let cancelled = false;
    (async () => {
      for (let i = 0; i < TILE_COUNT; i++) {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/gallery/random?cat=${cat}`);
          const d = await r.json();
          if (cancelled) return;
          if (d?.url) {
            setTiles((prev) => {
              const next = [...prev];
              next[i] = d.url;
              return next;
            });
          }
        } catch {
          /* ignore — tile stays null and shows a placeholder */
        }
        // Small stagger so we don't hammer the server with 6 parallel hits.
        await new Promise((res) => setTimeout(res, 140));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cat]);

  // ── Per-tile auto-cycle. Each tile gets its own random interval (4-8s)
  // so the wall feels alive and never refreshes in lockstep.
  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const ms = 4000 + Math.floor(Math.random() * 4000);
      const id = window.setInterval(async () => {
        try {
          const r = await fetch(`/api/gallery/random?cat=${cat}`);
          const d = await r.json();
          if (d?.url) {
            setTiles((prev) => {
              const next = [...prev];
              next[i] = d.url;
              return next;
            });
          }
        } catch {
          /* swallow */
        }
      }, ms);
      timers.push(id);
    }
    return () => timers.forEach((t) => clearInterval(t));
  }, [cat]);

  // ── Beat engine. While running and bpm > 0, fire a tick every (60s/bpm).
  // Each tick toggles the orb pulse, plays a click if audio is on, and
  // counts a stroke. bpm=0 = explicit STOP / edge-hold mode.
  const playClick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current!;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 620;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.1);
    } catch {
      /* AudioContext unavailable — silently skip */
    }
  }, []);

  useEffect(() => {
    if (!running || bpm <= 0) {
      setPulse(false);
      return;
    }
    const baseInterval = 60_000 / bpm;
    const pat = STROKE_PATTERNS.find((p) => p.id === pattern) || STROKE_PATTERNS[0];
    let step = 0;
    let timeoutId = 0;
    const tick = () => {
      const mult = pat.multipliers[step % pat.multipliers.length];
      const interval = baseInterval * mult;
      setPulse(true);
      window.setTimeout(
        () => setPulse(false),
        Math.min(interval * 0.4, 220),
      );
      setStrokes((s) => s + 1);
      if (audioOn) playClick();
      step++;
      setPatternStep(step);
      timeoutId = window.setTimeout(tick, interval);
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, [running, bpm, audioOn, playClick, pattern]);

  // ── Auto-stroke "drip". Even when the beat hasn't fired (e.g. very low
  // BPM, or while the user just stares at the wall), the goon-game keeps
  // ticking the stroke counter forward over time so progress always feels
  // alive. Rate scales with BPM so a faster beat means faster auto-strokes.
  useEffect(() => {
    if (!running) return;
    const rate = 1500 - Math.min(1200, bpm * 6); // 1500ms .. 300ms
    const id = window.setInterval(() => {
      setStrokes((s) => s + 1);
    }, Math.max(300, rate));
    return () => clearInterval(id);
  }, [running, bpm]);

  // ── Game level engine. Whenever stroke count crosses a milestone the
  // chamber levels up — bumps the BPM and fires a celebratory toast so it
  // genuinely feels like progressing through a goon game.
  useEffect(() => {
    let next = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (strokes >= LEVELS[i].strokes) next = i;
    }
    if (next !== level) {
      setLevel(next);
      if (next > 0) {
        // Auto-BPM: don't lock to a fixed number — jitter ±20 around the
        // level's base so each level-up feels like a fresh, unpredictable
        // gear shift instead of the same predictable value every time.
        const base = LEVELS[next].bpm;
        const jitter = Math.floor(Math.random() * 41) - 20; // -20..+20
        const newBpm = Math.max(20, base + jitter);
        toast.success(`LEVEL UP — ${LEVELS[next].title} 🔥`, {
          description: `${strokes} strokes · BPM ${newBpm}`,
        });
        if (autoLevel) setBpm(newBpm);
        // Hit the user with a fresh order on every level-up so the game
        // talks to them when something actually changes.
        setCommand(pickFrom(KINK_COMMANDS));
        setCommandTick((t) => t + 1);
      }
    }
  }, [strokes, level, autoLevel]);

  // ── Moan player. Streams long-form (10-30 min) NSFW audio dramas / ASMR
  // pulled from a curated archive.org set via /api/moan/random. The clip
  // loops while it's playing so the user gets continuous moaning; "Skip"
  // fetches a fresh track on demand; an error mid-playback also auto-
  // fetches a new track so one bad URL never stalls the player.
  const fetchMoanClip = useCallback(async () => {
    setMoanLabel("Loading hentai audio…");
    try {
      const r = await fetch("/api/moan/random");
      if (!r.ok) throw new Error(`status ${r.status}`);
      const d = await r.json();
      const u: string | undefined = d?.url;
      if (!u) throw new Error("no audio url");
      setMoanUrl(u);
      const title: string = String(d?.title || "moan track").slice(0, 28);
      setMoanLabel(title);
    } catch {
      setMoanUrl(null);
      setMoanLabel("Source failed — tap Skip");
    }
  }, []);

  // Volume changes shouldn't re-fetch — apply them directly.
  useEffect(() => {
    if (moanRef.current) moanRef.current.volume = moanVol;
  }, [moanVol]);

  // On enable, kick off a fetch if we don't have a clip yet. On disable,
  // pause without dropping the source so re-enabling resumes instantly.
  useEffect(() => {
    const a = moanRef.current;
    if (!a) return;
    if (!moanOn) {
      a.pause();
      return;
    }
    if (!moanUrl) {
      fetchMoanClip();
      return;
    }
    a.volume = moanVol;
    a.loop = true; // KEY: keep moaning continuously instead of stopping after one play.
    if (a.src !== moanUrl) a.src = moanUrl;
    a.play().catch(() => {
      // Autoplay blocked — user can hit Skip to retry once they interact.
    });
  }, [moanOn, moanUrl, moanVol, fetchMoanClip]);

  const skipMoan = useCallback(() => {
    fetchMoanClip();
  }, [fetchMoanClip]);

  // ── Whisper ticker — rotates a dirty one-liner across the bottom strip.
  // Faster cadence when a beat is running so it feels reactive.
  useEffect(() => {
    const interval = running ? 3500 : 7000;
    const id = window.setInterval(() => setWhisper(pickFrom(WHISPERS)), interval);
    return () => clearInterval(id);
  }, [running]);

  // ── Kink command rotator — auto-rotates every 10s while running so the
  // user keeps getting fresh micro-instructions.
  useEffect(() => {
    if (!running) {
      setCommandCountdown(10);
      return;
    }
    // Tick down every second so the user sees the next order coming.
    setCommandCountdown(10);
    const tick = window.setInterval(() => {
      setCommandCountdown((c) => {
        if (c <= 1) {
          setCommand(pickFrom(KINK_COMMANDS));
          setCommandTick((t) => t + 1);
          return 10;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running]);

  // ── Hypno trigger word rotator (only when hypno overlay is enabled).
  useEffect(() => {
    if (!hypno) return;
    const id = window.setInterval(() => setHypnoWord(pickFrom(HYPNO_TRIGGERS)), 2400);
    return () => clearInterval(id);
  }, [hypno]);

  // ── Hentai GIF strip — fills 3 looping clips and cycles them
  // independently (every 15-25s) so the row keeps mutating in the background.
  // Always sends the active category so positions like doggy actually filter
  // the strip (server combines them with "hentai" so results stay drawn).
  const fetchOneGif = useCallback(async (): Promise<string | null> => {
    try {
      const r = await fetch(`/api/gif/random?strict=1&cat=${encodeURIComponent(cat)}`);
      if (!r.ok) return null;
      const d = await r.json();
      return (d?.hd || d?.sd) || null;
    } catch {
      return null;
    }
  }, [cat]);

  // Initial fill + full re-fill whenever the category changes so the strip
  // immediately reflects the user's pick.
  useEffect(() => {
    let cancelled = false;
    setGifs([null, null, null]);
    (async () => {
      for (let i = 0; i < 3; i++) {
        if (cancelled) return;
        const u = await fetchOneGif();
        if (cancelled) return;
        setGifs((prev) => {
          const next = [...prev];
          next[i] = u;
          return next;
        });
        await new Promise((res) => setTimeout(res, 250));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOneGif]);

  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < 3; i++) {
      const ms = 15000 + Math.floor(Math.random() * 10000);
      const id = window.setInterval(async () => {
        const u = await fetchOneGif();
        if (u) {
          setGifs((prev) => {
            const next = [...prev];
            next[i] = u;
            return next;
          });
        }
      }, ms);
      timers.push(id);
    }
    return () => timers.forEach((t) => clearInterval(t));
  }, [fetchOneGif]);

  // ── Achievement unlocker — checks every state change and persists.
  useEffect(() => {
    const newly: string[] = [];
    const next = new Set(unlocked);
    for (const a of ACHIEVEMENTS) {
      if (next.has(a.id)) continue;
      const hit =
        (a.unlockStrokes !== undefined && strokes >= a.unlockStrokes) ||
        (a.unlockEdges !== undefined && edgeCount >= a.unlockEdges) ||
        (a.unlockLevel !== undefined && level >= a.unlockLevel);
      if (hit) {
        next.add(a.id);
        newly.push(`${a.emoji} ${a.label}`);
      }
    }
    if (newly.length) {
      setUnlocked(next);
      const arr = [...next];
      try {
        localStorage.setItem("goon-achievements", JSON.stringify(arr));
      } catch {}
      // Mirror to the server-side account so unlocks follow the user across
      // devices. Fire-and-forget — local copy is the source of truth on this
      // page, the server is just the durable backup.
      void (async () => {
        try {
          const { getOrCreateAccountId, patchAccount } = await import("../api");
          await patchAccount(getOrCreateAccountId(), { achievements: arr });
        } catch {}
      })();
      toast.success("Achievement unlocked", {
        description: newly.join(" · "),
      });
    }
  }, [strokes, edgeCount, level, unlocked]);

  const rollKink = useCallback(() => {
    setCommand(pickFrom(KINK_COMMANDS));
  }, []);

  const rollVerdict = useCallback(() => {
    const isPunish = Math.random() < 0.5;
    const text = isPunish ? pickFrom(PUNISHMENTS) : pickFrom(REWARDS);
    setVerdict({ kind: isPunish ? "punish" : "reward", text });
  }, []);

  // ── Session timer: starts on first run, ticks every second.
  useEffect(() => {
    if (!running) return;
    if (!sessionStart) setSessionStart(Date.now());
    const id = window.setInterval(() => {
      setElapsed((_) =>
        Math.floor((Date.now() - (sessionStart ?? Date.now())) / 1000),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [running, sessionStart]);

  // ── Mantra rotates every 6s, pulling fresh lines from the shared pool.
  useEffect(() => {
    setTagline(pickGoonerTagline(boyName));
    const id = window.setInterval(() => {
      setTagline(pickGoonerTagline(boyName));
    }, 6000);
    return () => clearInterval(id);
  }, [boyName]);

  // ── Fullscreen sync — handles standard + webkit prefix (iOS Safari).
  useEffect(() => {
    const onFs = () =>
      setFullscreen(
        !!(
          document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
        ),
      );
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        // Standard + webkit (iOS Safari) + ms (old Edge)
        const req =
          el.requestFullscreen?.bind(el) ||
          (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(el) ||
          (el as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen?.bind(el) ||
          (el as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen?.bind(el);
        req?.();
      } else {
        const exit =
          document.exitFullscreen?.bind(document) ||
          (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.bind(document) ||
          (document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen?.bind(document) ||
          (document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen?.bind(document);
        exit?.();
      }
    } catch {
      /* fullscreen blocked — ignore */
    }
  };

  const onEdge = () => {
    setEdgeCount((c) => {
      const n = c + 1;
      try {
        localStorage.setItem("goon-edge-count", String(n));
      } catch {}
      return n;
    });
    setStrokes(0);
    setLevel(0);
    setTagline(`Edge banked, ${boyName}. Hands off. Don't you dare cum.`);
  };

  const onReset = () => {
    setRunning(false);
    setStrokes(0);
    setLevel(0);
    setSessionStart(null);
    setElapsed(0);
    setBpm(60);
  };

  const refreshTiles = async () => {
    setTiles(Array(TILE_COUNT).fill(null));
    for (let i = 0; i < TILE_COUNT; i++) {
      try {
        const r = await fetch(`/api/gallery/random?cat=${cat}`);
        const d = await r.json();
        if (d?.url) {
          setTiles((prev) => {
            const next = [...prev];
            next[i] = d.url;
            return next;
          });
        }
      } catch {}
      await new Promise((res) => setTimeout(res, 100));
    }
  };

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const beatInterval = bpm > 0 ? 60_000 / bpm : 0;
  // Visual orb size scales subtly with BPM so frenzy feels bigger.
  const orbBaseSize = 160 + Math.min(80, bpm / 3);

  return (
    <section
      ref={containerRef}
      className={`min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-4 sm:py-6 ${
        fullscreen ? "bg-black" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-pink-400/80 mb-1 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-pink-500" /> 18+ · Immersive
              Mode · For {boyName}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl tracking-wider bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-none">
              GOON CHAMBER
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Image wall + stroke pacer + audible beat. Hand on. Eyes wide.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              Session
            </span>
            <span className="font-display text-xl text-white tabular-nums">
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </span>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as Cat)}
              className="ml-2 bg-black/60 border border-pink-500/30 text-pink-200 text-xs rounded-lg h-9 px-2 focus:outline-none focus:border-pink-400"
            >
              {CATS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              onClick={toggleFullscreen}
              title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="h-9 px-3 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 flex items-center gap-1.5 text-xs font-semibold"
            >
              {fullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              {fullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
        </div>

        {/* ── Image wall — 2x3 grid that auto-cycles. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {tiles.map((url, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-pink-500/20 shadow-lg shadow-pink-900/20"
            >
              {url ? (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover animate-[chamberFade_700ms_ease-out]"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-950/40 to-black flex items-center justify-center">
                  <span className="text-[10px] tracking-widest uppercase text-pink-500/60">
                    loading…
                  </span>
                </div>
              )}
            </div>
          ))}
          <style>{`@keyframes chamberFade {
            0% { opacity: 0; transform: scale(1.05); filter: blur(4px); }
            100% { opacity: 1; transform: scale(1); filter: blur(0); }
          }`}</style>
        </div>

        {/* ── Live hentai GIF strip — auto-cycles 3 looping clips. */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {gifs.map((url, i) => (
            <div
              key={i}
              className="relative aspect-video rounded-xl overflow-hidden bg-black border border-rose-500/30 shadow-lg shadow-rose-900/30"
            >
              {url ? (
                <video
                  key={url}
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover animate-[chamberFade_700ms_ease-out]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 to-black flex items-center justify-center">
                  <span className="text-[10px] tracking-widest uppercase text-rose-500/60">
                    loading clip…
                  </span>
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 text-[9px] tracking-[0.25em] uppercase text-rose-200/90 bg-black/50 px-1.5 py-0.5 rounded">
                live
              </span>
            </div>
          ))}
        </div>

        {/* ── Kink Roulette + Verdict (Punishment / Reward) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2 glass-card rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/40 via-black/40 to-rose-950/40 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Mistress Says
                {running && (
                  <span className="ml-1.5 text-pink-200/70 normal-case tracking-normal text-[10px] tabular-nums">
                    next in {commandCountdown}s
                  </span>
                )}
              </p>
              <button
                onClick={rollKink}
                className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/50 text-pink-100 flex items-center gap-1.5"
              >
                <Dice5 className="w-3.5 h-3.5" /> New
              </button>
            </div>
            <p
              key={`${command}-${commandTick}`}
              className="text-base sm:text-lg text-pink-50 italic font-medium leading-snug min-h-[3rem] animate-[chamberMantra_500ms_ease-out] drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]"
            >
              ▸ {command}
            </p>
            {running && (
              <div className="mt-2 h-1 w-full rounded-full bg-pink-950/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${(commandCountdown / 10) * 100}%` }}
                />
              </div>
            )}
          </div>
          <div className="glass-card rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 via-black/40 to-rose-950/40 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Fate
              </p>
              <button
                onClick={rollVerdict}
                className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/50 text-amber-100 flex items-center gap-1.5"
              >
                <Dice5 className="w-3.5 h-3.5" /> Roll
              </button>
            </div>
            {verdict ? (
              <div
                key={verdict.text}
                className={`flex-1 rounded-xl p-3 text-sm leading-snug animate-[chamberMantra_500ms_ease-out] ${
                  verdict.kind === "punish"
                    ? "bg-rose-950/40 border border-rose-500/40 text-rose-100"
                    : "bg-emerald-950/30 border border-emerald-400/40 text-emerald-100"
                }`}
              >
                <p className="text-[10px] tracking-[0.3em] uppercase mb-1 opacity-80">
                  {verdict.kind === "punish" ? "Punishment" : "Reward"}
                </p>
                {verdict.text}
              </div>
            ) : (
              <p className="flex-1 text-xs text-amber-200/70 italic flex items-center">
                Roll the dice. Maybe a reward. Maybe ruin.
              </p>
            )}
          </div>
        </div>

        {/* ── Stroke Pattern selector + Hypno toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2 glass-card rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-black/40 to-fuchsia-950/40 p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-purple-300 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Stroke Pattern
              </p>
              <span className="text-[10px] text-purple-200/70 italic">
                {STROKE_PATTERNS.find((p) => p.id === pattern)?.desc}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STROKE_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPattern(p.id)}
                  className={`h-9 px-3 rounded-lg text-[11px] font-bold tracking-widest uppercase border transition-all ${
                    pattern === p.id
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-transparent shadow-lg"
                      : "bg-black/40 border-purple-500/20 text-purple-200 hover:border-purple-400/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Visual rhythm dots */}
            <div className="mt-3 flex gap-1.5 items-center">
              {(STROKE_PATTERNS.find((p) => p.id === pattern)?.multipliers || []).map(
                (m, i) => {
                  const active =
                    running &&
                    patternStep %
                      (STROKE_PATTERNS.find((p) => p.id === pattern)?.multipliers
                        .length || 1) ===
                      i;
                  // Smaller dot = faster stroke at this step.
                  const size = Math.max(6, Math.min(20, 22 - m * 4));
                  return (
                    <span
                      key={i}
                      className={`rounded-full transition-all ${
                        active
                          ? "bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.8)]"
                          : "bg-purple-500/30"
                      }`}
                      style={{ width: size, height: size }}
                    />
                  );
                },
              )}
            </div>
          </div>
          <button
            onClick={() => setHypno((h) => !h)}
            className={`glass-card rounded-2xl p-4 text-left transition-all border ${
              hypno
                ? "border-violet-400/60 bg-gradient-to-br from-violet-700/40 to-fuchsia-700/40"
                : "border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-black/40 hover:border-violet-400/50"
            }`}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-violet-300 font-bold flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5" /> Hypno Mode
            </p>
            <p className="font-display text-2xl text-violet-100 leading-tight">
              {hypno ? "ENGAGED" : "Engage"}
            </p>
            <p className="mt-1 text-[11px] text-violet-200/70">
              Spinning spiral + trigger words overlay your screen.
            </p>
          </button>
        </div>

        {/* ── Pulsing orb + mantra + edge tap. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2 glass-card rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/40 via-black/40 to-rose-950/40 p-5 flex items-center gap-4 sm:gap-6">
            {/* The orb */}
            <div
              className="relative shrink-0 flex items-center justify-center"
              style={{ width: orbBaseSize / 1.4, height: orbBaseSize / 1.4 }}
            >
              {/* outer halo */}
              <div
                className="absolute inset-0 rounded-full transition-all"
                style={{
                  transform: pulse ? "scale(1.35)" : "scale(1.0)",
                  background:
                    "radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(244,63,94,0) 70%)",
                  transitionDuration: pulse
                    ? "120ms"
                    : `${Math.min(beatInterval * 0.5, 320)}ms`,
                }}
              />
              {/* core */}
              <div
                className="relative rounded-full flex items-center justify-center font-display text-white shadow-[0_0_40px_rgba(244,63,94,0.6)]"
                style={{
                  width: orbBaseSize / 2,
                  height: orbBaseSize / 2,
                  background: pulse
                    ? "radial-gradient(circle at 30% 30%, #fda4af, #e11d48 70%)"
                    : "radial-gradient(circle at 30% 30%, #fb7185, #9f1239 80%)",
                  transform: pulse ? "scale(1.18)" : "scale(1.0)",
                  transition: `transform ${pulse ? 80 : Math.min(beatInterval * 0.5, 280)}ms ease-out, background 80ms`,
                }}
              >
                <span className="text-2xl tabular-nums">{bpm}</span>
              </div>
            </div>
            {/* Mantra + start/pause */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-pink-400 font-bold mb-1">
                {running
                  ? bpm > 0
                    ? "Stroke with the orb"
                    : "Hold. Don't move."
                  : "Press start to begin"}
              </p>
              <p
                key={tagline}
                className="text-base sm:text-lg text-rose-50 italic font-medium leading-snug min-h-[3rem] animate-[chamberMantra_500ms_ease-out] drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]"
              >
                💋 {tagline}
              </p>
              <style>{`@keyframes chamberMantra {
                0% { opacity: 0; transform: translateY(6px); }
                100% { opacity: 1; transform: translateY(0); }
              }`}</style>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRunning((r) => !r)}
                  className={`h-10 px-4 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center gap-1.5 transition-all ${
                    running
                      ? "bg-rose-600/80 hover:bg-rose-600 text-white"
                      : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-900/40"
                  }`}
                >
                  {running ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start
                    </>
                  )}
                </button>
                <button
                  onClick={() => setAudioOn((a) => !a)}
                  title={audioOn ? "Mute click" : "Unmute click"}
                  className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    audioOn
                      ? "bg-pink-500/30 border-pink-400/50 text-pink-100"
                      : "bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:border-pink-500/40"
                  }`}
                >
                  {audioOn ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  Click
                </button>
                <button
                  onClick={onReset}
                  title="Reset session"
                  className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          </div>
          {/* Big EDGE tap */}
          <button
            onClick={onEdge}
            className="glass-card rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-600/30 via-rose-700/30 to-pink-700/30 hover:from-amber-500/40 hover:via-rose-600/40 hover:to-pink-600/40 p-5 text-center transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold mb-1 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> Tap when you edge
            </p>
            <p className="font-display text-5xl text-amber-200 leading-none">
              EDGE
            </p>
            <p className="mt-2 text-[11px] text-amber-200/80">
              Lifetime: {edgeCount} · Strokes since: {strokes}
            </p>
          </button>
        </div>

        {/* ── Goon-game level meter + moan player. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Level / progress card */}
          <div className="sm:col-span-2 glass-card rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-black/40 to-pink-950/40 p-4">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-fuchsia-300 fill-fuchsia-400" />
                <p className="text-[10px] tracking-[0.3em] uppercase text-fuchsia-300 font-bold">
                  Level {level + 1} · {LEVELS[level].title}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-fuchsia-200/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoLevel}
                  onChange={(e) => setAutoLevel(e.target.checked)}
                  className="accent-fuchsia-500"
                />
                Auto-bump BPM
              </label>
            </div>
            {(() => {
              const isMax = level >= LEVELS.length - 1;
              const cur = LEVELS[level].strokes;
              const nxt = isMax ? cur : LEVELS[level + 1].strokes;
              const span = Math.max(1, nxt - cur);
              const into = Math.max(0, Math.min(span, strokes - cur));
              const pct = isMax ? 100 : (into / span) * 100;
              return (
                <>
                  <div className="h-3 rounded-full bg-black/50 overflow-hidden border border-fuchsia-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-fuchsia-200/80 tracking-wide">
                    {isMax
                      ? `Maxed out — keep stroking, ${boyName}.`
                      : `${strokes} / ${nxt} strokes → ${LEVELS[level + 1].title}`}
                  </p>
                </>
              );
            })()}
          </div>
          {/* Moan player */}
          <div className="glass-card rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-black/40 to-pink-950/40 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-rose-300 font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Moan Player
              </p>
              <span className="text-[10px] text-rose-200/70 truncate max-w-[8rem]">
                {moanLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <button
                onClick={() => setMoanOn((m) => !m)}
                className={`h-9 px-3 rounded-lg text-[11px] font-bold tracking-widest uppercase border flex items-center gap-1.5 transition-colors ${
                  moanOn
                    ? "bg-rose-500/30 border-rose-400/60 text-rose-100"
                    : "bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:border-rose-400/50"
                }`}
              >
                {moanOn ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
                {moanOn ? "Moans on" : "Moans off"}
              </button>
              <button
                onClick={skipMoan}
                title="Skip to next moan"
                className="h-9 px-3 rounded-lg text-[11px] font-bold tracking-widest uppercase border bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-white hover:border-rose-400/50 flex items-center gap-1.5"
              >
                <SkipForward className="w-4 h-4" /> Skip
              </button>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <Volume2 className="w-3.5 h-3.5 text-rose-300/70 shrink-0" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={moanVol}
                onChange={(e) => setMoanVol(parseFloat(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <audio
              ref={moanRef}
              onError={skipMoan}
              loop
              preload="none"
            />
          </div>
        </div>

        {/* ── BPM slider + presets. */}
        <div className="glass-card rounded-2xl border border-pink-500/20 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-pink-400 font-bold">
                Tempo
              </p>
              <p className="font-display text-2xl text-white tabular-nums">
                {bpm} <span className="text-sm text-zinc-400">bpm</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setBpm(p.bpm)}
                  className={`h-9 px-3 rounded-lg text-[11px] font-bold tracking-widest uppercase border transition-all ${
                    bpm === p.bpm
                      ? `bg-gradient-to-r ${p.cls} text-white border-transparent shadow-lg`
                      : "bg-black/40 border-pink-500/20 text-pink-200 hover:border-pink-400/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 tracking-widest uppercase mt-1">
            <span>0 · stop</span>
            <span>60 · build</span>
            <span>140 · frenzy</span>
            <span>200 · beast</span>
            <span>300 · machine</span>
          </div>
        </div>

        {/* ── Counters strip. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" /> Beat
            </p>
            <p className="font-display text-lg text-white">
              {bpm > 0 ? `${bpm} bpm` : "STOP"}
            </p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 fill-pink-400 text-pink-400" /> Strokes
            </p>
            <p className="font-display text-lg text-pink-300">{strokes}</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-fuchsia-400 text-fuchsia-400" /> Level
            </p>
            <p className="font-display text-lg text-fuchsia-300">
              {level + 1}
              <span className="text-xs text-fuchsia-400/70 ml-1">
                {LEVELS[level].title}
              </span>
            </p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> Lifetime Edges
            </p>
            <p className="font-display text-lg text-amber-400">{edgeCount}</p>
          </div>
        </div>

        {/* ── Achievements grid */}
        <div className="glass-card rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/30 via-black/40 to-rose-950/30 p-4 mt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Kink Achievements
            </p>
            <span className="text-[11px] text-amber-200/70 tabular-nums">
              {unlocked.size} / {ACHIEVEMENTS.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = unlocked.has(a.id);
              return (
                <div
                  key={a.id}
                  title={
                    a.unlockStrokes !== undefined
                      ? `Stroke ${a.unlockStrokes}+`
                      : a.unlockEdges !== undefined
                        ? `Edge ${a.unlockEdges}+ times`
                        : `Reach level ${(a.unlockLevel ?? 0) + 1}`
                  }
                  className={`rounded-xl p-2 text-center border transition-all ${
                    got
                      ? "bg-amber-500/20 border-amber-400/60 text-amber-100 shadow-lg shadow-amber-900/30"
                      : "bg-black/40 border-zinc-700 text-zinc-500 opacity-60"
                  }`}
                >
                  <div className={`text-2xl ${got ? "" : "grayscale"}`}>{a.emoji}</div>
                  <div className="text-[9px] tracking-widest uppercase mt-1 truncate">
                    {a.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Whisper ticker — dirty one-liner pulsing across the bottom. */}
        <div className="mt-4 rounded-2xl border border-pink-500/20 bg-black/50 p-3 flex items-center gap-2 overflow-hidden">
          <MessageCircle className="w-4 h-4 text-pink-400 shrink-0" />
          <p
            key={whisper}
            className="text-sm sm:text-base text-pink-200 italic tracking-wide animate-[whisperSlide_500ms_ease-out] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {whisper}
          </p>
          <style>{`@keyframes whisperSlide {
            0% { opacity: 0; transform: translateX(8px); }
            100% { opacity: 1; transform: translateX(0); }
          }`}</style>
        </div>

        {/* Refresh-tiles link */}
        <div className="text-center mt-5">
          <button
            onClick={refreshTiles}
            className="text-xs text-zinc-500 hover:text-pink-400 tracking-widest uppercase flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Refresh the wall
          </button>
        </div>
      </div>

      {/* ── Fullscreen immersion overlay — shown when browser is in true
          fullscreen. Floats a vertically-stroking orb + rotating whisper
          over the content so the user always has the pacer in view. */}
      {fullscreen && (
        <div
          className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-end pb-16"
          aria-hidden
        >
          {/* Faint rotating stage message (whisper) as background text */}
          <p
            key={whisper}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-display text-2xl sm:text-4xl text-pink-200/10 tracking-[0.25em] uppercase pointer-events-none select-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[90vw] animate-[chamberMantra_600ms_ease-out]"
          >
            {whisper}
          </p>

          {/* Vertically stroking orb that travels up and down */}
          <div
            className="relative flex items-center justify-center"
            style={{
              animation: running && bpm > 0
                ? `fsOrbStroke ${60_000 / bpm}ms ease-in-out infinite alternate`
                : "none",
              marginBottom: "2rem",
            }}
          >
            {/* Halo */}
            <div
              className="absolute rounded-full transition-all"
              style={{
                width: 120,
                height: 120,
                transform: pulse ? "scale(1.5)" : "scale(1.0)",
                background:
                  "radial-gradient(circle, rgba(244,63,94,0.6) 0%, rgba(244,63,94,0) 70%)",
                transitionDuration: pulse ? "100ms" : `${Math.min(beatInterval * 0.4, 300)}ms`,
              }}
            />
            {/* Core orb */}
            <div
              className="relative rounded-full flex items-center justify-center font-display text-white shadow-[0_0_50px_rgba(244,63,94,0.7)]"
              style={{
                width: 90,
                height: 90,
                background: pulse
                  ? "radial-gradient(circle at 30% 30%, #fda4af, #e11d48 70%)"
                  : "radial-gradient(circle at 30% 30%, #fb7185, #9f1239 80%)",
                transform: pulse ? "scale(1.22)" : "scale(1.0)",
                transition: `transform ${pulse ? 70 : Math.min(beatInterval * 0.4, 260)}ms ease-out, background 70ms`,
              }}
            >
              <span className="text-xl tabular-nums font-bold">{bpm}</span>
            </div>
          </div>

          {/* BPM label */}
          <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300/60 font-bold">
            {running && bpm > 0 ? "STROKE" : bpm === 0 ? "HOLD" : "PAUSED"}
          </p>

          <style>{`
            @keyframes fsOrbStroke {
              0%   { transform: translateY(0px); }
              100% { transform: translateY(-120px); }
            }
          `}</style>
        </div>
      )}

      {/* ── Hypno overlay — subtle spinning spiral + trigger word.
          Pointer-events-none so the whole chamber stays interactive. */}
      {hypno && (
        <div
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="absolute"
            style={{
              width: "min(80vmin, 900px)",
              height: "min(80vmin, 900px)",
              background:
                "repeating-conic-gradient(from 0deg at 50% 50%, rgba(168,85,247,0.18) 0deg 12deg, rgba(0,0,0,0) 12deg 24deg)",
              borderRadius: "50%",
              filter: "blur(1px)",
              animation: "hypnoSpin 14s linear infinite",
              opacity: 0.6,
            }}
          />
          <p
            key={hypnoWord}
            className="relative font-display text-5xl sm:text-7xl tracking-[0.3em] text-violet-200 drop-shadow-[0_0_30px_rgba(168,85,247,0.7)] animate-[hypnoPulse_2.4s_ease-in-out_infinite]"
            style={{ textShadow: "0 0 30px rgba(168,85,247,0.7)" }}
          >
            {hypnoWord}
          </p>
          <button
            onClick={() => setHypno(false)}
            className="pointer-events-auto absolute top-4 right-4 h-9 px-3 rounded-lg text-[11px] uppercase tracking-widest font-bold bg-black/60 border border-violet-500/40 text-violet-100 hover:border-violet-300/60 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Snap out
          </button>
          <style>{`
            @keyframes hypnoSpin { to { transform: rotate(360deg); } }
            @keyframes hypnoPulse {
              0%, 100% { opacity: 0.4; transform: scale(0.96); letter-spacing: 0.3em; }
              50%      { opacity: 1;   transform: scale(1.05); letter-spacing: 0.5em; }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
