import { useMemo } from "react";

// Soft, subtle "cum" droplets dribbling down the viewport behind the UI.
// Same cheap pure-CSS approach as <SakuraPetals/>: pre-randomised tracks,
// no rAF, paused under prefers-reduced-motion. Default count is small so
// the effect stays light — like a few stray drops, not a downpour.
export default function CumDribbles({ count = 22 }: { count?: number }) {
  const drops = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const duration = 14 + Math.random() * 22; // slow, viscous drift
      const delay = -Math.random() * duration; // start mid-flight
      const width = 6 + Math.random() * 8; // chunkier so it actually reads
      const tail = 40 + Math.random() * 90; // length of the dribble tail
      const drift = -14 + Math.random() * 28; // gentle horizontal sway
      return { i, left, duration, delay, width, tail, drift };
    });
  }, [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {drops.map((d) => (
        <span
          key={d.i}
          className="cum-dribble"
          style={{
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.tail}px`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            ["--drift" as string]: `${d.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
