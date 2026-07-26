import { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Fingerprint } from 'lucide-react'

const PASS_SESSION_KEY = 'cng-session-auth'
const FACEID_KEY       = 'cng-faceid-v1'
const ACCT_KEY         = 'goonit-account-id'
const CORRECT          = 'NAS'

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64: string): ArrayBuffer {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer
}
const supportsWebAuthn =
  typeof window !== 'undefined' &&
  !!(window as unknown as Record<string, unknown>).PublicKeyCredential &&
  !!navigator.credentials?.create

interface Props { onVerified: () => void }

function Particles() {
  const items = useRef(
    Array.from({ length: 22 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      dur: 5 + Math.random() * 8,
      delay: Math.random() * 6,
      opacity: 0.03 + Math.random() * 0.08,
    }))
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.current.map((p, i) => (
        <div key={i} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size,
            background:'white', opacity:p.opacity,
            animation:`pgFloat ${p.dur}s ${p.delay}s ease-in-out infinite alternate` }} />
      ))}
    </div>
  )
}

function Grid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={`h${i}`} className="absolute left-0 right-0 h-px"
          style={{ top:`${(i + 1) * 6.25}%`, background:'rgba(255,255,255,0.018)' }} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`v${i}`} className="absolute top-0 bottom-0 w-px"
          style={{ left:`${(i + 1) * 9.09}%`, background:'rgba(255,255,255,0.012)' }} />
      ))}
    </div>
  )
}

export default function PasswordGate({ onVerified }: Props) {
  const [done,           setDone]           = useState(false)
  const [visible,        setVisible]        = useState(false)
  const [value,          setValue]          = useState('')
  const [show,           setShow]           = useState(false)
  const [error,          setError]          = useState(false)
  const [shake,          setShake]          = useState(false)
  const [unlocking,      setUnlocking]      = useState(false)
  const [faceIdState,    setFaceIdState]    = useState<'idle' | 'loading' | 'error'>('idle')
  const [hasFaceId,      setHasFaceId]      = useState(false)
  const [introPhase,     setIntroPhase]     = useState<'scan' | 'ready'>('scan')
  const inputRef = useRef<HTMLInputElement>(null)

  const unlock = useCallback(() => {
    setUnlocking(true)
    sessionStorage.setItem(PASS_SESSION_KEY, 'true')
    setTimeout(() => { onVerified(); setDone(true) }, 700)
  }, [onVerified])

  const attemptFaceId = useCallback(async () => {
    if (!supportsWebAuthn || faceIdState === 'loading') return
    setFaceIdState('loading')
    try {
      const storedCredId = localStorage.getItem(FACEID_KEY)
      if (storedCredId) {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rpId: window.location.hostname,
            allowCredentials: [{ type: 'public-key', id: b64ToBuf(storedCredId), transports: ['internal'] }],
            userVerification: 'required',
            timeout: 60000,
          },
        }) as PublicKeyCredential | null
        if (assertion) unlock()
      } else {
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: "Cum 'n' Go", id: window.location.hostname },
            user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'private', displayName: 'Private User' },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
            timeout: 60000,
            excludeCredentials: [],
          },
        }) as PublicKeyCredential | null
        if (cred) {
          localStorage.setItem(FACEID_KEY, bufToB64(cred.rawId))
          setHasFaceId(true)
          const accountId = localStorage.getItem(ACCT_KEY)
          if (accountId) {
            fetch(`/api/account/${encodeURIComponent(accountId)}/faceid`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enrolled: true }),
            }).catch(() => {})
          }
          unlock()
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'NotAllowedError') {
        setFaceIdState('error')
        setTimeout(() => setFaceIdState('idle'), 2000)
      } else {
        setFaceIdState('idle')
      }
      return
    }
    setFaceIdState('idle')
  }, [faceIdState, unlock])

  useEffect(() => {
    if (sessionStorage.getItem(PASS_SESSION_KEY) === 'true') {
      onVerified(); setDone(true); return
    }
    const hasLocalCred = !!localStorage.getItem(FACEID_KEY)
    setHasFaceId(hasLocalCred)

    const t1 = setTimeout(() => { setIntroPhase('ready'); setVisible(true) }, 650)

    if (hasLocalCred && supportsWebAuthn) {
      const t2 = setTimeout(() => attemptFaceId(), 1100)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    setTimeout(() => inputRef.current?.focus(), 900)
    return () => clearTimeout(t1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const attempt = () => {
    if (!value.trim() || unlocking) return
    if (value.trim() === CORRECT) {
      unlock()
    } else {
      setError(true); setShake(true); setValue('')
      setTimeout(() => { setShake(false); setError(false) }, 700)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  if (done) return null

  const showFaceIdButton = isIOS && supportsWebAuthn

  return (
    <>
      <style>{`
        @keyframes pgFloat { 0%{transform:translateY(0);} 100%{transform:translateY(-14px);} }
        @keyframes pgShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes pgScan { 0%{top:-5%} 100%{top:105%} }
        @keyframes pgReveal { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes pgPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes pgGlitch { 0%,92%,100%{clip-path:none;transform:none} 93%{clip-path:inset(30% 0 40% 0);transform:translateX(-4px)} 96%{clip-path:inset(55% 0 20% 0);transform:translateX(4px)} }
        @keyframes pgCorner { from{width:0;height:0} to{width:16px;height:16px} }
        @keyframes pgLineGrow { from{width:0} to{width:100%} }
        @keyframes pgBlink { 0%,88%,100%{opacity:1} 93%{opacity:0} }
      `}</style>

      <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
        style={{ background: '#030303' }}>

        <Grid />
        <Particles />

        {/* LED strips */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.5) 30%,white 50%,rgba(255,255,255,0.5) 70%,transparent)', boxShadow:'0 0 20px rgba(255,255,255,0.15)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.2) 50%,transparent)' }} />

        {/* Corner dots */}
        {['top-3 left-3','top-3 right-3','bottom-3 left-3','bottom-3 right-3'].map(pos => (
          <div key={pos} className={`absolute ${pos} w-1.5 h-1.5 rounded-full`}
            style={{ background:'white', boxShadow:'0 0 8px rgba(255,255,255,0.6)', animation:'pgBlink 4s ease-in-out infinite' }} />
        ))}

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 500px 350px at 50% 50%,rgba(255,255,255,0.03),transparent 70%)' }} />

        {/* ── INTRO SCAN PHASE ── */}
        {introPhase === 'scan' && (
          <div className="flex flex-col items-center gap-4" style={{ animation:'pgReveal 0.4s ease both' }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden relative"
              style={{ border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 0 40px rgba(255,255,255,0.06)' }}>
              <img src="/lunar-avatar.png" alt="CNG" className="w-full h-full object-cover"
                style={{ animation:'pgPulse 1.2s ease-in-out infinite' }} />
              <div className="absolute left-0 right-0 h-8 pointer-events-none"
                style={{ background:'linear-gradient(to bottom,transparent,rgba(255,255,255,0.12),transparent)', animation:'pgScan 0.9s linear infinite' }} />
            </div>
            <p className="text-[10px] font-mono tracking-[0.4em] uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>
              Initialising…
            </p>
          </div>
        )}

        {/* ── MAIN CARD ── */}
        {introPhase === 'ready' && (
          <div className="relative w-full max-w-sm mx-6"
            style={{ animation: shake ? 'pgShake 0.5s ease' : 'pgReveal 0.45s cubic-bezier(0.34,1.4,0.64,1) both' }}>

            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background:'rgba(6,6,6,0.99)',
                border:'1px solid rgba(255,255,255,0.09)',
                boxShadow: unlocking
                  ? '0 0 60px rgba(255,255,255,0.14), 0 0 0 1px rgba(255,255,255,0.06) inset'
                  : '0 0 0 1px rgba(255,255,255,0.03) inset, 0 30px 60px rgba(0,0,0,0.9)',
                transition:'box-shadow 0.5s ease',
              }}>

              {/* Corner accents */}
              {[
                { top:10, left:10, borderTop:'1px solid rgba(255,255,255,0.3)', borderLeft:'1px solid rgba(255,255,255,0.3)', borderRadius:'3px 0 0 0' },
                { top:10, right:10, borderTop:'1px solid rgba(255,255,255,0.3)', borderRight:'1px solid rgba(255,255,255,0.3)', borderRadius:'0 3px 0 0' },
                { bottom:10, left:10, borderBottom:'1px solid rgba(255,255,255,0.3)', borderLeft:'1px solid rgba(255,255,255,0.3)', borderRadius:'0 0 0 3px' },
                { bottom:10, right:10, borderBottom:'1px solid rgba(255,255,255,0.3)', borderRight:'1px solid rgba(255,255,255,0.3)', borderRadius:'0 0 3px 0' },
              ].map((s, i) => (
                <div key={i} className="absolute pointer-events-none"
                  style={{ ...s, width:16, height:16, animation:`pgCorner 0.4s ${i*0.06}s ease both` }} />
              ))}

              {/* Top LED */}
              <div className="absolute top-0 left-16 right-16 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)' }} />

              <div className={`px-7 pt-8 pb-9 transition-all duration-700 ${visible && !unlocking ? 'opacity-100' : 'opacity-0'}`}>

                {/* Branding */}
                <div className="text-center mb-7">
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative"
                      style={{ border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 0 40px rgba(255,255,255,0.06)' }}>
                      <img src="/logo.png" alt="CNG" className="w-full h-full object-cover rounded-2xl select-none" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background:'#030303', border:'1px solid rgba(255,255,255,0.1)' }}>
                      <div className="w-2 h-2 rounded-full"
                        style={{ background:'rgba(180,255,180,0.9)', boxShadow:'0 0 6px rgba(180,255,180,0.5)', animation:'pgBlink 3s ease-in-out infinite' }} />
                    </div>
                  </div>

                  <h1 className="text-white font-black text-2xl tracking-tight mb-1"
                    style={{ textShadow:'0 0 30px rgba(255,255,255,0.2)', animation:'pgGlitch 7s ease-in-out infinite' }}>
                    Cum&nbsp;'n'&nbsp;<span style={{ color:'rgba(255,255,255,0.4)' }}>Go</span>
                  </h1>

                  <div className="flex items-center gap-3 my-3 mx-4">
                    <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)', animation:'pgLineGrow 0.8s 0.3s ease both', width:0 }} />
                    <span className="text-[9px] font-black tracking-[0.5em] uppercase" style={{ color:'rgba(255,255,255,0.18)' }}>Private</span>
                    <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)', animation:'pgLineGrow 0.8s 0.3s ease both', width:0 }} />
                  </div>
                  <p className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color:'rgba(255,255,255,0.14)' }}>
                    Authorised Access Only
                  </p>
                </div>

                {/* Face ID primary (iOS only, if enrolled) */}
                {hasFaceId && showFaceIdButton && (
                  <>
                    <button onClick={attemptFaceId} disabled={faceIdState === 'loading' || unlocking}
                      className="w-full rounded-2xl font-black text-[13px] tracking-[0.18em] uppercase text-white transition-all duration-300 active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-3 mb-4"
                      style={{
                        height:56,
                        background: faceIdState === 'loading' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.18)',
                        boxShadow: faceIdState === 'loading' ? '0 0 30px rgba(255,255,255,0.08)' : 'none',
                      }}>
                      <Fingerprint className={`w-5 h-5 ${faceIdState === 'loading' ? 'animate-pulse' : ''}`} />
                      {faceIdState === 'loading' ? 'Scanning…' : faceIdState === 'error' ? 'Try again' : 'Unlock with Face ID'}
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
                      <span className="text-[9px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.15)' }}>or enter code</span>
                      <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
                    </div>
                  </>
                )}

                {/* Password input — always visible, no checkbox gate */}
                <div className="relative mb-3">
                  <input
                    ref={inputRef}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && attempt()}
                    placeholder="Enter access code"
                    autoComplete="current-password"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="w-full px-5 pr-12 text-white text-sm outline-none rounded-2xl transition-all"
                    style={{
                      height:52,
                      background:'rgba(255,255,255,0.03)',
                      border: error ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      caretColor:'white',
                      boxShadow: error ? '0 0 20px rgba(255,255,255,0.08)' : 'none',
                      letterSpacing: show ? '0.04em' : '0.15em',
                    }}
                    onFocus={e => {
                      if (!error) {
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.25)'
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.04)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                    onBlur={e => {
                      if (!error) {
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }
                    }}
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity" tabIndex={-1}
                    style={{ color:'rgba(255,255,255,0.22)', opacity: show ? 0.7 : 1 }}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error */}
                <div className={`transition-all duration-200 overflow-hidden ${error ? 'max-h-8 mb-3' : 'max-h-0'}`}>
                  <p className="text-[11px] text-center font-bold tracking-wider" style={{ color:'rgba(255,255,255,0.5)' }}>
                    ✕ &nbsp;Incorrect code
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={attempt}
                  disabled={!value.trim() || unlocking}
                  className="w-full rounded-2xl font-black text-[13px] tracking-[0.22em] uppercase text-black transition-all duration-300 active:scale-[0.97] disabled:opacity-20"
                  style={{
                    height:52,
                    background: unlocking ? 'rgba(255,255,255,0.85)' : '#ffffff',
                    boxShadow: unlocking ? '0 0 50px rgba(255,255,255,0.22)' : '0 0 20px rgba(255,255,255,0.08)',
                    transition:'box-shadow 0.4s ease, background 0.3s ease',
                  }}>
                  {unlocking ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      Entering
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" style={{ animationDelay:'0.25s' }} />
                    </span>
                  ) : 'Enter'}
                </button>

                {/* Face ID setup (iOS, not enrolled) */}
                {showFaceIdButton && !hasFaceId && (
                  <button onClick={attemptFaceId} disabled={faceIdState === 'loading' || unlocking}
                    className="w-full mt-3 rounded-2xl font-bold text-[11px] tracking-widest uppercase transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ height:44, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)' }}>
                    <Fingerprint className="w-4 h-4" />
                    {faceIdState === 'loading' ? 'Setting up…' : 'Set up Face ID'}
                  </button>
                )}

                <p className="text-center text-[8px] tracking-widest uppercase mt-6" style={{ color:'rgba(255,255,255,0.09)' }}>
                  18+ · Adult Content · Private Platform
                </p>
              </div>

              {/* Bottom LED */}
              <div className="absolute bottom-0 left-12 right-12 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)' }} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
