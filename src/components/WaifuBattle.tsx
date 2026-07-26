import { useState, useEffect, useCallback, useRef } from 'react'
import { Trophy, RefreshCw, Flame, X as XIcon, Crown, Swords, Heart, Zap, Check } from 'lucide-react'

interface Fighter {
  url: string
  wins: number
  losses: number
  battles: number
}

type BattleMode = 'waifu' | 'realistic3d' | 'feet' | 'mixed'

const MODE_META: Record<BattleMode, { label: string; cats: string[]; color: string; emoji: string; desc: string }> = {
  waifu:      { label: 'Waifu',   cats: ['waifu','neko','ahegao','boobs'],             color: 'from-pink-500 to-rose-500',    emoji: '🌸', desc: 'Anime waifus' },
  realistic3d:{ label: '3D / CGI',cats: ['realistic3d'],                               color: 'from-fuchsia-600 to-pink-600', emoji: '🎯', desc: 'Realistic renders' },
  feet:       { label: 'Feet',    cats: ['feet','footfocus','soles','barefoot'],        color: 'from-rose-500 to-pink-400',    emoji: '🦶', desc: 'Foot focus only' },
  mixed:      { label: 'Mixed',   cats: ['waifu','realistic3d','feet','ass','anal'],    color: 'from-purple-600 to-pink-500',  emoji: '💥', desc: 'All categories' },
}

const TOURNAMENT_SIZE = 16
const STORAGE_KEY = 'goonit-waifu-battle-stats'

function loadStats(): Record<string, Fighter> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveStats(stats: Record<string, Fighter>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

function roundLabel(matchupCount: number): string {
  if (matchupCount >= 8) return 'ROUND OF 16'
  if (matchupCount === 4) return 'QUARTER FINALS'
  if (matchupCount === 2) return 'SEMI FINALS'
  return 'THE FINAL'
}

function roundNumber(matchupCount: number): string {
  if (matchupCount >= 8) return 'R16'
  if (matchupCount === 4) return 'QF'
  if (matchupCount === 2) return 'SF'
  return 'F'
}

export default function WaifuBattle({
  onClose,
  onSaveToVault,
}: {
  onClose: () => void
  onSaveToVault?: (url: string) => void
}) {
  const [mode, setMode] = useState<BattleMode | null>(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'menu' | 'tournament' | 'champion' | 'leaderboard'>('menu')
  const [stats, setStats] = useState<Record<string, Fighter>>(loadStats)

  // Tournament state
  const [bracket, setBracket] = useState<[string, string][]>([])
  const [matchupIdx, setMatchupIdx] = useState(0)
  const [roundWinners, setRoundWinners] = useState<string[]>([])
  const [champion, setChampion] = useState<string | null>(null)
  const [voteResult, setVoteResult] = useState<'left' | 'right' | null>(null)
  const [animating, setAnimating] = useState(false)
  const [savedToVault, setSavedToVault] = useState(false)

  const fetchPool = useCallback(async (m: BattleMode): Promise<string[]> => {
    const { cats } = MODE_META[m]
    const calls = cats.flatMap(cat => [
      fetch(`/api/gallery?cat=${cat}&page=1&count=40`).then(r => r.json()),
      fetch(`/api/gallery?cat=${cat}&page=2&count=40`).then(r => r.json()),
      fetch(`/api/gallery?cat=${cat}&page=3&count=40`).then(r => r.json()),
    ])
    const results = await Promise.allSettled(calls)
    const urls: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value?.files)) {
        urls.push(...r.value.files.filter((f: string) => /\.(jpe?g|png|webp)(\?|$)/i.test(f)))
      }
    }
    // Dedupe
    const unique = [...new Set(urls)]
    // Shuffle
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]]
    }
    return unique
  }, [])

  const buildBracket = (pool: string[]): [string, string][] => {
    // Pick N images — largest power of 2 up to TOURNAMENT_SIZE
    let n = 2
    while (n * 2 <= Math.min(pool.length, TOURNAMENT_SIZE)) n *= 2
    const selected = pool.slice(0, n)
    const pairs: [string, string][] = []
    for (let i = 0; i < selected.length - 1; i += 2) {
      pairs.push([selected[i], selected[i + 1]])
    }
    return pairs
  }

  const startTournament = async (m: BattleMode) => {
    setMode(m)
    setLoading(true)
    setChampion(null)
    setSavedToVault(false)
    try {
      const pool = await fetchPool(m)
      const pairs = buildBracket(pool)
      setBracket(pairs)
      setMatchupIdx(0)
      setRoundWinners([])
      setVoteResult(null)
      setAnimating(false)
      setPhase('tournament')
    } finally {
      setLoading(false)
    }
  }

  const vote = useCallback((side: 'left' | 'right') => {
    if (animating || voteResult || bracket.length === 0) return
    const [leftUrl, rightUrl] = bracket[matchupIdx]
    const winUrl = side === 'left' ? leftUrl : rightUrl
    const loseUrl = side === 'left' ? rightUrl : leftUrl

    setVoteResult(side)
    setAnimating(true)

    setStats(prev => {
      const next = { ...prev }
      if (!next[winUrl]) next[winUrl] = { url: winUrl, wins: 0, losses: 0, battles: 0 }
      next[winUrl].wins++; next[winUrl].battles++
      if (!next[loseUrl]) next[loseUrl] = { url: loseUrl, wins: 0, losses: 0, battles: 0 }
      next[loseUrl].losses++; next[loseUrl].battles++
      saveStats(next)
      return next
    })

    setTimeout(() => {
      const newWinners = [...roundWinners, winUrl]
      const nextIdx = matchupIdx + 1

      if (nextIdx >= bracket.length) {
        // Round done
        if (newWinners.length === 1) {
          // Champion!
          setChampion(newWinners[0])
          setPhase('champion')
        } else {
          // Build next round bracket
          const nextBracket: [string, string][] = []
          for (let i = 0; i < newWinners.length - 1; i += 2) {
            nextBracket.push([newWinners[i], newWinners[i + 1]])
          }
          setBracket(nextBracket)
          setMatchupIdx(0)
          setRoundWinners([])
        }
      } else {
        setMatchupIdx(nextIdx)
        setRoundWinners(newWinners)
      }

      setVoteResult(null)
      setAnimating(false)
    }, 750)
  }, [animating, voteResult, bracket, matchupIdx, roundWinners])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'tournament') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') vote('left')
      if (e.key === 'ArrowRight' || e.key === 'd') vote('right')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, vote])

  const topFighters = Object.values(stats)
    .filter(f => f.battles >= 2)
    .sort((a, b) => (b.wins / b.battles) - (a.wins / a.battles))
    .slice(0, 10)

  // Progress through tournament
  const totalMatchups = (() => {
    // Total matchups = n - 1 for n fighters
    const firstRoundSize = bracket.length > 0 ? bracket.length : 1
    // Sum of all rounds
    let n = firstRoundSize * 2 // fighters in first round
    let total = 0
    while (n > 1) { total += n / 2; n = n / 2 }
    return total
  })()
  const completedMatchups = roundWinners.length + matchupIdx + (bracket.length > 0 ? 0 : 0)

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center p-6" style={{ backdropFilter: 'blur(16px)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Swords className="w-8 h-8 text-pink-300" />
            <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white">WAIFU FIGHTER</h1>
            <Swords className="w-8 h-8 text-pink-300" />
          </div>
          <p className="text-pink-200/60 text-base max-w-sm mx-auto leading-relaxed">
            {TOURNAMENT_SIZE} photos enter. You keep picking the hotter one.<br />
            <span className="text-pink-300 font-semibold">Only one becomes your champion — saved to your Vault.</span>
          </p>
          <p className="text-zinc-500 text-xs mt-2">← → Arrow keys or A/D to vote fast</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto mb-3" />
            <p className="text-pink-300 font-display tracking-wider text-xl animate-pulse">LOADING FIGHTERS…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
            {(Object.entries(MODE_META) as [BattleMode, typeof MODE_META[BattleMode]][]).map(([id, meta]) => (
              <button
                key={id}
                onClick={() => startTournament(id)}
                className={`rounded-2xl p-5 bg-gradient-to-br ${meta.color} text-white font-bold flex flex-col items-center gap-2 shadow-2xl hover:scale-105 transition-transform active:scale-95`}
              >
                <span className="text-3xl">{meta.emoji}</span>
                <span className="font-display tracking-wider text-lg">{meta.label}</span>
                <span className="text-[11px] opacity-70 font-normal">{meta.desc}</span>
              </button>
            ))}
          </div>
        )}

        {topFighters.length > 0 && (
          <button
            onClick={() => setPhase('leaderboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 font-semibold hover:bg-yellow-500/25 transition-colors"
          >
            <Trophy className="w-4 h-4" /> Hall of Fame ({topFighters.length})
          </button>
        )}
      </div>
    )
  }

  // ── CHAMPION ──────────────────────────────────────────────────────────────
  if (phase === 'champion' && champion) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
        {/* Champion image fills the background */}
        <img
          src={champion}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />

        {/* Top badge */}
        <div className="relative z-10 flex justify-center pt-8 px-4">
          <div className="flex items-center gap-3 bg-yellow-500/20 border border-yellow-400/50 rounded-2xl px-6 py-3 backdrop-blur-sm">
            <Crown className="w-7 h-7 text-yellow-300" />
            <span className="font-display text-3xl text-yellow-200 tracking-widest">YOUR CHAMPION</span>
            <Crown className="w-7 h-7 text-yellow-300" />
          </div>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 mt-auto p-6 text-center">
          <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
            She beat every other contender.<br />
            <span className="text-pink-300">She's your favourite. Save her to the Vault.</span>
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {onSaveToVault && (
              <button
                onClick={() => {
                  if (!savedToVault) {
                    onSaveToVault(champion)
                    setSavedToVault(true)
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-display text-xl tracking-wider transition-all shadow-lg ${
                  savedToVault
                    ? 'bg-green-600/80 text-green-100 cursor-default'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white active:scale-95'
                }`}
              >
                {savedToVault ? (
                  <><Check className="w-5 h-5" /> SAVED TO VAULT</>
                ) : (
                  <><Heart className="w-5 h-5 fill-white" /> SAVE TO VAULT</>
                )}
              </button>
            )}
            <button
              onClick={() => mode && startTournament(mode)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> New Tournament
            </button>
            <button
              onClick={() => setPhase('menu')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold transition-colors"
            >
              Change Mode
            </button>
          </div>
          <button onClick={onClose} className="mt-4 text-sm text-zinc-600 hover:text-zinc-400 transition-colors">Exit</button>
        </div>
      </div>
    )
  }

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  if (phase === 'leaderboard') {
    return (
      <div className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center p-6" style={{ backdropFilter: 'blur(16px)' }}>
        <button onClick={() => setPhase('menu')} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mb-6">
          <Crown className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
          <h2 className="font-display text-4xl tracking-wider text-white">HALL OF FAME</h2>
          <p className="text-zinc-500 text-sm mt-1">Ranked by win rate</p>
        </div>

        <div className="w-full max-w-md space-y-2 max-h-[60vh] overflow-y-auto">
          {topFighters.map((f, i) => {
            const winRate = Math.round((f.wins / f.battles) * 100)
            return (
              <div key={f.url} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-lg flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-zinc-300 text-zinc-700' : i === 2 ? 'bg-amber-600 text-amber-100' : 'bg-white/10 text-zinc-400'
                }`}>{i + 1}</div>
                <img src={f.url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-400 to-fuchsia-500 rounded-full" style={{ width: `${winRate}%` }} />
                    </div>
                    <span className="font-display text-lg text-pink-300 flex-shrink-0">{winRate}%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{f.wins}W · {f.losses}L · {f.battles} battles</p>
                </div>
                {onSaveToVault && (
                  <button
                    onClick={() => onSaveToVault(f.url)}
                    className="p-2 rounded-lg bg-pink-600/30 hover:bg-pink-600/60 text-pink-300 transition-colors flex-shrink-0"
                    title="Save to Vault"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setPhase('menu')}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold"
        >
          <Swords className="w-4 h-4" /> Back to Menu
        </button>
      </div>
    )
  }

  // ── TOURNAMENT ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-3" />
          <p className="text-pink-300 font-display tracking-wider text-xl animate-pulse">LOADING FIGHTERS…</p>
        </div>
      </div>
    )
  }

  const [leftUrl, rightUrl] = bracket[matchupIdx] ?? [null, null]
  const currentRoundLabel = roundLabel(bracket.length)
  const currentRoundShort = roundNumber(bracket.length)

  // Count how many matchups completed this tournament
  const matchupsThisRound = matchupIdx
  const totalMatchupsInRound = bracket.length

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0408] flex flex-col">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/70 border-b border-pink-300/10 flex-shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-display text-base sm:text-xl tracking-wider text-white">{currentRoundLabel}</span>
            {mode && <span className="text-xs text-pink-300/60 font-semibold hidden sm:inline">{MODE_META[mode].emoji} {MODE_META[mode].label}</span>}
          </div>
          <p className="text-[11px] text-zinc-500">Match {matchupIdx + 1} of {totalMatchupsInRound} · {roundWinners.length} advancing</p>
        </div>

        {/* Progress pips for current round */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalMatchupsInRound }).map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${
              i < matchupIdx ? 'bg-pink-400' :
              i === matchupIdx ? 'bg-white shadow-[0_0_6px_white]' :
              'bg-white/15'
            }`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-pink-400/60 tracking-widest hidden sm:block">{currentRoundShort}</span>
          <button onClick={() => setPhase('leaderboard')} className="flex items-center gap-1.5 text-xs text-yellow-400/80 hover:text-yellow-300 px-2 py-1 rounded hover:bg-white/10 transition-colors">
            <Trophy className="w-3.5 h-3.5" /> HOF
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Battle arena */}
      <div className="flex-1 flex overflow-hidden">
        <FighterCard
          url={leftUrl}
          side="left"
          voteResult={voteResult}
          onVote={() => vote('left')}
          shortcut="A / ←"
        />

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 w-12 bg-black/60 z-10">
          <div className="font-display text-xl text-pink-300/50 tracking-widest">VS</div>
          <Zap className="w-4 h-4 text-pink-300/30 animate-pulse" />
        </div>

        <FighterCard
          url={rightUrl}
          side="right"
          voteResult={voteResult}
          onVote={() => vote('right')}
          shortcut="D / →"
        />
      </div>

      {/* Vote buttons */}
      <div className="flex gap-0 flex-shrink-0 border-t border-pink-300/10">
        <button
          onClick={() => vote('left')}
          disabled={!!voteResult || animating}
          className="flex-1 py-4 bg-gradient-to-r from-pink-700/90 to-pink-600/90 hover:from-pink-600 hover:to-pink-500 text-white font-display text-xl sm:text-2xl tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5 fill-white flex-shrink-0" />
          <span className="truncate">SHE'S HOTTER</span>
        </button>
        <div className="w-px bg-pink-300/20 flex-shrink-0" />
        <button
          onClick={() => vote('right')}
          disabled={!!voteResult || animating}
          className="flex-1 py-4 bg-gradient-to-r from-fuchsia-700/90 to-purple-700/90 hover:from-fuchsia-600 hover:to-purple-600 text-white font-display text-xl sm:text-2xl tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span className="truncate">SHE'S HOTTER</span>
          <Heart className="w-5 h-5 fill-white flex-shrink-0" />
        </button>
      </div>

      <p className="text-center text-[10px] text-zinc-600 py-1 flex-shrink-0">← A / D → to vote with keyboard</p>

      <style>{`
        @keyframes winner-glow {
          0% { box-shadow: inset 0 0 0 0 rgba(255,182,217,0); }
          40% { box-shadow: inset 0 0 0 8px rgba(255,182,217,0.8); }
          100% { box-shadow: inset 0 0 0 5px rgba(255,182,217,0.4); }
        }
        .fighter-win { animation: winner-glow 0.6s ease-out forwards; }
        @keyframes loser-out {
          0% { opacity: 1; filter: none; }
          100% { opacity: 0.2; filter: grayscale(100%); }
        }
        .fighter-lose { animation: loser-out 0.5s ease-out forwards; }
      `}</style>
    </div>
  )
}

function FighterCard({ url, side, voteResult, onVote, shortcut }: {
  url: string | null
  side: 'left' | 'right'
  voteResult: 'left' | 'right' | null
  onVote: () => void
  shortcut: string
}) {
  const isWinner = voteResult === side
  const isLoser = voteResult !== null && voteResult !== side

  return (
    <div
      className={`flex-1 relative cursor-pointer overflow-hidden select-none ${isWinner ? 'fighter-win' : ''} ${isLoser ? 'fighter-lose' : ''}`}
      onClick={!voteResult ? onVote : undefined}
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).src = '/api/icon/waifu-1' }}
        />
      ) : (
        <div className="w-full h-full bg-zinc-900 animate-pulse" />
      )}

      {/* Hover overlay */}
      {!voteResult && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <div className="text-center">
            <p className="font-display text-2xl text-white tracking-wider">{side === 'left' ? '← SHE\'S HOTTER' : 'SHE\'S HOTTER →'}</p>
            <p className="text-pink-300/50 text-xs mt-1">{shortcut}</p>
          </div>
        </div>
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-pink-600/95 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-3">
            <Crown className="w-7 h-7 text-yellow-300" />
            <p className="font-display text-3xl text-white tracking-wider">ADVANCING</p>
          </div>
        </div>
      )}
    </div>
  )
}
