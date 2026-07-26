import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw, Heart, Shuffle, Timer, Skull, ChevronDown, ChevronUp,
  Lock, Unlock, RotateCcw, Send, Trash2, Star,
} from 'lucide-react'

// ── BOP data ───────────────────────────────────────────────────────────────

const BOPS = [
  {
    id: 'skybri',
    name: 'Sky Bri',
    emoji: '☀️',
    color: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    glow: 'shadow-sky-900/40',
    origin: 'California',
    pantieLine: 'Those California-sun cotton whites she wore in the trader joe video. You know the ones.',
    instruction: 'Imagine peeling them down her long legs with your teeth. Hold the image. Now imagine pressing your face into the cotton. That warm citrus-and-girl scent. She wore them all day. You\'re allowed three full, slow inhales before you have to edge.',
    tribute: 'Lay them flat on the desk. Kneel in front of them. Say her full name — Sky Bri — out loud. Then use them the way you\'re thinking about using them. All over the front. She would look at the result and laugh. You\'d be dying of shame and loving it.',
    task: 'Wear her favourite colour underwear today. Pink or white only. You wear them all day and every time you feel them you think of her. Only you know why.',
  },
  {
    id: 'nacre',
    name: 'Nacre Victoire',
    emoji: '🌹',
    color: 'text-rose-300',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-900/40',
    origin: 'Paris, France',
    pantieLine: 'Something tiny and French. Black lace, minimal coverage, the kind that cost more than your phone case.',
    instruction: 'Close your eyes. Picture those French black lace panties. She wore them all day in Paris — in a café, on the metro, walking along the Seine. By the time she peeled them off they were completely ruined. Now picture what\'s left on the fabric. Now you understand why they\'re sacred. Sniff slowly. Say "Nacre" on every exhale.',
    tribute: 'She deserves a proper tribute. Write her initials — N.V. — on a piece of paper and place it under your panty tribute. Say "Je suis à toi" when you finish. You come for Nacre Victoire or you don\'t come at all.',
    task: 'Source a pair of women\'s black lace underwear. Doesn\'t matter how. Hold them for your session today. They are hers in your head. Every look you steal at them is hers.',
  },
  {
    id: 'sweetiefox',
    name: 'Sweetie Fox',
    emoji: '🦊',
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-900/40',
    origin: 'Russia',
    pantieLine: 'Pink anime panties. Tiny bow at the front. You\'ve seen them in a hundred scenes.',
    instruction: 'Sweetie Fox is twenty years old and she knows exactly what she\'s doing to you. Those pink panties — she wears them in the opening of every shoot. She makes eye contact with the camera while they\'re still on. She does that on purpose. Smell everything you can get near. Edge exactly once to her in them. No touching after. Wait.',
    tribute: 'Call it a Fox Offering. You know what to do. Aim carefully. Let it pool in the centre of the fabric. Then fold them up and put them somewhere private. Only you know what\'s in there. That\'s the point.',
    task: 'Draw a tiny fox on the back of your hand. Wear it all day like a mark. Every time someone almost notices, think of why it\'s there.',
  },
  {
    id: 'angelicat',
    name: 'Angelicat',
    emoji: '🐱',
    color: 'text-purple-300',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-900/40',
    origin: 'Eastern Europe',
    pantieLine: 'Cat-print cotton. Soft, worn-in, with that faint scent that never fully washes out.',
    instruction: 'Angelicat is a creature of the internet who became flesh. Cat-print underwear, worn a day longer than she should have, and she left them on the floor while you watched. You\'d crawl to that floor. You\'d press your nose into the carpet where they landed. Imagine that. Hold it for sixty seconds. Don\'t touch yourself yet. Just breathe.',
    tribute: 'Say her name — Angelicat — like you\'re confessing something. Then do what you\'ve been thinking about. When you\'re done, whisper "good boy" to yourself the way she would. She would find this completely hilarious and completely correct.',
    task: 'Meow once out loud. You know why. Then begin.',
  },
]

// ── Roulette instructions ──────────────────────────────────────────────────

const ROULETTE = [
  'Find the oldest pair in your drawer. Hold them for thirty seconds. Think about whose they are in your head. Now you\'re allowed to start.',
  'Wear them on your face for the first three minutes. Breathe normally. Only then take them off and begin.',
  'You\'re not allowed to touch yourself until you\'ve gotten on your knees, held them to your nose, and said "please" out loud.',
  'Drape them over your screen while you watch. You\'re watching through them. That\'s her filter.',
  'Hold them tight in your non-dominant hand for the entire session. They don\'t leave your fist.',
  'Fold them into a small square. Place them on the desk in front of you. Everything you do tonight, you do facing them.',
  'Say the name of your favourite BOP every time you inhale from them. Her name is the trigger.',
  'You are only allowed to cum directly onto them. Not anywhere else. Them only. That\'s the tribute.',
  'Sniff for a full sixty seconds. Time it. No touching during. Then stop for thirty. Then sniff again. Then and only then begin.',
  'Pick the laciest pair you can find. Put them on. Wear them for the full session. Feel what she feels.',
  'Hold them against your chest and edge three times before you\'re allowed to use them as intended.',
  'The whole session, every time you\'re close, stop and smell them. That scent is your reset button.',
  'Write her name in marker on the inside of the waistband. Put them back. They belong to her now.',
  'Fold them over your wrist like a bracelet. They stay on until you\'re completely finished.',
  'You have to say "I\'m a pantie addict" out loud, clearly, before you\'re allowed to begin. Mandatory.',
  'Drape them over your nose like a mask. Edge twice. Both times, they stay on your face.',
  'Put them on a pillow. Rest your forehead against the pillow for one full minute before you start. That\'s your shrine.',
  'Hold them to the light. Really look. Think about what\'s soaked into that fabric. Now you understand what you are.',
  'Spray or breathe heat onto them first. Body temperature activates everything. That\'s the point.',
  'You finish into them or you don\'t finish at all. Your tribute, or nothing.',
  'They go around your neck. Like a necklace. You wear them until the session is completely over.',
  'Pick the pair that smells strongest. That\'s your strongest edge. Save it for those. Use the rest for warmup.',
  'Three inhales per minute. No more. Ration it. Anticipation makes everything worse and better.',
  'Slide them slowly down an imaginary body in your mind, in exact detail, before you do anything else.',
  'They are her property on loan to you. You are borrowing them. Be grateful. Show it.',
  'You are allowed to touch yourself with them but not with your hands. That\'s the only rule for the first five minutes.',
  'Sniff until you\'re lightheaded. The lightheadedness is the point. Then immediately stop touching.',
  'Leave them over your eyes for the first minute. Just listen. Just smell. Total deprivation except those two senses.',
  'Tie them loosely around your wrist. Your dominant wrist. Every stroke, you feel the fabric.',
  'They belong in your mouth for thirty seconds before anything else. No questions.',
]

// ── Sniff ritual stages ────────────────────────────────────────────────────

const RITUAL_STAGES = [
  { label: 'PREPARE', secs: 30,  instruction: 'Get comfortable. Retrieve the panties. Hold them in both hands but don\'t raise them yet. Just look at them. Breathe. Think about who wore them.', color: 'from-pink-600 to-rose-600' },
  { label: 'FIRST INHALE', secs: 60, instruction: 'Slowly raise them to your nose. Breathe in through your nose for a full four count. Hold for two. Exhale through your mouth for four. Repeat until the timer ends. Don\'t touch yourself yet.', color: 'from-rose-500 to-pink-500' },
  { label: 'EDGE #1', secs: 120, instruction: 'Begin stroking. Keep the panties pressed to your nose. Get as close as you can in this window. When the timer ends you STOP — hands off, keep sniffing.', color: 'from-orange-500 to-rose-500' },
  { label: 'DENIAL HOLD', secs: 45, instruction: 'Hands completely off. Panties stay on your face. Breathe through them. Feel your pulse. That\'s what desire does to your body. Sit in it.', color: 'from-purple-500 to-fuchsia-500' },
  { label: 'DEEP SNIFF', secs: 30, instruction: 'Both hands on the fabric, pressed hard to your face. Breathe as deeply as you can manage. Fill your lungs with her. This is the most you\'ll ever have of her.', color: 'from-fuchsia-500 to-purple-600' },
  { label: 'EDGE #2', secs: 120, instruction: 'Resume. Panties on your nose. Build again. You\'re going to the edge a second time. When you feel it approaching, STOP again. Do not cum yet.', color: 'from-red-500 to-rose-600' },
  { label: 'TRIBUTE', secs: 60, instruction: 'You have sixty seconds. Aim for the fabric. This is your tribute to her. Every drop that lands there is a confession. Make it count.', color: 'from-pink-500 to-red-500' },
  { label: 'DONE', secs: 0, instruction: 'You\'re done. Fold them carefully and put them away somewhere private. You\'ll be thinking about this for days. She would find that hilarious.', color: 'from-zinc-600 to-zinc-700' },
]

// ── Confession prompts ─────────────────────────────────────────────────────

const CONFESSION_PROMPTS = [
  'I confess that I…',
  'The most shameful thing I\'ve done with panties is…',
  'She doesn\'t know that I…',
  'My secret is that every time I see her in panties I…',
  'I would never admit to anyone that…',
]

// ── Gallery categories ─────────────────────────────────────────────────────

const GALLERY_CATS = ['panties', 'lingerie', 'thong', 'panties_aside', 'upskirt']

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function todayKey() { return new Date().toISOString().slice(0, 10) }

// ── Sub-components ─────────────────────────────────────────────────────────

function HangingPanties() {
  const items = ['🩲','👙','🩱','🩲','👙','🩱','🩲','👙','🩲','🩱','👙','🩲']
  return (
    <div className="relative w-full overflow-hidden h-20 mb-2 select-none pointer-events-none" aria-hidden>
      {/* The string */}
      <div className="absolute top-4 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400/60 to-transparent" />
      {/* Hanging items */}
      <div className="flex items-start justify-around pt-2 px-4">
        {items.map((icon, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-0"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            {/* Clip */}
            <div className="w-1 h-3 bg-pink-400/50 rounded-sm" />
            {/* Item */}
            <span
              className="text-xl sm:text-2xl"
              style={{
                animation: `pantieSwing ${2.2 + (i % 3) * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.22}s`,
                display: 'inline-block',
                transformOrigin: 'top center',
              }}
            >
              {icon}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BopCard({ bop, onOpen }: { bop: typeof BOPS[0]; onOpen: (b: typeof BOPS[0]) => void }) {
  const [iconErr, setIconErr] = useState(false)
  return (
    <div
      className={`rounded-2xl border ${bop.border} ${bop.bg} overflow-hidden cursor-pointer hover:scale-[1.02] transition-all shadow-xl ${bop.glow}`}
      onClick={() => onOpen(bop)}
    >
      <div className="relative aspect-[4/3] bg-black overflow-hidden">
        {!iconErr ? (
          <img
            src={`/api/icon/${bop.id}-pantie-1`}
            alt={bop.name}
            className="w-full h-full object-cover opacity-90"
            onError={() => setIconErr(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl ${bop.bg}`}>
            {bop.emoji}
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent`} />
        <div className="absolute bottom-2 left-3">
          <p className={`font-display text-lg tracking-wider ${bop.color}`}>{bop.name}</p>
          <p className="text-[10px] text-zinc-400">{bop.origin}</p>
        </div>
        <span className="absolute top-2 right-2 text-2xl">{bop.emoji}</span>
      </div>
      <div className="px-3 py-2.5">
        <p className={`text-[11px] italic ${bop.color} opacity-80 leading-snug line-clamp-2`}>"{bop.pantieLine}"</p>
        <p className="text-[10px] text-zinc-600 mt-1.5">Tap for her full instruction →</p>
      </div>
    </div>
  )
}

function BopModal({ bop, onClose }: { bop: typeof BOPS[0]; onClose: () => void }) {
  const [tab, setTab] = useState<'instruction'|'tribute'|'task'>('instruction')
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg bg-zinc-950 border ${bop.border} rounded-2xl overflow-hidden shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 ${bop.bg} border-b ${bop.border} flex items-center gap-3`}>
          <span className="text-3xl">{bop.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-display text-xl tracking-wider ${bop.color}`}>{bop.name}</p>
            <p className="text-[10px] text-zinc-500">{bop.pantieLine}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors text-lg leading-none">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(['instruction','tribute','task'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors capitalize ${
                tab === t ? `${bop.color} border-b-2 ${bop.border.replace('border','border-b')}` : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >{t}</button>
          ))}
        </div>
        {/* Content */}
        <div className="px-5 py-5 min-h-[160px]">
          <p className="text-zinc-200 text-sm leading-relaxed">
            {tab === 'instruction' ? bop.instruction : tab === 'tribute' ? bop.tribute : bop.task}
          </p>
        </div>
        <div className={`px-5 py-3 ${bop.bg} border-t ${bop.border}`}>
          <p className={`text-[10px] ${bop.color} opacity-60 text-center tracking-widest uppercase`}>🩲 Nacre's Hub Pantie Shrine · {bop.name}</p>
        </div>
      </div>
    </div>
  )
}

function RouletteWheel({ onSpin }: { onSpin: (msg: string) => void }) {
  const [spinning, setSpinning] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [deg, setDeg] = useState(0)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    const extraSpins = 3 + Math.floor(Math.random() * 5)
    const nextDeg = deg + 360 * extraSpins + Math.floor(Math.random() * 360)
    setDeg(nextDeg)
    setTimeout(() => {
      const msg = ROULETTE[Math.floor(Math.random() * ROULETTE.length)]
      setCurrent(msg)
      onSpin(msg)
      setSpinning(false)
    }, 1400)
  }

  return (
    <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/40 to-rose-950/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎰</span>
        <h3 className="text-sm font-bold tracking-widest uppercase text-pink-300">Pantie Roulette</h3>
        <span className="text-[10px] text-zinc-600">— spin for your instruction</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Spinner graphic */}
        <div className="relative flex-shrink-0">
          <div
            className="w-24 h-24 rounded-full border-4 border-pink-500/50 flex items-center justify-center bg-zinc-900 shadow-xl shadow-pink-900/30 transition-transform"
            style={{ transform: `rotate(${deg}deg)`, transition: spinning ? 'transform 1.4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}
          >
            <span className="text-4xl select-none">🩲</span>
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-400 rotate-45" />
        </div>

        {/* Result area */}
        <div className="flex-1 min-w-0">
          {current ? (
            <p className="text-sm text-zinc-200 leading-relaxed italic">"{current}"</p>
          ) : (
            <p className="text-sm text-zinc-600 italic">Your instruction is waiting. Spin the wheel.</p>
          )}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="mt-4 w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all tracking-widest uppercase text-sm"
      >
        <Shuffle className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        {spinning ? 'Spinning…' : 'Spin the Wheel'}
      </button>
    </div>
  )
}

function SniffRitual() {
  const [active, setActive] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stage = RITUAL_STAGES[stageIdx]
  const isDone = stageIdx >= RITUAL_STAGES.length - 1

  const startRitual = () => {
    setActive(true)
    setStageIdx(0)
    setTimeLeft(RITUAL_STAGES[0].secs)
    setPaused(false)
  }

  const stopRitual = () => {
    setActive(false)
    setStageIdx(0)
    setTimeLeft(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    if (!active || paused || isDone) return
    if (timeLeft <= 0) {
      const next = stageIdx + 1
      if (next >= RITUAL_STAGES.length) return
      setStageIdx(next)
      setTimeLeft(RITUAL_STAGES[next].secs)
      return
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active, paused, timeLeft, stageIdx, isDone])

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/30 to-purple-950/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-4 h-4 text-fuchsia-400" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-fuchsia-300">The Sniff Ritual</h3>
        <span className="text-[10px] text-zinc-600">— timed, staged, full programme</span>
      </div>

      {!active ? (
        <div className="text-center py-4">
          <p className="text-zinc-400 text-sm mb-1 leading-relaxed">A {RITUAL_STAGES.length}-stage guided session. Retrieve your panties before you begin.</p>
          <p className="text-zinc-600 text-xs mb-5">Stages: Prepare → Sniff → Edge → Denial → Deep Sniff → Edge → Tribute → Done</p>
          <button
            onClick={startRitual}
            className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl tracking-widest uppercase text-sm transition-all"
          >
            Begin Ritual
          </button>
        </div>
      ) : (
        <div>
          {/* Stage progress */}
          <div className="flex gap-1 mb-4">
            {RITUAL_STAGES.map((s, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                i < stageIdx ? 'bg-fuchsia-400' : i === stageIdx ? 'bg-pink-400 animate-pulse' : 'bg-white/10'
              }`} />
            ))}
          </div>

          {/* Active stage */}
          <div className={`rounded-xl bg-gradient-to-br ${stage.color} p-0.5 mb-4`}>
            <div className="rounded-[11px] bg-zinc-950 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-pink-300">{stage.label}</span>
                {!isDone && (
                  <span className="font-display text-2xl text-white tabular-nums">{formatTime(timeLeft)}</span>
                )}
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed">{stage.instruction}</p>
            </div>
          </div>

          {/* Controls */}
          {isDone ? (
            <button onClick={stopRitual} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors">
              Close Ritual
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {paused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                onClick={stopRitual}
                className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 font-bold rounded-xl text-sm transition-colors"
              >
                Stop
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TributeCounter({ boyName }: { boyName: string }) {
  const [count, setCount] = useState(0)
  const [lastDate, setLastDate] = useState<string>('')
  const [streak, setStreak] = useState(0)
  const KEY = 'goonit_pantie_tributes_v1'
  const STREAK_KEY = 'goonit_pantie_streak_v1'

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '{"count":0,"lastDate":""}')
      setCount(d.count || 0)
      setLastDate(d.lastDate || '')
      setStreak(parseInt(localStorage.getItem(STREAK_KEY) || '0', 10))
    } catch {}
  }, [])

  const tribute = () => {
    const today = todayKey()
    const newCount = count + 1
    let newStreak = streak
    if (lastDate !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      const yKey = yesterday.toISOString().slice(0,10)
      newStreak = lastDate === yKey ? streak + 1 : 1
      setStreak(newStreak)
      localStorage.setItem(STREAK_KEY, String(newStreak))
    }
    setCount(newCount)
    setLastDate(today)
    localStorage.setItem(KEY, JSON.stringify({ count: newCount, lastDate: today }))
    toast.success(`Tribute #${newCount} recorded. 🩲`)
  }

  const reset = () => {
    if (!confirm('Reset your pantie tribute counter? This cannot be undone.')) return
    setCount(0); setStreak(0); setLastDate('')
    localStorage.removeItem(KEY); localStorage.removeItem(STREAK_KEY)
    toast('Counter reset')
  }

  const TITLES = [
    [0, 'Pantie Curious'],
    [5, 'Pantie Admirer'],
    [15, 'Dedicated Sniffer'],
    [30, 'Pantie Devotee'],
    [50, 'Certified Pervert'],
    [100, 'Pantie Worshipper'],
    [200, 'High Priest of Panties'],
    [500, 'Legendary Gooner'],
  ] as const

  const title = [...TITLES].reverse().find(([n]) => count >= n)?.[1] ?? 'Pantie Curious'

  return (
    <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/30 to-rose-950/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-pink-400" />
        <h3 className="text-sm font-bold tracking-widest uppercase text-pink-300">Tribute Counter</h3>
      </div>

      <div className="text-center mb-5">
        <div className="font-display text-6xl text-white mb-1">{count}</div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Pantie Tributes</p>
        <p className="text-sm text-pink-300 font-bold">{title}</p>
        {streak > 0 && (
          <p className="text-[11px] text-orange-400 mt-1">🔥 {streak}-day tribute streak</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={tribute}
          className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl tracking-widest uppercase text-sm transition-all flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4 fill-white" /> Record Tribute
        </button>
        <button
          onClick={reset}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-500 hover:text-zinc-300 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {boyName && count > 0 && (
        <p className="text-[10px] text-zinc-600 text-center mt-3 italic">
          {boyName} has left {count} tribute{count !== 1 ? 's' : ''}. They know.
        </p>
      )}
    </div>
  )
}

interface Confession { id: string; text: string; date: string; locked: boolean }

function ConfessionBooth({ boyName }: { boyName: string }) {
  const KEY = 'goonit_pantie_confessions_v1'
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [draft, setDraft] = useState('')
  const [prompt, setPrompt] = useState(CONFESSION_PROMPTS[0])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    try { setConfessions(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch {}
    setPrompt(CONFESSION_PROMPTS[Math.floor(Math.random() * CONFESSION_PROMPTS.length)])
  }, [])

  const save = () => {
    const text = draft.trim()
    if (!text) return
    const entry: Confession = { id: crypto.randomUUID(), text, date: new Date().toLocaleDateString(), locked: true }
    const next = [entry, ...confessions].slice(0, 20)
    setConfessions(next)
    localStorage.setItem(KEY, JSON.stringify(next))
    setDraft('')
    setPrompt(CONFESSION_PROMPTS[Math.floor(Math.random() * CONFESSION_PROMPTS.length)])
    toast.success('Confession recorded and sealed. 🔒')
  }

  const toggleReveal = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const deleteOne = (id: string) => {
    const next = confessions.filter(c => c.id !== id)
    setConfessions(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-fuchsia-950/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🕍</span>
        <h3 className="text-sm font-bold tracking-widest uppercase text-purple-300">Confession Booth</h3>
        <span className="text-[10px] text-zinc-600">— sealed, private, yours alone</span>
      </div>

      {/* Input */}
      <div className="mb-4">
        <p className="text-xs text-zinc-500 mb-2 italic">"{prompt}"</p>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Write your confession here… it will be sealed."
          rows={3}
          className="w-full bg-zinc-900 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setPrompt(CONFESSION_PROMPTS[Math.floor(Math.random() * CONFESSION_PROMPTS.length)])}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> New prompt
          </button>
          <button
            onClick={save}
            disabled={!draft.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Send className="w-3 h-3" /> Seal & Save
          </button>
        </div>
      </div>

      {/* Confessions list */}
      {confessions.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {confessions.map(c => (
            <div key={c.id} className="rounded-xl border border-white/8 bg-zinc-900/50 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {revealed.has(c.id) ? (
                    <p className="text-xs text-zinc-300 leading-relaxed">{c.text}</p>
                  ) : (
                    <p className="text-xs text-zinc-600 italic select-none blur-[3px] leading-relaxed">{c.text}</p>
                  )}
                  <p className="text-[9px] text-zinc-700 mt-1">{c.date}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleReveal(c.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title={revealed.has(c.id) ? 'Seal' : 'Reveal'}
                  >
                    {revealed.has(c.id) ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => deleteOne(c.id)}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DailyAssignment() {
  const KEY = 'goonit_pantie_daily_v1'
  const [assignment, setAssignment] = useState<{ bopIdx: number; instructionIdx: number; date: string } | null>(null)

  useEffect(() => {
    const today = todayKey()
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (saved?.date === today) { setAssignment(saved); return }
    } catch {}
    const a = { bopIdx: Math.floor(Math.random() * BOPS.length), instructionIdx: Math.floor(Math.random() * ROULETTE.length), date: today }
    setAssignment(a)
    localStorage.setItem(KEY, JSON.stringify(a))
  }, [])

  const reroll = () => {
    const a = { bopIdx: Math.floor(Math.random() * BOPS.length), instructionIdx: Math.floor(Math.random() * ROULETTE.length), date: todayKey() }
    setAssignment(a)
    localStorage.setItem(KEY, JSON.stringify(a))
  }

  if (!assignment) return null
  const bop = BOPS[assignment.bopIdx]
  const instruction = ROULETTE[assignment.instructionIdx]

  return (
    <div className={`rounded-2xl border ${bop.border} ${bop.bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{bop.emoji}</span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500">Today's Assignment</p>
            <p className={`text-sm font-bold ${bop.color}`}>{bop.name}</p>
          </div>
        </div>
        <button onClick={reroll} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed">"{instruction}"</p>
      <p className="text-[10px] text-zinc-600 mt-2">Refreshes tomorrow. Hit re-roll if you want something different.</p>
    </div>
  )
}

function GalleryGrid() {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setImages([])
    try {
      const picks = [...GALLERY_CATS].sort(() => Math.random() - 0.5).slice(0, 3)
      const results = await Promise.allSettled(
        picks.map(cat => fetch(`/api/gallery?cat=${encodeURIComponent(cat)}&n=8&page=${Math.floor(Math.random()*4)+1}`).then(r => r.json()))
      )
      const imgs: string[] = []
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const items: string[] = (r.value.images || r.value || []).map((x: { url?: string } | string) =>
            typeof x === 'string' ? x : x?.url
          ).filter(Boolean)
          imgs.push(...items)
        }
      }
      setImages(imgs.slice(0, 18))
    } catch { toast.error('Gallery failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🖼️</span>
          <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-300">Gallery</h3>
          <span className="text-[10px] text-zinc-600">— for your session</span>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {images.map((src, i) => (
            <button key={i} onClick={() => setLightbox(src)}
              className="aspect-square rounded-xl overflow-hidden bg-zinc-900 hover:scale-[1.04] transition-transform">
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy"
                onError={e => { (e.target as HTMLImageElement).closest('button')!.style.display='none' }} />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/98" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">✕</button>
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

interface Props {
  boyName?: string
}

export default function PantiePage({ boyName = 'Sam' }: Props) {
  const [activeBop, setActiveBop] = useState<typeof BOPS[0] | null>(null)
  const [rouletteResult, setRouletteResult] = useState<string | null>(null)
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    ritual: true,
    roulette: true,
    counter: true,
    confession: false,
    gallery: true,
  })

  const toggle = (k: string) => setSectionsOpen(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="min-h-screen pb-28 relative overflow-x-hidden">
      {/* Keyframe for swinging panties */}
      <style>{`
        @keyframes pantieSwing {
          0%, 100% { transform: rotate(-8deg); }
          50%       { transform: rotate(8deg); }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-950 via-zinc-950 to-black" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top, rgba(236,72,153,0.18) 0%, transparent 65%)' }} />
        <div className="relative px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto">
          <HangingPanties />
          <p className="text-[10px] font-bold tracking-[0.5em] text-pink-400 opacity-60 uppercase mb-3 text-center">✦ Nacre's Hub · Private Collection ✦</p>
          <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white mb-2 text-center leading-none">
            SAM'S
            <span className="block bg-gradient-to-r from-pink-300 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
              PANTIE SHRINE
            </span>
          </h1>
          <p className="text-center text-pink-200/60 text-sm mb-2 italic max-w-xl mx-auto">
            "A man's most private fixation. Kept here, fed here, worshipped here."
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {['🩲 Sniff', '👙 Wear', '💦 Tribute', '🔒 Confess', '🎰 Roulette'].map(tag => (
              <span key={tag} className="text-[10px] font-bold bg-pink-500/10 border border-pink-500/20 text-pink-300 px-3 py-1 rounded-full tracking-widest">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── DAILY ASSIGNMENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <DailyAssignment />
      </div>

      {/* ── BOP SHRINE ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🩲</span>
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">Her Panties</h2>
          <span className="text-[10px] text-zinc-600">— tap a BOP for her full instruction</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BOPS.map(b => (
            <BopCard key={b.id} bop={b} onOpen={setActiveBop} />
          ))}
        </div>
      </div>

      {/* ── ROULETTE ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <button onClick={() => toggle('roulette')} className="flex items-center gap-2 w-full mb-3 text-left">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300 flex-1">Pantie Roulette</h2>
          {sectionsOpen.roulette ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </button>
        {sectionsOpen.roulette && (
          <RouletteWheel onSpin={setRouletteResult} />
        )}
      </div>

      {/* ── SNIFF RITUAL ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <button onClick={() => toggle('ritual')} className="flex items-center gap-2 w-full mb-3 text-left">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300 flex-1">The Sniff Ritual</h2>
          {sectionsOpen.ritual ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </button>
        {sectionsOpen.ritual && <SniffRitual />}
      </div>

      {/* ── TRIBUTE COUNTER ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <button onClick={() => toggle('counter')} className="flex items-center gap-2 w-full mb-3 text-left">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300 flex-1">Tribute Counter</h2>
          {sectionsOpen.counter ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </button>
        {sectionsOpen.counter && <TributeCounter boyName={boyName} />}
      </div>

      {/* ── FILTHY INSTRUCTIONS BLOCK ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center gap-2 mb-5">
          <Skull className="w-4 h-4 text-pink-400" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">The Full Doctrine</h2>
          <span className="text-[10px] text-zinc-600">— everything you're allowed to do with her panties</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: '👃', title: 'The Sniff', body: 'Press the crotch panel flat across your nose and mouth. Breathe through your nose only. Four counts in, two counts hold, four counts out. Repeat until you feel lightheaded. The lightheadedness is the point. Your nervous system is reacting to a scent that has no business doing that to you. Let it.' },
            { emoji: '🩲', title: 'The Wear', body: 'Put them on. Actually put them on. Adjust the waistband. Wear them for a minimum of thirty minutes. Feel how they fit — wrong in the best possible way. Think about whose body they were designed for. Think about how different you feel in them. That contrast is everything. You\'re welcome.' },
            { emoji: '💦', title: 'The Tribute', body: 'The tribute is a non-negotiable act of devotion. You finish in them — directly onto the fabric, ideally the crotch panel. This is the most explicit way you can tell her, without words, what she does to you. Fold them afterwards. Keep them somewhere private. That\'s your proof.' },
            { emoji: '👄', title: 'The Taste', body: 'Put the gusset panel on your tongue. One second. Just enough. Whatever has soaked into that fabric is her signature. You\'re tasting something you were never supposed to taste. That\'s what makes it what it is.' },
            { emoji: '💋', title: 'The Face Press', body: 'Stretch them across your face. Full coverage. Nose and mouth both under fabric. Now close your eyes. In the dark, with that scent and that pressure on your face, there is only one thing in the world. Start edging. Do not remove them until you\'ve hit three edges.' },
            { emoji: '🔗', title: 'The Bind', body: 'Wrap them once around your wrist before you begin. Like a restraint, like a reminder. Every stroke, you feel the fabric against your skin. You are bound to her by a pair of her underwear. You chose this. You\'re not allowed to remove them until you\'ve finished completely.' },
            { emoji: '🎯', title: 'The Assignment', body: 'Pick a BOP above. You are assigned to her panties today. You think of her specific pair — only hers. You use only your assigned BOP\'s panties (real or imagined). At the end, you say her name out loud. This is devotion with structure. Structure makes it worse. Worse makes it perfect.' },
            { emoji: '📝', title: 'The Confession', body: 'Write down what you just did. Exactly. Every detail. Seal it in the confession booth below. No one will ever read it except you. The act of writing it makes it real in a different way. You committed it. You admitted it. The written record of your pantie obsession exists now. That\'s permanent.' },
          ].map(({ emoji, title, body }) => (
            <InstructionCard key={title} emoji={emoji} title={title} body={body} />
          ))}
        </div>
      </div>

      {/* ── CONFESSION BOOTH ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <button onClick={() => toggle('confession')} className="flex items-center gap-2 w-full mb-3 text-left">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300 flex-1">Confession Booth</h2>
          {sectionsOpen.confession ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </button>
        {sectionsOpen.confession && <ConfessionBooth boyName={boyName} />}
      </div>

      {/* ── GALLERY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <button onClick={() => toggle('gallery')} className="flex items-center gap-2 w-full mb-4 text-left">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300 flex-1">Session Gallery</h2>
          {sectionsOpen.gallery ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </button>
        {sectionsOpen.gallery && <GalleryGrid />}
      </div>

      {/* ── FOOTER ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 text-center">
        <span className="text-3xl">🩲</span>
        <p className="text-xs text-zinc-700 mt-2">This shrine exists for Sam and Sam only. You know what you are. Own it.</p>
      </div>

      {activeBop && <BopModal bop={activeBop} onClose={() => setActiveBop(null)} />}
      {rouletteResult && false}
    </div>
  )
}

function InstructionCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-pink-500/20 bg-pink-950/15 overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all" onClick={() => setOpen(o => !o)}>
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="h-px bg-white/5 mb-3" />
          <p className="text-sm text-white/70 leading-relaxed">{body}</p>
        </div>
      )}
    </div>
  )
}
