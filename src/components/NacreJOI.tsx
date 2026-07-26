import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Zap, Volume2, VolumeX } from 'lucide-react'

type Pace = 'stop' | 'crawl' | 'slow' | 'medium' | 'fast' | 'pound' | 'edge'

interface Command {
  pace: Pace
  text: string
  subtext?: string
  duration: number // seconds
  canCum?: boolean
}

const PACE_CONFIG: Record<Pace, { label: string; color: string; bg: string; border: string; bpm: number; emoji: string }> = {
  stop:   { label: 'STOP',   color: 'text-white',      bg: 'bg-zinc-900',      border: 'border-white/20',     bpm: 0,   emoji: '✋' },
  crawl:  { label: 'CRAWL',  color: 'text-blue-300',   bg: 'bg-blue-900/20',   border: 'border-blue-500/30',  bpm: 10,  emoji: '🐌' },
  slow:   { label: 'SLOW',   color: 'text-pink-300',   bg: 'bg-pink-900/20',   border: 'border-pink-500/30',  bpm: 25,  emoji: '🌹' },
  medium: { label: 'STEADY', color: 'text-orange-300', bg: 'bg-orange-900/20', border: 'border-orange-500/30',bpm: 50,  emoji: '🔥' },
  fast:   { label: 'FASTER', color: 'text-red-300',    bg: 'bg-red-900/25',    border: 'border-red-500/35',   bpm: 80,  emoji: '⚡' },
  pound:  { label: 'POUND',  color: 'text-purple-300', bg: 'bg-purple-900/30', border: 'border-purple-500/40',bpm: 120, emoji: '💀' },
  edge:   { label: 'EDGE',   color: 'text-rose-300',   bg: 'bg-rose-900/30',   border: 'border-rose-500/40',  bpm: 0,   emoji: '☠️' },
}

const SESSION: Command[] = [
  { pace: 'stop',   text: 'Strip. Completely naked.', subtext: 'She wants you bare before she starts.', duration: 15 },
  { pace: 'crawl',  text: 'Begin. Very slowly.', subtext: 'She\'s watching you warm up.', duration: 30 },
  { pace: 'slow',   text: 'Nice and slow for her.', subtext: 'Don\'t rush. She has all the time she wants.', duration: 40 },
  { pace: 'stop',   text: 'STOP. Hands off.', subtext: 'Count to twenty. Don\'t touch.', duration: 22 },
  { pace: 'slow',   text: 'Back to slow. Just like that.', subtext: 'She decides the pace. Not you.', duration: 35 },
  { pace: 'medium', text: 'Steady now. Feel it build.', subtext: 'Eyes on her. Don\'t look away.', duration: 45 },
  { pace: 'fast',   text: 'Faster. Don\'t you dare stop.', subtext: 'Keep up. She wants to see you struggle.', duration: 30 },
  { pace: 'edge',   text: 'EDGE — STOP NOW.', subtext: 'Right at the limit. Hold it there. Don\'t you dare cum.', duration: 25 },
  { pace: 'crawl',  text: 'Start again. Barely touching.', subtext: 'Good. Now come back down slowly.', duration: 40 },
  { pace: 'medium', text: 'Back to steady. She\'s watching your face.', subtext: 'Think about how she looks at the camera.', duration: 40 },
  { pace: 'fast',   text: 'Faster again. All the way up.', subtext: 'She wants to see you lose control. Don\'t.', duration: 35 },
  { pace: 'pound',  text: 'POUND. Everything you have.', subtext: 'Fast as you can. Don\'t cum. DON\'T.', duration: 20 },
  { pace: 'edge',   text: 'EDGE — STOP. HANDS OFF.', subtext: 'Say her name. Nacre. Out loud.', duration: 30 },
  { pace: 'stop',   text: 'Sit there. Feel it.', subtext: 'She\'s watching you sit in the denial. She loves this.', duration: 30 },
  { pace: 'slow',   text: 'Slowly. Back to her pace.', subtext: 'One more time. She says slow.', duration: 50 },
  { pace: 'medium', text: 'Build it again. Every stroke for her.', subtext: 'You\'re close now. Stay controlled.', duration: 45 },
  { pace: 'fast',   text: 'Faster. Don\'t hold back the pace.', subtext: 'Just the pace. Not the finish. Not yet.', duration: 35 },
  { pace: 'pound',  text: 'FULL PACE. EVERYTHING.', subtext: 'She can see how desperate you are.', duration: 25 },
  { pace: 'edge',   text: 'EDGE. STOP. NOW.', subtext: 'Third edge. Say "I am yours, Nacre." Out loud.', duration: 35 },
  { pace: 'crawl',  text: 'One more time from the beginning.', subtext: 'You built it three times. One final climb.', duration: 30 },
  { pace: 'slow',   text: 'Slow for her.', subtext: 'She\'s deciding whether you\'ve earned it.', duration: 40 },
  { pace: 'medium', text: 'Steady. This is the last build.', subtext: 'Make every stroke count.', duration: 40 },
  { pace: 'fast',   text: 'Faster. She\'s watching.', subtext: 'You\'re going to earn this.', duration: 35 },
  { pace: 'pound',  text: 'POUND. Everything. Right now.', subtext: 'She says go. Don\'t stop until she says.', duration: 30, canCum: true },
]

const CUM_COMMAND: Command = {
  pace: 'pound',
  text: '💦 CUM FOR HER. NOW.',
  subtext: 'Permission granted. Say her name when it happens. NACRE.',
  duration: 60,
  canCum: true,
}

function PaceDial({ pace }: { pace: Pace }) {
  const cfg = PACE_CONFIG[pace]
  const pct = cfg.bpm / 120

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-36 h-36 rounded-full border-4 ${cfg.border} ${cfg.bg} flex items-center justify-center transition-all duration-700`}
        style={{ boxShadow: cfg.bpm > 0 ? `0 0 30px ${cfg.border.replace('border-', '').replace('/40','').replace('/30','').replace('/35','').replace('/20','')}` : 'none' }}
      >
        <div className="text-center">
          <p className="text-4xl mb-1">{cfg.emoji}</p>
          <p className={`text-xs font-black tracking-[0.3em] uppercase ${cfg.color}`}>{cfg.label}</p>
          {cfg.bpm > 0 && <p className="text-[9px] text-zinc-600 mt-0.5">{cfg.bpm} bpm</p>}
        </div>
        {/* Pulsing ring for active pace */}
        {cfg.bpm > 0 && (
          <div
            className={`absolute inset-0 rounded-full border-2 ${cfg.border} opacity-40`}
            style={{ animation: `ping ${60 / cfg.bpm}s cubic-bezier(0, 0, 0.2, 1) infinite` }}
          />
        )}
      </div>
    </div>
  )
}

function CountBar({ total, elapsed }: { total: number; elapsed: number }) {
  const pct = Math.min((elapsed / total) * 100, 100)
  return (
    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function NacreJOI() {
  const [started, setStarted] = useState(false)
  const [cmdIdx, setCmdIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [cumOpen, setCumOpen] = useState(false)
  const [edgeCount, setEdgeCount] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [muted, setMuted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const cmd = cumOpen ? CUM_COMMAND : SESSION[cmdIdx] ?? SESSION[SESSION.length - 1]
  const pace = PACE_CONFIG[cmd.pace]

  // Beat sound using Web Audio API
  const playBeat = useCallback(() => {
    if (muted || cmd.pace === 'stop' || cmd.pace === 'edge') return
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = cmd.pace === 'pound' ? 200 : cmd.pace === 'fast' ? 300 : 400
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {}
  }, [muted, cmd.pace])

  // Beat ticker
  useEffect(() => {
    if (!started || paused || cmd.pace === 'stop' || cmd.pace === 'edge' || PACE_CONFIG[cmd.pace].bpm === 0) return
    const interval = Math.round(60000 / PACE_CONFIG[cmd.pace].bpm)
    const t = setInterval(playBeat, interval)
    return () => clearInterval(t)
  }, [started, paused, cmd.pace, playBeat])

  // Stage timer
  useEffect(() => {
    if (!started || paused || done) return
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        setTotalTime(t => t + 1)
        if (next >= cmd.duration) {
          // advance
          if (cumOpen) { setDone(true); return 0 }
          const nextIdx = cmdIdx + 1
          if (nextIdx >= SESSION.length) {
            setCumOpen(true)
          } else {
            if (SESSION[nextIdx].pace === 'edge') setEdgeCount(c => c + 1)
            setCmdIdx(nextIdx)
          }
          return 0
        }
        return next
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [started, paused, done, cmdIdx, cmd.duration, cumOpen])

  const skipStage = () => {
    if (cumOpen) { setDone(true); return }
    const next = cmdIdx + 1
    if (next >= SESSION.length) { setCumOpen(true) }
    else { if (SESSION[next].pace === 'edge') setEdgeCount(c => c + 1); setCmdIdx(next); setElapsed(0) }
  }

  const reset = () => {
    setCmdIdx(0); setElapsed(0); setPaused(false); setDone(false)
    setCumOpen(false); setEdgeCount(0); setTotalTime(0); setStarted(false)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!started) return (
    <div className="min-h-screen pb-28 flex items-center justify-center">
      <div className="max-w-lg w-full px-4 text-center">
        <div className="relative overflow-hidden bg-zinc-900/80 border border-rose-500/20 rounded-3xl p-8 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950/30 to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-4">✦ Interactive Session ✦</p>
          <h1 className="font-display text-5xl tracking-wider text-white mb-1">NACRE</h1>
          <h2 className="font-display text-3xl bg-gradient-to-r from-rose-200 to-pink-400 bg-clip-text text-transparent mb-6">JOI SESSION</h2>
          <p className="text-zinc-300 text-sm leading-relaxed mb-4">She controls the pace. The speed dial tells you exactly how fast to stroke. Commands appear on screen. You follow them — all of them. You don't cum until she opens the gate.</p>
          <div className="grid grid-cols-3 gap-2 mb-6 text-center">
            {(['stop','slow','medium','fast','pound','edge'] as Pace[]).map(p => (
              <div key={p} className={`rounded-xl border ${PACE_CONFIG[p].border} ${PACE_CONFIG[p].bg} py-2`}>
                <p className="text-base">{PACE_CONFIG[p].emoji}</p>
                <p className={`text-[9px] font-bold uppercase ${PACE_CONFIG[p].color}`}>{PACE_CONFIG[p].label}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-xs mb-6">{SESSION.length} stages · 3 edges · ~{Math.round(SESSION.reduce((a,b)=>a+b.duration,0)/60)} min total</p>
          <button onClick={() => setStarted(true)} className="w-full py-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-lg rounded-2xl hover:bg-rose-500/30 transition-all tracking-wider">
            🌹 START SESSION
          </button>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen pb-28 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">💦</div>
        <h2 className="font-display text-4xl text-white mb-3">DONE</h2>
        <p className="text-rose-300/70 mb-6">She got everything she wanted from you.</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Session time</p>
            <p className="text-2xl font-bold text-white">{fmt(totalTime)}</p>
          </div>
          <div className="bg-zinc-900 border border-rose-500/20 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Edges</p>
            <p className="text-2xl font-bold text-rose-300">{edgeCount}</p>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-2 mx-auto px-6 py-3 bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl text-sm">
          <RotateCcw className="w-4 h-4" /> Run it again
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-2 transition-all ${cumOpen ? 'bg-green-950/95 border-green-500/30' : 'bg-zinc-950/95 border-rose-500/10'}`}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-rose-400/40">Nacre JOI</p>
            <p className="text-xs font-bold text-white">Stage {cumOpen ? 'CUM WINDOW' : `${cmdIdx + 1}/${SESSION.length}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 text-xs">
              <Zap className="w-3 h-3 text-rose-400" /><span className="text-rose-300 font-bold">{edgeCount} edges</span>
            </span>
            <span className="text-zinc-500 text-xs font-mono">{fmt(totalTime)}</span>
            <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500">
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={reset} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-zinc-900">
        <div className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-700"
          style={{ width: `${((cmdIdx) / SESSION.length) * 100}%` }} />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-8 flex flex-col items-center gap-6">
        {/* Pace dial */}
        <PaceDial pace={cmd.pace} />

        {/* Command card */}
        <div className={`w-full rounded-2xl border ${pace.border} ${pace.bg} p-6 text-center transition-all duration-500`}>
          <p className={`text-2xl sm:text-3xl font-black ${pace.color} mb-2 leading-tight`}>{cmd.text}</p>
          {cmd.subtext && <p className="text-zinc-400 text-sm leading-relaxed italic">{cmd.subtext}</p>}
        </div>

        {/* Stage timer bar */}
        <div className="w-full">
          <CountBar total={cmd.duration} elapsed={elapsed} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-600">{elapsed}s</span>
            <span className="text-[10px] text-zinc-600">{cmd.duration}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setPaused(!paused)}
            className="flex-1 h-12 bg-zinc-900 border border-white/8 text-zinc-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
          >
            {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
          </button>
          <button
            onClick={skipStage}
            className="h-12 px-5 bg-zinc-900 border border-white/8 text-zinc-400 rounded-xl hover:bg-zinc-800 transition-all"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Coming up */}
        {!cumOpen && cmdIdx < SESSION.length - 1 && (
          <div className="w-full">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Next</p>
            <div className={`flex items-center gap-3 rounded-xl border ${PACE_CONFIG[SESSION[cmdIdx + 1].pace].border} bg-zinc-900/40 px-4 py-2.5 opacity-50`}>
              <span className="text-lg">{PACE_CONFIG[SESSION[cmdIdx + 1].pace].emoji}</span>
              <div>
                <p className={`text-xs font-bold ${PACE_CONFIG[SESSION[cmdIdx + 1].pace].color}`}>{PACE_CONFIG[SESSION[cmdIdx + 1].pace].label}</p>
                <p className="text-[10px] text-zinc-500">{SESSION[cmdIdx + 1].text}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
