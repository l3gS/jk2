import { useMemo } from 'react'

// Cherry-blossom petals drifting down behind every page. Pure CSS — no canvas
// or rAF — so it costs nothing in JS and pauses cleanly via prefers-reduced-motion.
export default function SakuraPetals({ count = 18 }: { count?: number }) {
  const petals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100
      const duration = 14 + Math.random() * 18
      const delay = -Math.random() * duration  // start partway through
      const size = 8 + Math.random() * 14
      const drift = -40 + Math.random() * 80
      const hue = 320 + Math.random() * 30  // pink → magenta range
      return { i, left, duration, delay, size, drift, hue }
    })
  }, [count])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map(p => (
        <span
          key={p.i}
          className="sakura-petal"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            background: `radial-gradient(circle at 35% 35%, hsl(${p.hue} 90% 85%) 0%, hsl(${p.hue} 80% 65%) 60%, hsl(${p.hue} 70% 50%) 100%)`,
            // CSS variable consumed by the keyframe to add subtle horizontal drift
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
