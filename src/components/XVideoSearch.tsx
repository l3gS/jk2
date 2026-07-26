import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Search, Play, Download, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

const QUICK_SEARCHES = [
  'belle delphine', 'hannah owo', 'luna pearl', 'sweetie fox', 'katiana kay',
  'nacre victoire', 'onlyfans leak', 'nsfw creator', 'anime cosplay nsfw', 'egirl leak',
]

function XVideoCard({ url, index }: { url: string; index: number }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [thumb, setThumb] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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
      setStreamUrl(s)
      setPlaying(true)
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
        streamUrl: stream,
        title: `@${handle} — X video`,
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch { preTab?.close(); toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  return (
    <div ref={cardRef} className="rounded-xl border border-sky-500/20 bg-zinc-900/60 overflow-hidden">
      {playing && streamUrl ? (
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} controls autoPlay className="w-full h-full object-contain" />
        </div>
      ) : (
        <div
          className="relative aspect-video bg-zinc-900 flex items-center justify-center cursor-pointer group"
          style={thumb ? { backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          onClick={handlePlay}
        >
          {thumb && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />}
          <div className="relative w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shadow-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
          </div>
          <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-sky-300 px-2 py-0.5 rounded">
            @{handle}
          </span>
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded">𝕏</span>
          {!thumb && !loading && (
            <span className="absolute top-2 left-2 text-[9px] bg-black/70 text-zinc-400 px-2 py-0.5 rounded border border-white/10">
              Click to load
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <p className="flex-1 text-xs text-sky-300 opacity-70 truncate">@{handle}</p>
        <button onClick={handleDownload} disabled={dlLoading}
          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-sky-500/10 border border-sky-400/20 text-sky-300 rounded-lg transition-all disabled:opacity-50 hover:opacity-80">
          {dlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Save
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 bg-white/5 border border-white/10 text-zinc-400 rounded-lg hover:text-white transition-colors">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

interface Props {
  className?: string
}

export default function XVideoSearch({ className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')

  const doSearch = async (q?: string) => {
    const searchQ = (q ?? query).trim()
    if (!searchQ) return
    setLoading(true)
    setResults([])
    setSearched(true)
    setCurrentQuery(searchQ)
    try {
      const r = await fetch(`/api/x-keyword-search?q=${encodeURIComponent(searchQ)}&limit=20`)
      if (!r.ok) throw new Error(`${r.status}`)
      const data = await r.json()
      setResults(data.urls || [])
      if (!data.urls?.length) toast('No videos found — X search can be slow, try again')
    } catch (err) {
      toast.error('Search failed — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-black pb-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-sky-400/50 mb-2">𝕏 Video Search</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-white mb-1">SEARCH</h1>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-sky-300 mb-3">X VIDEOS</h1>
          <p className="text-zinc-500 text-sm">Find videos on X/Twitter by keyword. Results are live-scraped and embedded here.</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search any keyword — belle delphine, nacre victoire, onlyfans…"
            className="flex-1 h-12 px-4 bg-zinc-900 border border-sky-500/20 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:border-sky-400/40 text-sm"
          />
          <button onClick={() => doSearch()}
            disabled={loading || !query.trim()}
            className="h-12 px-5 bg-sky-500/20 border border-sky-400/30 text-sky-200 font-bold rounded-xl transition-all disabled:opacity-40 hover:bg-sky-500/30 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {QUICK_SEARCHES.map(q => (
            <button key={q} onClick={() => { setQuery(q); doSearch(q) }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-sky-500/15 text-zinc-400 hover:text-sky-300 text-xs rounded-lg transition-colors border border-zinc-800 hover:border-sky-500/25">
              #{q}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-zinc-500 text-sm">Searching X for "{currentQuery}"…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm mb-4">No videos found for "{currentQuery}"</p>
            <button onClick={() => doSearch()}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black tracking-[0.4em] uppercase text-sky-400/60">
                {results.length} results for "{currentQuery}"
              </p>
              <button onClick={() => doSearch()}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-sky-300 transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((url, i) => (
                <XVideoCard key={url} url={url} index={i} />
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-4xl mb-3">𝕏</p>
            <p className="text-zinc-500 text-sm mb-1">Search any keyword above</p>
            <p className="text-zinc-700 text-xs">Results are scraped live from X/Twitter</p>
          </div>
        )}
      </div>
    </div>
  )
}
