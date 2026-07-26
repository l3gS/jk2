import { useEffect, useRef, useState, useCallback } from 'react'
import { Images, Loader2, Play, X, Heart, Download, Shuffle, Film, Image as ImageIcon, User, ArrowLeft, Printer } from 'lucide-react'
import { toast } from 'sonner'

export interface VaultMediaItem {
  kind: 'pic' | 'gif'
  url: string         // playable / displayable URL (image url for pics, video url for gifs)
  thumbnail: string   // poster (for gifs) or same as url (for pics)
  title: string
}

export interface BackgroundChoice {
  kind: 'video' | 'image'
  url: string
  poster?: string
}

const PIC_CATS = [
  { id: 'waifu', label: 'Waifu' },
  { id: 'neko', label: 'Neko' },
  { id: 'blowjob', label: 'BJ' },
  { id: 'realistic3d', label: '3D / CGI' },
  { id: 'feet', label: 'Feet' },
  { id: 'ass', label: 'Ass' },
  { id: 'boobs', label: 'Boobs' },
  { id: 'ahegao', label: 'Ahegao' },
  { id: 'anal', label: 'Anal' },
  { id: 'pussy', label: 'Pussy' },
  { id: 'paizuri', label: 'Paizuri' },
  { id: 'yuri', label: 'Yuri' },
  { id: 'futanari', label: 'Futa' },
  { id: 'trap', label: 'Trap' },
  { id: 'pinup', label: 'Pinup' },
] as const

const GIF_CATS = [
  { id: 'hentai', label: 'Hentai' },
  { id: 'realistic3d', label: '3D / CGI' },
  { id: 'ahegao', label: 'Ahegao' },
  { id: 'anime', label: 'Anime' },
  { id: 'lewd', label: 'Lewd' },
  { id: 'ecchi', label: 'Ecchi' },
  { id: 'futanari', label: 'Futa' },
  { id: 'paizuri', label: 'Paizuri' },
  { id: 'yuri', label: 'Yuri' },
] as const

// Used by the dedicated /feet page. Sub-categories all map to laser-focused
// danbooru tags on the server (foot_focus / soles / barefoot / toe_scrunch
// / footjob / thighhighs / socks).
const FEET_CATS = [
  { id: 'footfocus', label: 'Foot Focus' },
  { id: 'soles',     label: 'Soles' },
  { id: 'barefoot',  label: 'Barefoot' },
  { id: 'toes',      label: 'Toes' },
  { id: 'footjob',   label: 'Footjob' },
  { id: 'stockings', label: 'Thighhighs' },
  { id: 'socks',     label: 'Socks' },
  { id: 'feet-api',  label: 'API 🌐' },
] as const

type Mode = 'pics' | 'gifs' | '3d'
type Orientation = 'all' | 'wide' | 'tall' | 'square'

// Orientation classifier. ~1.15 ratio threshold — anything close to 1:1
// counts as square, otherwise wide/tall.
function classifyOrientation(w: number, h: number): Exclude<Orientation, 'all'> {
  if (!w || !h) return 'square'
  const r = w / h
  if (r > 1.15) return 'wide'
  if (r < 1 / 1.15) return 'tall'
  return 'square'
}

const ORIENTATION_OPTIONS: { id: Orientation; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'wide',   label: 'Wide' },
  { id: 'tall',   label: 'Tall' },
  { id: 'square', label: 'Square' },
]

interface GifItem {
  id: string
  hd?: string
  sd?: string
  poster?: string
  width?: number
  height?: number
}

interface HentaiGalleryProps {
  /**
   * Lock the gallery to anime-feet content only. Hides the GIFs / non-feet
   * categories and shows the dedicated feet sub-categories instead. Used by
   * the standalone "Feet" top-level page.
   */
  feetOnly?: boolean
  onSaveToVault?: (item: VaultMediaItem) => void
  onSetBackground?: (bg: BackgroundChoice) => void
}

export default function HentaiGallery({ feetOnly = false, onSaveToVault, onSetBackground }: HentaiGalleryProps = {}) {
  const [mode, setMode] = useState<Mode>('pics')
  const [picCat, setPicCat] = useState<string>(feetOnly ? 'footfocus' : 'waifu')
  const [gifCat, setGifCat] = useState<string>('hentai')
  const [pics, setPics] = useState<string[]>([])
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [end, setEnd] = useState(false)
  const [lightbox, setLightbox] = useState<{ src: string; isVideo: boolean } | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Per-pic metadata: dimensions for the orientation filter and (where the
  // source provides it — danbooru) the original artist tag so we can offer a
  // "more from this artist" feed. Hydrated from the server `meta` map on each
  // fetch, with a client-side fallback measurement for sources that don't
  // expose dimensions (e.g. waifu.pics).
  const [picMeta, setPicMeta] = useState<Record<string, { w?: number; h?: number; artist?: string }>>({})
  const [orientation, setOrientation] = useState<Orientation>('all')
  // When set, the gallery loads pics filtered to a single artist instead of
  // the active category. Cleared via the banner's "back" button.
  const [artistFilter, setArtistFilter] = useState<string | null>(null)

  const recordPicDims = useCallback((url: string, w: number, h: number) => {
    if (!w || !h) return
    setPicMeta(prev => {
      const cur = prev[url]
      if (cur && cur.w && cur.h) return prev
      return { ...prev, [url]: { ...(cur || {}), w, h } }
    })
  }, [])

  // Force pics-mode whenever feetOnly is enabled (no real-people clips here).
  useEffect(() => { if (feetOnly) setMode('pics') }, [feetOnly])

  // Reset whenever the mode, category, or artist filter changes
  useEffect(() => {
    setPics([])
    setGifs([])
    setPage(1)
    setEnd(false)
    setPicMeta({})
    emptyStreakRef.current = 0
  }, [mode, picCat, gifCat, artistFilter])

  const emptyStreakRef = useRef(0)

  const loadMore = useCallback(async () => {
    if (loading || end) return
    setLoading(true)
    try {
      if (mode === '3d') {
        // Fetch BOTH 3D pics and 3D gifs simultaneously
        const [pR, gR] = await Promise.all([
          fetch(`/api/gallery?cat=realistic3d&page=${page}&n=15&pics=1`),
          fetch(`/api/gifs?cat=realistic3d&n=12&page=${page}`)
        ])
        let added = 0
        if (pR.ok) {
          const j = await pR.json()
          const files: string[] = j.files || []
          setPics(prev => {
            const seen = new Set(prev)
            const fresh = files.filter(f => !seen.has(f))
            added += fresh.length
            return [...prev, ...fresh]
          })
        }
        if (gR.ok) {
          const j = await gR.json()
          const items: GifItem[] = j.items || []
          setGifs(prev => {
            const seen = new Set(prev.map(g => g.id))
            const fresh = items.filter(g => !seen.has(g.id))
            added += fresh.length
            return [...prev, ...fresh]
          })
        }
        if (added === 0) emptyStreakRef.current += 1
        else emptyStreakRef.current = 0
        if (emptyStreakRef.current >= 4) {
          emptyStreakRef.current = 0
          setPics([]); setGifs([])
          setPage(1 + Math.floor(Math.random() * 8))
        } else {
          setPage(p => p + 1)
        }
      } else if (mode === 'pics') {
        // pics=1 tells the server to drop animated .gif files so they only
        // appear in the GIFs/Clips tab — keeps the two tabs cleanly split.
        // When an artist filter is active, we hit the dedicated by-artist
        // endpoint instead of the category feed.
        const url = artistFilter
          ? `/api/gallery/by-artist?artist=${encodeURIComponent(artistFilter)}&page=${page}&n=30&pics=1`
          : `/api/gallery?cat=${picCat}&page=${page}&n=30&pics=1`
        const r = await fetch(url)
        if (!r.ok) throw new Error('gallery fetch failed')
        const j = await r.json()
        const files: string[] = j.files || []
        // Hydrate per-pic meta (dimensions for the orientation filter, plus
        // artist tag for the "more from this artist" button). Pics from
        // sources without dims (waifu.pics) get measured client-side on load.
        const meta: Record<string, { w?: number; h?: number; artist?: string }> = j.meta || {}
        if (meta && typeof meta === 'object') {
          setPicMeta(prev => {
            const next = { ...prev }
            for (const u of Object.keys(meta)) {
              const m = meta[u] || {}
              const cur = next[u] || {}
              const w = Number.isFinite(m.w) && (m.w as number) > 0 ? m.w : cur.w
              const h = Number.isFinite(m.h) && (m.h as number) > 0 ? m.h : cur.h
              const artist = (typeof m.artist === 'string' && m.artist) ? m.artist : cur.artist
              if (w !== cur.w || h !== cur.h || artist !== cur.artist) {
                next[u] = { ...cur, ...(w ? { w } : {}), ...(h ? { h } : {}), ...(artist ? { artist } : {}) }
              }
            }
            return next
          })
        }
        let added = 0
        setPics(prev => {
          const seen = new Set(prev)
          const fresh = files.filter(f => !seen.has(f))
          added = fresh.length
          return [...prev, ...fresh]
        })
        // If nothing new for 4 consecutive pages, wipe the dedup set and jump
        // to a fresh random page — the gallery is infinite, never truly ends.
        if (added === 0) emptyStreakRef.current += 1
        else emptyStreakRef.current = 0
        if (emptyStreakRef.current >= 4) {
          emptyStreakRef.current = 0
          setPics([])        // clear seen-set so dedup starts fresh
          setPicMeta({})
          setPage(1 + Math.floor(Math.random() * 12))
        } else {
          setPage(p => p + 1)
        }
      } else {
        const r = await fetch(`/api/gifs?cat=${gifCat}&n=20&page=${page}`)
        if (!r.ok) throw new Error('gif fetch failed')
        const j = await r.json()
        const items: GifItem[] = j.items || []
        let added = 0
        setGifs(prev => {
          const seen = new Set(prev.map(g => g.id))
          const fresh = items.filter(g => !seen.has(g.id))
          added = fresh.length
          return [...prev, ...fresh]
        })
        if (items.length === 0 || added === 0) emptyStreakRef.current += 1
        else emptyStreakRef.current = 0
        if (emptyStreakRef.current >= 4) {
          emptyStreakRef.current = 0
          setGifs([])        // clear seen-set so dedup starts fresh
          setPage(1 + Math.floor(Math.random() * 15))
        } else {
          setPage(p => p + 1)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mode, picCat, gifCat, page, loading, end, artistFilter])

  // Reset empty-streak counter on category / artist change
  useEffect(() => { emptyStreakRef.current = 0 }, [mode, picCat, gifCat, artistFilter])

  // Initial load + reload after reset
  useEffect(() => {
    if (pics.length === 0 && mode === 'pics' && !loading && !end) loadMore()
    if (gifs.length === 0 && mode === 'gifs' && !loading && !end) loadMore()
    if (pics.length === 0 && mode === '3d' && !loading && !end) loadMore()
  }, [pics.length, gifs.length, mode, loading, end, loadMore])

  // Infinite-scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  // Apply the orientation filter (pics mode only). Pics whose dimensions
  // haven't been measured yet are hidden when a filter is active so we don't
  // flash off-orientation cards — they'll fade in once `onMeasured` fires.
  const filteredPics = (mode !== 'pics' || orientation === 'all')
    ? pics
    : pics.filter(src => {
        const d = picMeta[src]
        if (!d || !d.w || !d.h) return false
        return classifyOrientation(d.w, d.h) === orientation
      })

  const items = mode === 'pics' ? filteredPics.length : mode === '3d' ? pics.length + gifs.length : gifs.length

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-12 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {feetOnly ? (
            <>
              {/* Sam-customized hero — this is his favourite page */}
              <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-900/30 via-rose-900/20 to-purple-900/30 p-5 sm:p-6 mb-5">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-start gap-4 flex-wrap">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-900/40">
                    <Heart className="w-7 h-7 text-white fill-white/40" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-pink-300/90 mb-1">
                      Sam's favourite page · curated for you
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl tracking-wider bg-gradient-to-r from-pink-300 via-rose-300 to-purple-300 bg-clip-text text-transparent leading-none">
                      SAM'S FEET COLLECTION
                    </h2>
                    <p className="text-pink-100/80 text-sm mt-2">
                      Welcome back, Sam. An endless personal feed of anime feet —
                      soles, barefoot, footjobs, thighhighs and more. All drawn art,
                      hand-picked just the way you like it.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-pink-500/30 border border-pink-400/50 text-pink-100 text-xs rounded-full font-bold flex-shrink-0">
                    18+ · SAM ONLY
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Images className="w-6 h-6 text-pink-500" />
                <h2 className="font-display text-3xl sm:text-4xl tracking-wider bg-gradient-to-r from-pink-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  HENTAI GALLERY
                </h2>
                <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs rounded-full font-bold">18+</span>
              </div>
              <p className="text-xgrab-gray text-sm">
                An endless feed of waifus, hentai art, and animated clips. Scroll forever.
              </p>
            </>
          )}
        </div>

        {/* Mode toggle — hidden in feet-only mode (pics-only) */}
        {!feetOnly && (
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setMode('pics')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${mode === 'pics' ? 'bg-pink-500/30 text-white border border-pink-400/40' : 'text-xgrab-gray hover:text-white'}`}
              >
                <Images className="w-4 h-4" /> Pictures
              </button>
              <button
                onClick={() => setMode('gifs')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${mode === 'gifs' ? 'bg-pink-500/30 text-white border border-pink-400/40' : 'text-xgrab-gray hover:text-white'}`}
              >
                <Film className="w-4 h-4" /> GIFs / Clips
              </button>
              <button
                onClick={() => setMode('3d')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${mode === '3d' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' : 'text-xgrab-gray hover:text-white'}`}
              >
                ✦ 3D / CGI
              </button>
            </div>

            <button
              onClick={() => { setPics([]); setGifs([]); setPage(1); setEnd(false) }}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              title="Shuffle a fresh batch"
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
        )}
        {feetOnly && (
          <div className="flex justify-end mb-5">
            <button
              onClick={() => { setPics([]); setGifs([]); setPage(1); setEnd(false) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              title="Shuffle a fresh batch"
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
        )}

        {/* Artist feed banner — shown when the user clicks "more from
            this artist" on a pic. Replaces the category chips while active
            and shows a back button to return to normal browsing. */}
        {artistFilter && mode === 'pics' && (
          <div className="mb-6 flex items-center gap-3 flex-wrap rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30 px-4 py-3">
            <button
              onClick={() => setArtistFilter(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15"
              title="Back to browsing"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-purple-300 flex-shrink-0" />
              <span className="text-xs uppercase tracking-[0.18em] text-purple-200/80 font-bold">
                Artist
              </span>
              <span className="text-pink-200 font-display text-lg tracking-wider truncate">
                {artistFilter.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="ml-auto text-[11px] text-xgrab-gray">
              {pics.length} pic{pics.length === 1 ? '' : 's'} loaded
            </span>
          </div>
        )}

        {/* Category chips — hidden in artist-feed mode and 3D mode */}
        {!artistFilter && mode !== '3d' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(feetOnly ? FEET_CATS : (mode === 'pics' ? PIC_CATS : GIF_CATS)).map(c => {
              const active = mode === 'pics' ? picCat === c.id : gifCat === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => mode === 'pics' ? setPicCat(c.id) : setGifCat(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-pink-500/25 border-pink-400/60 text-pink-200'
                      : 'bg-white/5 border-white/10 text-xgrab-gray hover:border-white/20 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Orientation filter — pics mode only. Filters by image w:h
            ratio so users can pull only Wide / Tall / Square art. */}
        {mode === 'pics' && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-xgrab-gray font-bold mr-1">
              Size
            </span>
            {ORIENTATION_OPTIONS.map(o => {
              const active = orientation === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => setOrientation(o.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-purple-500/25 border-purple-400/60 text-purple-200'
                      : 'bg-white/5 border-white/10 text-xgrab-gray hover:border-white/20 hover:text-white'
                  }`}
                  title={
                    o.id === 'all'    ? 'Show every image' :
                    o.id === 'wide'   ? 'Landscape (w > h)' :
                    o.id === 'tall'   ? 'Portrait (h > w)' :
                                        'Square (≈ 1:1)'
                  }
                >
                  {o.label}
                </button>
              )
            })}
            {orientation !== 'all' && (
              <span className="text-[11px] text-xgrab-gray ml-1">
                {filteredPics.length} of {pics.length}
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {mode === '3d' ? (
          <div className="space-y-10">
            {/* 3D pics section */}
            {pics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-purple-300">✦ 3D Renders &amp; CGI Art</span>
                  <div className="flex-1 h-px bg-purple-500/20" />
                  <span className="text-[10px] text-zinc-600">{pics.length} pics</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {pics.map((src, i) => (
                    <PicCard
                      key={src + i}
                      src={src}
                      onOpen={() => setLightbox({ src, isVideo: false })}
                      onSave={onSaveToVault ? () => onSaveToVault({ kind: 'pic', url: src, thumbnail: src, title: '3D CGI pic' }) : undefined}
                      onSetBackground={onSetBackground ? () => onSetBackground({ kind: 'image', url: src }) : undefined}
                      onMeasured={(w, h) => recordPicDims(src, w, h)}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 3D gifs section */}
            {gifs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-purple-300">✦ 3D Animated Clips</span>
                  <div className="flex-1 h-px bg-purple-500/20" />
                  <span className="text-[10px] text-zinc-600">{gifs.length} clips</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gifs.map(g => (
                    <GifCard
                      key={g.id}
                      g={g}
                      onOpen={() => setLightbox({ src: g.hd || g.sd || '', isVideo: true })}
                      onSave={onSaveToVault ? () => onSaveToVault({ kind: 'gif', url: g.hd || g.sd || '', thumbnail: g.poster || '', title: '3D animated clip' }) : undefined}
                      onSetBackground={onSetBackground ? () => onSetBackground({ kind: 'video', url: g.hd || g.sd || '', poster: g.poster }) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : mode === 'pics' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredPics.map((src, i) => {
              const meta = picMeta[src]
              const artist = meta?.artist && meta.artist !== artistFilter ? meta.artist : undefined
              return (
                <PicCard
                  key={src + i}
                  src={src}
                  artist={artist}
                  onOpen={() => setLightbox({ src, isVideo: false })}
                  onSave={onSaveToVault ? () => onSaveToVault({ kind: 'pic', url: src, thumbnail: src, title: 'Hentai pic' }) : undefined}
                  onSetBackground={onSetBackground ? () => onSetBackground({ kind: 'image', url: src }) : undefined}
                  onMeasured={(w, h) => recordPicDims(src, w, h)}
                  onViewArtist={artist ? () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    setArtistFilter(artist)
                  } : undefined}
                />
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gifs.map(g => (
              <GifCard
                key={g.id}
                g={g}
                onOpen={() => setLightbox({ src: g.hd || g.sd || '', isVideo: true })}
                onSave={onSaveToVault ? () => onSaveToVault({ kind: 'gif', url: g.hd || g.sd || '', thumbnail: g.poster || '', title: 'Hentai clip' }) : undefined}
                onSetBackground={onSetBackground ? () => onSetBackground({ kind: 'video', url: g.hd || g.sd || '', poster: g.poster }) : undefined}
              />
            ))}
          </div>
        )}

        {/* Status / sentinel */}
        <div ref={sentinelRef} className="py-12 flex items-center justify-center text-xgrab-gray text-sm">
          {loading && (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading more…</>)}
          {!loading && end && items > 0 && <span>You've reached the bottom · {items} items</span>}
          {!loading && items === 0 && !end && <span>Loading…</span>}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null) }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {lightbox.isVideo ? (
            <video
              src={lightbox.src}
              autoPlay
              loop
              controls
              playsInline
              className="max-w-full max-h-full rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.src}
              alt=""
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <a
            href={lightbox.src}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/90 hover:bg-pink-500 text-white text-sm font-semibold shadow-xl"
          >
            <Download className="w-4 h-4" /> Save
          </a>
        </div>
      )}
    </section>
  )
}

function printImage(url: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { toast.error('Allow popups to print'); return }
  win.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100vw;max-height:100vh;object-fit:contain}@media print{body{background:#fff}}</style></head><body><img src="${url.replace(/"/g,'&quot;')}" onload="setTimeout(()=>{window.print()},250)"/></body></html>`)
  win.document.close()
}

function PicCard({ src, artist, onOpen, onSave, onSetBackground, onMeasured, onViewArtist }: { src: string; artist?: string; onOpen: () => void; onSave?: () => void; onSetBackground?: () => void; onMeasured?: (w: number, h: number) => void; onViewArtist?: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const prettyArtist = artist ? artist.replace(/_/g, ' ') : ''
  return (
    <div
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-pink-400/60 transition cursor-pointer"
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-pink-900/30 to-purple-900/30" />}
      <img
        src={src}
        alt={prettyArtist ? `Art by ${prettyArtist}` : ''}
        loading="lazy"
        onLoad={(e) => {
          setLoaded(true)
          const img = e.currentTarget
          if (img.naturalWidth && img.naturalHeight) {
            onMeasured?.(img.naturalWidth, img.naturalHeight)
          }
        }}
        className={`w-full h-full object-cover transition duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition">
        {onSave && (
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(true); onSave() }}
            title="Save to vault"
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-pink-500/80 transition-colors"
          >
            <Heart className={`w-4 h-4 transition ${liked ? 'text-pink-400 fill-pink-400 scale-110' : ''}`} />
          </button>
        )}
        {onSetBackground && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetBackground() }}
            title="Set as site background"
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-purple-500/80 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); printImage(src) }}
          title="Print image"
          className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-blue-500/80 transition-colors"
        >
          <Printer className="w-4 h-4" />
        </button>
        {onViewArtist && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewArtist() }}
            title={`More from ${prettyArtist || 'this artist'}`}
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-purple-500/80 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Artist credit pill — only shown on hover, only when we know who
          drew the pic. Clicking it jumps to that artist's feed. */}
      {onViewArtist && prettyArtist && (
        <button
          onClick={(e) => { e.stopPropagation(); onViewArtist() }}
          title={`More from ${prettyArtist}`}
          className="absolute bottom-2 left-2 right-2 max-w-full truncate inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition hover:bg-purple-500/70 hover:border-purple-300/50"
        >
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{prettyArtist}</span>
        </button>
      )}
    </div>
  )
}

function GifCard({ g, onOpen, onSave, onSetBackground }: { g: GifItem; onOpen: () => void; onSave?: () => void; onSetBackground?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (hover) { v.currentTime = 0; v.play().catch(() => {}) }
    else { v.pause() }
  }, [hover])

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      className="group relative aspect-[9/16] sm:aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black hover:border-pink-400/60 transition cursor-pointer"
    >
      {g.poster && (
        <img
          src={g.poster}
          alt=""
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hover ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      <video
        ref={videoRef}
        src={g.sd || g.hd}
        muted
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hover ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-pink-500/80 text-white text-[10px] font-bold flex items-center gap-1">
        <Play className="w-2.5 h-2.5 fill-white" /> GIF
      </span>
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition">
        {onSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave() }}
            title="Save to vault"
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-pink-500/80 transition-colors"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
        {onSetBackground && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetBackground() }}
            title="Set as site background"
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-purple-500/80 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
