import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Gamepad2, Flame, Sparkles, RefreshCw, Heart, Dices, ExternalLink,
  Loader2, Trophy, X as XIcon, ChevronRight, Lock, Unlock, Eye,
} from 'lucide-react'
import { HentaiMemoryMatch, HentaiSlidePuzzle } from './HentaiMiniGames'
import TargetPractice from './TargetPractice'
import WaifuBattle from './WaifuBattle'

// ─── Strip Higher or Lower ────────────────────────────────────────────
const STRIP_LEVELS: { name: string; prompt: string; emoji: string }[] = [
  { name: 'School Uniform',  emoji: '🎒', prompt: 'gorgeous anime hentai schoolgirl in seifuku uniform with pleated skirt, big eyes, blushing cheeks, bedroom background, soft afternoon light' },
  { name: 'Casual Reveal',   emoji: '👕', prompt: 'gorgeous anime hentai girl in tight crop top and tiny skirt, blushing, big sparkling anime eyes, sultry pose, dorm bedroom, sunset light' },
  { name: 'Lingerie',        emoji: '👙', prompt: 'gorgeous anime hentai girl in sexy red lace lingerie, garter belt and stockings, blushing, sultry pose, candlelit bedroom' },
  { name: 'Just a Towel',    emoji: '🛁', prompt: 'gorgeous anime hentai girl wrapped in nothing but a small white towel, fresh from the bath, steamy bathroom, water droplets on skin, blushing, sultry pose' },
  { name: 'Tease',           emoji: '🔥', prompt: 'gorgeous anime hentai girl in only black panties, arms covering chest, blushing deep red, sultry pose, candlelit bedroom, silk sheets' },
  { name: 'Fully Bare',      emoji: '🌶️', prompt: 'tasteful nude anime hentai pin-up girl, hands strategically posed, blushing cheeks, soft golden lighting, silk sheets bedroom, fine art hentai illustration' },
]

const SUITS = ['♥', '♦', '♣', '♠'] as const
type Suit = typeof SUITS[number]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
type Rank = typeof RANKS[number]

interface Card { suit: Suit; rank: Rank; value: number }

function makeCard(): Card {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)]
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
  const value = rank === 'A' ? 1 : rank === 'J' ? 11 : rank === 'Q' ? 12 : rank === 'K' ? 13 : parseInt(rank, 10)
  return { suit, rank, value }
}

// Easy mode: bias the "current" card so the answer is obvious.
// Pick from {A,2,3,4} (clearly low → guess HIGHER) or {10,J,Q,K} (clearly high → guess LOWER).
function makeEasyCard(): Card {
  const easyRanks: Rank[] = ['A', '2', '3', '4', '10', 'J', 'Q', 'K']
  const rank = easyRanks[Math.floor(Math.random() * easyRanks.length)]
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
  const value = rank === 'A' ? 1 : rank === 'J' ? 11 : rank === 'Q' ? 12 : rank === 'K' ? 13 : parseInt(rank, 10)
  return { suit, rank, value }
}

function PlayingCard({ card, hidden }: { card: Card; hidden?: boolean }) {
  const isRed = card.suit === '♥' || card.suit === '♦'
  if (hidden) {
    return (
      <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl bg-gradient-to-br from-pink-700 via-pink-700 to-purple-800 border-2 border-white/20 flex items-center justify-center shadow-2xl">
        <Flame className="w-12 h-12 text-white/30" />
      </div>
    )
  }
  return (
    <div className={`w-28 h-40 sm:w-32 sm:h-44 rounded-xl bg-white border-2 border-zinc-300 flex flex-col items-center justify-between p-3 shadow-2xl ${isRed ? 'text-pink-600' : 'text-black'}`}>
      <div className="self-start text-xl font-bold leading-none">
        <div>{card.rank}</div>
        <div className="text-2xl leading-none">{card.suit}</div>
      </div>
      <div className="text-5xl">{card.suit}</div>
      <div className="self-end text-xl font-bold leading-none rotate-180">
        <div>{card.rank}</div>
        <div className="text-2xl leading-none">{card.suit}</div>
      </div>
    </div>
  )
}

function StripHighOrLow({ onClose }: { onClose: () => void }) {
  const [seed] = useState(() => Math.floor(Math.random() * 99999))
  const [level, setLevel] = useState(0)
  const [streak, setStreak] = useState(0)
  const [current, setCurrent] = useState<Card>(() => makeEasyCard())
  const [next, setNext] = useState<Card | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [imageBust, setImageBust] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const levelData = STRIP_LEVELS[Math.min(level, STRIP_LEVELS.length - 1)]
  const imageUrl = `/api/aigen?prompt=${encodeURIComponent(levelData.prompt)}&aspect=portrait&seed=${seed + level * 7 + imageBust}`

  useEffect(() => { setImgLoaded(false) }, [imageUrl])

  const guess = (direction: 'higher' | 'lower') => {
    if (revealing || gameOver) return
    const drawn = makeCard()
    setNext(drawn)
    setRevealing(true)
    setTimeout(() => {
      const correct =
        (direction === 'higher' && drawn.value > current.value) ||
        (direction === 'lower' && drawn.value < current.value) ||
        drawn.value === current.value // ties win — house rule, more reveals
      if (correct) {
        const newStreak = streak + 1
        setStreak(newStreak)
        // EASY MODE: every correct guess unlocks the next reveal level
        if (level < STRIP_LEVELS.length - 1) {
          setLevel(l => Math.min(l + 1, STRIP_LEVELS.length - 1))
        }
        setTimeout(() => {
          // Always serve another easy "extreme" card so the answer stays obvious
          setCurrent(makeEasyCard())
          setNext(null)
          setRevealing(false)
        }, 1200)
      } else {
        setGameOver(true)
      }
    }, 700)
  }

  const restart = () => {
    setLevel(0); setStreak(0); setCurrent(makeEasyCard()); setNext(null); setRevealing(false); setGameOver(false); setImageBust(b => b + 1)
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black border border-pink-600/40 rounded-3xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 flex-shrink-0" />

        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-20">
          <XIcon className="w-5 h-5" />
        </button>

        <div className="px-6 py-4 flex-shrink-0 flex items-center gap-3 border-b border-white/5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-900/40">
            <Dices className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl tracking-wider text-white leading-none">STRIP HIGHER OR LOWER</h2>
            <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">Guess right · Strip her down</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Streak</p>
              <p className="font-display text-2xl text-white leading-none flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-400" />{streak}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Level</p>
              <p className="font-display text-2xl text-pink-400 leading-none">{level + 1}/{STRIP_LEVELS.length}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* AI strip image */}
          <div className="relative bg-zinc-950 min-h-[300px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
            <img
              key={imageUrl}
              src={imageUrl}
              alt={levelData.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p className="text-xs tracking-widest uppercase">Generating reveal…</p>
              </div>
            )}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur rounded-full border border-pink-500/30 text-xs font-bold text-pink-300 tracking-widest uppercase flex items-center gap-1">
              {levelData.emoji} {levelData.name}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex gap-1">
              {STRIP_LEVELS.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= level ? 'bg-gradient-to-r from-pink-500 to-pink-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          {/* Game board */}
          <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
            {gameOver ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-600/20 border-2 border-pink-500/40 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="font-display text-3xl text-white mb-2 tracking-wider">GAME OVER</h3>
                <p className="text-zinc-400 mb-1">You reached <span className="font-bold text-pink-400">Level {level + 1}</span></p>
                <p className="text-zinc-400 mb-6">Final streak: <span className="font-bold text-amber-400">{streak}</span></p>
                <button onClick={restart} className="px-6 h-12 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold tracking-wider flex items-center gap-2 mx-auto">
                  <RefreshCw className="w-4 h-4" /> Play Again
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] tracking-widest uppercase text-zinc-500 mb-3">Will the next card be higher or lower?</p>
                <div className="flex items-end gap-3 mb-6">
                  <PlayingCard card={current} />
                  {next && <PlayingCard card={next} hidden={!revealing} />}
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  <button
                    onClick={() => guess('lower')}
                    disabled={revealing}
                    className="h-14 rounded-2xl bg-zinc-900 border-2 border-zinc-700 hover:border-pink-500 disabled:opacity-50 text-white font-bold tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    ↓ LOWER
                  </button>
                  <button
                    onClick={() => guess('higher')}
                    disabled={revealing}
                    className="h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    HIGHER ↑
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-4 text-center">Easy mode 🌸 · Cards stay near the edges · Ties win · Every correct guess unlocks the next reveal</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Spicy Wheel ──────────────────────────────────────────────────────
const WHEEL_SLICES = [
  { label: 'Strip 1 item',    color: '#ec4899', tag: 'STRIP' },
  { label: 'Truth time',      color: '#a855f7', tag: 'TRUTH' },
  { label: 'Take a shot',     color: '#f59e0b', tag: 'SHOT' },
  { label: 'Make out · 30s',  color: '#dc2626', tag: 'MAKEOUT' },
  { label: 'Pick a dare',     color: '#ef4444', tag: 'DARE' },
  { label: 'Slow dance',      color: '#f43f5e', tag: 'DANCE' },
  { label: 'Lap dance · 60s', color: '#be185d', tag: 'LAP' },
  { label: "Partner's choice", color: '#7c3aed', tag: 'CHOICE' },
]

function SpicyWheel({ onClose }: { onClose: () => void }) {
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<typeof WHEEL_SLICES[number] | null>(null)
  const sliceAngle = 360 / WHEEL_SLICES.length

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    const turns = 5 + Math.random() * 4
    const final = Math.random() * 360
    const newAngle = angle + turns * 360 + final
    setAngle(newAngle)
    setTimeout(() => {
      const normalized = (360 - (newAngle % 360) + 270) % 360
      const idx = Math.floor(normalized / sliceAngle) % WHEEL_SLICES.length
      setResult(WHEEL_SLICES[idx])
      setSpinning(false)
    }, 4200)
  }

  const conicGradient = useMemo(() => {
    const stops: string[] = []
    WHEEL_SLICES.forEach((s, i) => {
      const start = i * sliceAngle
      const end = (i + 1) * sliceAngle
      stops.push(`${s.color} ${start}deg ${end}deg`)
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [sliceAngle])

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 to-black border border-pink-600/40 rounded-3xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600" />
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-zinc-400 hover:text-white z-20">
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-white leading-none">SPICY WHEEL</h2>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">Spin · Obey · Repeat</p>
            </div>
          </div>

          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto my-4">
            {/* pointer */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-pink-500 drop-shadow-lg" />
            {/* wheel */}
            <div
              className="absolute inset-0 rounded-full shadow-2xl shadow-pink-900/50 border-4 border-white/10 transition-transform duration-[4000ms] ease-out"
              style={{ background: conicGradient, transform: `rotate(${angle}deg)` }}
            >
              {WHEEL_SLICES.map((s, i) => {
                const rot = i * sliceAngle + sliceAngle / 2
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 origin-left text-white font-bold text-[10px] sm:text-xs tracking-wider whitespace-nowrap pointer-events-none"
                    style={{ transform: `rotate(${rot}deg) translateX(45px)` }}
                  >
                    {s.tag}
                  </div>
                )
              })}
            </div>
            {/* center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-pink-600 border-4 border-black flex items-center justify-center z-10 shadow-xl">
              <Flame className="w-7 h-7 text-white" />
            </div>
          </div>

          <button
            onClick={spin}
            disabled={spinning}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-pink-900/40"
          >
            {spinning ? 'SPINNING…' : 'SPIN THE WHEEL'}
          </button>

          {result && !spinning && (
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/40 text-center animate-slide-up">
              <p className="text-[10px] tracking-widest text-pink-300 uppercase mb-1">The wheel chose</p>
              <p className="font-display text-2xl text-white tracking-wide">{result.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reveal Scratch — click to scratch off and reveal AI image ─────────
function RevealScratch({ onClose }: { onClose: () => void }) {
  const PROMPTS = [
    'gorgeous anime hentai girl in red lace lingerie on silk sheets, big sparkling eyes, blushing, candlelit bedroom',
    'cute anime hentai girl in tiny black bikini at sunset beach, twin tails, sultry pose, golden hour',
    'sexy anime hentai goth girl in fishnet stockings and leather, purple hair, neon red glow, sultry pose',
    'sweet anime hentai girl in oversized white shirt and panties, morning light, bedroom, blushing',
    'gorgeous anime hentai girl in steamy bath, water droplets, blushing, sultry pose, long flowing hair',
    'gorgeous anime hentai catgirl in maid outfit, cat ears and tail, blushing, sultry pose, cafe background',
    'gorgeous anime hentai elf girl in revealing fantasy armor, long pointy ears, blushing, magical forest',
  ]
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999))
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length))
  const [scratched, setScratched] = useState<Set<number>>(new Set())
  const [imgLoaded, setImgLoaded] = useState(false)

  const tiles = 36 // 6x6
  const revealed = scratched.size
  const isRevealed = revealed >= tiles - 6

  const url = `/api/aigen?prompt=${encodeURIComponent(PROMPTS[promptIdx])}&aspect=portrait&seed=${seed}`

  const next = () => {
    setSeed(Math.floor(Math.random() * 99999))
    setPromptIdx((i) => (i + 1) % PROMPTS.length)
    setScratched(new Set())
    setImgLoaded(false)
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-black border border-pink-600/40 rounded-3xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600" />
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-zinc-400 hover:text-white z-20">
          <XIcon className="w-5 h-5" />
        </button>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><Eye className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-white leading-none">REVEAL ROULETTE</h2>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">Tap tiles · Reveal her</p>
            </div>
          </div>

          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img
              key={url}
              src={url}
              alt=""
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              </div>
            )}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-px">
              {Array.from({ length: tiles }).map((_, i) => {
                const off = scratched.has(i)
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setScratched(s => { if (s.has(i)) return s; const n = new Set(s); n.add(i); return n })}
                    onClick={() => setScratched(s => { if (s.has(i)) return s; const n = new Set(s); n.add(i); return n })}
                    className={`transition-opacity duration-300 ${off ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    style={{ background: 'linear-gradient(135deg, #1a1a1a, #000)' }}
                  >
                    <Lock className="w-3 h-3 text-pink-500/30 mx-auto" />
                  </button>
                )
              })}
            </div>
            {isRevealed && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-pink-600 text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 animate-slide-up">
                <Unlock className="w-3 h-3" /> Revealed
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setScratched(new Set(Array.from({ length: tiles }, (_, i) => i)))} className="h-12 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-pink-500 text-white font-bold text-sm tracking-wider transition-colors">
              Reveal All
            </button>
            <button onClick={next} className="h-12 rounded-xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold text-sm tracking-wider transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Next Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── External games iframe viewer with fallback ───────────────────────
interface ExternalGame {
  id: string
  title: string
  desc: string
  url: string
  embed?: string
  emoji: string
  tag: string
}

// Hentai-themed external games. We embed via /api/gameproxy which strips
// X-Frame-Options & CSP frame-ancestors so the iframe actually loads.
// "New Tab" remains as a guaranteed-working fallback.
const EXTERNAL_GAMES: ExternalGame[] = [
  {
    id: 'hentaiheroes',
    title: 'Hentai Heroes',
    desc: 'Anime harem RPG — recruit hentai girls, battle rivals, unlock explicit scenes.',
    url: 'https://www.hentaiheroes.com/',
    emoji: '⚔️', tag: 'HENTAI RPG',
  },
  {
    id: 'gayharemheroes',
    title: 'Hentai Clicker',
    desc: 'Idle clicker hentai game — tap to charm anime waifus and unlock NSFW art.',
    url: 'https://www.hentaiclicker.com/',
    emoji: '👆', tag: 'IDLE HENTAI',
  },
  {
    id: 'pussysaga',
    title: 'Pussy Saga',
    desc: 'Anime match-3 puzzle — clear levels to unlock hentai reward scenes.',
    url: 'https://pussysaga.com/',
    emoji: '🧩', tag: 'PUZZLE',
  },
  {
    id: 'bootyfarm',
    title: 'Booty Farm',
    desc: 'Sexy farming sim — grow crops, romance hentai farm girls, unlock dirty scenes.',
    url: 'https://bootyfarm.nutaku.net/',
    emoji: '🌽', tag: 'FARM SIM',
  },
  {
    id: 'kamihime',
    title: 'Kamihime Project R',
    desc: 'Japanese anime gacha RPG with explicit hentai illustrations of goddess characters.',
    url: 'https://www.nutaku.net/games/kamihime-project-r/play/',
    emoji: '⛩️', tag: 'GACHA',
  },
  {
    id: 'fapceo',
    title: 'Fap CEO',
    desc: 'Build your hentai webcam empire — hire and train sexy anime models.',
    url: 'https://www.fapceo.com/',
    emoji: '💼', tag: 'TYCOON',
  },
  {
    id: 'harem-heat',
    title: 'Harem Heat',
    desc: 'Visual-novel harem builder — collect hentai girls and roleplay scenes.',
    url: 'https://harem-heat.com/',
    emoji: '🔥', tag: 'VN',
  },
  {
    id: 'comix-harem',
    title: 'Comix Harem',
    desc: 'Comic-style harem RPG with explicit hentai art and battle action.',
    url: 'https://www.comixharem.com/',
    emoji: '📚', tag: 'COMIC',
  },
  {
    id: 'hentai-clicker',
    title: 'Tit Tycoon',
    desc: 'Hentai-themed business tycoon — recruit busty anime employees.',
    url: 'https://tittycoin.com/',
    emoji: '💰', tag: 'TYCOON',
  },
]

// Downloadable PC games — zips uploaded by the user that get hosted out of
// app/public/games/ and served as direct downloads. Used for desktop-only
// builds (Unity Windows, etc.) that can't run in a browser.
interface DownloadGame {
  id: string
  title: string
  desc: string
  file: string        // path under /games/
  size: string
  platform: string
  emoji: string
  tag: string
}

const DOWNLOAD_GAMES: DownloadGame[] = []

function ExternalGameModal({ game, onClose }: { game: ExternalGame; onClose: () => void }) {
  const [failed, setFailed] = useState(false)
  // Route through our proxy by default to bypass X-Frame-Options / CSP.
  const embedSrc = game.embed || `/api/gameproxy?url=${encodeURIComponent(game.url)}`
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 bg-black/95 backdrop-blur-xl">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-zinc-950 border border-pink-600/40 rounded-2xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-zinc-900 flex-shrink-0">
          <span className="text-2xl">{game.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{game.title}</p>
            <p className="text-[11px] text-zinc-500 truncate">{game.url}</p>
          </div>
          <a href={game.url} target="_blank" rel="noopener noreferrer" className="px-3 h-9 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold tracking-wider flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> New Tab
          </a>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"><XIcon className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 relative bg-black">
          {!failed ? (
            <iframe
              src={embedSrc}
              title={game.title}
              className="w-full h-full"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-600/20 border border-pink-500/40 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="font-display text-2xl text-white mb-2 tracking-wider">Site won't embed</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
                  {game.title} blocks being embedded inside other websites. Open it in a new tab to play.
                </p>
                <a href={game.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold tracking-wider">
                  <ExternalLink className="w-4 h-4" /> Play on {game.title}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main games hub ───────────────────────────────────────────────────
export default function AdultGames() {
  const [openGame, setOpenGame] = useState<'strip' | 'wheel' | 'reveal' | 'memory' | 'puzzle' | 'target' | 'battle' | null>(null)

  const builtIn = [
    {
      id: 'strip' as const,
      title: 'Hentai Higher or Lower',
      desc: 'Easy-mode card game with hentai reveals. Guess higher or lower and strip your waifu down across 6 escalating levels.',
      emoji: '🃏', tag: 'CARDS', heat: 'HOT',
      gradient: 'from-pink-600 to-pink-600',
      waifu: 'game-strip',
    },
    {
      id: 'wheel' as const,
      title: 'Waifu Wheel',
      desc: 'Spin to land on Strip · Truth · Dare · Lap Dance · or Partner\'s Choice. Eight hentai slices, infinite trouble.',
      emoji: '🎯', tag: 'PARTY', heat: 'MEDIUM',
      gradient: 'from-purple-600 to-pink-600',
      waifu: 'game-wheel',
    },
    {
      id: 'reveal' as const,
      title: 'Hentai Roulette',
      desc: 'Scratch tiles off to reveal a random hentai illustration. Hover to scratch fast.',
      emoji: '🔓', tag: 'REVEAL', heat: 'HOT',
      gradient: 'from-pink-600 to-pink-600',
      waifu: 'game-reveal',
    },
    {
      id: 'memory' as const,
      title: 'Hentai Memory Match',
      desc: 'Flip cards to match 4 pairs of unique hentai waifus. Sharp memory = faster reveals.',
      emoji: '🧠', tag: 'MEMORY', heat: 'HOT',
      gradient: 'from-purple-600 to-pink-600',
      waifu: 'game-memory',
    },
    {
      id: 'puzzle' as const,
      title: 'Hentai Slide Puzzle',
      desc: '3×3 sliding puzzle of a hentai illustration. Solve to fully reveal your waifu.',
      emoji: '🧩', tag: 'PUZZLE', heat: 'HOT',
      gradient: 'from-pink-600 to-purple-600',
      waifu: 'game-puzzle',
    },
    {
      id: 'target' as const,
      title: 'Target Practice',
      desc: '3D / CGI and feet targets pop up on screen. Click them before they vanish. 60 seconds, crosshair cursor, pink splat on every hit.',
      emoji: '🎯', tag: 'AIM', heat: 'HOT',
      gradient: 'from-fuchsia-600 to-pink-500',
      waifu: 'game-target',
    },
    {
      id: 'battle' as const,
      title: 'Waifu Battle',
      desc: 'Two fighters. You pick the winner. Hot-or-Not voting across 3D CGI, Waifu, Feet or Mixed. Builds a personal Hall of Fame.',
      emoji: '⚔️', tag: 'VOTE', heat: 'HOT',
      gradient: 'from-pink-600 to-purple-600',
      waifu: 'game-battle',
    },
  ]

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.3em] text-pink-400 uppercase mb-2 flex items-center justify-center gap-2">
            <Flame className="w-3 h-3" /> Adults Only · 18+
          </p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-wider mb-3 bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">
            HENTAI ARCADE 🌸
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">Play built-in waifu mini-games with live AI-generated hentai art, or dive into the hottest browser hentai games on the net.</p>
        </div>

        {/* Built-in games */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="font-display text-base tracking-widest text-white/80 uppercase">Built-in · Powered by AI</h3>
            <span className="ml-auto text-[10px] text-zinc-500 tracking-widest uppercase">Instant play</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {builtIn.map(g => (
              <button
                key={g.id}
                onClick={() => setOpenGame(g.id)}
                className="group text-left rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/60 bg-gradient-to-br from-zinc-900 to-black hover:scale-[1.02] transition-all"
              >
                <div className={`relative h-56 bg-gradient-to-br ${g.gradient} flex items-center justify-center overflow-hidden`}>
                  {/* Nude hentai waifu pulled from public gallery, cached server-side */}
                  <img
                    src={`/api/icon/${g.waifu}`}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="relative text-6xl drop-shadow-2xl opacity-0 group-hover:opacity-90 transition-opacity">{g.emoji}</span>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-white tracking-widest z-10">{g.tag}</div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-pink-600/80 backdrop-blur text-[10px] font-bold text-white tracking-widest flex items-center gap-1 z-10">
                    <Flame className="w-2.5 h-2.5" /> {g.heat}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                </div>
                <div className="p-4">
                  <h4 className="font-display text-xl tracking-wide text-white mb-1.5">{g.title}</h4>
                  <p className="text-sm text-zinc-400 leading-snug mb-3">{g.desc}</p>
                  <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs tracking-widest uppercase group-hover:gap-2.5 transition-all">
                    Play Now <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* External games */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 className="w-4 h-4 text-pink-400" />
            <h3 className="font-display text-base tracking-widest text-white/80 uppercase">Popular Hentai Games</h3>
            <span className="ml-auto text-[10px] text-zinc-500 tracking-widest uppercase">Embedded via proxy · or new tab</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {EXTERNAL_GAMES.map(g => (
              <a
                key={g.id}
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-left rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/60 bg-gradient-to-br from-zinc-900 to-zinc-950 transition-all hover:scale-[1.02]"
              >
                {/* Nude hentai waifu thumbnail under each external game card */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={`/api/icon/ext-${g.id}`}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span className="absolute top-2 right-2 text-3xl drop-shadow-2xl">{g.emoji}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm truncate">{g.title}</h4>
                  </div>
                  <span className="inline-block mb-2 text-[10px] font-bold bg-pink-500/15 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/30 tracking-widest">{g.tag}</span>
                  <p className="text-xs text-zinc-400 leading-snug mb-3 line-clamp-2">{g.desc}</p>
                  <div className="flex items-center gap-1.5 text-pink-400 font-bold text-[11px] tracking-widest uppercase group-hover:gap-2.5 transition-all">
                    Open in New Tab <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Downloadable PC games */}
        {DOWNLOAD_GAMES.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <h3 className="font-display text-base tracking-widest text-white/80 uppercase">Downloadable PC Games</h3>
              <span className="ml-auto text-[10px] text-zinc-500 tracking-widest uppercase">Desktop only · Native install</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOWNLOAD_GAMES.map(g => (
                <a
                  key={g.id}
                  href={g.file}
                  download
                  className="group text-left rounded-2xl overflow-hidden border border-amber-500/20 hover:border-amber-400/60 bg-gradient-to-br from-zinc-900 to-zinc-950 transition-all hover:scale-[1.02]"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={`/api/icon/dl-${g.id}`}
                      alt={g.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <span className="absolute top-2 right-2 text-3xl drop-shadow-2xl">{g.emoji}</span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-black text-[10px] font-bold tracking-widest">
                      {g.platform.toUpperCase()} · {g.size}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-sm truncate">{g.title}</h4>
                    </div>
                    <span className="inline-block mb-2 text-[10px] font-bold bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 tracking-widest">{g.tag}</span>
                    <p className="text-xs text-zinc-400 leading-snug mb-3 line-clamp-2">{g.desc}</p>
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] tracking-widest uppercase group-hover:gap-2.5 transition-all">
                      Download Zip <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-pink-500/5 border border-amber-500/20 flex items-start gap-3">
          <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400 leading-relaxed space-y-2">
            <p>
              <span className="font-bold text-white">Why these open in a new tab:</span> every major adult-game platform (Nutaku, Hentai Heroes, Pussy Saga, Fap CEO, etc.) uses login cookies + strict CORS / X-Frame headers and redirects out of any embed. Even with a proxy they break on first interaction — so we link straight out for a guaranteed working experience.
            </p>
            <p>
              <span className="font-bold text-white">Want a fully embedded hentai game?</span> Drop an HTML5 build into <code className="px-1.5 py-0.5 rounded bg-black/40 text-pink-300">app/public/games/&lt;name&gt;/</code> and it will load in-page (same-origin, no CSP issues). Suggested free downloads:
            </p>
            <ul className="list-disc list-inside text-zinc-500 space-y-1 ml-2">
              <li><a className="text-pink-400 hover:underline" href="https://itch.io/games/tag-hentai/tag-html5" target="_blank" rel="noopener noreferrer">itch.io · Hentai HTML5 games</a> — pick any "HTML" tagged game, "Download" → unzip into <code>public/games/</code>.</li>
              <li><a className="text-pink-400 hover:underline" href="https://itch.io/games/tag-adult/tag-html5" target="_blank" rel="noopener noreferrer">itch.io · Adult HTML5 games</a></li>
              <li><a className="text-pink-400 hover:underline" href="https://www.newgrounds.com/portal/browse/sort/score/interval/all/genre/2/tag/hentai" target="_blank" rel="noopener noreferrer">Newgrounds · Hentai · Adventure</a> — older Flash games (need Ruffle), newer HTML5 work directly.</li>
            </ul>
            <p className="text-zinc-500">
              Send me a download link or upload the unpacked folder and I'll add a card that loads it in-app.
            </p>
          </div>
        </div>
      </div>

      {openGame === 'strip' && <StripHighOrLow onClose={() => setOpenGame(null)} />}
      {openGame === 'wheel' && <SpicyWheel onClose={() => setOpenGame(null)} />}
      {openGame === 'reveal' && <RevealScratch onClose={() => setOpenGame(null)} />}
      {openGame === 'memory' && <HentaiMemoryMatch onClose={() => setOpenGame(null)} />}
      {openGame === 'puzzle' && <HentaiSlidePuzzle onClose={() => setOpenGame(null)} />}
      {openGame === 'target' && <TargetPractice onClose={() => setOpenGame(null)} />}
      {openGame === 'battle' && <WaifuBattle onClose={() => setOpenGame(null)} />}
    </section>
  )
}
