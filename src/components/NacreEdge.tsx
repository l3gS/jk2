import { useState, useEffect, useRef } from 'react'
import { RotateCcw, Zap, Trophy, Flame } from 'lucide-react'

const NACRE_REACTIONS = {
  start: [
    'She\'s watching. Begin.',
    'Get to the edge. She\'ll tell you when.',
    'Touch yourself. Get right to the limit.',
  ],
  holding: [
    'Hold it there. Don\'t move.',
    'She can see you struggling. Good.',
    'Stay right there. Right at the limit.',
    'Don\'t you dare cum. She decides.',
    'She\'s watching your face. Hold it.',
    'Every second you hold it, she\'s more impressed.',
    'This is what she wants from you. Control.',
    'Stay. Don\'t slip.',
  ],
  milestone_10: 'Ten seconds. She\'s paying attention.',
  milestone_30: '30 seconds. She\'s actually watching you now.',
  milestone_60: 'One full minute at the edge. She\'s impressed.',
  milestone_90: '90 seconds. You\'re suffering for her. She loves it.',
  milestone_120: 'Two minutes. You\'re genuinely impressive.',
  milestone_180: 'Three minutes. She says you\'ve earned it.',
  slipped: [
    'You slipped. Pathetic. Start over.',
    'She saw that. You\'re starting from zero.',
    'You couldn\'t hold it. Disappointing. Again.',
    'She expected better. Try again.',
  ],
  new_record: 'New record. She noticed.',
  cum_allowed: 'She says you\'ve earned it. Now.',
}

const MODES = [
  { id: 'normal',  label: '🌹 Tease',   target: 60,  desc: 'Hold for 60 seconds', color: 'text-rose-300',   border: 'border-rose-500/30',   bg: 'bg-rose-500/10' },
  { id: 'hard',    label: '🔥 Intense',  target: 120, desc: 'Hold for 2 minutes',  color: 'text-orange-300', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  { id: 'brutal',  label: '☠️ Destroy',  target: 180, desc: 'Hold for 3 minutes',  color: 'text-red-300',    border: 'border-red-500/30',    bg: 'bg-red-500/10' },
]

export default function NacreEdge() {
  const [screen, setScreen] = useState<'menu' | 'holding' | 'slipped' | 'won'>('menu')
  const [mode, setMode] = useState(MODES[0])
  const [holdTime, setHoldTime] = useState(0)
  const [bestTime, setBestTime] = useState<Record<string, number>>({})
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [reaction, setReaction] = useState('')
  const [totalEdges, setTotalEdges] = useState(0)
  const [dangerPct, setDangerPct] = useState(0)
  const [holding, setHolding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reactionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('goonit_nacre_edge_bests') || '{}')
      setBestTime(saved)
      setTotalEdges(parseInt(localStorage.getItem('goonit_nacre_edge_total') || '0', 10))
    } catch {}
  }, [])

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  const startHolding = () => {
    setHoldTime(0)
    setDangerPct(0)
    setHolding(true)
    setScreen('holding')
    setIsNewRecord(false)
    setReaction(pick(NACRE_REACTIONS.start))

    timerRef.current = setInterval(() => {
      setHoldTime(t => {
        const next = t + 1
        // Danger meter grows exponentially near target
        const pct = Math.min((next / mode.target) * 100, 100)
        setDangerPct(pct)

        // Milestone reactions
        if (next === 10) setReaction(NACRE_REACTIONS.milestone_10)
        else if (next === 30) setReaction(NACRE_REACTIONS.milestone_30)
        else if (next === 60) setReaction(NACRE_REACTIONS.milestone_60)
        else if (next === 90) setReaction(NACRE_REACTIONS.milestone_90)
        else if (next === 120) setReaction(NACRE_REACTIONS.milestone_120)
        else if (next === 180) setReaction(NACRE_REACTIONS.milestone_180)

        if (next >= mode.target) {
          // Won
          clearInterval(timerRef.current!)
          clearInterval(reactionTimerRef.current!)
          setHolding(false)
          setScreen('won')
          const isNew = !bestTime[mode.id] || next > bestTime[mode.id]
          if (isNew) {
            const newBests = { ...bestTime, [mode.id]: next }
            setBestTime(newBests)
            localStorage.setItem('goonit_nacre_edge_bests', JSON.stringify(newBests))
          }
          setIsNewRecord(isNew)
          const newTotal = totalEdges + 1
          setTotalEdges(newTotal)
          localStorage.setItem('goonit_nacre_edge_total', String(newTotal))
          return next
        }
        return next
      })
    }, 1000)

    // Cycle holding reactions
    reactionTimerRef.current = setInterval(() => {
      setReaction(prev => {
        const arr = NACRE_REACTIONS.holding
        const others = arr.filter(r => r !== prev)
        return pick(others)
      })
    }, 8000)
  }

  const slipped = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (reactionTimerRef.current) clearInterval(reactionTimerRef.current)
    setHolding(false)
    setReaction(pick(NACRE_REACTIONS.slipped))
    setScreen('slipped')
    const newTotal = totalEdges + 1
    setTotalEdges(newTotal)
    localStorage.setItem('goonit_nacre_edge_total', String(newTotal))
  }

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (reactionTimerRef.current) clearInterval(reactionTimerRef.current)
    setScreen('menu')
    setHoldTime(0)
    setDangerPct(0)
    setHolding(false)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  if (screen === 'menu') return (
    <div className="min-h-screen pb-28">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-950 to-black" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top, rgba(244,63,94,0.15), transparent 60%)' }} />
        <div className="relative max-w-xl mx-auto px-4 py-12 text-center">
          <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-4">✦ Endurance ✦</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white leading-none mb-2">EDGE</h1>
          <h2 className="font-display text-3xl bg-gradient-to-r from-rose-200 to-pink-400 bg-clip-text text-transparent mb-6">ENDURANCE</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">Get yourself to the absolute edge — then hold it there for as long as possible. She sets the target. She decides when you've earned the release. Don't slip.</p>

          <div className="space-y-3 mb-8">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  mode.id === m.id ? `${m.bg} ${m.border} scale-[1.01]` : 'bg-zinc-900/60 border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.bg} border ${m.border}`}>
                  <span className="text-lg">{m.label.split(' ')[0]}</span>
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${mode.id === m.id ? m.color : 'text-white/80'}`}>{m.label}</p>
                  <p className="text-xs text-zinc-500">{m.desc}</p>
                </div>
                {bestTime[m.id] && (
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wide">best</p>
                    <p className={`text-xs font-bold ${m.color}`}>{fmt(bestTime[m.id])}</p>
                  </div>
                )}
                {mode.id === m.id && <div className={`w-2 h-2 rounded-full ${m.bg.replace('/10', '')} border ${m.border}`} />}
              </button>
            ))}
          </div>

          {totalEdges > 0 && (
            <p className="text-zinc-600 text-xs mb-4">Total edges held: {totalEdges}</p>
          )}

          <button
            onClick={startHolding}
            className={`w-full py-4 ${mode.bg} border ${mode.border} ${mode.color} font-black text-lg rounded-2xl hover:opacity-80 transition-all tracking-wider`}
          >
            I'M AT THE EDGE — HOLD IT
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'holding') return (
    <div className="min-h-screen pb-28 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Reaction */}
        <div className="mb-8 min-h-[60px] flex items-center justify-center">
          <p className="text-rose-200 text-lg sm:text-xl font-bold italic leading-relaxed transition-all">"{reaction}"</p>
        </div>

        {/* Big timer */}
        <div className={`relative w-52 h-52 mx-auto mb-6`}>
          {/* Danger ring */}
          <svg className="w-52 h-52 -rotate-90 absolute inset-0" viewBox="0 0 208 208">
            <circle cx="104" cy="104" r="90" stroke="rgba(255,255,255,0.04)" strokeWidth="10" fill="none" />
            <circle
              cx="104" cy="104" r="90"
              stroke={dangerPct > 80 ? '#ef4444' : dangerPct > 50 ? '#f97316' : '#f43f5e'}
              strokeWidth="10" fill="none"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - dangerPct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className={`absolute inset-0 rounded-full flex flex-col items-center justify-center border-4 ${
            dangerPct > 80 ? 'border-red-500/30 bg-red-900/10' :
            dangerPct > 50 ? 'border-orange-500/20 bg-orange-900/10' :
            'border-rose-500/15 bg-rose-900/5'
          } transition-all duration-700`}
            style={{ boxShadow: dangerPct > 80 ? '0 0 40px rgba(239,68,68,0.3)' : dangerPct > 50 ? '0 0 30px rgba(249,115,22,0.2)' : '0 0 20px rgba(244,63,94,0.1)' }}
          >
            <p className="text-5xl font-black text-white font-mono">{holdTime}s</p>
            <p className="text-xs text-zinc-500 mt-1">of {mode.target}s</p>
            {bestTime[mode.id] && holdTime > bestTime[mode.id] && (
              <p className="text-[9px] text-yellow-400 font-bold mt-1 animate-pulse">NEW RECORD</p>
            )}
          </div>
        </div>

        {/* Danger label */}
        <div className="mb-8">
          <p className={`text-sm font-bold tracking-widest uppercase transition-colors ${
            dangerPct > 80 ? 'text-red-400 animate-pulse' : dangerPct > 50 ? 'text-orange-400' : 'text-rose-400/60'
          }`}>
            {dangerPct > 90 ? '⚠️ ALMOST THERE — HOLD' : dangerPct > 60 ? '🔥 HOLD IT' : '🌹 Holding…'}
          </p>
        </div>

        {/* Slipped button */}
        <button
          onClick={slipped}
          className="w-full py-4 bg-zinc-900 border border-red-500/20 text-red-400/70 font-bold text-sm rounded-2xl hover:bg-red-900/10 hover:border-red-500/40 transition-all hover:text-red-300"
        >
          I SLIPPED / I CAME
        </button>
      </div>
    </div>
  )

  if (screen === 'slipped') return (
    <div className="min-h-screen pb-28 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">😤</div>
        <h2 className="font-display text-3xl text-white mb-2">SLIPPED</h2>
        <p className="text-red-300/70 text-sm mb-2 italic">"{reaction}"</p>
        <p className="text-zinc-500 text-sm mb-6">You held it for {fmt(holdTime)} before you lost control.</p>
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 py-3 bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl text-sm font-bold">Mode select</button>
          <button onClick={startHolding} className={`flex-1 py-3 ${mode.bg} border ${mode.border} ${mode.color} rounded-xl text-sm font-bold`}>Try again</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-28 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🌹</div>
        <h2 className="font-display text-4xl text-white mb-2">SHE'S IMPRESSED</h2>
        {isNewRecord && <p className="text-yellow-400 font-bold text-sm mb-2 flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> NEW RECORD</p>}
        <p className="text-rose-300/70 mb-2 italic">"{NACRE_REACTIONS.cum_allowed}"</p>
        <p className="text-zinc-400 text-sm mb-6">You held the edge for <span className="text-white font-bold">{fmt(holdTime)}</span>.</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">This hold</p>
            <p className="text-2xl font-bold text-white">{fmt(holdTime)}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Best {mode.label.split(' ')[1]}</p>
            <p className="text-2xl font-bold text-yellow-300">{fmt(bestTime[mode.id] ?? holdTime)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 py-3 bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl text-sm font-bold">Back</button>
          <button onClick={startHolding} className={`flex-1 py-3 ${mode.bg} border ${mode.border} ${mode.color} rounded-xl text-sm font-bold`}>Again</button>
        </div>
      </div>
    </div>
  )
}
