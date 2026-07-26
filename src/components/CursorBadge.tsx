import { useEffect, useRef, useState } from "react";

// Tiny PNG sticker that follows the user's mouse, anchored to the
// bottom-right corner of the system cursor — like a charm clipped to it.
// The native cursor is preserved (no CSS override of `cursor:`).
export default function CursorBadge({
  src = "/gallery/cursor.png",
  size = 36,
  offsetX = 14,
  offsetY = 14,
}: {
  src?: string;
  size?: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Touch / coarse-pointer devices: hide the badge entirely
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mql.matches) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    let armed = false;

    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      armed = true;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!armed) return;
          armed = false;
          if (ref.current) {
            ref.current.style.transform = `translate3d(${pendingX + offsetX}px, ${pendingY + offsetY}px, 0)`;
          }
          if (!visible) setVisible(true);
        });
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [offsetX, offsetY, visible]);

  return (
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease-out",
        filter: "drop-shadow(0 2px 6px rgba(244,63,94,0.45))",
        willChange: "transform",
        objectFit: "contain",
      }}
    />
  );
}
