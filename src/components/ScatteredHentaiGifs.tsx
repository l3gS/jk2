import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, X, Maximize2 } from "lucide-react";

// Scattered hentai gifs that decorate the home page edges. Pulls a batch of
// gifs from /api/gifs once on mount, picks SLOTS many of them, and pins each
// one to a fixed position so they're always visible while scrolling without
// covering the main content or fighting with corner-anchored UI.
//
// Each thumbnail is a muted, looping <video> with a soft pink frame and a
// gentle bobbing animation. Click to expand fullscreen, X to dismiss.

interface GifItem {
  id: string;
  hd?: string;
  sd?: string;
  poster?: string;
  width?: number;
  height?: number;
}

// Fixed positions chosen to:
//   - hug the left/right edges (clear of the central content column)
//   - avoid the top header band (top-0 → top-20)
//   - avoid the mobile bottom nav (bottom 0 → bottom-20)
//   - avoid the corner background button (bottom-left)
//   - avoid the chat bubbles + heart particles (bottom-right)
// `mobile: false` slots are dropped on small screens to keep the phone view
// uncluttered.
const SLOTS: {
  top: string;
  side: "left" | "right";
  offset: string;
  size: number;
  rotate: number;
  bobDelay: number;
  mobile: boolean;
}[] = [
  { top: "10%",  side: "left",  offset: "0.5rem", size: 130, rotate: -6,  bobDelay: 0,    mobile: true },
  { top: "32%",  side: "right", offset: "0.5rem", size: 150, rotate: 5,   bobDelay: 1.4,  mobile: true },
  { top: "55%",  side: "left",  offset: "0.75rem", size: 120, rotate: -4, bobDelay: 2.7,  mobile: false },
  { top: "70%",  side: "right", offset: "0.5rem", size: 140, rotate: 7,   bobDelay: 0.9,  mobile: true },
  { top: "22%",  side: "left",  offset: "1rem",   size: 110, rotate: 3,   bobDelay: 3.6,  mobile: false },
  { top: "45%",  side: "right", offset: "1rem",   size: 110, rotate: -8,  bobDelay: 4.2,  mobile: false },
];

export default function ScatteredHentaiGifs({
  paused = false,
  enabled = true,
}: {
  /** Suspend rendering (e.g. while age gate is up). */
  paused?: boolean;
  /** Master on/off — lets the user hide them all if they want. */
  enabled?: boolean;
}) {
  const [items, setItems] = useState<GifItem[] | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [fullscreen, setFullscreen] = useState<GifItem | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const fetchedOnce = useRef(false);

  // Track viewport size so mobile-flagged slots can hide on small screens.
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // One-shot fetch: grab a healthy batch of gifs, pick a random subset.
  useEffect(() => {
    if (paused || !enabled || fetchedOnce.current) return;
    fetchedOnce.current = true;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/gifs?cat=hentai&n=20`);
        if (!r.ok) throw new Error(`http ${r.status}`);
        const j = await r.json();
        if (cancelled) return;
        const all: GifItem[] = (j.items || []).filter(
          (g: GifItem) => g.hd || g.sd,
        );
        // Shuffle so each load looks different.
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        setItems(all.slice(0, SLOTS.length));
      } catch {
        // Silently bail — these are decoration, not critical UI.
        setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paused, enabled]);

  // Pre-bind each slot to its item so positions stay stable even if the
  // items array reference changes.
  const placed = useMemo(() => {
    if (!items) return [];
    return SLOTS.map((slot, idx) => ({ slot, item: items[idx], idx })).filter(
      (p) => p.item && !dismissed.has(p.idx) && (p.slot.mobile || !isMobile),
    );
  }, [items, dismissed, isMobile]);

  if (paused || !enabled || !items || placed.length === 0) {
    return (
      <FullscreenViewer
        item={fullscreen}
        onClose={() => setFullscreen(null)}
      />
    );
  }

  return (
    <>
      {placed.map(({ slot, item, idx }) => {
        const src = item.hd || item.sd!;
        const positionStyle: React.CSSProperties = {
          top: slot.top,
          [slot.side]: slot.offset,
          width: slot.size,
          // Maintain aspect ratio from the gif metadata when present, else
          // default to a portrait-ish 3:4 frame.
          aspectRatio: item.width && item.height
            ? `${item.width} / ${item.height}`
            : "3 / 4",
        };
        return (
          <div
            key={`${idx}-${item.id}`}
            className="fixed z-[5] group pointer-events-auto"
            style={positionStyle}
          >
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-pink-400/60 shadow-[0_0_18px_rgba(236,72,153,0.55)] bg-black/60 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform animate-gif-bob"
              style={{
                // The bob keyframe reads --rot to combine rotation + translate
                // on the same `transform` (you can't animate two transforms
                // independently), so rotation has to flow through here.
                ["--rot" as string]: `${slot.rotate}deg`,
                animationDelay: `${slot.bobDelay}s`,
              }}
              onClick={() => setFullscreen(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setFullscreen(item);
              }}
              aria-label="Open hentai gif"
            >
              <video
                src={src}
                poster={item.poster}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Heart corner badge */}
              <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-pink-500/90 grid place-items-center shadow-lg">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              {/* Hover overlay with expand hint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-pink-100 font-bold flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> tap
                </span>
              </div>
              {/* Dismiss button — clicked separately from the card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissed((prev) => {
                    const next = new Set(prev);
                    next.add(idx);
                    return next;
                  });
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Hide this gif"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
      <FullscreenViewer item={fullscreen} onClose={() => setFullscreen(null)} />
    </>
  );
}

function FullscreenViewer({
  item,
  onClose,
}: {
  item: GifItem | null;
  onClose: () => void;
}) {
  // Esc to close.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;
  const src = item.hd || item.sd!;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-pink-500/80 hover:bg-pink-500 text-white grid place-items-center shadow-lg"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <video
        src={src}
        poster={item.poster}
        autoPlay
        loop
        controls
        playsInline
        className="max-w-full max-h-full rounded-2xl border-2 border-pink-400/50 shadow-[0_0_60px_rgba(236,72,153,0.5)]"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
