import { useMemo } from "react";

// Floating pink hearts drifting upward — pure-CSS sister to SakuraPetals.
// Reinforces the waifu/kawaii aesthetic without any JS animation cost and
// pauses cleanly via prefers-reduced-motion (handled by the keyframe).
export default function HeartParticles({ count = 8 }: { count?: number }) {
  const hearts = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const duration = 12 + Math.random() * 14;
      const delay = -Math.random() * duration;
      const size = 12 + Math.random() * 14;
      const drift = -30 + Math.random() * 60;
      const hue = 330 + Math.random() * 25;
      return { i, left, duration, delay, size, drift, hue };
    });
  }, [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {hearts.map((h) => (
        <span
          key={h.i}
          className="waifu-heart"
          style={{
            left: `${h.left}%`,
            width: `${h.size}px`,
            height: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            color: `hsl(${h.hue} 95% 75%)`,
            ["--drift" as string]: `${h.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
