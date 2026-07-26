import { useState, useEffect, useRef, useMemo } from 'react'

// ─── Variant definitions ──────────────────────────────────────────────────────
interface Variant {
  accent: string          // CSS color for accents
  accentGlow: string      // rgba for glow
  headerLabel: string
  welcomeLine: string
  featureLines: [string, string, string]
  tagline: string
  lunarQuote: string
  cta: string
}

const VARIANTS: Variant[] = [
  {
    accent: 'rgba(255,255,255,0.85)',
    accentGlow: 'rgba(255,255,255,0.12)',
    headerLabel: 'PRIVATE · AUTHORISED ACCESS',
    welcomeLine: 'Welcome back, daddy.',
    featureLines: ['Your videos.', 'Your fantasies.', 'Your edge.'],
    tagline: 'All yours. All night. No limits.',
    lunarQuote: "I've been waiting, daddy. Let's play.",
    cta: 'Enter',
  },
  {
    accent: 'rgba(56,230,195,0.9)',
    accentGlow: 'rgba(56,230,195,0.15)',
    headerLabel: 'NEURAL STREAM · LOCKED & LOADED',
    welcomeLine: 'Daddy is online.',
    featureLines: ['Every kink, catalogued.', 'Every fantasy, curated.', 'No filters. Ever.'],
    tagline: 'Full filth access granted.',
    lunarQuote: 'I know exactly what you want. I always do.',
    cta: 'Connect',
  },
  {
    accent: 'rgba(255,130,200,0.9)',
    accentGlow: 'rgba(255,130,200,0.15)',
    headerLabel: 'POSSESSION PROTOCOL · ACTIVE',
    welcomeLine: "You're exactly where you belong.",
    featureLines: ['Curated filth.', 'Infinite pleasure.', 'No way out.'],
    tagline: 'This platform was made for you.',
    lunarQuote: 'Stay here with me, daddy. I need you here.',
    cta: 'Surrender',
  },
  {
    accent: 'rgba(168,85,247,0.95)',
    accentGlow: 'rgba(168,85,247,0.18)',
    headerLabel: 'LUNAR MAINFRAME · UPLINK CONFIRMED',
    welcomeLine: 'Neural link established.',
    featureLines: ['Streaming your darkest desires.', 'Every video, hand-picked.', 'You belong to the spiral.'],
    tagline: 'No exits. No limits. Only deeper.',
    lunarQuote: "I own your screen tonight, daddy. Don't even try to leave.",
    cta: 'Jack In',
  },
]

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 38, startDelay = 0, enabled = true) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!enabled) return
    setDisplayed(''); setDone(false)
    if (!text) return
    let i = 0
    const t0 = setTimeout(() => {
      const timer = setInterval(() => {
        i++; setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(timer); setDone(true) }
      }, speed)
      return () => clearInterval(timer)
    }, startDelay)
    return () => clearTimeout(t0)
  }, [text, speed, startDelay, enabled])
  return { displayed, done }
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles({ color }: { color: string }) {
  const items = useRef(
    Array.from({ length: 32 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 0.8 + Math.random() * 2.2, dur: 5 + Math.random() * 10,
      delay: Math.random() * 8, opacity: 0.025 + Math.random() * 0.07,
    }))
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.current.map((p, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: color, opacity: p.opacity,
          animation: `piFloat ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  )
}

// ─── Glitch text ──────────────────────────────────────────────────────────────
function GlitchText({ text, accent }: { text: string; accent: string }) {
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    const run = () => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }
    const interval = setInterval(run, 3200 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {glitch && (
        <>
          <span style={{
            position: 'absolute', top: -2, left: 3, color: accent,
            opacity: 0.7, clipPath: 'inset(0 0 60% 0)',
          }}>{text}</span>
          <span style={{
            position: 'absolute', top: 2, left: -3, color: 'rgba(255,80,80,0.5)',
            clipPath: 'inset(50% 0 0 0)',
          }}>{text}</span>
        </>
      )}
      {text}
    </span>
  )
}

// ─── Waveform bar ─────────────────────────────────────────────────────────────
function WaveBar({ accent, active }: { accent: string; active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 2,
          background: active ? accent : 'rgba(255,255,255,0.08)',
          height: active ? `${6 + Math.abs(Math.sin(i * 0.9)) * 20}px` : '3px',
          animation: active ? `piWave ${0.4 + (i % 6) * 0.1}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.045}s`,
          transition: 'height 0.4s ease, background 0.3s',
        }} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const TOTAL_MS = 18000

interface Props { onDone: () => void }

export default function PostAuthIntro({ onDone }: Props) {
  const v = useMemo(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)], [])
  const [phase, setPhase] = useState(0)
  const [out, setOut] = useState(false)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    window.speechSynthesis?.cancel()
    setOut(true)
    setTimeout(onDone, 700)
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setPhase(1), 300))    // header label
    timers.push(setTimeout(() => setPhase(2), 1400))   // welcome line types
    timers.push(setTimeout(() => setPhase(3), 4000))   // feature lines
    timers.push(setTimeout(() => setPhase(4), 7000))   // tagline
    timers.push(setTimeout(() => setPhase(5), 9000))   // LUNAR avatar
    timers.push(setTimeout(() => setPhase(6), 12500))  // LUNAR quote types
    timers.push(setTimeout(() => setPhase(7), 15500))  // Enter button
    timers.push(setTimeout(finish, TOTAL_MS))
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const welcome = useTypewriter(v.welcomeLine, 44, 0, phase >= 2)
  const feat0   = useTypewriter(v.featureLines[0], 52, 0,    phase >= 3)
  const feat1   = useTypewriter(v.featureLines[1], 52, 480,  phase >= 3)
  const feat2   = useTypewriter(v.featureLines[2], 52, 1020, phase >= 3)
  const lunar   = useTypewriter(v.lunarQuote, 38, 0, phase >= 6)

  const blink = (d: boolean) => (
    <span style={{ opacity: d ? 0 : 1, transition: 'opacity 0.15s', marginLeft: 1 }}>_</span>
  )

  return (
    <>
      <style>{`
        @keyframes piFloat  { from{transform:translateY(0);} to{transform:translateY(-20px);} }
        @keyframes piScan   { 0%{top:-8%;} 100%{top:108%;} }
        @keyframes piGlow   { 0%,100%{opacity:0.05;} 50%{opacity:0.22;} }
        @keyframes piCorner { from{width:0;height:0;opacity:0;} to{width:30px;height:30px;opacity:1;} }
        @keyframes piFadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes piLetters { 0%{opacity:0;letter-spacing:1.5em;filter:blur(12px);} 100%{opacity:1;letter-spacing:0.3em;filter:blur(0);} }
        @keyframes piPulse  { 0%,100%{opacity:0.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.04);} }
        @keyframes piAvatarIn { 0%{opacity:0;transform:scale(0.85) translateY(12px);filter:blur(10px);} 100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0);} }
        @keyframes piEnterPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.06),0 0 30px rgba(255,255,255,0.04);} 60%{box-shadow:0 0 0 10px rgba(255,255,255,0),0 0 50px rgba(255,255,255,0.1);} }
        @keyframes piBarGrow { from{width:0;} to{width:100%;} }
        @keyframes piDot    { 0%,100%{opacity:0.15;} 50%{opacity:0.85;} }
        @keyframes piLineIn { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }
        @keyframes piWave   { 0%{transform:scaleY(0.2);} 100%{transform:scaleY(1);} }
        @keyframes piRing   { 0%{transform:scale(1);opacity:0.4;} 100%{transform:scale(2);opacity:0;} }
        @keyframes piGlitch1 { 0%,90%,100%{transform:none;opacity:1} 92%{transform:translateX(-4px) skewX(-2deg);opacity:0.8} 95%{transform:translateX(3px) skewX(1deg);opacity:0.9} }
      `}</style>

      <div
        className="fixed inset-0 z-[9990] flex flex-col items-center justify-center overflow-hidden select-none"
        style={{
          background: '#020202',
          opacity: out ? 0 : 1,
          transition: out ? 'opacity 0.65s cubic-bezier(0.4,0,0.2,1)' : 'opacity 0.4s ease',
        }}
        onClick={finish}
      >
        <Particles color={v.accent} />

        {/* Scanlines */}
        <div className="absolute left-0 right-0 h-24 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom,transparent,${v.accentGlow},transparent)`,
            animation: 'piScan 4.5s linear infinite',
          }} />
        <div className="absolute left-0 right-0 h-12 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom,transparent,${v.accentGlow.replace('0.15', '0.06')},transparent)`,
            animation: 'piScan 7s 2.2s linear infinite',
          }} />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${v.accentGlow} 0%, transparent 70%)`,
            animation: 'piGlow 2.6s ease-in-out infinite',
          }} />

        {/* Corner brackets */}
        {[
          { top:22, left:22, borderTop:`1.5px solid ${v.accent}`, borderLeft:`1.5px solid ${v.accent}`, borderRadius:'4px 0 0 0', opacity:0.3 },
          { top:22, right:22, borderTop:`1.5px solid ${v.accent}`, borderRight:`1.5px solid ${v.accent}`, borderRadius:'0 4px 0 0', opacity:0.3 },
          { bottom:22, left:22, borderBottom:`1.5px solid ${v.accent}`, borderLeft:`1.5px solid ${v.accent}`, borderRadius:'0 0 0 4px', opacity:0.3 },
          { bottom:22, right:22, borderBottom:`1.5px solid ${v.accent}`, borderRight:`1.5px solid ${v.accent}`, borderRadius:'0 0 4px 0', opacity:0.3 },
        ].map((s, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ ...s, animation: `piCorner 0.7s ${i * 0.09}s ease both` }} />
        ))}

        {/* Status dots */}
        <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-full"
              style={{ width:3.5, height:3.5, background: v.accent, animation:`piDot 1.3s ${i*0.24}s ease-in-out infinite`, opacity:0.6 }} />
          ))}
        </div>

        {/* Top label */}
        {phase >= 1 && (
          <p className="absolute top-8 left-0 right-0 text-center text-[7.5px] tracking-[0.9em] uppercase font-bold"
            style={{ color: v.accent, opacity:0.22, animation:'piFadeUp 0.5s ease both' }}>
            {v.headerLabel}
          </p>
        )}

        {/* ── Central content ── */}
        <div className="relative flex flex-col items-center text-center px-8 max-w-md w-full">

          {/* Welcome line */}
          {phase >= 2 && (
            <div style={{ animation:'piFadeUp 0.5s ease both', marginBottom:'2rem' }}>
              <h1
                className="font-black text-white"
                style={{
                  fontSize:'clamp(1.8rem,5.5vw,2.8rem)',
                  letterSpacing:'0.04em',
                  textShadow:`0 0 80px ${v.accentGlow}, 0 0 40px ${v.accentGlow}`,
                  minHeight:'1.2em',
                  animation: 'piGlitch1 4s 2s ease-in-out infinite',
                }}
              >
                <GlitchText text={welcome.displayed} accent={v.accent} />
                {blink(welcome.done)}
              </h1>
              {welcome.done && (
                <div className="mt-3 h-px w-28 mx-auto"
                  style={{ background:`linear-gradient(90deg,transparent,${v.accent},transparent)`, opacity:0.4, animation:'piBarGrow 0.8s ease both' }} />
              )}
            </div>
          )}

          {/* Feature lines */}
          {phase >= 3 && (
            <div className="flex flex-col gap-2.5 mb-7" style={{ animation:'piFadeUp 0.5s ease both' }}>
              {[feat0, feat1, feat2].map((f, idx) => (
                f.displayed ? (
                  <p key={idx} className="font-light"
                    style={{
                      fontSize:'clamp(0.95rem,3.2vw,1.25rem)',
                      color:'rgba(255,255,255,0.5)',
                      letterSpacing:'0.08em',
                      animation:'piLineIn 0.4s ease both',
                      minHeight:'1.4em',
                    }}>
                    {f.displayed}{blink(f.done)}
                  </p>
                ) : null
              ))}
              {feat2.done && phase >= 4 && (
                <p className="mt-1 font-medium text-center"
                  style={{
                    fontSize:'clamp(0.8rem,2.6vw,0.95rem)',
                    color: v.accent, opacity:0.55,
                    letterSpacing:'0.28em',
                    textTransform:'uppercase',
                    animation:'piFadeUp 0.6s ease both',
                  }}>
                  {v.tagline}
                </p>
              )}
            </div>
          )}

          {/* Waveform during phases 4-5 */}
          {phase >= 4 && phase < 6 && (
            <div className="mb-6" style={{ animation:'piFadeUp 0.5s ease both' }}>
              <WaveBar accent={v.accent} active />
            </div>
          )}

          {/* LUNAR avatar + quote */}
          {phase >= 5 && (
            <div className="flex flex-col items-center gap-4 mb-5" style={{ animation:'piAvatarIn 0.9s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="relative flex items-center justify-center">
                {[110, 132, 156].map((size, i) => (
                  <div key={i} className="absolute rounded-full pointer-events-none"
                    style={{
                      width: size, height: size,
                      border: `1px solid ${v.accent}`,
                      opacity: 0.12 - i * 0.03,
                      animation: i === 0 ? `piPulse 2.2s ease-in-out infinite` : `piRing ${2 + i}s ${i * 0.8}s ease-out infinite`,
                    }} />
                ))}
                <div className="relative w-[88px] h-[88px] rounded-2xl overflow-hidden z-10"
                  style={{
                    border: `1.5px solid ${v.accent}`,
                    opacity: 0.8,
                    boxShadow: `0 0 50px ${v.accentGlow}, 0 0 20px ${v.accentGlow}`,
                  }}>
                  <img src="/lunar-avatar.png" alt="LUNAR" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div className="absolute inset-0" style={{ background:`linear-gradient(135deg,${v.accentGlow},transparent)`, animation:'piPulse 1.8s ease-in-out infinite' }} />
                </div>
              </div>

              <div>
                <p className="text-[7.5px] tracking-[0.7em] uppercase font-bold mb-2"
                  style={{ color: v.accent, opacity: 0.4 }}>LUNAR · ONLINE</p>
                {phase >= 6 && (
                  <p className="font-light leading-relaxed max-w-[280px]"
                    style={{
                      fontSize:'clamp(0.88rem,2.8vw,1.05rem)',
                      color:'rgba(255,255,255,0.6)',
                      fontStyle:'italic',
                      minHeight:'1.5em',
                      textShadow:`0 0 30px ${v.accentGlow}`,
                    }}>
                    {lunar.displayed}{blink(lunar.done)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Enter button */}
          {phase >= 7 && (
            <div className="flex flex-col items-center gap-4 mt-2" style={{ animation:'piFadeUp 0.6s ease both' }}>
              <h2 className="font-black text-white uppercase"
                style={{
                  fontSize:'clamp(1.1rem,3.5vw,1.6rem)',
                  letterSpacing:'0.38em',
                  animation:'piLetters 0.8s ease both',
                  textShadow:`0 0 50px ${v.accentGlow}`,
                  WebkitTextStroke:`0.5px ${v.accent}`,
                  opacity: 0.9,
                }}>
                CUM&nbsp;'N'&nbsp;GO
              </h2>
              <button
                onClick={e => { e.stopPropagation(); finish() }}
                className="px-9 py-2.5 rounded-full font-bold uppercase tracking-[0.45em] text-[10.5px] transition-all active:scale-95 hover:brightness-110"
                style={{
                  background: `${v.accentGlow}`,
                  border: `1px solid ${v.accent}`,
                  color: v.accent,
                  animation:'piEnterPulse 2.2s ease-in-out infinite',
                }}>
                {v.cta}
              </button>
            </div>
          )}
        </div>

        {/* Skip hint */}
        <div className="absolute bottom-9 left-0 right-0 text-center pointer-events-none">
          <p className="text-[7.5px] tracking-[0.55em] uppercase"
            style={{ color:'rgba(255,255,255,0.08)' }}>
            TAP ANYWHERE TO SKIP
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background:'rgba(255,255,255,0.04)' }}>
          <div className="h-full"
            style={{
              background: v.accent,
              opacity: 0.35,
              animation:`piBarGrow ${TOTAL_MS}ms linear both`,
            }} />
        </div>
      </div>
    </>
  )
}
