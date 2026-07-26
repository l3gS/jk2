import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Play, Download, ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

const STATS = [
  { label: 'Real Name',   value: 'Mary-Belle Kirschner' },
  { label: 'Born',        value: 'October 23, 1999 · Scorpio ♏' },
  { label: 'Birthplace',  value: 'Brighton, UK (raised Cape Town, SA)' },
  { label: 'Height',      value: '5\'3" (160 cm)' },
  { label: 'Known For',   value: 'GamerGirl Bathwater · OnlyFans · Cosplay' },
  { label: 'Hair',        value: 'Naturally dark brown; dyes pink' },
]

const TAGS = ['OnlyFans', 'Cosplay', 'Egirl', 'UK', 'Petite', 'Pink Hair', 'Gamer Girl', 'Iconic', 'Scorpio']

const CURATED_X_LINKS = [
  'https://x.com/bunhubtv/status/2061840265493537048',
  'https://x.com/IISHubX/status/2056359191300723101',
  'https://x.com/xx_vidz/status/2060244663303393792',
  'https://x.com/Onlythe69/status/1574887855683272704',
  'https://x.com/Redzone_cosp/status/2038635329918275690',
  'https://x.com/Redzone_cosp/status/2036561866541900102',
  'https://x.com/ENo1677695/status/2012024626772423087',
  'https://x.com/BogPozzle/status/2032121898738597899',
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
        title: `Belle Delphine — @${handle}`,
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch { preTab?.close(); toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  return (
    <div ref={cardRef} className="rounded-xl border border-pink-500/20 bg-zinc-900/60 overflow-hidden">
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
          <div className="relative w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center shadow-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
          </div>
          <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-pink-300 px-2 py-0.5 rounded">
            @{handle}
          </span>
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded">𝕏</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <p className="flex-1 text-xs text-pink-300 opacity-70 truncate">@{handle}</p>
        <button onClick={handleDownload} disabled={dlLoading}
          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-pink-500/10 border border-pink-400/20 text-pink-300 rounded-lg transition-all disabled:opacity-50 hover:opacity-80">
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
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string }) => void
}

export default function BelleDelphine({ onSaveToVault: _onSaveToVault }: Props) {
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const doSearch = async (q?: string) => {
    const sq = (q ?? searchQuery).trim() || 'belle delphine'
    setSearchLoading(true)
    setSearchResults([])
    try {
      const r = await fetch(`/api/x-keyword-search?q=${encodeURIComponent(sq)}&limit=16`)
      if (!r.ok) throw new Error(`${r.status}`)
      const data = await r.json()
      setSearchResults(data.urls || [])
      if (!data.urls?.length) toast('No results found — showing curated clips instead')
    } catch {
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => { doSearch('belle delphine') }, [])

  const displayUrls = searchResults.length > 0 ? searchResults : CURATED_X_LINKS

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(0,0,0,0.9) 50%, black 100%)', borderBottom: '1px solid rgba(236,72,153,0.15)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(236,72,153,0.15) 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex-shrink-0 overflow-hidden"
            style={{ border: '1px solid rgba(236,72,153,0.3)' }}>
            <img
              src="https://unavatar.io/twitter/belledelphinee"
              alt="Belle Delphine"
              className="w-full h-full object-cover object-top"
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                el.parentElement!.innerHTML = '<span style="font-size:3rem;display:flex;align-items:center;justify-content:center;height:100%;background:rgba(236,72,153,0.15)">🎀</span>'
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black tracking-[0.5em] uppercase text-pink-400/60 mb-1">Nacre's Hub · X Clips</p>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-white leading-none mb-1">
              BELLE<span className="text-pink-400"> DELPHINE</span>
            </h1>
            <p className="text-zinc-500 text-sm mb-3">Mary-Belle Kirschner · born October 23, 1999 · Brighton, UK</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {TAGS.map(t => (
                <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)', color: 'rgba(249,168,212,0.8)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[8px] font-black tracking-[0.3em] uppercase text-zinc-600 mb-0.5">{s.label}</p>
              <p className="text-xs font-bold text-white/80">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(236,72,153,0.12)' }}>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Belle Delphine became one of the most recognisable figures in internet culture. She sold bathwater, was banned from Instagram, came back, launched one of the most discussed OnlyFans accounts of 2020–2023, and managed to be exactly as provocative as she intended at every step.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Born Mary-Belle Kirschner on October 23, 1999 in Brighton. The pink hair, the ahegao expression, the deliberate kawaii-meets-explicit aesthetic — all of it was constructed with genuine media savvy. The bathwater sold out in three days. Her archive from 2020–2023 is legendary.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black tracking-[0.4em] uppercase text-zinc-600">𝕏 Video Clips</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(!showSearch)}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: 'rgba(249,168,212,0.8)' }}>
                <Search className="w-3 h-3" /> Search X
              </button>
              <button onClick={() => doSearch(searchQuery || 'belle delphine')} disabled={searchLoading}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {searchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Refresh
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search X for belle delphine videos…"
                className="flex-1 h-10 px-3 bg-zinc-900 border border-pink-500/20 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:border-pink-400/40 text-sm"
              />
              <button onClick={() => doSearch()} disabled={searchLoading}
                className="h-10 px-4 bg-pink-500/20 border border-pink-400/30 text-pink-200 font-bold rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm">
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          )}

          {searchLoading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
              <p className="text-zinc-500 text-sm">Searching X for Belle Delphine clips…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayUrls.map((url, i) => (
                <XVideoCard key={url} url={url} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
