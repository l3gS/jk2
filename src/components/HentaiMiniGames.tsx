import { useState, useEffect, useMemo } from 'react'
import { X as XIcon, RefreshCw, Loader2, Trophy, Heart, Puzzle, Brain } from 'lucide-react'

// ─── Hentai Memory Match ──────────────────────────────────────────────
// 4 pairs (8 cards) of AI-generated hentai art. Flip two — match to keep.
const MEMORY_PROMPTS = [
  'gorgeous nude anime hentai catgirl with white cat ears, blushing, sultry sitting pose, soft bedroom',
  'gorgeous nude anime hentai elf girl with long blonde hair, blushing, sultry pose, magical forest',
  'gorgeous nude anime hentai succubus with purple hair and small horns, blushing, sultry pose, dark bedroom',
  'gorgeous nude anime hentai shrine maiden with long black hair, blushing, sultry pose, japanese shrine',
]

interface MemoryCard { id: number; pairId: number; prompt: string; flipped: boolean; matched: boolean }

function buildDeck(seed: number): MemoryCard[] {
  const cards: MemoryCard[] = []
  MEMORY_PROMPTS.forEach((p, i) => {
    cards.push({ id: i * 2,     pairId: i, prompt: p, flipped: false, matched: false })
    cards.push({ id: i * 2 + 1, pairId: i, prompt: p, flipped: false, matched: false })
  })
  // shuffle (fisher-yates with seeded-ish randomness)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor((Math.sin(seed + i) * 10000 - Math.floor(Math.sin(seed + i) * 10000)) * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function HentaiMemoryMatch({ onClose }: { onClose: () => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999))
  const [deck, setDeck] = useState<MemoryCard[]>(() => buildDeck(seed))
  const [first, setFirst] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)

  const allMatched = deck.every(c => c.matched)

  const restart = () => {
    const s = Math.floor(Math.random() * 99999)
    setSeed(s); setDeck(buildDeck(s)); setFirst(null); setMoves(0); setBusy(false)
  }

  const click = (i: number) => {
    if (busy || deck[i].flipped || deck[i].matched) return
    const next = deck.slice()
    next[i] = { ...next[i], flipped: true }
    setDeck(next)
    if (first === null) { setFirst(i); return }
    setBusy(true); setMoves(m => m + 1)
    setTimeout(() => {
      setDeck(d => {
        const a = d[first], b = d[i]
        if (a.pairId === b.pairId) {
          const upd = d.slice()
          upd[first] = { ...a, matched: true }
          upd[i]     = { ...b, matched: true }
          return upd
        } else {
          const upd = d.slice()
          upd[first] = { ...a, flipped: false }
          upd[i]     = { ...b, flipped: false }
          return upd
        }
      })
      setFirst(null); setBusy(false)
    }, 900)
  }

  const imgUrlFor = (prompt: string) =>
    `/api/aigen?prompt=${encodeURIComponent(prompt)}&seed=${seed}`

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-black border border-pink-600/40 rounded-3xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600" />
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-zinc-400 hover:text-white z-20">
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl tracking-wider text-white leading-none">HENTAI MEMORY MATCH</h2>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">Match 4 waifu pairs · Powered by Grok</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Moves</p>
              <p className="font-display text-2xl text-white leading-none">{moves}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {deck.map((c, i) => (
              <button
                key={c.id}
                onClick={() => click(i)}
                disabled={c.matched}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${c.matched ? 'border-pink-500/60 opacity-90' : c.flipped ? 'border-pink-500/40' : 'border-zinc-700 hover:border-pink-500/40'}`}
              >
                {c.flipped || c.matched ? (
                  <img src={imgUrlFor(c.prompt)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-700 via-pink-700 to-purple-800 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white/40" />
                  </div>
                )}
                {c.matched && (
                  <div className="absolute inset-0 ring-2 ring-pink-400/70 rounded-xl pointer-events-none" />
                )}
              </button>
            ))}
          </div>

          {allMatched && (
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/40 text-center animate-slide-up">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-display text-2xl text-white tracking-wide">ALL WAIFUS UNLOCKED</p>
              <p className="text-zinc-400 text-sm mt-1">Cleared in <span className="font-bold text-pink-400">{moves}</span> moves</p>
              <button onClick={restart} className="mt-4 px-6 h-11 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold tracking-wider flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Hentai Slide Puzzle ──────────────────────────────────────────────
// 3x3 sliding puzzle of an AI-generated hentai image. One blank tile.
const PUZZLE_PROMPTS = [
  'gorgeous nude anime hentai pinup girl, long pink hair, blushing, sultry pose, soft pastel background',
  'gorgeous nude anime hentai bunny girl with white bunny ears, blushing, sultry pose, casino background',
  'gorgeous nude anime hentai vampire with silver hair and red eyes, blushing, sultry pose, gothic bedroom',
  'gorgeous nude anime hentai mage girl in only witch hat, long purple hair, blushing, sultry pose, magical library',
]

const PUZZLE_SIZE = 3
const TOTAL = PUZZLE_SIZE * PUZZLE_SIZE
const BLANK = TOTAL - 1

function isSolvable(arr: number[]): boolean {
  let inv = 0
  const noBlank = arr.filter(v => v !== BLANK)
  for (let i = 0; i < noBlank.length; i++)
    for (let j = i + 1; j < noBlank.length; j++)
      if (noBlank[i] > noBlank[j]) inv++
  return inv % 2 === 0
}
function shuffleTiles(): number[] {
  while (true) {
    const arr = Array.from({ length: TOTAL }, (_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    if (isSolvable(arr) && !arr.every((v, i) => v === i)) return arr
  }
}
function solved(arr: number[]) { return arr.every((v, i) => v === i) }

export function HentaiSlidePuzzle({ onClose }: { onClose: () => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999))
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(Math.random() * PUZZLE_PROMPTS.length))
  const [tiles, setTiles] = useState<number[]>(() => shuffleTiles())
  const [moves, setMoves] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)

  const url = `/api/aigen?prompt=${encodeURIComponent(PUZZLE_PROMPTS[promptIdx])}&seed=${seed}`
  const won = solved(tiles)

  useEffect(() => { setImgLoaded(false) }, [url])

  const tryMove = (idx: number) => {
    if (won) return
    const blank = tiles.indexOf(BLANK)
    const r1 = Math.floor(idx / PUZZLE_SIZE), c1 = idx % PUZZLE_SIZE
    const r2 = Math.floor(blank / PUZZLE_SIZE), c2 = blank % PUZZLE_SIZE
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return
    const next = tiles.slice()
    ;[next[idx], next[blank]] = [next[blank], next[idx]]
    setTiles(next); setMoves(m => m + 1)
  }

  const newPuzzle = () => {
    setSeed(Math.floor(Math.random() * 99999))
    setPromptIdx(i => (i + 1) % PUZZLE_PROMPTS.length)
    setTiles(shuffleTiles()); setMoves(0)
  }

  const tilePct = 100 / PUZZLE_SIZE

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-black border border-pink-600/40 rounded-3xl shadow-2xl shadow-pink-900/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600" />
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-zinc-400 hover:text-white z-20">
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl tracking-wider text-white leading-none">HENTAI PUZZLE</h2>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">Slide to reveal · Powered by Grok</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Moves</p>
              <p className="font-display text-2xl text-white leading-none">{moves}</p>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {!imgLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              </div>
            )}
            {/* Hidden loader that triggers imgLoaded */}
            <img src={url} alt="" className="hidden" onLoad={() => setImgLoaded(true)} />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[2px]">
              {tiles.map((tile, i) => {
                if (tile === BLANK && !won) return <div key={i} className="bg-black" />
                const tileR = Math.floor(tile / PUZZLE_SIZE)
                const tileC = tile % PUZZLE_SIZE
                return (
                  <button
                    key={i}
                    onClick={() => tryMove(i)}
                    className="relative overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity"
                  >
                    <div
                      className="absolute"
                      style={{
                        backgroundImage: `url(${url})`,
                        backgroundSize: `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`,
                        backgroundPosition: `${(tileC * 100) / (PUZZLE_SIZE - 1)}% ${(tileR * 100) / (PUZZLE_SIZE - 1)}%`,
                        width: '100%', height: '100%',
                        top: 0, left: 0,
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setTiles(Array.from({ length: TOTAL }, (_, i) => i))} className="h-12 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-pink-500 text-white font-bold text-sm tracking-wider transition-colors">
              Solve
            </button>
            <button onClick={newPuzzle} className="h-12 rounded-xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold text-sm tracking-wider transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> New Waifu
            </button>
          </div>

          {won && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/40 text-center animate-slide-up">
              <Trophy className="w-7 h-7 text-amber-400 mx-auto mb-1" />
              <p className="font-display text-xl text-white tracking-wide">WAIFU REVEALED</p>
              <p className="text-zinc-400 text-xs mt-1">Solved in {moves} moves</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Hentai Image Pool — small floating image used as a decorative icon ──
export const HENTAI_ICON_IDS = [
  'waifu-1','waifu-2','waifu-3','waifu-4','waifu-5','waifu-6',
  'waifu-7','waifu-8','waifu-9','waifu-10','waifu-11','waifu-12',
]

export function useHentaiIcon(slot: number) {
  return useMemo(() => `/api/icon/${HENTAI_ICON_IDS[slot % HENTAI_ICON_IDS.length]}`, [slot])
}
