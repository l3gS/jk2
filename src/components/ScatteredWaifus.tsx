import { useEffect, useMemo, useRef, useState } from "react";
import { X, Maximize2, Heart } from "lucide-react";

// Scattered nude anime waifu images placed around the site as decoration.
// Pulls from the gallery API using specific character/waifu tags
// (Yae Miko, Alya, Fischl, Hu Tao, Raiden, etc.) and pins them to fixed
// edge positions so they don't cover the main content column.

interface WaifuImage {
  url: string;
  tag: string;
}

// Character tags to cycle through — danbooru/gelbooru syntax.
const WAIFU_TAGS = [
  "yae_miko",
  "fischl_(genshin_impact)",
  "hu_tao_(genshin_impact)",
  "raiden_shogun",
  "alya_mikhailova",
  "kamisato_ayaka",
  "nilou_(genshin_impact)",
  "eula_(genshin_impact)",
  "keqing_(genshin_impact)",
  "ganyu_(genshin_impact)",
];

// Fixed layout slots — hug the edges, clear of the main 6xl content column.
// `mobile: false` → hidden on screens < 768px to keep phone view clean.
const SLOTS: {
  top: string;
  side: "left" | "right";
  offset: string;
  size: number;
  rotate: number;
  bobDelay: number;
  mobile: boolean;
  tagIdx: number;
}[] = [
  { top: "8%",   side: "right", offset: "0.3rem",  size: 140, rotate: 5,   bobDelay: 0,    mobile: true,  tagIdx: 0 },
  { top: "26%",  side: "left",  offset: "0.3rem",  size: 130, rotate: -7,  bobDelay: 1.8,  mobile: true,  tagIdx: 1 },
  { top: "44%",  side: "right", offset: "0.3rem",  size: 145, rotate: 4,   bobDelay: 3.2,  mobile: false, tagIdx: 2 },
  { top: "62%",  side: "left",  offset: "0.3rem",  size: 135, rotate: -5,  bobDelay: 0.7,  mobile: true,  tagIdx: 3 },
  { top: "78%",  side: "right", offset: "0.3rem",  size: 125, rotate: 8,   bobDelay: 2.4,  mobile: false, tagIdx: 4 },
  { top: "15%",  side: "left",  offset: "0.5rem",  size: 120, rotate: 3,   bobDelay: 4.1,  mobile: false, tagIdx: 5 },
  { top: "52%",  side: "left",  offset: "0.5rem",  size: 130, rotate: -6,  bobDelay: 1.3,  mobile: false, tagIdx: 6 },
  { top: "35%",  side: "right", offset: "0.5rem",  size: 115, rotate: 6,   bobDelay: 5.0,  mobile: false, tagIdx: 7 },
];

export default function ScatteredWaifus({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const [images, setImages] = useState<(WaifuImage | null)[]>(
    Array(SLOTS.length).fill(null),
  );
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const fetchedOnce = useRef(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!enabled || fetchedOnce.current) return;
    fetchedOnce.current = true;
    let cancelled = false;

    const fetchSlot = async (idx: number) => {
      const tag = WAIFU_TAGS[SLOTS[idx].tagIdx % WAIFU_TAGS.length];
      // Try the character tag first, fall back to hentai
      const urls = [
        `/api/gallery/random?cat=${encodeURIComponent(tag)}`,
        `/api/gallery/random?cat=hentai`,
      ];
      for (const url of urls) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const d = await r.json();
          if (cancelled) return;
          const imgUrl: string | undefined = d?.url;
          if (imgUrl) {
            setImages((prev) => {
              const next = [...prev];
              next[idx] = { url: imgUrl, tag };
              return next;
            });
            return;
          }
        } catch {
          // ignore, try fallback
        }
      }
    };

    // Stagger fetches so we don't hammer the server.
    SLOTS.forEach((_, idx) => {
      setTimeout(() => {
        if (!cancelled) fetchSlot(idx);
      }, idx * 280);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const placed = useMemo(
    () =>
      SLOTS.map((slot, idx) => ({ slot, img: images[idx], idx })).filter(
        (p) => p.img && !dismissed.has(p.idx) && (p.slot.mobile || !isMobile),
      ),
    [images, dismissed, isMobile],
  );

  if (!enabled) return null;

  return (
    <>
      {placed.map(({ slot, img, idx }) => (
        <div
          key={idx}
          className="fixed z-[4] group pointer-events-auto"
          style={{
            top: slot.top,
            [slot.side]: slot.offset,
            width: slot.size,
          }}
        >
          <div
            className="relative w-full rounded-2xl overflow-hidden border-2 border-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,0.45)] bg-black/60 cursor-pointer hover:scale-105 transition-transform animate-gif-bob"
            style={{
              aspectRatio: "2 / 3",
              ["--rot" as string]: `${slot.rotate}deg`,
              animationDelay: `${slot.bobDelay}s`,
            }}
            onClick={() => setExpanded(img!.url)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setExpanded(img!.url);
            }}
            aria-label="Open waifu image"
          >
            <img
              src={img!.url}
              alt=""
              className="w-full h-full object-cover object-top"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget.parentElement!.parentElement as HTMLDivElement).style.display = "none";
              }}
            />
            {/* Fuchsia heart badge */}
            <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-fuchsia-500/90 grid place-items-center shadow-lg">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            {/* Hover expand hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-fuchsia-100 font-bold flex items-center gap-1">
                <Maximize2 className="w-2.5 h-2.5" /> tap
              </span>
            </div>
            {/* Dismiss */}
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
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {/* Fullscreen lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-[300] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <button
            type="button"
            onClick={() => setExpanded(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white grid place-items-center shadow-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={expanded}
            alt=""
            className="max-w-full max-h-full rounded-2xl border-2 border-fuchsia-400/50 shadow-[0_0_60px_rgba(217,70,239,0.5)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
