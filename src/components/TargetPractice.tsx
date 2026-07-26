import { useState, useEffect, useRef, useCallback } from 'react'
import { X as XIcon, Target, RefreshCw, Trophy, Crosshair, Flame, Footprints } from 'lucide-react'

type Mode = '3d' | 'feet' | 'mixed'

const MODE_LABELS: Record<Mode, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  '3d':    { label: '3D / CGI',  icon: <Target className="w-5 h-5" />,     color: 'from-fuchsia-500 to-pink-500',   desc: 'Realistic 3D renders' },
  'feet':  { label: 'Feet',      icon: <Footprints className="w-5 h-5" />, color: 'from-pink-400 to-rose-500',      desc: 'Foot focus only 🦶' },
  'mixed': { label: 'Mixed',     icon: <Flame className="w-5 h-5" />,      color: 'from-pink-500 to-fuchsia-600',   desc: 'Anything goes' },
}

const ZONES = [
  { label: 'FACE',   yMin: 5,  yMax: 22, xMin: 35, xMax: 65, emoji: '😍' },
  { label: 'CHEST',  yMin: 26, yMax: 50, xMin: 28, xMax: 72, emoji: '💕' },
  { label: 'BELLY',  yMin: 46, yMax: 64, xMin: 32, xMax: 68, emoji: '✨' },
  { label: 'THIGHS', yMin: 60, yMax: 80, xMin: 22, xMax: 78, emoji: '🌸' },
  { label: 'FEET',   yMin: 75, yMax: 97, xMin: 18, xMax: 82, emoji: '🦶' },
]

const TOTAL_ROUNDS = 5

interface RoundData {
  imgUrl: string
  targetX: number
  targetY: number
  zoneLabel: string
  zoneEmoji: string
}

interface ShotData {
  x: number
  y: number
  score: number
  dist: number
}

type SubPhase = 'showing' | 'fire' | 'reveal'

let _uid = 0
function uid() { return ++_uid }

export default function TargetPractice({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<'menu' | 'playing' | 'results'>('menu')
  const [subPhase, setSubPhase] = useState<SubPhase>('showing')
  const [currentRound, setCurrentRound] = useState(0)
  const [rounds, setRounds] = useState<RoundData[]>([])
  const [shots, setShots] = useState<ShotData[]>([])
  const [imgPool, setImgPool] = useState<string[]>([])
  const [loadingImgs, setLoadingImgs] = useState(false)
  const [showCountdown, setShowCountdown] = useState<number | null>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)

  const fieldRef = useRef<HTMLDivElement>(null)
  const autoAdvRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const poolRef = useRef<string[]>([])
  const poolIdxRef = useRef(0)

  const clearAuto = () => { if (autoAdvRef.current) clearTimeout(autoAdvRef.current) }

  const fetchPool = useCallback(async (m: Mode) => {
    setLoadingImgs(true)
    const cats = m === '3d' ? ['realistic3d'] : m === 'feet' ? ['feet', 'footfocus', 'soles'] : ['realistic3d', 'feet', 'waifu']
    try {
      const results = await Promise.allSettled(
        cats.flatMap(cat => [
          fetch(`/api/gallery?cat=${cat}&page=1&count=30`).then(r => r.json()),
          fetch(`/api/gallery?cat=${cat}&page=2&count=30`).then(r => r.json()),
        ])
      )
      const urls: string[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value?.files)) {
          urls.push(...r.value.files.filter((f: string) => /\.(jpe?g|png|webp)(\?|$)/i.test(f)))
        }
      }
      for (let i = urls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [urls[i], urls[j]] = [urls[j], urls[i]]
      }
      poolRef.current = urls
      setImgPool(urls)
    } finally {
      setLoadingImgs(false)
    }
  }, [])

  const buildRounds = useCallback((pool: string[]): RoundData[] => {
    return Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
      const zone = ZONES[i % ZONES.length]
      const img = pool[(poolIdxRef.current + i) % pool.length] || pool[0]
      const x = zone.xMin + Math.random() * (zone.xMax - zone.xMin)
      const y = zone.yMin + Math.random() * (zone.yMax - zone.yMin)
      return { imgUrl: img, targetX: x, targetY: y, zoneLabel: zone.label, zoneEmoji: zone.emoji }
    })
  }, [])

  const startGame = useCallback(async (m: Mode) => {
    setMode(m)
    setShots([])
    setCurrentRound(0)
    setSubPhase('showing')
    poolIdxRef.current = 0
    await fetchPool(m)
  }, [fetchPool])

  useEffect(() => {
    if (imgPool.length > 0 && phase === 'menu') {
      const built = buildRounds(imgPool)
      setRounds(built)
      setPhase('playing')
      setSubPhase('showing')
      startCountdown()
    }
  }, [imgPool, phase, buildRounds])

  const startCountdown = () => {
    setShowCountdown(3)
  }

  useEffect(() => {
    if (showCountdown === null) return
    if (showCountdown <= 0) {
      setShowCountdown(null)
      autoAdvRef.current = setTimeout(() => {
        setSubPhase('fire')
      }, 2200)
      return
    }
    const t = setTimeout(() => setShowCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [showCountdown])

  const handleFire = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (subPhase !== 'fire' || !fieldRef.current) return
    clearAuto()

    const rect = fieldRef.current.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    const round = rounds[currentRound]
    const dx = x - round.targetX
    const dy = y - round.targetY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const score = Math.max(0, Math.round(100 - dist * 1.8))

    setRipple({ x, y, id: uid() })
    setShots(prev => [...prev, { x, y, score, dist }])
    setSubPhase('reveal')

    autoAdvRef.current = setTimeout(() => {
      const next = currentRound + 1
      if (next >= TOTAL_ROUNDS) {
        setPhase('results')
      } else {
        setCurrentRound(next)
        setSubPhase('showing')
        autoAdvRef.current = setTimeout(() => setSubPhase('fire'), 2500)
      }
    }, 2200)
  }, [subPhase, rounds, currentRound])

  useEffect(() => () => clearAuto(), [])

  const totalScore = shots.reduce((a, s) => a + s.score, 0)
  const maxScore = TOTAL_ROUNDS * 100
  const pct = Math.round((totalScore / maxScore) * 100)
  const rank = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 55 ? 'B' : pct >= 35 ? 'C' : 'D'
  const rankColor = rank === 'S' ? 'text-yellow-300' : rank === 'A' ? 'text-pink-300' : rank === 'B' ? 'text-fuchsia-300' : rank === 'C' ? 'text-orange-400' : 'text-zinc-500'
  const rankMsg = rank === 'S' ? 'Dead Shot. Every drop landed.' : rank === 'A' ? 'Great aim. She felt every drop.' : rank === 'B' ? 'Decent. Most of it landed.' : rank === 'C' ? 'Close enough, barely.' : 'You missed almost everything.'

  if (phase === 'menu') {
    return (
      <div className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center p-6" style={{ backdropFilter: 'blur(14px)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Crosshair className="w-8 h-8 text-pink-300" />
            <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white">TARGET PRACTICE</h1>
            <Crosshair className="w-8 h-8 text-pink-300" />
          </div>
          <p className="text-pink-200/60 text-base max-w-sm mx-auto leading-relaxed">
            She appears on screen. A target zone glows on her body. It disappears.<br />
            <span className="text-pink-300 font-semibold">Then you tap exactly where you're going to finish.</span>
          </p>
          <p className="text-zinc-500 text-sm mt-2">Aim true. {TOTAL_ROUNDS} rounds. No second chances.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mb-8">
          {(Object.entries(MODE_LABELS) as [Mode, typeof MODE_LABELS[Mode]][]).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => startGame(id)}
              disabled={loadingImgs}
              className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${meta.color} text-white font-bold flex flex-col items-center gap-3 shadow-2xl hover:scale-105 transition-transform active:scale-95 disabled:opacity-50`}
            >
              <div className="text-3xl">{meta.icon}</div>
              <span className="font-display tracking-wider text-xl">{meta.label}</span>
              <span className="text-[11px] opacity-70 font-normal">{meta.desc}</span>
            </button>
          ))}
        </div>

        {loadingImgs && (
          <p className="text-pink-300 font-display tracking-wider animate-pulse">LOADING IMAGES…</p>
        )}

        <div className="flex gap-8 text-center text-sm text-pink-200/40">
          <div><div className="text-2xl font-display text-pink-300">{TOTAL_ROUNDS}</div>rounds</div>
          <div><div className="text-2xl font-display text-pink-300">100</div>pts/round</div>
          <div><div className="text-2xl font-display text-pink-300">S–D</div>rank</div>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <div className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center p-6" style={{ backdropFilter: 'blur(14px)' }}>
        <div className="text-center max-w-sm w-full">
          <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
          <h2 className="font-display text-5xl tracking-wider text-white mb-2">RESULTS</h2>
          <div className={`font-display text-9xl mb-2 ${rankColor}`}>{rank}</div>
          <p className="text-zinc-300 italic text-sm mb-6">{rankMsg}</p>

          <div className="space-y-2 mb-6">
            {shots.map((s, i) => {
              const r = rounds[i]
              const label = r?.zoneLabel ?? `Round ${i + 1}`
              const emoji = r?.zoneEmoji ?? '🎯'
              return (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm text-zinc-300 flex-1 text-left">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500" style={{ width: `${s.score}%` }} />
                    </div>
                    <span className={`font-display text-lg w-10 text-right ${s.score >= 80 ? 'text-yellow-300' : s.score >= 55 ? 'text-pink-300' : s.score >= 30 ? 'text-fuchsia-300' : 'text-zinc-500'}`}>
                      {s.score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white/5 rounded-2xl p-4 mb-6">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Total Score</p>
            <p className="font-display text-4xl text-white">{totalScore} <span className="text-zinc-500 text-2xl">/ {maxScore}</span></p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('menu'); setShots([]); setCurrentRound(0) }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Mode Select
            </button>
            <button
              onClick={() => {
                if (!mode) return
                setShots([]); setCurrentRound(0); setSubPhase('showing')
                const built = buildRounds(imgPool)
                setRounds(built)
                setPhase('playing')
                startCountdown()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-white font-semibold transition-colors"
            >
              <Crosshair className="w-4 h-4" /> Play Again
            </button>
          </div>
          <button onClick={onClose} className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Exit</button>
        </div>
      </div>
    )
  }

  const round = rounds[currentRound]
  if (!round) return null
  const currentShot = shots[currentRound]

  return (
    <div
      ref={fieldRef}
      className="fixed inset-0 z-50 bg-black overflow-hidden select-none"
      style={{ cursor: subPhase === 'fire' ? 'crosshair' : 'default' }}
      onClick={subPhase === 'fire' ? handleFire : undefined}
      onTouchEnd={subPhase === 'fire' ? handleFire : undefined}
    >
      {/* Background image */}
      <img
        src={round.imgUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        onError={(e) => { (e.target as HTMLImageElement).src = '/api/icon/waifu-1' }}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${subPhase === 'fire' ? 'bg-black/30' : 'bg-black/15'}`} />

      {/* TARGET ZONE — visible only in 'showing' */}
      {subPhase === 'showing' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${round.targetX}%`,
            top: `${round.targetY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing glow ring */}
          <div className="w-20 h-20 rounded-full border-4 border-pink-400 shadow-[0_0_30px_rgba(244,63,94,0.9),0_0_60px_rgba(244,63,94,0.5)] animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-4 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.6)] flex items-center justify-center relative">
            <Crosshair className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-center">
            <p className="font-display text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] tracking-widest">{round.zoneLabel}</p>
          </div>
        </div>
      )}

      {/* REVEAL — target position (gold) + shot position (white splat) */}
      {subPhase === 'reveal' && currentShot && (
        <>
          {/* Target marker */}
          <div
            className="absolute pointer-events-none"
            style={{ left: `${round.targetX}%`, top: `${round.targetY}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-12 h-12 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-center text-[10px] text-yellow-300 mt-1 font-bold tracking-widest">TARGET</p>
          </div>

          {/* Shot marker */}
          <div
            className="absolute pointer-events-none"
            style={{ left: `${currentShot.x}%`, top: `${currentShot.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <SplatMark />
            <p className="text-center text-[10px] text-white mt-1 font-bold tracking-widest">YOU</p>
          </div>

          {/* Score popup */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
            <div className={`rounded-2xl px-8 py-5 text-center shadow-2xl ${
              currentShot.score >= 80 ? 'bg-yellow-500/95' :
              currentShot.score >= 55 ? 'bg-pink-600/95' :
              currentShot.score >= 30 ? 'bg-fuchsia-600/95' : 'bg-zinc-700/95'
            }`}>
              <p className="text-[11px] tracking-[0.4em] uppercase text-white/80 mb-0.5">
                {currentShot.score >= 80 ? '🎯 Dead On' : currentShot.score >= 55 ? '✅ Close' : currentShot.score >= 30 ? '⚠️ Off Target' : '❌ Missed'}
              </p>
              <p className="font-display text-5xl text-white">+{currentShot.score}</p>
              <p className="text-white/70 text-xs mt-0.5">{Math.round(currentShot.dist)}% away</p>
            </div>
          </div>
        </>
      )}

      {/* Ripple on tap */}
      {ripple && (
        <div
          key={ripple.id}
          className="absolute pointer-events-none rounded-full border-4 border-white/80 animate-ping"
          style={{ left: `${ripple.x}%`, top: `${ripple.y}%`, width: 60, height: 60, transform: 'translate(-50%,-50%)', animationDuration: '0.4s' }}
        />
      )}

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center gap-3 px-4 pt-safe pt-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">
          {/* Round pips */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${
                i < shots.length ? 'bg-pink-400' :
                i === currentRound ? 'bg-white shadow-[0_0_8px_white]' :
                'bg-white/20'
              }`} />
            ))}
          </div>
          <div className="flex-1" />
          <div className="font-display text-lg text-white tracking-wider">{currentRound + 1}/{TOTAL_ROUNDS}</div>
          <div className="font-display text-lg text-pink-300">{totalScore + (currentShot?.score ?? 0)}</div>
          <button onClick={onClose} className="pointer-events-auto p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors ml-1">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Countdown */}
      {showCountdown !== null && showCountdown > 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="font-display text-[160px] text-white/90 leading-none drop-shadow-[0_0_60px_rgba(244,63,94,0.8)]" style={{ animation: 'countPulse 0.9s ease-out' }}>
            {showCountdown}
          </div>
        </div>
      )}

      {/* FIRE instruction */}
      {subPhase === 'fire' && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-4 text-center border border-pink-500/40 shadow-lg shadow-pink-900/40">
            <p className="text-[11px] tracking-[0.4em] uppercase text-pink-400 mb-0.5">Round {currentRound + 1} · {round.zoneLabel}</p>
            <p className="font-display text-3xl text-white tracking-widest">TAP WHERE YOU'LL FINISH</p>
            <p className="text-zinc-400 text-xs mt-1">Target was on her {round.zoneLabel.toLowerCase()}. Aim true.</p>
          </div>
        </div>
      )}

      {/* SHOWING instruction */}
      {subPhase === 'showing' && showCountdown === null && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-4 text-center border border-yellow-500/30">
            <p className="font-display text-2xl text-yellow-200 tracking-widest">AIM FOR HER {round.zoneLabel} {round.zoneEmoji}</p>
            <p className="text-zinc-400 text-xs mt-1 animate-pulse">Memorise the target…</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes countPulse {
          0%   { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.7); }
        }
      `}</style>
    </div>
  )
}

function SplatMark() {
  return (
    <div className="w-14 h-14 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {[0,40,80,125,165,205,250,295,335].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const r = 26 + (i % 3) * 8
          const x2 = 50 + Math.cos(rad) * r
          const y2 = 50 + Math.sin(rad) * r
          return (
            <g key={i}>
              <line x1="50" y1="50" x2={x2} y2={y2} stroke="#ffb6d9" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
              <circle cx={x2} cy={y2} r="4.5" fill="#ff6eb4" opacity="0.95" />
            </g>
          )
        })}
        <circle cx="50" cy="50" r="16" fill="#ffb6d9" opacity="0.92" />
        <circle cx="50" cy="50" r="8" fill="white" opacity="0.98" />
      </svg>
    </div>
  )
}
