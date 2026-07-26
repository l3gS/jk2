import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'goonit-age-verified-v1'

interface AgeGateProps { onVerified: () => void }

function Particles() {
  const items = useRef(
    Array.from({ length: 35 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      dur: 5 + Math.random() * 10,
      delay: Math.random() * 8,
      opacity: 0.025 + Math.random() * 0.07,
    }))
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.current.map((p, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: 'white', opacity: p.opacity,
          animation: `agePFloat ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  )
}

export default function AgeGate({ onVerified }: AgeGateProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in')
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      onVerified(); return
    }
    setOpen(true)
    const t1 = setTimeout(() => setPhase('show'), 600)
    return () => clearTimeout(t1)
  }, [onVerified])

  const handleEnter = () => {
    if (entering) return
    setEntering(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    localStorage.setItem('goonit-age-verified-at', new Date().toISOString())
    setTimeout(() => { setPhase('out') }, 80)
    setTimeout(() => { setOpen(false); onVerified() }, 700)
  }

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes agePFloat { 0% { transform:translateY(0); } 100% { transform:translateY(-20px); } }
        @keyframes agePScan { 0% { top:-6%; } 100% { top:106%; } }
        @keyframes agePCorner { from { width:0;height:0;opacity:0; } to { width:24px;height:24px;opacity:1; } }
        @keyframes agePDot { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:1;transform:scale(1.5);} }
        @keyframes agePGlitch {
          0%,88%,100%{clip-path:none;transform:none;}
          90%{clip-path:inset(20% 0 50% 0);transform:translate(-5px,0);}
          93%{clip-path:inset(60% 0 10% 0);transform:translate(5px,0);}
          96%{clip-path:none;transform:none;}
        }
        @keyframes agePReveal { from{opacity:0;transform:translateY(32px) scale(0.95);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes agePFadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes agePPulse { 0%,100%{opacity:0.06;} 50%{opacity:0.14;} }
        @keyframes agePButtonGlow { 0%,100%{box-shadow:0 0 30px rgba(255,255,255,0.08),0 0 0 0 rgba(255,255,255,0.04);} 50%{box-shadow:0 0 60px rgba(255,255,255,0.14),0 0 0 8px rgba(255,255,255,0);} }
        @keyframes agePLineGrow { from{width:0;opacity:0;} to{width:100%;opacity:1;} }
        @keyframes agePEnter { 0%,100%{transform:scaleX(1);} 50%{transform:scaleX(1.02);} }
        @keyframes agePFadeOut { from{opacity:1;} to{opacity:0;} }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden select-none"
        style={{
          background: '#020202',
          opacity: phase === 'out' ? 0 : 1,
          transition: phase === 'out' ? 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}>

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.013) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.013) 60px)',
        }} />

        {/* Scan beam */}
        <div className="absolute left-0 right-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.022),transparent)', animation: 'agePScan 3.5s linear infinite' }} />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(255,255,255,0.04), transparent 70%)', animation: 'agePPulse 2.5s ease-in-out infinite' }} />

        <Particles />

        {/* LED strips */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5) 35%,white 50%,rgba(255,255,255,0.5) 65%,transparent)', boxShadow: '0 0 20px rgba(255,255,255,0.12)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15) 50%,transparent)' }} />

        {/* Corner brackets */}
        {[
          { top:24, left:24, borderTop:'1.5px solid rgba(255,255,255,0.3)', borderLeft:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'3px 0 0 0' },
          { top:24, right:24, borderTop:'1.5px solid rgba(255,255,255,0.3)', borderRight:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'0 3px 0 0' },
          { bottom:24, left:24, borderBottom:'1.5px solid rgba(255,255,255,0.3)', borderLeft:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'0 0 0 3px' },
          { bottom:24, right:24, borderBottom:'1.5px solid rgba(255,255,255,0.3)', borderRight:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'0 0 3px 0' },
        ].map((s, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ ...s, width:24, height:24, animation:`agePCorner 0.5s ${i*0.07}s ease both` }} />
        ))}

        {/* Status dots — top center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-full"
              style={{ width:4, height:4, background:'rgba(255,255,255,0.35)', animation:`agePDot 1.2s ${i*0.22}s ease-in-out infinite` }} />
          ))}
        </div>

        {/* Corner dots */}
        {['top-5 left-5','top-5 right-5','bottom-5 left-5','bottom-5 right-5'].map(pos => (
          <div key={pos} className={`absolute ${pos} w-1.5 h-1.5 rounded-full pointer-events-none`}
            style={{ background:'white', boxShadow:'0 0 8px rgba(255,255,255,0.7)', animation:'agePDot 3.5s ease-in-out infinite' }} />
        ))}

        {/* ── MAIN CONTENT ── */}
        <div className="flex flex-col items-center gap-8 relative px-6 text-center"
          style={{ animation: phase === 'show' ? 'agePReveal 0.6s cubic-bezier(0.34,1.3,0.64,1) both' : 'none', opacity: phase === 'in' ? 0 : 1 }}>

          {/* Avatar with rings */}
          <div className="relative flex items-center justify-center">
            {[1,2,3].map(i => (
              <div key={i} className="absolute rounded-full pointer-events-none"
                style={{
                  width: 80 + i*48, height: 80 + i*48,
                  border: `1px solid rgba(255,255,255,${0.1 - i*0.028})`,
                  animation: `agePDot ${2+i*0.7}s ${i*0.3}s ease-in-out infinite`,
                }} />
            ))}
            <div className="w-20 h-20 rounded-2xl overflow-hidden relative z-10"
              style={{ border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 0 60px rgba(255,255,255,0.08)' }}>
              <img src="/lunar-avatar.png" alt="CNG" className="w-full h-full object-cover" />
              <div className="absolute left-0 right-0 h-10 pointer-events-none"
                style={{ background:'linear-gradient(to bottom,transparent,rgba(255,255,255,0.1),transparent)', animation:'agePScan 1.4s linear infinite' }} />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-white font-black uppercase mb-3"
              style={{
                fontSize:'clamp(2.2rem,7vw,4.5rem)',
                letterSpacing:'0.38em',
                textShadow:'0 0 60px rgba(255,255,255,0.12)',
                animation:'agePGlitch 7s 1.5s ease-in-out infinite',
              }}>
              CUM&nbsp;'N'&nbsp;GO
            </h1>

            {/* Rule lines */}
            <div className="flex items-center gap-3 justify-center mb-3">
              <div className="h-px" style={{ width:0, background:'rgba(255,255,255,0.15)', animation:'agePLineGrow 0.7s 0.3s ease both' }} />
              <p className="text-[9px] font-black tracking-[0.55em] uppercase whitespace-nowrap"
                style={{ color:'rgba(255,255,255,0.2)' }}>
                PRIVATE · RESTRICTED ACCESS
              </p>
              <div className="h-px" style={{ width:0, background:'rgba(255,255,255,0.15)', animation:'agePLineGrow 0.7s 0.3s ease both' }} />
            </div>

            <p className="text-[10px] tracking-[0.35em] uppercase font-bold"
              style={{ color:'rgba(255,255,255,0.12)', animation:'agePFadeIn 0.5s 0.5s ease both', opacity:0 }}>
              Adults Only · 18+
            </p>
          </div>

          {/* Enter button */}
          <div style={{ animation:'agePFadeIn 0.6s 0.4s ease both', opacity:0 }}>
            <button
              onClick={handleEnter}
              disabled={entering}
              className="relative overflow-hidden font-black uppercase tracking-[0.3em] text-black transition-all active:scale-[0.97]"
              style={{
                width: 'clamp(220px, 45vw, 320px)',
                height: 56,
                borderRadius: 14,
                background: entering ? 'rgba(255,255,255,0.7)' : 'white',
                fontSize: 13,
                boxShadow: '0 0 50px rgba(255,255,255,0.12)',
                animation: !entering ? 'agePButtonGlow 2.5s ease-in-out infinite' : 'none',
              }}>
              {/* Shimmer */}
              {!entering && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.3) 50%,transparent 60%)', animation:'agePEnter 3s ease-in-out infinite' }} />
              )}
              {entering ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  Entering
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" style={{ animationDelay:'0.25s' }} />
                </span>
              ) : 'Enter →'}
            </button>

            <p className="mt-4 text-[8px] tracking-widest uppercase text-center"
              style={{ color:'rgba(255,255,255,0.12)', maxWidth:280 }}>
              By entering you confirm you are 18+ and adult content is legal in your jurisdiction
            </p>

            <button onClick={() => window.location.href='https://www.google.com'}
              className="mt-3 w-full h-9 rounded-xl text-[11px] font-medium transition-all active:scale-95"
              style={{ background:'transparent', color:'rgba(255,255,255,0.14)' }}>
              I'm under 18 — exit
            </button>
          </div>
        </div>

        {/* Bottom status */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.6em] uppercase"
          style={{ color:'rgba(255,255,255,0.08)', animation:'agePFadeIn 0.5s 0.8s ease both', opacity:0, whiteSpace:'nowrap' }}>
          18+ · Adult Content · Private Platform
        </p>
      </div>
    </>
  )
}
