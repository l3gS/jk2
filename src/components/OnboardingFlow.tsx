import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronRight, User, Zap, Video, Archive, Brain, X } from 'lucide-react'

const STORAGE_KEY = 'cng-onboarded-v1'

interface Props {
  authUsername: string | null
  boyName: string
  onSignIn: () => void
  onSetBoyName: (name: string) => void
  onDone: () => void
}

interface Step {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  optional?: boolean
}

const STEPS: Step[] = [
  {
    id: 'account',
    title: 'Create your account',
    subtitle: 'Save your vault, history, and preferences — access from any device.',
    icon: <User size={18} />,
  },
  {
    id: 'profile',
    title: 'Set your display name',
    subtitle: 'How LUNAR calls you. Totally private.',
    icon: <Zap size={18} />,
  },
  {
    id: 'features',
    title: "Discover what's here",
    subtitle: 'A quick look at what the platform can do.',
    icon: <Brain size={18} />,
  },
  {
    id: 'done',
    title: "You're ready",
    subtitle: 'Dive in whenever you want.',
    icon: <Check size={18} />,
  },
]

const FEATURES = [
  {
    icon: <Brain size={20} />,
    label: 'LUNAR AI',
    desc: 'Your personal AI — she finds videos, runs the app, and talks dirty.',
    color: 'rgba(168,85,247,0.9)',
    glow: 'rgba(168,85,247,0.15)',
  },
  {
    icon: <Video size={20} />,
    label: 'Mainframe',
    desc: 'Terminal-style video search across PornHub & xVideos. Voice-controlled.',
    color: 'rgba(56,230,195,0.9)',
    glow: 'rgba(56,230,195,0.1)',
  },
  {
    icon: <Archive size={20} />,
    label: 'Vault',
    desc: 'Save and organise your favourite videos. Synced to your account.',
    color: 'rgba(255,200,80,0.9)',
    glow: 'rgba(255,200,80,0.1)',
  },
  {
    icon: <Zap size={20} />,
    label: 'Live Search',
    desc: 'Real-time content discovery — leaks, X posts, curated galleries.',
    color: 'rgba(255,100,130,0.9)',
    glow: 'rgba(255,100,130,0.1)',
  },
]

export default function OnboardingFlow({ authUsername, boyName, onSignIn, onSetBoyName, onDone }: Props) {
  const [activeStep, setActiveStep] = useState(0)
  const [nameInput, setNameInput] = useState(boyName || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  // Auto-advance account step when user signs in
  useEffect(() => {
    if (authUsername && activeStep === 0) setActiveStep(1)
  }, [authUsername, activeStep])

  const finish = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
      onDone()
    }, 480)
  }, [onDone])

  const completedSteps = new Set<string>()
  if (authUsername) completedSteps.add('account')
  if (nameSaved || (boyName && boyName !== 'Sam' && boyName !== '')) completedSteps.add('profile')

  const stepDone = (id: string) => completedSteps.has(id)
  const isLast = activeStep === STEPS.length - 1

  const handleNameSave = () => {
    const n = nameInput.trim()
    if (!n) return
    onSetBoyName(n)
    setNameSaved(true)
    setTimeout(() => setActiveStep(2), 400)
  }

  return (
    <>
      <style>{`
        @keyframes obIn  { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes obOut { from { opacity:1; transform:none; } to { opacity:0; transform:translateY(-16px) scale(0.98); } }
        @keyframes obScan { 0%{top:-6%;} 100%{top:106%;} }
        @keyframes obPulse { 0%,100%{opacity:0.08;} 50%{opacity:0.22;} }
        @keyframes obSlide { from{opacity:0;transform:translateX(-10px);} to{opacity:1;transform:none;} }
        @keyframes obCheck { from{transform:scale(0) rotate(-20deg);opacity:0;} to{transform:scale(1) rotate(0deg);opacity:1;} }
        @keyframes obDot { 0%,100%{opacity:0.2;transform:scale(0.8);} 50%{opacity:1;transform:scale(1.15);} }
      `}</style>

      <div
        className="fixed inset-0 z-[800] flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(20px)',
          animation: exiting ? 'obOut 0.48s ease forwards' : visible ? 'obIn 0.5s cubic-bezier(0.16,1,0.3,1) both' : 'none',
          opacity: visible ? undefined : 0,
        }}
      >
        {/* Scan line */}
        <div className="absolute left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.018),transparent)', animation: 'obScan 3.5s linear infinite' }} />

        {/* Main panel */}
        <div className="relative w-full max-w-3xl mx-4 rounded-2xl overflow-hidden flex"
          style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', minHeight: 520 }}>

          {/* Corner brackets */}
          {[
            { top:0,left:0, borderTop:'1px solid rgba(255,255,255,0.2)',borderLeft:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px 0 0 0' },
            { top:0,right:0, borderTop:'1px solid rgba(255,255,255,0.2)',borderRight:'1px solid rgba(255,255,255,0.2)', borderRadius:'0 12px 0 0' },
            { bottom:0,left:0, borderBottom:'1px solid rgba(255,255,255,0.2)',borderLeft:'1px solid rgba(255,255,255,0.2)', borderRadius:'0 0 0 12px' },
            { bottom:0,right:0, borderBottom:'1px solid rgba(255,255,255,0.2)',borderRight:'1px solid rgba(255,255,255,0.2)', borderRadius:'0 0 12px 0' },
          ].map((s,i) => <div key={i} className="absolute pointer-events-none" style={{...s,width:20,height:20}} />)}

          {/* ── Left sidebar — steps ── */}
          <div className="shrink-0 w-52 flex flex-col py-8 px-5 gap-1"
            style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Logo area */}
            <div className="mb-6">
              <p className="text-[7px] tracking-[0.6em] uppercase font-bold mb-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
                PRIVATE ACCESS
              </p>
              <h2 className="text-white font-black text-lg tracking-[0.15em] uppercase">CUM 'N' GO</h2>
              <div className="mt-2 flex gap-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className="rounded-full"
                    style={{ width:3,height:3,background:'rgba(255,255,255,0.3)',animation:`obDot 1.2s ${i*0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>

            <p className="text-[8px] tracking-[0.4em] uppercase font-bold mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              GET STARTED
            </p>

            {STEPS.map((step, i) => {
              const done = stepDone(step.id) || (step.id === 'done' && activeStep === 3)
              const active = activeStep === i
              const past = i < activeStep
              return (
                <button
                  key={step.id}
                  onClick={() => (done || past || i <= activeStep) && setActiveStep(i)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    cursor: (done || past || i <= activeStep) ? 'pointer' : 'default',
                    opacity: i > activeStep && !done ? 0.4 : 1,
                  }}
                >
                  {/* Step indicator */}
                  <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: done ? 'rgba(80,220,140,0.15)' : active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      border: done ? '1px solid rgba(80,220,140,0.4)' : active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {done
                      ? <Check size={11} style={{ color: 'rgba(80,220,140,0.9)', animation: 'obCheck 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }} />
                      : <span className="text-[9px] font-bold" style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>{i+1}</span>
                    }
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold leading-tight"
                      style={{ color: active ? 'rgba(255,255,255,0.85)' : done ? 'rgba(80,220,140,0.7)' : 'rgba(255,255,255,0.35)' }}>
                      {step.title}
                    </p>
                    {step.optional && (
                      <p className="text-[8px] tracking-wider uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>optional</p>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Progress bar */}
            <div className="mt-auto pt-6">
              <div className="h-px rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%`, background: 'linear-gradient(to right,rgba(168,85,247,0.7),rgba(56,230,195,0.7))' }} />
              </div>
              <p className="text-[7px] tracking-widest uppercase mt-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
                {activeStep} of {STEPS.length - 1} complete
              </p>
            </div>
          </div>

          {/* ── Right — step content ── */}
          <div className="flex-1 flex flex-col px-10 py-8 relative overflow-hidden">
            {/* Skip / close */}
            <button onClick={finish}
              className="absolute top-5 right-5 opacity-20 hover:opacity-60 transition-opacity"
              title="Skip onboarding">
              <X size={16} style={{ color: 'white' }} />
            </button>

            {/* Radial glow background */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 70% 50% at 60% 40%, rgba(168,85,247,0.04) 0%, transparent 70%)', animation: 'obPulse 3s ease-in-out infinite' }} />

            {/* ────── STEP 0: Account ────── */}
            {activeStep === 0 && (
              <div key="step-account" style={{ animation: 'obSlide 0.35s ease both' }}>
                <div className="mb-6">
                  <p className="text-[8px] tracking-[0.5em] uppercase font-bold mb-2" style={{ color: 'rgba(168,85,247,0.7)' }}>
                    STEP 1 OF 3
                  </p>
                  <h3 className="text-white font-black text-2xl mb-2">Create your account</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Your vault, watch history, and settings stay on your device — but signing up
                    means you can access everything from any device, any time.
                  </p>
                </div>

                {/* Benefits list */}
                <div className="flex flex-col gap-3 mb-8">
                  {[
                    { icon: '🔒', label: 'Private by design', desc: 'No email required. Username + password only.' },
                    { icon: '☁️', label: 'Cross-device sync', desc: 'Your vault follows you anywhere.' },
                    { icon: '⚡', label: 'Personalised experience', desc: 'LUNAR learns what you like.' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-lg shrink-0 mt-0.5">{b.icon}</span>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{b.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onSignIn}
                    className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'rgba(168,85,247,0.9)', color: 'white', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
                    Create Account / Sign In
                  </button>
                  <button onClick={() => setActiveStep(1)}
                    className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Skip for now <ChevronRight size={12} />
                  </button>
                </div>

                {authUsername && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                    style={{ background: 'rgba(80,220,140,0.08)', border: '1px solid rgba(80,220,140,0.2)' }}>
                    <Check size={12} style={{ color: 'rgba(80,220,140,0.8)' }} />
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(80,220,140,0.8)' }}>
                      Signed in as @{authUsername}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ────── STEP 1: Profile ────── */}
            {activeStep === 1 && (
              <div key="step-profile" style={{ animation: 'obSlide 0.35s ease both' }}>
                <div className="mb-6">
                  <p className="text-[8px] tracking-[0.5em] uppercase font-bold mb-2" style={{ color: 'rgba(56,230,195,0.7)' }}>
                    STEP 2 OF 3
                  </p>
                  <h3 className="text-white font-black text-2xl mb-2">What should LUNAR call you?</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    She uses your name in chat, toasts, and greetings. Keep it as private as you like.
                  </p>
                </div>

                <div className="max-w-xs mb-8">
                  <label className="text-[9px] tracking-[0.4em] uppercase font-bold block mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Display name
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                      placeholder="e.g. daddy, king, sir…"
                      autoFocus
                      className="flex-1 bg-transparent rounded-xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.85)',
                        caretColor: 'rgba(56,230,195,0.8)',
                      }}
                    />
                    <button
                      onClick={handleNameSave}
                      disabled={!nameInput.trim()}
                      className="px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all hover:brightness-110 active:scale-95 disabled:opacity-30"
                      style={{ background: 'rgba(56,230,195,0.85)', color: '#020202' }}>
                      Save
                    </button>
                  </div>
                  {nameSaved && (
                    <div className="mt-3 flex items-center gap-2" style={{ animation: 'obCheck 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                      <Check size={12} style={{ color: 'rgba(80,220,140,0.8)' }} />
                      <span className="text-[11px]" style={{ color: 'rgba(80,220,140,0.8)' }}>Saved — LUNAR will call you "{nameInput.trim()}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {nameSaved
                    ? <button onClick={() => setActiveStep(2)}
                        className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'rgba(56,230,195,0.85)', color: '#020202', boxShadow: '0 0 24px rgba(56,230,195,0.25)' }}>
                        Continue <ChevronRight size={14} className="inline ml-1" />
                      </button>
                    : <button onClick={() => setActiveStep(2)}
                        className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase transition-opacity hover:opacity-80"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Skip <ChevronRight size={12} />
                      </button>
                  }
                </div>
              </div>
            )}

            {/* ────── STEP 2: Features ────── */}
            {activeStep === 2 && (
              <div key="step-features" style={{ animation: 'obSlide 0.35s ease both' }}>
                <div className="mb-6">
                  <p className="text-[8px] tracking-[0.5em] uppercase font-bold mb-2" style={{ color: 'rgba(255,200,80,0.7)' }}>
                    STEP 3 OF 3
                  </p>
                  <h3 className="text-white font-black text-2xl mb-2">Here's what you've unlocked</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Everything on this platform is private, encrypted, and built for you.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {FEATURES.map((f, i) => (
                    <div key={i} className="flex flex-col gap-2 px-4 py-4 rounded-xl transition-all"
                      style={{
                        background: `rgba(255,255,255,0.03)`,
                        border: `1px solid ${f.color.replace('0.9', '0.12')}`,
                        boxShadow: `0 0 30px ${f.glow}`,
                        animation: `obSlide 0.3s ${i * 0.07}s ease both`,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: f.glow, border: `1px solid ${f.color.replace('0.9', '0.2')}`, color: f.color }}>
                        {f.icon}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.label}</p>
                        <p className="text-[10px] leading-snug mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setActiveStep(3)}
                  className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'rgba(255,200,80,0.9)', color: '#020202', boxShadow: '0 0 28px rgba(255,200,80,0.2)' }}>
                  Got it — let's go <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            )}

            {/* ────── STEP 3: Done ────── */}
            {activeStep === 3 && (
              <div key="step-done" className="flex flex-col items-center justify-center flex-1 text-center" style={{ animation: 'obSlide 0.35s ease both' }}>
                {/* Big check */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: 'rgba(80,220,140,0.08)',
                    border: '1px solid rgba(80,220,140,0.25)',
                    boxShadow: '0 0 60px rgba(80,220,140,0.12)',
                    animation: 'obCheck 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                  }}>
                  <Check size={36} style={{ color: 'rgba(80,220,140,0.9)' }} />
                </div>

                <h3 className="text-white font-black text-3xl mb-3">
                  {authUsername ? `Welcome, @${authUsername}.` : "You're in."}
                </h3>
                <p className="text-sm leading-relaxed max-w-xs mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  LUNAR is online. Your vault is ready. The spiral starts now.
                </p>

                {/* Summary chips */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {authUsername && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
                      style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: 'rgba(168,85,247,0.8)' }}>
                      ✓ Account created
                    </span>
                  )}
                  {(nameSaved || (boyName && boyName !== 'Sam')) && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
                      style={{ background: 'rgba(56,230,195,0.1)', border: '1px solid rgba(56,230,195,0.22)', color: 'rgba(56,230,195,0.8)' }}>
                      ✓ Name set
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
                    style={{ background: 'rgba(255,200,80,0.1)', border: '1px solid rgba(255,200,80,0.22)', color: 'rgba(255,200,80,0.8)' }}>
                    ✓ Platform ready
                  </span>
                </div>

                <button onClick={finish}
                  className="px-8 py-3.5 rounded-xl font-black text-sm tracking-[0.2em] uppercase transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'white', color: '#020202', boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}>
                  Start Exploring
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export { STORAGE_KEY as ONBOARDING_KEY }
