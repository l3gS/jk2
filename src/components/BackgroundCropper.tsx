import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Check, Loader2, Move } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "../api";

// Background cropper modal.
//
// Opens with a source image URL, shows it inside a 16:9 frame with pan +
// zoom, and on confirm renders the visible region to a 1920x1080 canvas,
// uploads the JPEG, and calls onConfirm with the resulting URL.
//
// `onConfirm(url)` receives the *new* uploaded URL (not the source).
// `onCancel()` closes the modal without changing the background.
export default function BackgroundCropper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string | null;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  // Image natural dimensions (loaded once).
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  // User zoom (1 = exact cover; can go up to 4x).
  const [scale, setScale] = useState(1);
  // User drag offset, in CSS pixels relative to the centered baseline.
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startY: number; dx: number; dy: number } | null>(null);

  // Reset transform whenever a new src is opened.
  useEffect(() => {
    setNat(null);
    setScale(1);
    setDrag({ x: 0, y: 0 });
  }, [src]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [src]);

  // Keyboard shortcuts: Esc to cancel, Enter to confirm.
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter" && !busy) handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, busy, scale, drag, nat]);

  // Compute the cover scale: the multiplier that makes the image exactly
  // fill the frame on its smaller axis when scale=1.
  const computeGeometry = () => {
    const frame = frameRef.current;
    if (!frame || !nat) return null;
    const Fw = frame.clientWidth;
    const Fh = frame.clientHeight;
    const cov = Math.max(Fw / nat.w, Fh / nat.h);
    const dw = nat.w * cov * scale;
    const dh = nat.h * cov * scale;
    // Centered baseline + user drag.
    let tx = (Fw - dw) / 2 + drag.x;
    let ty = (Fh - dh) / 2 + drag.y;
    // Clamp so the image always fully covers the frame.
    tx = Math.min(0, Math.max(Fw - dw, tx));
    ty = Math.min(0, Math.max(Fh - dh, ty));
    return { Fw, Fh, dw, dh, tx, ty, cov };
  };

  // Given the geometry, compute the source-rect to slice from the natural
  // image (in image-natural pixel coords).
  const computeSourceRect = () => {
    const g = computeGeometry();
    if (!g || !nat) return null;
    const px = g.cov * scale; // displayed pixels per natural pixel
    return {
      sx: -g.tx / px,
      sy: -g.ty / px,
      sw: g.Fw / px,
      sh: g.Fh / px,
    };
  };

  // Pointer drag handlers.
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      dx: drag.x,
      dy: drag.y,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s) return;
    setDrag({
      x: s.dx + (e.clientX - s.startX),
      y: s.dy + (e.clientY - s.startY),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    dragState.current = null;
    // Re-clamp via a state nudge — recompute by setting the same drag
    // through the geometry clamp.
    const g = computeGeometry();
    if (g && frameRef.current && nat) {
      const Fw = frameRef.current.clientWidth;
      const Fh = frameRef.current.clientHeight;
      const dw = nat.w * g.cov * scale;
      const dh = nat.h * g.cov * scale;
      const baseTx = (Fw - dw) / 2;
      const baseTy = (Fh - dh) / 2;
      setDrag({ x: g.tx - baseTx, y: g.ty - baseTy });
    }
  };

  // Anchored zoom. Recomputes drag so the natural-image pixel currently at
  // (anchorX, anchorY) in frame coords stays at the same screen position
  // after the scale change. Used by the wheel (cursor anchor) and the
  // slider/buttons (frame-center anchor) so zooming never drifts the view.
  // Without this, a non-zero drag offset combined with a scale bump shifts
  // the natural pixel under the frame center — which reads visually as the
  // image scooting sideways while you're trying to zoom in.
  const zoomAt = useCallback((newScale: number, anchorX: number, anchorY: number) => {
    const frame = frameRef.current;
    if (!frame || !nat) {
      setScale((s) => clampScale(newScale));
      return;
    }
    const ns = clampScale(newScale);
    const Fw = frame.clientWidth;
    const Fh = frame.clientHeight;
    const cov = Math.max(Fw / nat.w, Fh / nat.h);
    // Current displayed-image geometry (no clamping — we want raw drag).
    const dwOld = nat.w * cov * scale;
    const dhOld = nat.h * cov * scale;
    const txOld = (Fw - dwOld) / 2 + drag.x;
    const tyOld = (Fh - dhOld) / 2 + drag.y;
    // Natural-image pixel under the anchor right now.
    const px = cov * scale;
    const natX = (anchorX - txOld) / px;
    const natY = (anchorY - tyOld) / px;
    // Required tx/ty after the scale change so that same natural pixel
    // ends up back under (anchorX, anchorY).
    const dwNew = nat.w * cov * ns;
    const dhNew = nat.h * cov * ns;
    const pxNew = cov * ns;
    const txNew = anchorX - natX * pxNew;
    const tyNew = anchorY - natY * pxNew;
    setScale(ns);
    setDrag({
      x: txNew - (Fw - dwNew) / 2,
      y: tyNew - (Fh - dhNew) / 2,
    });
  }, [nat, scale, drag.x, drag.y]);

  // Helper for slider / buttons — always anchor on frame center.
  const zoomToCenter = useCallback((newScale: number) => {
    const frame = frameRef.current;
    if (!frame) {
      setScale((s) => clampScale(newScale));
      return;
    }
    zoomAt(newScale, frame.clientWidth / 2, frame.clientHeight / 2);
  }, [zoomAt]);

  // Wheel zoom — anchored at the cursor so what's under the pointer stays
  // under the pointer (the natural feel for image cropping tools).
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const delta = -e.deltaY / 500;
    zoomAt(scale + delta, cursorX, cursorY);
  };

  // Render the visible region into a 1920x1080 canvas, blob it, upload it.
  const handleConfirm = async () => {
    if (!src || busy) return;
    const sr = computeSourceRect();
    if (!sr || !nat) return;
    setBusy(true);
    const t = toast.loading("Cropping background…");
    try {
      // Always output at the full 1920px width regardless of zoom level.
      // Previously this was capped at sr.sw (source pixels in the crop),
      // which meant zooming in reduced output resolution. Now we always
      // upscale/downscale to 1920×1080 so background quality stays constant.
      const targetW = Math.min(1920, nat.w);
      const targetH = Math.round((targetW * 9) / 16);
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      // High-quality bicubic resampling when scaling.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Load the image fresh with crossOrigin so the canvas isn't tainted
      // by cross-origin pixels (no-op for same-origin sources).
      const img = await loadImage(src);
      ctx.drawImage(img, sr.sx, sr.sy, sr.sw, sr.sh, 0, 0, targetW, targetH);
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          0.97,
        );
      });
      const file = new File([blob], `bg_${Date.now()}.jpg`, { type: "image/jpeg" });
      const res = await uploadFile(file);
      if ("error" in res) {
        toast.error(res.error, { id: t });
        return;
      }
      toast.success("Background applied 💕", { id: t });
      onConfirm(res.url);
    } catch (err) {
      toast.error((err as Error).message || "Crop failed", { id: t });
    } finally {
      setBusy(false);
    }
  };

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-pink-400/30 bg-gradient-to-br from-pink-950/40 via-black to-purple-950/40 shadow-[0_0_60px_rgba(236,72,153,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-pink-200">
            <Move className="w-4 h-4" />
            <span className="font-display tracking-[0.3em] text-sm uppercase">
              Crop background
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropping frame: enforced 16:9 to match the page background. */}
        <div className="p-4 sm:p-5">
          <div
            ref={frameRef}
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black select-none"
            style={{ aspectRatio: "16 / 9", touchAction: "none", cursor: dragState.current ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {/* Hidden img used to read natural dimensions. We deliberately
                do NOT set crossOrigin here — most external image hosts (e.g.
                danbooru CDNs) don't send CORS headers, and a CORS-mode request
                would fail before we even get a chance to measure. The actual
                canvas draw at confirm time handles CORS via the proxy. */}
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const t = e.currentTarget;
                setNat({ w: t.naturalWidth, h: t.naturalHeight });
              }}
              onError={() => {
                toast.error("Couldn't load that image");
                onCancel();
              }}
              style={{ display: "none" }}
            />
            {/* Visible image: positioned by geometry. */}
            {nat && (() => {
              const g = computeGeometry();
              if (!g) return null;
              return (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute pointer-events-none will-change-transform"
                  style={{
                    left: 0,
                    top: 0,
                    width: g.dw,
                    height: g.dh,
                    transform: `translate(${g.tx}px, ${g.ty}px)`,
                  }}
                />
              );
            })()}
            {/* Loading overlay */}
            {!nat && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-pink-300 animate-spin" />
              </div>
            )}
            {/* Subtle inner glow ring so the framing reads as the canvas */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-pink-400/20 rounded-2xl" />
          </div>

          {/* Zoom slider */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => zoomToCenter(scale - 0.1)}
              className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-pink-200"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={scale}
              onChange={(e) => zoomToCenter(parseFloat(e.target.value))}
              className="flex-1 accent-pink-500"
            />
            <button
              type="button"
              onClick={() => zoomToCenter(scale + 0.1)}
              className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-pink-200"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] tabular-nums text-pink-200/70 w-12 text-right">
              {scale.toFixed(2)}x
            </span>
          </div>

          {/* Hint */}
          <p className="mt-3 text-center text-[11px] text-pink-200/60 tracking-wider uppercase">
            Drag to pan · Scroll or use the slider to zoom
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/30">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 h-9 rounded-lg text-xs font-bold tracking-wider uppercase bg-white/5 hover:bg-white/10 text-white/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !nat}
            className="inline-flex items-center gap-2 px-5 h-9 rounded-lg text-xs font-bold tracking-wider uppercase bg-pink-500 hover:bg-pink-400 text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {busy ? "Saving" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function clampScale(s: number) {
  return Math.min(4, Math.max(1, s));
}

// Load `src` as a CORS-clean Image suitable for canvas drawing.
//
// Strategy:
//   1. Try the URL directly with crossOrigin="anonymous". Works for our own
//      uploads and any external host that sends CORS headers.
//   2. If that fails (most external image CDNs), retry through the server's
//      `/api/imgproxy` which streams the bytes back same-origin with
//      Access-Control-Allow-Origin: *.
//
// Same-origin URLs (already absolute or starting with `/`) skip step 2 since
// the proxy can't do anything for them.
function loadImage(src: string): Promise<HTMLImageElement> {
  const tryLoad = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  const isExternal = /^https?:\/\//i.test(src) &&
    !src.startsWith(window.location.origin);
  return tryLoad(src).catch((err) => {
    if (!isExternal) throw err;
    return tryLoad(`/api/imgproxy?url=${encodeURIComponent(src)}`);
  });
}
