import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Search, Play, Download, ExternalLink, Loader2, RefreshCw, X as XIcon, ChevronDown } from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

const PAGE_SIZE = 20

const QUICK_SEARCHES = [
  { label: 'Nacre Victoire', q: 'nacre victoire', emoji: '🌹' },
  { label: 'Belle Delphine', q: 'belle delphine leaked', emoji: '🎀' },
  { label: 'Creamy Spot', q: 'creamyspot squirt', emoji: '💦' },
  { label: 'Katiana Kay', q: 'katiana kay', emoji: '🍑' },
  { label: 'Sweetie Fox', q: 'sweetiefox', emoji: '🦊' },
  { label: 'Ahegao', q: 'ahegao compilation', emoji: '😵' },
  { label: 'POV BJ', q: 'pov blowjob deepthroat', emoji: '👅' },
  { label: 'Fishnets', q: 'fishnets thigh highs', emoji: '🕸️' },
  { label: 'Squirting', q: 'squirt compilation', emoji: '💧' },
  { label: 'Creampie', q: 'creampie compilation', emoji: '🍦' },
  { label: 'Egirl', q: 'egirl onlyfans leak', emoji: '💜' },
  { label: 'Cosplay', q: 'cosplay nude compilation', emoji: '🎭' },
]

function XVideoCard({ url, index }: { url: string; index: number }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [thumb, setThumb]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [playing, setPlaying]     = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef   = useRef<Hls | null>(null)
  const cardRef  = useRef<HTMLDivElement>(null)

  const handle = url.match(/x\.com\/([^/]+)\/status/)?.[1] ?? `clip${index + 1}`

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      try {
        const data = await fetchVideoInfo(url)
        const t = data.media_extended?.[0]?.thumbnail_url ?? null
        const s = (data.mediaURLs?.[0] || data.media_extended?.[0]?.url) ?? null
        if (t) setThumb(t)
        if (s) setStreamUrl(s)
      } catch {}
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [url])

  const handlePlay = async () => {
    if (streamUrl) { setPlaying(true); return }
    setLoading(true)
    try {
      const data = await fetchVideoInfo(url)
      const s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url
      if (!s) { toast.error('Could not load video'); return }
      setStreamUrl(s); setPlaying(true)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!playing || !streamUrl || !videoRef.current) return
    const el = videoRef.current
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(el)
    } else {
      el.src = getStreamUrl(streamUrl)
    }
    el.play().catch(() => {})
    return () => { hlsRef.current?.destroy() }
  }, [playing, streamUrl])

  const handleDownload = async () => {
    setDlLoading(true)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const preTab = isIOSDevice ? window.open('', '_blank') : null
    try {
      let stream = streamUrl
      if (!stream) {
        const data = await fetchVideoInfo(url)
        stream = data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null
        if (stream) setStreamUrl(stream)
      }
      if (!stream) { preTab?.close(); toast.error('Could not resolve video'); return }
      const result = await saveToDevice({
        streamUrl: stream, title: `X — @${handle}`,
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch { preTab?.close(); toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  return (
    <div ref={cardRef} className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
      {playing && streamUrl ? (
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} controls autoPlay className="w-full h-full object-contain" />
        </div>
      ) : (
        <div
          className="relative aspect-video bg-zinc-900/60 flex items-center justify-center cursor-pointer group"
          style={thumb ? { backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          onClick={handlePlay}>
          {thumb && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />}
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
          </div>
          {!thumb && (
            <div className="absolute inset-0 flex items-end p-2 pointer-events-none">
              <div className="text-[9px] text-zinc-600 font-bold truncate">@{handle}</div>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white/50 px-2 py-0.5 rounded backdrop-blur-sm">@{handle}</span>
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded backdrop-blur-sm">𝕏</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-xs text-zinc-600 hover:text-zinc-300 truncate transition-colors">
          @{handle}
        </a>
        <button onClick={handleDownload} disabled={dlLoading}
          className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
          {dlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Save
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg text-zinc-600 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

export default function XSearchPage() {
  const [query,     setQuery]     = useState('')
  const [allResults, setAllResults] = useState<string[]>([])
  const [visible,   setVisible]   = useState(PAGE_SIZE)
  const [loading,   setLoading]   = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const shown = allResults.slice(0, visible)

  const doSearch = async (q?: string) => {
    const sq = (q ?? query).trim()
    if (!sq) return
    setLoading(true)
    setAllResults([])
    setVisible(PAGE_SIZE)
    setLastQuery(sq)
    try {
      const r = await fetch(`/api/x-keyword-search?q=${encodeURIComponent(sq)}&limit=60`)
      if (!r.ok) throw new Error(`${r.status}`)
      const data = await r.json()
      setAllResults(data.urls || [])
      if (!data.urls?.length) toast('No results — try a different search')
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQuick = (q: string) => { setQuery(q); doSearch(q) }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#000000' }}>
      {/* Scanline texture */}
      <div className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
          zIndex: 0,
        }} />

      <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-8" style={{ zIndex: 1 }}>

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[9px] font-black tracking-[0.5em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.18)' }}>Cum 'n' Go</p>
          <h1 className="font-black text-3xl sm:text-5xl text-white mb-2 tracking-tight"
            style={{ textShadow: '0 0 40px rgba(255,255,255,0.12)' }}>
            𝕏 <span style={{ color: 'rgba(255,255,255,0.45)' }}>Search</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.2)' }} className="text-sm">
            Search X for video content — streams direct in the browser.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6 rounded-3xl p-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search X for videos… (e.g. belle delphine, nacre victoire)"
                className="w-full h-12 pl-10 pr-4 rounded-2xl text-white placeholder:text-white/20 outline-none ring-0 focus:outline-none text-sm transition"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.22)')}
                onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>
            <button
              onClick={() => doSearch()}
              disabled={loading || !query.trim()}
              className="h-12 px-6 rounded-2xl font-black text-sm text-black tracking-wider disabled:opacity-30 flex items-center gap-2 transition-all active:scale-95"
              style={{ background: '#ffffff', boxShadow: '0 0 20px rgba(255,255,255,0.12)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <><Search className="w-4 h-4" /><span className="hidden sm:inline">Search</span></>}
            </button>
            {allResults.length > 0 && (
              <button onClick={() => { setAllResults([]); setLastQuery(''); setQuery('') }}
                className="h-12 w-12 rounded-2xl flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick search chips */}
        {allResults.length === 0 && !loading && (
          <div className="mb-8">
            <p className="text-[9px] font-black tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.15)' }}>Quick Search</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map(({ label, q, emoji }) => (
                <button key={q} onClick={() => handleQuick(q)}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-2xl text-xs font-bold hover:text-white transition-all active:scale-95 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Searching X for <span className="text-white/60">"{lastQuery}"</span>…
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && allResults.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-black tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>Results</p>
                <p className="text-white font-bold text-lg leading-tight">
                  Showing {shown.length} of {allResults.length} clips for <span style={{ color: 'rgba(255,255,255,0.55)' }}>"{lastQuery}"</span>
                </p>
              </div>
              <button onClick={() => doSearch()} disabled={loading}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shown.map((url, i) => (
                <XVideoCard key={url} url={url} index={i} />
              ))}
            </div>

            {/* Load more */}
            {visible < allResults.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisible(v => Math.min(v + PAGE_SIZE, allResults.length))}
                  className="flex items-center gap-2 h-12 px-8 rounded-2xl font-black text-sm tracking-wider transition-all active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.04)',
                  }}>
                  <ChevronDown className="w-4 h-4" />
                  Load More ({allResults.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty */}
        {!loading && allResults.length === 0 && query && lastQuery && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No results for <span style={{ color: 'rgba(255,255,255,0.55)' }}>"{lastQuery}"</span>
            </p>
          </div>
        )}

        {!loading && allResults.length === 0 && !lastQuery && (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <p className="text-5xl mb-4" style={{ opacity: 0.3 }}>𝕏</p>
            <p>Start typing and hit Enter to search</p>
          </div>
        )}
      </div>
    </div>
  )
}
