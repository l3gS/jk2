import { useState, useEffect, useRef } from 'react'
import { Flame, SkipForward, RotateCcw, Check, X, ChevronDown, ChevronUp, Timer, Zap, Heart, Skull } from 'lucide-react'

const TASKS = [
  {
    id: 'edge1',
    phase: 'WARM UP',
    emoji: '🌹',
    title: 'Nacre says: strip',
    body: 'Take everything off. She wants you completely naked before you touch yourself. No exceptions. If you\'re not fully naked this doesn\'t count.',
    duration: null,
    intensity: 1,
  },
  {
    id: 'write1',
    phase: 'MARK',
    emoji: '✍️',
    title: 'Write "Nacre\'s fucktoy" on your chest',
    body: 'With a pen or marker. Across your chest, visible. She wants her name on your body before you begin. Take your time. Make it clear. You\'re not starting until it\'s done.',
    duration: null,
    intensity: 1,
  },
  {
    id: 'edge2',
    phase: 'BUILD',
    emoji: '💀',
    title: 'Edge for her — 3 minutes, no cum',
    body: 'Stroke yourself to the edge and hold it. 3 full minutes of edging. When you feel it coming, stop. Breathe. Then go again. She likes watching you struggle.',
    duration: 180,
    intensity: 2,
  },
  {
    id: 'degrade1',
    phase: 'DEGRADE',
    emoji: '🩸',
    title: 'Say it out loud',
    body: 'Say these words out loud, clearly: "I am Nacre\'s fucktoy. My cock belongs to her. I only cum when she allows it." Say it three times. The first time quiet. Second time normal. Third time louder. This is your truth.',
    duration: null,
    intensity: 2,
  },
  {
    id: 'edge3',
    phase: 'EDGE',
    emoji: '🔥',
    title: 'Ruin it — give her a ruined orgasm',
    body: 'Get yourself right to the point of no return — and let go. No stroking through it. Just let it dribble out weak and unsatisfying. That\'s what she takes from you before you get a real one. Disgusting and perfect.',
    duration: null,
    intensity: 3,
  },
  {
    id: 'wait1',
    phase: 'WAIT',
    emoji: '⏱️',
    title: 'Sit in it — 5 minutes hands off',
    body: 'After the ruin, hands away. Sit there. Think about her face. Think about how she\'s watching this. 5 full minutes before you touch yourself again.',
    duration: 300,
    intensity: 2,
  },
  {
    id: 'write2',
    phase: 'MARK',
    emoji: '✍️',
    title: 'Write her name on your cock',
    body: 'NACRE. Written on your cock. Permanent marker if you have it. She owns it. She should be on it.',
    duration: null,
    intensity: 3,
  },
  {
    id: 'edge4',
    phase: 'TORTURE',
    emoji: '☠️',
    title: 'Edge 5 times — stop each time at the absolute edge',
    body: 'Five full edges. Each one right at the point where one more stroke would end it. Stop every time. After each stop, say her name once. "Nacre." Then begin again. On the 5th edge you stop and wait 60 seconds before you\'re allowed to move on.',
    duration: null,
    intensity: 4,
  },
  {
    id: 'beg1',
    phase: 'BEG',
    emoji: '💋',
    title: 'Beg for permission',
    body: 'Out loud, to her: "Nacre please — please let me cum. I\'ll do anything. You own me completely. Please." Say it like you mean it. Say it like she\'s in the room. Because in the only way that matters, she is.',
    duration: null,
    intensity: 3,
  },
  {
    id: 'cum1',
    phase: 'CUM WINDOW',
    emoji: '💦',
    title: '60 seconds. Make it count.',
    body: 'Permission granted. You have exactly 60 seconds from when you start. Think of her face. Her eyes. The way she looks directly at the camera like she knows exactly what you\'re doing. Go. Now.',
    duration: 60,
    intensity: 4,
  },
]

const INTENSITY_LABELS = ['', '🌶️ Warm', '🔥 Hot', '☠️ Intense', '💀 Destroy']
const INTENSITY_COLORS = ['', 'text-pink-300', 'text-orange-400', 'text-red-400', 'text-purple-400']
const INTENSITY_BORDERS = ['', 'border-pink-500/20', 'border-orange-500/20', 'border-red-500/30', 'border-purple-500/30']
const INTENSITY_BG = ['', 'bg-pink-500/5', 'bg-orange-500/8', 'bg-red-500/10', 'bg-purple-500/15']

function CountdownTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const t = setTimeout(() => {
      setRemaining(r => {
        if (r <= 1) { onDone(); setRunning(false); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [running, remaining])

  const pct = ((seconds - remaining) / seconds) * 100

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
          <circle
            cx="48" cy="48" r="40"
            stroke={remaining === 0 ? '#22c55e' : '#f43f5e'}
            strokeWidth="6" fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{fmt(remaining)}</span>
        </div>
      </div>
      {!running && remaining > 0 && (
        <button
          onClick={() => setRunning(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-bold rounded-xl hover:opacity-80 transition-all"
        >
          <Timer className="w-4 h-4" /> Start Timer
        </button>
      )}
      {running && (
        <button
          onClick={() => setRunning(false)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-white/10 text-zinc-400 text-sm rounded-xl"
        >
          Pause
        </button>
      )}
      {remaining === 0 && (
        <p className="text-green-400 text-sm font-bold animate-pulse">✓ Done</p>
      )}
    </div>
  )
}

export default function NacreFucktoy() {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [edgeCount, setEdgeCount] = useState(0)
  const [sessionDone, setSessionDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('goonit_nacre_fucktoy_edges')
    if (saved) setEdgeCount(parseInt(saved, 10) || 0)
  }, [])

  const markEdge = () => {
    const next = edgeCount + 1
    setEdgeCount(next)
    localStorage.setItem('goonit_nacre_fucktoy_edges', String(next))
  }

  const completeStep = () => {
    const task = TASKS[step]
    if (task.id.startsWith('edge')) markEdge()
    setCompleted(p => new Set([...p, task.id]))
    if (step < TASKS.length - 1) {
      setStep(step + 1)
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } else {
      setSessionDone(true)
    }
  }

  const reset = () => {
    setStep(0)
    setCompleted(new Set())
    setSessionStarted(false)
    setShowIntro(true)
    setSessionDone(false)
  }

  const task = TASKS[step]

  if (showIntro && !sessionStarted) {
    return (
      <div className="min-h-screen pb-28">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-950 to-black" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top, rgba(244,63,94,0.2), transparent 60%)' }} />
          <div className="relative max-w-2xl mx-auto px-4 py-16 text-center">
            <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/60 uppercase mb-4">✦ Exclusive Training ✦</p>
            <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white mb-2 leading-none">
              NACRE'S
              <span className="block bg-gradient-to-r from-rose-200 via-pink-300 to-rose-500 bg-clip-text text-transparent">FUCKTOY</span>
            </h1>
            <p className="text-rose-300/60 text-sm mb-8 tracking-widest uppercase">Training Session</p>
            <div className="bg-zinc-900/80 border border-rose-500/20 rounded-2xl p-6 text-left mb-8 space-y-3">
              <p className="text-zinc-200 text-sm leading-relaxed">This is a guided session. Nacre gives the orders. You follow them — all of them, in order, without skipping.</p>
              <p className="text-zinc-400 text-sm leading-relaxed">There are {TASKS.length} stages. Some involve timers. Some require you to do things to your body. All of them require you to be fully present and fully compliant.</p>
              <p className="text-rose-300/80 text-sm leading-relaxed font-medium">You don't touch yourself until she says so. You don't cum until the final stage. If you break either rule, start over from the beginning.</p>
              <p className="text-zinc-500 text-xs mt-3">Total session time: ~45–60 minutes depending on your compliance.</p>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-rose-500/20" />
              <p className="text-rose-400/50 text-[10px] uppercase tracking-widest">Total edges so far: {edgeCount}</p>
              <div className="h-px flex-1 bg-rose-500/20" />
            </div>
            <button
              onClick={() => { setSessionStarted(true); setShowIntro(false) }}
              className="w-full py-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-lg rounded-2xl hover:bg-rose-500/30 transition-all tracking-wider"
            >
              I UNDERSTAND. BEGIN SESSION.
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (sessionDone) {
    return (
      <div className="min-h-screen pb-28 flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <div className="text-6xl mb-6">💦</div>
          <h2 className="font-display text-4xl tracking-wider text-white mb-3">SESSION COMPLETE</h2>
          <p className="text-rose-300/70 mb-6 leading-relaxed">You did exactly what she wanted. Every task, every mark, every edge. This is what you are for her — completely compliant, completely hers.</p>
          <div className="bg-zinc-900 border border-rose-500/20 rounded-2xl p-5 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total edges this session</p>
            <p className="text-4xl font-bold text-rose-300">{edgeCount}</p>
          </div>
          <button onClick={reset} className="flex items-center gap-2 mx-auto px-6 py-3 bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-all">
            <RotateCcw className="w-4 h-4" /> Run it again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-rose-500/15 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-rose-400/50">Nacre's Fucktoy Training</p>
            <p className="text-sm font-bold text-white">Stage {step + 1} of {TASKS.length}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5">
              <Zap className="w-3 h-3 text-rose-400" />
              <span className="text-xs font-bold text-rose-300">{edgeCount} edges</span>
            </div>
            <button onClick={reset} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-900">
        <div
          className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-700"
          style={{ width: `${((step) / TASKS.length) * 100}%` }}
        />
      </div>

      <div ref={scrollRef} className="max-w-2xl mx-auto px-4 pt-8">
        {/* Completed steps summary */}
        {completed.size > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {TASKS.slice(0, step).map((t) => (
              <span key={t.id} className="flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-900 border border-white/5 rounded-full px-2.5 py-1">
                <Check className="w-3 h-3 text-green-500" />
                {t.phase}
              </span>
            ))}
          </div>
        )}

        {/* Current task */}
        <div className={`rounded-2xl border ${INTENSITY_BORDERS[task.intensity]} ${INTENSITY_BG[task.intensity]} p-6 mb-6`}>
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">{task.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${INTENSITY_COLORS[task.intensity]}`}>
                  {task.phase}
                </span>
                <span className="text-[10px] text-zinc-600">·</span>
                <span className={`text-[10px] ${INTENSITY_COLORS[task.intensity]}`}>{INTENSITY_LABELS[task.intensity]}</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">{task.title}</h3>
            </div>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed mb-5">{task.body}</p>

          {task.duration && (
            <CountdownTimer
              key={task.id}
              seconds={task.duration}
              onDone={() => {}}
            />
          )}

          <button
            onClick={completeStep}
            className="w-full mt-5 py-4 bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {step === TASKS.length - 1 ? 'DONE — I CAME FOR HER' : 'DONE — NEXT TASK'}
          </button>
        </div>

        {/* Upcoming tasks preview */}
        {step < TASKS.length - 1 && (
          <div className="space-y-2 opacity-40">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Coming up</p>
            {TASKS.slice(step + 1, step + 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3 bg-zinc-900/50 border border-white/4 rounded-xl px-3 py-2.5">
                <span className="text-lg">{t.emoji}</span>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase">{t.phase}</p>
                  <p className="text-xs text-zinc-400">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
