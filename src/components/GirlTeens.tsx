import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, ExternalLink, Download, Loader2, Heart } from 'lucide-react'
import { xvSearch, phKeywordSearch, saveToDevice } from '../api'
import type { XvResult } from '../api'
import { toast } from 'sonner'

// ─── Theme ───────────────────────────────────────────────────────────────────
const AC        = '#D4A0C0'
const AC_DIM    = 'rgba(212,160,192,0.14)'
const AC_BORDER = 'rgba(212,160,192,0.25)'
const AC_GLOW   = 'rgba(212,160,192,0.30)'
const BG        = '#000000'

const QUERIES = [
  { label: 'Selfie + Feet', xv: 'cute girl selfie feet', ph: 'teen selfie feet pov' },
  { label: 'Mirror Selfie', xv: 'mirror selfie blonde teen', ph: 'blonde teen mirror selfie' },
  { label: 'Feet Close-Up', xv: 'teen girl feet solo', ph: 'teen feet close up solo' },
  { label: 'Casual Selfie', xv: 'cute teen selfie strip', ph: 'cute girl selfie amateur' },
]

function GridCard({
  item, onSave, savedIds,
}: { item: XvResult; onSave: (item: XvResult) => void; savedIds: Set<string> }) {
  const saved = savedIds.has(item.id)
  return (
    <div
      className="relative rounded-2xl overflow-hidden group cursor-pointer border transition-all hover:scale-[1.02] hover:border-opacity-50"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${AC_BORDER}` }}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] relative overflow-hidden bg-black/40">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎀</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Action overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={item.videoPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={14} className="text-white" />
          </a>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white/10 transition"
            onClick={() => onSave(item)}
          >
            <Download size={14} className="text-white" />
          </button>
        </div>

        {saved && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: AC }}>
            <Heart size={10} fill="white" className="text-white" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-2.5">
        <p className="text-[11px] text-white/60 font-medium line-clamp-2 leading-tight">{item.title}</p>
      </div>
    </div>
  )
}

export default function GirlTeens() {
  const [results, setResults]     = useState<XvResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [queryIdx, setQueryIdx]   = useState(0)
  const [search, setSearch]       = useState('')
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set())
  const [page, setPage]           = useState(0)

  const load = useCallback(async (qIdx: number, pg = 0) => {
    setLoading(true)
    setError(null)
    setQueryIdx(qIdx)
    setPage(pg)
    if (pg === 0) setResults([])

    const q = QUERIES[qIdx]
    try {
      // Try xvideos first, then pornhub as fallback
      let items: XvResult[] = []

      const [xvRes, phRes] = await Promise.allSettled([
        xvSearch(q.xv, 'xvideos'),
        phKeywordSearch(q.ph),
      ])

      if (xvRes.status === 'fulfilled') items.push(...xvRes.value)
      if (phRes.status === 'fulfilled') items.push(...phRes.value)

      // Deduplicate by id
      const seen = new Set<string>()
      items = items.filter(it => { if (seen.has(it.id)) return false; seen.add(it.id); return true })

      if (items.length === 0) {
        // Fallback: try redtube
        const rtRes = await xvSearch(q.xv, 'redtube').catch(() => [])
        items = rtRes
      }

      setResults(prev => pg === 0 ? items : [...prev, ...items])
      if (items.length === 0) setError('No results found — try another category.')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(0) }, [load])

  async function handleSave(item: XvResult) {
    setSavedIds(prev => new Set([...prev, item.id]))
    toast('📥 Saving…', { duration: 3000 })
    await saveToDevice({
      pageUrl: item.videoPageUrl,
      title: item.title.slice(0, 40),
      onIOSHint: msg => toast(msg, { duration: 6000 }),
    })
  }

  const filtered = search.trim()
    ? results.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : results

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10"
        style={{ background: `radial-gradient(circle, ${AC_GLOW}, transparent 70%)`, filter: 'blur(100px)' }} />

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: AC_BORDER }}>
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, rgba(212,160,192,0.08) 0%, rgba(0,0,0,0.95) 100%)`
        }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-7">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🎀</span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Girl Gallery</h1>
              <p className="text-xs tracking-[0.3em] uppercase font-bold mt-0.5" style={{ color: `${AC}99` }}>
                19+ · Selfies · Feet · Amateur
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Category tabs ── */}
        <div className="flex gap-2 flex-wrap mb-5">
          {QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => void load(i)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all border"
              style={{
                background: queryIdx === i ? AC_DIM : 'rgba(255,255,255,0.03)',
                borderColor: queryIdx === i ? AC : 'rgba(255,255,255,0.08)',
                color: queryIdx === i ? AC : 'rgba(255,255,255,0.45)',
              }}
            >
              {q.label}
            </button>
          ))}
          <button
            onClick={() => void load(queryIdx)}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5"
            style={{ border: `1px solid ${AC_BORDER}`, color: `${AC}` }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter results…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none transition border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${AC_BORDER}`,
            }}
          />
        </div>

        {/* ── Grid ── */}
        {loading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: AC }} />
            <p className="text-sm text-white/40">Fetching content…</p>
          </div>
        ) : error && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-white/40 text-sm">{error}</p>
            <button onClick={() => void load(queryIdx)}
              className="px-5 py-2 rounded-xl text-xs font-bold border transition"
              style={{ border: `1px solid ${AC_BORDER}`, color: AC }}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => (
                <GridCard key={item.id} item={item} onSave={handleSave} savedIds={savedIds} />
              ))}
            </div>

            {filtered.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => void load(queryIdx, page + 1)}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl font-bold text-sm border transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40"
                  style={{ border: `1px solid ${AC_BORDER}`, color: AC, background: AC_DIM }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
