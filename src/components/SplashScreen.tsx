import { useState, useEffect, useRef, useCallback } from 'react'

interface Props { onDone: () => void }

const VARIANTS = [
  {
    label: 'PRIVATE · AUTHORISED ACCESS',
    sub: 'Initialising',
    accent: 'rgba(255,255,255,0.85)',
    glow: 'rgba(255,255,255,0.06)',
    scanColor: 'rgba(255,255,255,0.025)',
    gridColor: 'rgba(255,255,255,0.015)',
    cornerColor: 'rgba(255,255,255,0.3)',
    bg: '#020202',
  },
  {
    label: 'CLASSIFIED · MEMBERS ONLY',
    sub: 'Loading Systems',
    accent: 'rgba(180,140,255,0.9)',
    glow: 'rgba(160,100,255,0.08)',
    scanColor: 'rgba(160,100,255,0.04)',
    gridColor: 'rgba(160,100,255,0.012)',
    cornerColor: 'rgba(180,140,255,0.35)',
    bg: '#030208',
  },
  {
    label: 'RESTRICTED · EYES ONLY',
    sub: 'Establishing Connection',
    accent: 'rgba(255,80,80,0.85)',
    glow: 'rgba(255,40,40,0.07)',
    scanColor: 'rgba(255,60,60,0.03)',
    gridColor: 'rgba(255,40,40,0.01)',
    cornerColor: 'rgba(255,100,100,0.3)',
    bg: '#080202',
  },
  {
    label: 'DEEP NETWORK · ACCESS GRANTED',
    sub: 'Syncing',
    accent: 'rgba(80,220,180,0.85)',
    glow: 'rgba(40,200,150,0.07)',
    scanColor: 'rgba(40,200,150,0.03)',
    gridColor: 'rgba(40,200,150,0.01)',
    cornerColor: 'rgba(80,220,180,0.28)',
    bg: '#010806',
  },
]

export default function SplashScreen({ onDone }: Props) {
  const variant = useRef(VARIANTS[Math.floor(Math.random() * VARIANTS.length)]).current
  const [phase, setPhase] = useState<'in' | 'hold' | 'seq1' | 'seq2' | 'seq3' | 'out' | 'gone'>('in')
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('out')
    setTimeout(onDone, 520)
  }, [onDone])

  useEffect(() => {
    // Phase timeline: in→hold→seq1→seq2→seq3→out (total ~5.5s)
    const timers = [
      setTimeout(() => setPhase('hold'), 600),
      setTimeout(() => setPhase('seq1'), 1600),
      setTimeout(() => setPhase('seq2'), 2900),
      setTimeout(() => setPhase('seq3'), 4200),
      setTimeout(finish, 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [finish])

  if (phase === 'gone') return null

  const v = variant

  return (
    <>
      <style>{`
        @keyframes splashLetters {
          0%   { opacity: 0; letter-spacing: 2em; filter: blur(12px); }
          100% { opacity: 1; letter-spacing: 0.35em; filter: blur(0); }
        }
        @keyframes splashSub {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashScan {
          0%   { top: -8%; }
          100% { top: 108%; }
        }
        @keyframes splashPulse {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.45; }
        }
        @keyframes splashCorner {
          from { width: 0; height: 0; opacity: 0; }
          to   { width: 24px; height: 24px; opacity: 1; }
        }
        @keyframes splashDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1; transform: scale(1.2); }
        }
        @keyframes splashBarIn {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes splashSeqFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashGlitch {
          0%,95%,100% { transform: none; opacity: 1; }
          96% { transform: translateX(3px) skewX(-2deg); opacity: 0.85; }
          97% { transform: translateX(-2px); opacity: 0.9; }
          98% { transform: none; opacity: 1; }
          99% { transform: translateX(1px) skewX(1deg); opacity: 0.95; }
        }
        @keyframes splashSkip {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      <div
        onClick={finish}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
        style={{
          background: v.bg,
          opacity: phase === 'out' ? 0 : 1,
          transition: phase === 'out' ? 'opacity 0.52s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 59px,${v.gridColor} 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,${v.gridColor} 60px)`,
        }} />

        {/* Scan beam */}
        <div className="absolute left-0 right-0 h-28 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom,transparent,${v.scanColor},transparent)`,
            animation: 'splashScan 3.2s linear infinite',
          }} />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 65% 45% at 50% 50%, ${v.glow} 0%, transparent 70%)`,
          animation: 'splashPulse 2.2s ease-in-out infinite',
        }} />

        {/* Corner brackets */}
        {[
          { top: 24, left: 24, borderTop: `1.5px solid ${v.cornerColor}`, borderLeft: `1.5px solid ${v.cornerColor}`, borderRadius: '3px 0 0 0' },
          { top: 24, right: 24, borderTop: `1.5px solid ${v.cornerColor}`, borderRight: `1.5px solid ${v.cornerColor}`, borderRadius: '0 3px 0 0' },
          { bottom: 24, left: 24, borderBottom: `1.5px solid ${v.cornerColor}`, borderLeft: `1.5px solid ${v.cornerColor}`, borderRadius: '0 0 0 3px' },
          { bottom: 24, right: 24, borderBottom: `1.5px solid ${v.cornerColor}`, borderRight: `1.5px solid ${v.cornerColor}`, borderRadius: '0 0 3px 0' },
        ].map((s, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ ...s, width: 24, height: 24, animation: `splashCorner 0.55s ${i * 0.07}s cubic-bezier(0.16,1,0.3,1) both` }} />
        ))}

        {/* Status dots */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-full"
              style={{
                width: 4, height: 4,
                background: v.accent,
                animation: `splashDot 1.2s ${i * 0.22}s ease-in-out infinite`,
              }} />
          ))}
        </div>

        {/* Main title */}
        <div className="text-center relative z-10">
          {/* Top label */}
          <p className="text-[9px] tracking-[0.8em] uppercase font-bold mb-6"
            style={{
              color: 'rgba(255,255,255,0.2)',
              opacity: phase === 'in' ? 0 : 1,
              transition: 'opacity 0.5s 0.25s ease',
            }}>
            {v.label}
          </p>

          {/* Main wordmark with glitch */}
          <h1
            className="font-black text-white uppercase"
            style={{
              fontSize: 'clamp(2.5rem,8vw,5rem)',
              animation: phase === 'in'
                ? 'splashLetters 0.75s cubic-bezier(0.16,1,0.3,1) both'
                : 'splashGlitch 4s 1.8s ease-in-out infinite',
              letterSpacing: '0.35em',
              textShadow: `0 0 60px ${v.glow}, 0 0 120px ${v.glow}`,
              WebkitTextStroke: `0.5px ${v.cornerColor}`,
              color: phase !== 'in' ? v.accent : 'white',
              transition: 'color 0.8s 0.6s ease',
            }}
          >
            CUM&nbsp;'N'&nbsp;GO
          </h1>

          {/* Divider bars */}
          <div className="mt-5 flex items-center gap-3 justify-center">
            <div className="h-px flex-1 max-w-24 origin-left"
              style={{
                background: `linear-gradient(to right,transparent,${v.cornerColor})`,
                animation: phase !== 'in' ? 'splashBarIn 0.6s 0.1s ease both' : 'none',
                opacity: phase === 'in' ? 0 : 1,
              }} />
            <span className="text-[8px] tracking-[0.6em] uppercase font-medium"
              style={{
                color: 'rgba(255,255,255,0.18)',
                opacity: phase === 'in' ? 0 : 1,
                transition: 'opacity 0.5s 0.45s ease',
              }}>
              {v.sub}
            </span>
            <div className="h-px flex-1 max-w-24 origin-right"
              style={{
                background: `linear-gradient(to left,transparent,${v.cornerColor})`,
                animation: phase !== 'in' ? 'splashBarIn 0.6s 0.1s ease both' : 'none',
                opacity: phase === 'in' ? 0 : 1,
              }} />
          </div>

          {/* Sequential text lines */}
          <div className="mt-8 flex flex-col items-center gap-2" style={{minHeight:56}}>
            {(phase === 'seq1' || phase === 'seq2' || phase === 'seq3') && (
              <p className="text-[10px] tracking-[0.5em] uppercase font-light"
                style={{ color: 'rgba(255,255,255,0.22)', animation: 'splashSeqFade 0.4s ease both' }}>
                ▸ Verifying identity…
              </p>
            )}
            {(phase === 'seq2' || phase === 'seq3') && (
              <p className="text-[10px] tracking-[0.5em] uppercase font-light"
                style={{ color: 'rgba(255,255,255,0.22)', animation: 'splashSeqFade 0.4s 0.05s ease both' }}>
                ▸ Decrypting content layer…
              </p>
            )}
            {phase === 'seq3' && (
              <p className="text-[10px] tracking-[0.5em] uppercase font-bold"
                style={{ color: v.accent, animation: 'splashSeqFade 0.4s 0.08s ease both' }}>
                ✓ Access Granted
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-px overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: v.accent,
              animation: phase !== 'in' ? 'splashProgress 4.9s linear both' : 'none',
              width: phase === 'in' ? '0%' : undefined,
            }} />
        </div>

        {/* Skip hint */}
        {(phase === 'hold' || phase === 'seq1' || phase === 'seq2' || phase === 'seq3') && (
          <div className="absolute bottom-8 right-8"
            style={{ animation: 'splashSkip 0.4s 0.8s ease both', opacity: 0 }}>
            <span className="text-[7px] tracking-[0.5em] uppercase"
              style={{ color: 'rgba(255,255,255,0.12)' }}>
              tap to skip
            </span>
          </div>
        )}

        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg,transparent,${v.cornerColor} 50%,transparent)` }} />
      </div>
    </>
  )
}
