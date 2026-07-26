import { useState, useEffect } from 'react'

interface Props { onDone: () => void }

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'gone'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 500)
    const t2 = setTimeout(() => setPhase('out'), 1600)
    const t3 = setTimeout(() => { setPhase('gone'); onDone() }, 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  if (phase === 'gone') return null

  return (
    <>
      <style>{`
        @keyframes splashLetters {
          0%   { opacity: 0; letter-spacing: 2em; filter: blur(12px); }
          100% { opacity: 1; letter-spacing: 0.35em; filter: blur(0); }
        }
        @keyframes splashSub {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashScan {
          0%   { top: -6%; }
          100% { top: 106%; }
        }
        @keyframes splashPulse {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.4; }
        }
        @keyframes splashCorner {
          from { width: 0; height: 0; }
          to   { width: 22px; height: 22px; }
        }
        @keyframes splashDot {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
        style={{
          background: '#020202',
          opacity: phase === 'out' ? 0 : 1,
          transition: phase === 'out' ? 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.015) 60px)',
        }} />

        {/* Scan beam */}
        <div className="absolute left-0 right-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.025),transparent)',
            animation: 'splashScan 2.5s linear infinite',
          }} />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
          animation: 'splashPulse 1.8s ease-in-out infinite',
        }} />

        {/* Corner brackets */}
        {[
          { top: 24, left: 24, borderTop: '1.5px solid rgba(255,255,255,0.3)', borderLeft: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '3px 0 0 0' },
          { top: 24, right: 24, borderTop: '1.5px solid rgba(255,255,255,0.3)', borderRight: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '0 3px 0 0' },
          { bottom: 24, left: 24, borderBottom: '1.5px solid rgba(255,255,255,0.3)', borderLeft: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '0 0 0 3px' },
          { bottom: 24, right: 24, borderBottom: '1.5px solid rgba(255,255,255,0.3)', borderRight: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '0 0 3px 0' },
        ].map((s, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ ...s, width: 22, height: 22, animation: `splashCorner 0.5s ${i * 0.06}s ease both` }} />
        ))}

        {/* Status dots */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-full"
              style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.4)', animation: `splashDot 1.1s ${i * 0.18}s ease-in-out infinite` }} />
          ))}
        </div>

        {/* Main title */}
        <div className="text-center relative">
          <p className="text-[9px] tracking-[0.8em] uppercase font-bold mb-5"
            style={{
              color: 'rgba(255,255,255,0.2)',
              opacity: phase === 'in' ? 0 : 1,
              transition: 'opacity 0.5s 0.2s ease',
            }}>
            PRIVATE · AUTHORISED ACCESS
          </p>
          <h1
            className="font-black text-white uppercase"
            style={{
              fontSize: 'clamp(2.5rem,8vw,5rem)',
              animation: phase !== 'in' ? 'none' : 'splashLetters 0.7s cubic-bezier(0.16,1,0.3,1) both',
              letterSpacing: '0.35em',
              textShadow: '0 0 60px rgba(255,255,255,0.12), 0 0 120px rgba(255,255,255,0.06)',
              WebkitTextStroke: '0.5px rgba(255,255,255,0.15)',
            }}
          >
            CUM&nbsp;'N'&nbsp;GO
          </h1>
          <div className="mt-5 flex items-center gap-3 justify-center">
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.2))' }} />
            <span className="text-[8px] tracking-[0.6em] uppercase"
              style={{
                color: 'rgba(255,255,255,0.15)',
                opacity: phase === 'in' ? 0 : 1,
                transition: 'opacity 0.5s 0.4s ease',
              }}>
              Initialising
            </span>
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to left,transparent,rgba(255,255,255,0.2))' }} />
          </div>
        </div>

        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15) 50%,transparent)' }} />
      </div>
    </>
  )
}
