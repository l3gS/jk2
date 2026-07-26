import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Zap, Flame, Skull, Crown, ChevronRight, Volume2, X, RefreshCw, Timer, AlertTriangle } from 'lucide-react'

// ─── Task bank ────────────────────────────────────────────────────────────────
interface Task {
  id: string
  text: string
  category: string
  intensity: 1 | 2 | 3 | 4 | 5
  duration?: number
}

const TASKS: Task[] = [
  // ── SPIT & DROOL ──────────────────────────────────────────────
  { id: 's1', category: 'SPIT', intensity: 2, duration: 60, text: 'Spit directly onto the head. Work it in slowly with just two fingers. Keep adding spit every 20 seconds.' },
  { id: 's2', category: 'SPIT', intensity: 3, duration: 90, text: 'Drool a thick string onto your frenulum. Let it drip. Stroke through it slowly, no wiping allowed.' },
  { id: 's3', category: 'SPIT', intensity: 3, duration: 60, text: 'Fill your palm with spit. Slap it against your cock twice. Then stroke messy and loud — it has to make sound.' },
  { id: 's4', category: 'SPIT', intensity: 4, duration: 120, text: 'Spit every 10 strokes without stopping. If it dries out between, you failed. Keep it dripping soaked.' },
  { id: 's5', category: 'SPIT', intensity: 2, duration: 45, text: 'Coat just the head in spit. Rub the tip only with your wet palm in circles for the full duration.' },

  // ── FRENULUM TORTURE ──────────────────────────────────────────
  { id: 'f1', category: 'FRENULUM', intensity: 3, duration: 90, text: 'Thumb circles directly on your frenulum only. No shaft contact. Slow and deliberate. 90 seconds.' },
  { id: 'f2', category: 'FRENULUM', intensity: 4, duration: 60, text: 'Pinch your frenulum lightly between two fingers. Roll it. Don\'t stop until you want to beg.' },
  { id: 'f3', category: 'FRENULUM', intensity: 5, duration: 120, text: 'Wet thumb on the frenulum — up-down flicks at varying speed. Start slow, build until you\'re dripping.' },
  { id: 'f4', category: 'FRENULUM', intensity: 3, duration: 60, text: 'Index finger pressed flat against your frenulum. Vibrate your hand. No stroking. Just pressure and trembling.' },
  { id: 'f5', category: 'FRENULUM', intensity: 4, duration: 90, text: 'Two-finger grip just BELOW the head, squeeze and release rhythmically. Concentrate every sensation on that spot.' },

  // ── HEAD FOCUS ────────────────────────────────────────────────
  { id: 'h1', category: 'HEAD', intensity: 3, duration: 60, text: 'Grip just under the crown and twist slowly. Clockwise 30 seconds, counterclockwise 30 seconds. Don\'t move your hand position.' },
  { id: 'h2', category: 'HEAD', intensity: 3, duration: 45, text: 'Thumb only over the urethral slit. Slow circles. Think about how sensitive that spot is. Now press harder.' },
  { id: 'h3', category: 'HEAD', intensity: 4, duration: 60, text: 'Wet palm pressed flat over the glans. Rotate. Hold the shaft with the other hand so only the head gets stimulation.' },
  { id: 'h4', category: 'HEAD', intensity: 2, duration: 30, text: 'Just the tip, two-finger squeeze on the crown. Hold. Count to 10. Release. Repeat 3 times.' },
  { id: 'h5', category: 'HEAD', intensity: 5, duration: 90, text: 'Thumb on frenulum, fingers curled over the head, light squeeze. Every 15 seconds tighten your grip slightly. By 90s your knuckles should be white.' },

  // ── SLAP & HUMILIATION ────────────────────────────────────────
  { id: 'sl1', category: 'SLAP', intensity: 3, duration: 30, text: 'Five hard slaps against your palm. Say "pathetic" after each one. Then stroke yourself and admit you loved it.' },
  { id: 'sl2', category: 'SLAP', intensity: 4, duration: 45, text: 'Slap your cock against your stomach repeatedly. Call yourself a dirty little stroke-addict out loud. Keep going.' },
  { id: 'sl3', category: 'SLAP', intensity: 3, duration: 30, text: 'Give yourself 10 punishment slaps. Each one harder than the last. Count them. Thank yourself after each one.' },
  { id: 'sl4', category: 'SLAP', intensity: 4, duration: 20, text: 'Three quick slaps directly on the head. Then lick your palm and stroke slowly for 30 seconds. Reward earned.' },
  { id: 'sl5', category: 'SLAP', intensity: 5, duration: 60, text: 'Alternate: 5 hard slaps, then 20 seconds of desperate fast stroking. Repeat for the full minute. You\'re a cock-slapping machine.' },

  // ── RUINED EDGES ──────────────────────────────────────────────
  { id: 'r1', category: 'RUIN', intensity: 4, duration: 0, text: 'Get yourself to the absolute edge. The exact moment you feel it start to tip — release everything. No touching while it drips.' },
  { id: 'r2', category: 'RUIN', intensity: 5, duration: 0, text: 'Edge until you\'re twitching. Let go and watch yourself ruin it. You don\'t get a proper orgasm today. Ruin it and start again.' },
  { id: 'r3', category: 'RUIN', intensity: 4, duration: 0, text: 'Get to the point of no return. Open your hand flat. Let gravity ruin it. Collect yourself. You\'re doing it again.' },
  { id: 'r4', category: 'RUIN', intensity: 5, duration: 0, text: 'Full-speed stroke to the very edge. The second you tip — slap yourself. Keep twitching through the ruin. Every drop earned by your own hand.' },

  // ── MESSY STROKE TASKS ────────────────────────────────────────
  { id: 'm1', category: 'MESSY', intensity: 2, duration: 90, text: 'Make it loud. Every stroke has to make a wet sound or you\'re not using enough spit. If it goes quiet, stop and reload.' },
  { id: 'm2', category: 'MESSY', intensity: 3, duration: 60, text: 'Death grip, then immediately loose and sloppy. Alternate every 10 strokes. Messy, desperate, inconsistent — just how you like it.' },
  { id: 'm3', category: 'MESSY', intensity: 2, duration: 60, text: 'No rhythm allowed. Stroke erratically — fast, slow, stop, fast again. Never let yourself settle into a pattern.' },
  { id: 'm4', category: 'MESSY', intensity: 3, duration: 90, text: 'Use both hands. One on the shaft, one cupped over the head. Sloppy and overlapping. It should look and sound disgusting.' },
  { id: 'm5', category: 'MESSY', intensity: 4, duration: 120, text: 'Stroke with full palm — not just fingers. Wet, sloppy, overhanded. Think about how filthy you look right now. That\'s the point.' },

  // ── STAMINA HELL ──────────────────────────────────────────────
  { id: 'st1', category: 'STAMINA', intensity: 3, duration: 120, text: '20 seconds hard and fast. 10 seconds dead stop. 20 seconds again. Repeat 4 times. No touching during the stops.' },
  { id: 'st2', category: 'STAMINA', intensity: 4, duration: 180, text: 'Stroke slowly — ONE stroke per 3 seconds. For 3 full minutes. You can\'t go faster. The desperation is the point.' },
  { id: 'st3', category: 'STAMINA', intensity: 3, duration: 120, text: 'Build from 1 stroke/sec to maximum speed over 60 seconds. Then immediately back down to 1 stroke/sec. Repeat.' },
  { id: 'st4', category: 'STAMINA', intensity: 5, duration: 300, text: '5 minutes of edging. If you get too close — stop completely. Wait 10 seconds. Resume. The goal is to stay at 90% for the full 5 minutes.' },
  { id: 'st5', category: 'STAMINA', intensity: 4, duration: 240, text: 'Every 30 seconds switch hand position: overhand, underhand, two-finger, full grip. Keep going. 4 minutes. Different sensations every 30 seconds.' },

  // ── SUBMISSION / DEGRADATION ──────────────────────────────────
  { id: 'deg1', category: 'DEGRADE', intensity: 3, duration: 30, text: 'Say out loud: "I\'m a desperate little stroke addict who can\'t control himself." Say it three times. Then keep stroking.' },
  { id: 'deg2', category: 'DEGRADE', intensity: 4, duration: 60, text: 'Tell yourself exactly what you are while stroking. Don\'t stop the strokes, don\'t stop the words. Keep confessing.' },
  { id: 'deg3', category: 'DEGRADE', intensity: 3, duration: 0, text: 'Stop everything. Look down at yourself. Count to 10 slowly. Think about how pathetically horny you are. Then beg yourself for permission to continue.' },
  { id: 'deg4', category: 'DEGRADE', intensity: 5, duration: 120, text: 'Stroke while saying exactly what you want done to you. Out loud. Specific. Detailed. Disgusting. You don\'t get to be vague about it.' },
  { id: 'deg5', category: 'DEGRADE', intensity: 4, duration: 0, text: 'Write down one filthy thing you\'ve been thinking about on your hand. Then use that hand to stroke. You\'re marked by your own depravity.' },

  // ── OVERSTIMULATION ───────────────────────────────────────────
  { id: 'ov1', category: 'OVER-STIM', intensity: 4, duration: 60, text: 'Post-edge: keep stroking for 60 seconds no matter how sensitive it gets. Through the urge to stop. Through the twitching.' },
  { id: 'ov2', category: 'OVER-STIM', intensity: 5, duration: 30, text: 'After coming to the edge, keep going at full speed for 30 more seconds. Force yourself through the wall of sensitivity.' },
  { id: 'ov3', category: 'OVER-STIM', intensity: 4, duration: 45, text: 'Tight grip over the head and pump just the top quarter. Overstimulate that spot specifically. It\'s going to be too much. That\'s the goal.' },

  // ── COCK WORSHIP ──────────────────────────────────────────
  { id: 'cw1', category: 'WORSHIP', intensity: 3, duration: 60, text: 'Look down at your cock. Tell it every filthy thing you want right now. Out loud, specific, disgusting. It\'s in charge. You\'re not.' },
  { id: 'cw2', category: 'WORSHIP', intensity: 4, duration: 90, text: 'Kiss the tip. Lick your palm. Treat it like it\'s the only thing that matters because right now it is. Worship it properly before you stroke.' },
  { id: 'cw3', category: 'WORSHIP', intensity: 3, duration: 0, text: 'Write "good boy" on your thigh. Stroke slow until you feel like you\'ve earned it. You haven\'t. Keep going anyway.' },
  { id: 'cw4', category: 'WORSHIP', intensity: 5, duration: 120, text: 'Edge twice, stopping dead both times. After the second ruin, press your wet palm flat against the tip and hold it there. Count to 30. That\'s your punishment for being this desperate.' },
  { id: 'cw5', category: 'WORSHIP', intensity: 4, duration: 60, text: 'Grip the base. Don\'t move. Just squeeze and feel it throb against your hand. Stay in that place for a full minute without a single stroke.' },

  // ── BODY WRITING ──────────────────────────────────────────
  { id: 'bw1', category: 'BODY WRITE', intensity: 3, duration: 0, text: 'Write "STROKE ADDICT" across your chest. Then look at it while you edge. You can\'t untrue it.' },
  { id: 'bw2', category: 'BODY WRITE', intensity: 4, duration: 0, text: 'Write your worst kink on your palm. Use that hand to finish. No hiding what you are from yourself.' },
  { id: 'bw3', category: 'BODY WRITE', intensity: 5, duration: 0, text: 'Write "RUINED" on your shaft. Now you have to stroke through that word for the rest of the session.' },
  { id: 'bw4', category: 'BODY WRITE', intensity: 3, duration: 0, text: 'Number your thighs: left = edges remaining, right = ruins so far. Update them in real time. You\'re keeping score on yourself.' },

  // ── CHASTITY TEASE ────────────────────────────────────────
  { id: 'ct1', category: 'CHASTITY', intensity: 4, duration: 180, text: 'No touching for 3 full minutes. Sit on your hands if you need to. Watch something. Think about something filthy. Don\'t touch. The desperation is the point.' },
  { id: 'ct2', category: 'CHASTITY', intensity: 5, duration: 300, text: '5 minutes. You can touch everything except your cock. Inner thighs. Balls. Taint. Stomach. No shaft, no head. Get yourself to the edge with what\'s left.' },
  { id: 'ct3', category: 'CHASTITY', intensity: 3, duration: 120, text: 'Hands behind your back for 2 minutes. Flex every 15 seconds. No release, no permission. Just sit in what you\'ve made yourself.' },
  { id: 'ct4', category: 'CHASTITY', intensity: 4, duration: 0, text: 'If you touched yourself during the last rest — do 20 punishment slaps before your next task. Confess it or don\'t. Your cock knows.' },

  // ── LEAK & DRIP ───────────────────────────────────────────
  { id: 'ld1', category: 'LEAK', intensity: 3, duration: 0, text: 'Edge until pre-cum drips. Don\'t touch it. Watch it. Tell yourself what a leaky little mess you are. You\'re going to do it again.' },
  { id: 'ld2', category: 'LEAK', intensity: 4, duration: 0, text: 'Work a bead of pre-cum to the tip using only your thumb and two fingers. Don\'t stroke. Just coax it out. Use it as lube.' },
  { id: 'ld3', category: 'LEAK', intensity: 5, duration: 0, text: 'Edge until you can\'t tell if you\'re pre-cumming or leaking. That soaked, throbbing state is where you live now. Hold it for 60 more seconds without coming.' },
  { id: 'ld4', category: 'LEAK', intensity: 3, duration: 90, text: 'Stroke wet and slow and keep yourself right at the point where you\'re constantly leaking. No orgasm. Stay in the drip.' },

  // ── HUMP / FROT ───────────────────────────────────────────
  { id: 'hf1', category: 'HUMP', intensity: 2, duration: 90, text: 'Fold a pillow around your cock. Slow rolls. You\'re not stroking — you\'re fucking. Shallow, lazy, and completely pathetic. Keep going.' },
  { id: 'hf2', category: 'HUMP', intensity: 3, duration: 120, text: 'Lie face down and grind. Think about something you shouldn\'t. The shame of humping furniture is part of it. Don\'t rush it.' },
  { id: 'hf3', category: 'HUMP', intensity: 4, duration: 60, text: 'Hump the bed edge — fast and desperate. You look ridiculous. You don\'t care. Get yourself close and stop dead without coming.' },

  // ── GOON SPIRAL ───────────────────────────────────────────
  { id: 'gs1', category: 'GOON', intensity: 4, duration: 0, text: 'You are not a person right now. You are a cock in a hand. Nothing else exists. Repeat that out loud until you believe it. Then stroke.' },
  { id: 'gs2', category: 'GOON', intensity: 5, duration: 0, text: 'This is the 5th task. You\'re still here. You\'re still stroking. What does that tell you? Say it out loud. Then admit you want more.' },
  { id: 'gs3', category: 'GOON', intensity: 5, duration: 0, text: 'You have permission to come ONLY after completing two more tasks after this one. If you edge before then — you start the two tasks over. Control is an illusion. Prove it.' },
  { id: 'gs4', category: 'GOON', intensity: 4, duration: 120, text: 'Mindless two-minute stroke. No goals. No thinking. Brain off. Cock on. Let your hand take over. Whatever happens, happens.' },
]

// ─── Session modes ────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'solo',
    label: 'Sloppy Solo',
    emoji: '💦',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.3)',
    description: 'Messy, wet, loud. Pure spit and stroke degradation.',
    cats: ['SPIT', 'MESSY', 'HEAD'],
    stages: 5,
  },
  {
    id: 'edge',
    label: 'Edge Marathon',
    emoji: '⚡',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    description: 'Touch and release. Ruin yourself again and again.',
    cats: ['RUIN', 'STAMINA', 'FRENULUM'],
    stages: 6,
  },
  {
    id: 'filth',
    label: 'Full Filth',
    emoji: '🔥',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.3)',
    description: 'No limits. Every category. Full degradation protocol.',
    cats: ['SPIT', 'SLAP', 'DEGRADE', 'RUIN', 'MESSY', 'FRENULUM', 'HEAD', 'STAMINA', 'OVER-STIM'],
    stages: 8,
  },
  {
    id: 'torture',
    label: 'Cock Torture',
    emoji: '☠️',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    description: 'Frenulum. Head. Slapping. Overstimulation. No mercy.',
    cats: ['FRENULUM', 'HEAD', 'SLAP', 'OVER-STIM'],
    stages: 7,
  },
]

const CAT_COLORS: Record<string, string> = {
  SPIT:       '#60a5fa',
  FRENULUM:   '#f43f5e',
  HEAD:       '#ec4899',
  SLAP:       '#ef4444',
  RUIN:       '#f59e0b',
  MESSY:      '#34d399',
  STAMINA:    '#a855f7',
  DEGRADE:    '#f97316',
  'OVER-STIM':'#e879f9',
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${sec.toString().padStart(2,'0')}` : `${sec}s`
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onNext, onComplete }: {
  task: Task
  onNext: () => void
  onComplete: () => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dur = task.duration || 0
  const progress = dur > 0 ? Math.min(1, elapsed / dur) : 0

  useEffect(() => {
    setElapsed(0); setRunning(false); setDone(false)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [task.id])

  function toggleTimer() {
    if (done) return
    if (running) {
      clearInterval(timerRef.current!)
      setRunning(false)
    } else {
      setRunning(true)
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (dur > 0 && e + 1 >= dur) {
            clearInterval(timerRef.current!)
            setRunning(false)
            setDone(true)
            return dur
          }
          return e + 1
        })
      }, 1000)
    }
  }

  const color = CAT_COLORS[task.category] || '#f43f5e'

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}30`, backdropFilter: 'blur(20px)' }}>

      {/* Category pill */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
          style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
          {task.category}
        </span>
        <div className="flex gap-1">
          {'★'.repeat(task.intensity).split('').map((_, i) => (
            <span key={i} className="text-xs" style={{ color: i < task.intensity ? color : 'rgba(255,255,255,0.15)' }}>★</span>
          ))}
        </div>
      </div>

      {/* Task text */}
      <p className="text-white text-base leading-relaxed font-medium">{task.text}</p>

      {/* Timer */}
      {dur > 0 && (
        <div className="flex flex-col gap-2">
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: done ? '#22c55e' : color }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono" style={{ color: done ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>
              {done ? '✓ COMPLETE' : `${fmtTime(elapsed)} / ${fmtTime(dur)}`}
            </span>
            <button onClick={toggleTimer}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              style={{ background: running ? color + '30' : color + '20', color, border: `1px solid ${color}40` }}>
              {running ? <><Pause size={11}/> Pause</> : done ? <>✓ Done</> : <><Play size={11}/> Start</>}
            </button>
          </div>
        </div>
      )}

      {/* Done state for no-timer tasks */}
      {dur === 0 && !done && (
        <button onClick={() => setDone(true)}
          className="w-full py-2 rounded-xl text-sm font-black transition-all"
          style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
          I did it — mark complete
        </button>
      )}

      {/* Next / actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onNext}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-all">
          <RefreshCw size={13}/> Skip
        </button>
        <button onClick={onComplete}
          disabled={dur > 0 && !done}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-30"
          style={{ background: done || dur === 0 ? color + '25' : 'rgba(255,255,255,0.05)', color: done || dur === 0 ? color : 'rgba(255,255,255,0.4)', border: `1px solid ${done || dur === 0 ? color + '40' : 'rgba(255,255,255,0.08)'}` }}>
          Next Task <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SloppyCockSession() {
  const [phase, setPhase] = useState<'select' | 'session' | 'result'>('select')
  const [mode, setMode] = useState<typeof MODES[0] | null>(null)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskHistory, setTaskHistory] = useState<Task[]>([])
  const [stage, setStage] = useState(0)
  const [edges, setEdges] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRunning) {
      sessionTimerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000)
    } else {
      clearInterval(sessionTimerRef.current!)
    }
    return () => clearInterval(sessionTimerRef.current!)
  }, [timerRunning])

  function startSession(m: typeof MODES[0]) {
    setMode(m)
    setPhase('session')
    setStage(0)
    setEdges(0)
    setSessionTime(0)
    setTaskHistory([])
    setTimerRunning(true)
    pickNextTask(m, [])
  }

  function pickNextTask(m: typeof MODES[0], history: Task[]) {
    const pool = TASKS.filter(t => m.cats.includes(t.category))
    const recent = history.slice(-3).map(h => h.id)
    const fresh = pool.filter(t => !recent.includes(t.id))
    const task = pickRandom(fresh.length > 0 ? fresh : pool)
    setCurrentTask(task)
  }

  function handleNextTask() {
    if (!mode) return
    pickNextTask(mode, [...taskHistory, currentTask!])
  }

  function handleCompleteTask() {
    if (!mode || !currentTask) return
    const newHistory = [...taskHistory, currentTask]
    setTaskHistory(newHistory)
    const newStage = stage + 1
    setStage(newStage)
    if (newStage >= mode.stages) {
      setTimerRunning(false)
      // Save session to localStorage activity log
      try {
        const prev = JSON.parse(localStorage.getItem('goonit-sessions') || '[]')
        const entry = {
          id: Date.now(),
          ts: new Date().toISOString(),
          mode: mode.label,
          emoji: mode.emoji,
          stages: newStage,
          edges,
          durationSec: sessionTime,
          cats: mode.cats,
        }
        const updated = [entry, ...prev].slice(0, 50)
        localStorage.setItem('goonit-sessions', JSON.stringify(updated))
        // Also bump cumulative edge count
        const prevEdges = parseInt(localStorage.getItem('goon-edge-count') || '0') || 0
        localStorage.setItem('goon-edge-count', String(prevEdges + edges))
      } catch {}
      setPhase('result')
    } else {
      pickNextTask(mode, newHistory)
    }
  }

  function endSession() {
    setTimerRunning(false)
    setPhase('result')
  }

  function resetToSelect() {
    setPhase('select')
    setMode(null)
    setCurrentTask(null)
    setTaskHistory([])
    setStage(0)
    setEdges(0)
    setSessionTime(0)
    setTimerRunning(false)
  }

  // ─── PHASE: SELECT ─────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen pb-20 pt-4 px-4" style={{ background: 'linear-gradient(to bottom, #0d0005 0%, #050000 100%)' }}>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black tracking-widest uppercase"
              style={{ background: 'rgba(244,63,94,0.15)', color: 'rgba(255,100,120,0.9)', border: '1px solid rgba(244,63,94,0.25)' }}>
              <AlertTriangle size={11}/> 18+ EXPLICIT
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2"
              style={{ textShadow: '0 0 40px rgba(244,63,94,0.5)' }}>
              SLOPPY COCK<br/>
              <span style={{ color: '#f43f5e' }}>SESSION</span>
            </h1>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
              A structured degradation session. Disgusting tasks, timed challenges, and total loss of control. Pick your poison.
            </p>
          </div>

          {/* Mode cards */}
          <div className="flex flex-col gap-3">
            {MODES.map(m => (
              <button key={m.id} onClick={() => startSession(m)}
                className="text-left p-5 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] group"
                style={{ background: `linear-gradient(135deg, ${m.color}08 0%, transparent 100%)`, border: `1px solid ${m.color}20`, backdropFilter: 'blur(10px)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: m.color + '15', boxShadow: `0 0 20px ${m.glow}` }}>
                    {m.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-white text-lg">{m.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: m.color + '20', color: m.color }}>
                        {m.stages} stages
                      </span>
                    </div>
                    <p className="text-zinc-500 text-sm">{m.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.cats.slice(0,5).map(c => (
                        <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: (CAT_COLORS[c] || '#fff') + '15', color: CAT_COLORS[c] || '#fff', border: `1px solid ${(CAT_COLORS[c] || '#fff')}25` }}>
                          {c}
                        </span>
                      ))}
                      {m.cats.length > 5 && <span className="text-[10px] text-zinc-600">+{m.cats.length-5} more</span>}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors shrink-0"/>
                </div>
              </button>
            ))}
          </div>

          {/* Quick task button */}
          <div className="mt-6 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-zinc-600 text-xs mb-2">or</p>
            <button
              onClick={() => {
                const t = pickRandom(TASKS)
                setCurrentTask(t)
                setMode(MODES[2])
                setPhase('session')
                setStage(0)
                setEdges(0)
                setSessionTime(0)
                setTaskHistory([])
                setTimerRunning(true)
              }}
              className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              🎲 Random Task — just give me something
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PHASE: RESULT ─────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="min-h-screen pb-20 pt-12 px-4 flex items-center justify-center" style={{ background: '#050000' }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-7xl mb-4">{mode?.emoji || '💦'}</div>
          <h2 className="text-3xl font-black text-white mb-2">Session Complete</h2>
          <p className="text-zinc-500 text-sm mb-6">You made it through {mode?.stages} stages of {mode?.label}.</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Duration', value: fmtTime(sessionTime), icon: <Timer size={16}/> },
              { label: 'Stages', value: String(stage), icon: <Flame size={16}/> },
              { label: 'Edges', value: String(edges), icon: <Zap size={16}/> },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 border border-white/8 bg-white/4">
                <div className="text-rose-400 mb-1 flex justify-center">{s.icon}</div>
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-[10px] text-zinc-600 uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => mode && startSession(mode)}
              className="w-full py-3 rounded-xl font-black text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #9f1239)' }}>
              Again — same mode
            </button>
            <button onClick={resetToSelect}
              className="w-full py-3 rounded-xl font-bold text-zinc-400 hover:text-white text-sm border border-white/10 transition-all">
              Choose different mode
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PHASE: SESSION ────────────────────────────────────────────
  if (!mode || !currentTask) return null

  const progressFraction = stage / mode.stages
  const colorHex = mode.color

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(to bottom, #0d0005 0%, #050000 100%)' }}>
      <div className="max-w-lg mx-auto px-4">

        {/* Session header */}
        <div className="flex items-center justify-between py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={resetToSelect} className="text-zinc-600 hover:text-white transition-colors p-1">
              <X size={18}/>
            </button>
            <div>
              <span className="font-black text-white text-base">{mode.emoji} {mode.label}</span>
              <div className="text-xs text-zinc-600">Stage {stage + 1} of {mode.stages}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Edge counter */}
            <button onClick={() => setEdges(e => e + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
              style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
              <Zap size={12}/> {edges} edges
            </button>
            <div className="text-xs font-mono text-zinc-600 min-w-[3rem] text-right">{fmtTime(sessionTime)}</div>
          </div>
        </div>

        {/* Session progress bar */}
        <div className="h-1 bg-white/5 rounded-full my-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressFraction * 100}%`, background: `linear-gradient(90deg, ${colorHex}, ${colorHex}88)` }} />
        </div>

        {/* Task card */}
        <div className="mt-4">
          {currentTask && (
            <TaskCard
              task={currentTask}
              onNext={handleNextTask}
              onComplete={handleCompleteTask}
            />
          )}
        </div>

        {/* History */}
        {taskHistory.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-zinc-700 uppercase tracking-widest mb-3">Completed</p>
            <div className="flex flex-col gap-2">
              {[...taskHistory].reverse().slice(0,3).map((t, i) => (
                <div key={t.id + i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-green-500 text-xs">✓</span>
                  <span className="text-xs font-bold" style={{ color: CAT_COLORS[t.category] }}>{t.category}</span>
                  <span className="text-xs text-zinc-600 truncate">{t.text.slice(0, 60)}…</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End session */}
        <div className="mt-6 text-center">
          <button onClick={endSession} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            End session early
          </button>
        </div>
      </div>
    </div>
  )
}
