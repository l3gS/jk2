import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Loader2, ChevronDown, Search, ExternalLink, Download,
  Flower2, Heart, Lock, RefreshCw,
} from 'lucide-react'
import Hls from 'hls.js'
import { fetchVideoInfo, getStreamUrl, saveToDevice, xvSearch, phKeywordSearch } from '../api'

// ─── Theme — warm rose-gold "leak vault" aesthetic ────────────────────────────
const AC        = '#F43F5E'        // rose-500
const AC_DIM    = 'rgba(244,63,94,0.15)'
const AC_BORDER = 'rgba(244,63,94,0.28)'
const AC_GLOW   = 'rgba(244,63,94,0.45)'
const AC_TEXT   = 'rgba(254,205,211,0.95)'
const BG        = '#000000'
const PAGE_SIZE = 20

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

// ─── Lazy card ────────────────────────────────────────────────────────────────
function MollyCard({ url, active, onSelect }: {
  url: string; active: boolean; onSelect: (url: string) => void
}) {
  const [thumb, setThumb]   = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const handle = url.match(/x\.com\/([^/]+)\/status/)?.[1] ?? 'clip'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      try {
        const data = await fetchVideoInfo(url)
        const t = data.media_extended?.[0]?.thumbnail_url ?? null
        if (t) setThumb(t)
        setLoaded(true)
      } catch { setLoaded(true) }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [url])

  return (
    <div ref={ref}
      className="cursor-pointer group rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.97]"
      style={{
        border: active ? `2px solid ${AC}` : '1px solid rgba(255,255,255,0.05)',
        background: active ? AC_DIM : 'rgba(12,0,6,0.85)',
        boxShadow: active ? `0 0 20px ${AC_GLOW}` : 'none',
      }}
      onClick={() => onSelect(url)}>
      <div className="relative aspect-video overflow-hidden bg-black">
        {thumb ? (
          <img src={thumb} alt={`@${handle}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            {loaded
              ? <span className="text-[9px] font-bold" style={{ color: 'rgba(244,63,94,0.3)' }}>No preview</span>
              : <Loader2 className="w-4 h-4 animate-spin" style={{ color: AC_GLOW }} />}
          </div>
        )}
        {active && <div className="absolute top-2 left-2 w-2 h-2 rounded-full animate-pulse" style={{ background: AC }} />}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: AC, boxShadow: `0 0 18px ${AC_GLOW}` }}>
              <Play size={14} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {/* Leak watermark */}
        <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(244,63,94,0.7)', border: `1px solid ${AC_BORDER}` }}>
          🔒 LEAK
        </span>
        <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-black/70 px-1.5 py-0.5 rounded"
          style={{ color: AC_TEXT }}>@{handle}</span>
      </div>
    </div>
  )
}

// ─── Player ───────────────────────────────────────────────────────────────────
function MollyPlayer({ url, allUrls, onNavigate }: {
  url: string | null; allUrls: string[]; onNavigate: (u: string) => void
}) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [playing, setPlaying]     = useState(false)
  const [muted, setMuted]         = useState(false)
  const [currentTime, setCurrent] = useState(0)
  const [duration, setDuration]   = useState(0)
  const [isFs, setIsFs]           = useState(false)
  const [dlLoading, setDlLoading] = useState(false)

  const vidRef  = useRef<HTMLVideoElement>(null)
  const hlsRef  = useRef<Hls | null>(null)
  const contRef = useRef<HTMLDivElement>(null)

  const idx = url ? allUrls.indexOf(url) : -1

  useEffect(() => {
    if (!url) return
    setStreamUrl(null); setLoading(true); setPlaying(false); setCurrent(0); setDuration(0)
    fetchVideoInfo(url)
      .then(data => setStreamUrl(data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [url])

  useEffect(() => {
    const el = vidRef.current
    if (!el || !streamUrl) return
    hlsRef.current?.destroy(); hlsRef.current = null
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(el)
    } else {
      el.src = getStreamUrl(streamUrl)
    }
    el.play().catch(() => {})
    const onTime  = () => setCurrent(el.currentTime)
    const onDur   = () => setDuration(el.duration)
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('durationchange', onDur)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('durationchange', onDur)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      hlsRef.current?.destroy()
    }
  }, [streamUrl])

  const fmt = (s: number) => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00'

  const handleDl = async () => {
    if (!url) return
    setDlLoading(true)
    const preTab = isIOS ? window.open('', '_blank') : null
    try {
      let s = streamUrl
      if (!s) {
        const data = await fetchVideoInfo(url)
        s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null
      }
      if (!s) { preTab?.close(); return }
      await saveToDevice({ streamUrl: s, title: `Molly — @${url.match(/x\.com\/([^/]+)/)?.[1] ?? 'clip'}`, preOpenedTab: preTab })
    } catch {}
    finally { setDlLoading(false) }
  }

  const toggleFs = useCallback(() => {
    if (!contRef.current) return
    if (!document.fullscreenElement) { contRef.current.requestFullscreen().catch(() => {}); setIsFs(true) }
    else { document.exitFullscreen().catch(() => {}); setIsFs(false) }
  }, [])

  if (!url) return (
    <div className="rounded-2xl aspect-video flex items-center justify-center"
      style={{ background: 'rgba(12,0,6,0.7)', border: `1px solid ${AC_BORDER}` }}>
      <div className="text-center">
        <span className="text-5xl mb-3 block">🌸</span>
        <p className="text-xs" style={{ color: 'rgba(244,63,94,0.4)' }}>Select a clip</p>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${AC_BORDER}`, background: '#000' }}>
      <div ref={contRef} className="relative aspect-video bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: AC }} />
          </div>
        )}
        <video ref={vidRef} className="w-full h-full object-contain" playsInline />
        <div className="absolute inset-x-0 bottom-0 p-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
          {duration > 0 && (
            <input type="range" min={0} max={duration} step={0.1} value={currentTime}
              onChange={e => { const t = Number(e.target.value); if (vidRef.current) vidRef.current.currentTime = t; setCurrent(t) }}
              className="w-full h-1 mb-2 appearance-none cursor-pointer"
              style={{ accentColor: AC }} />
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => { const v = vidRef.current; if (v) { playing ? v.pause() : v.play() } }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: AC, boxShadow: `0 0 12px ${AC_GLOW}` }}>
              {playing ? <Pause size={14} fill="white" className="text-white" /> : <Play size={14} fill="white" className="text-white ml-0.5" />}
            </button>
            {idx > 0 && (
              <button onClick={() => onNavigate(allUrls[idx - 1])}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>◂</button>
            )}
            {idx < allUrls.length - 1 && (
              <button onClick={() => onNavigate(allUrls[idx + 1])}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>▸</button>
            )}
            <span className="text-[10px] font-mono" style={{ color: AC_TEXT }}>{fmt(currentTime)} / {fmt(duration)}</span>
            <div className="flex-1" />
            <button onClick={() => { const v = vidRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted) } }}
              className="text-white/40 hover:text-white">{muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>
            <button onClick={handleDl} disabled={dlLoading} className="text-white/40 hover:text-white disabled:opacity-40">
              {dlLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white">
              <ExternalLink size={14} />
            </a>
            <button onClick={toggleFs} className="text-white/40 hover:text-white">
              {isFs ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
            </button>
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.7)', color: AC_TEXT, border: `1px solid ${AC_BORDER}` }}>
          🔒 LEAK
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(12,0,6,0.95)', borderTop: `1px solid ${AC_BORDER}` }}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: AC_TEXT }}>
            @{url.match(/x\.com\/([^/]+)/)?.[1] ?? 'clip'}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(244,63,94,0.4)' }}>{idx + 1} of {allUrls.length}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center border"
          style={{ background: AC_DIM, borderColor: AC_BORDER, color: AC_TEXT }}>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const QUERIES = [
  'mollyflowers leaked',
  'mollyflowers onlyfans',
  'mollyflowers nude',
  'mollyflowers sex tape',
]

export default function MollyFlowers() {
  const [allUrls, setAllUrls]   = useState<string[]>([])
  const [visible, setVisible]   = useState(PAGE_SIZE)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [queryIdx, setQueryIdx] = useState(0)
  const [search, setSearch]     = useState('')

  async function loadQuery(qIdx: number) {
    setLoading(true); setError(null); setQueryIdx(qIdx)
    setAllUrls([]); setVisible(PAGE_SIZE); setSelected(null)
    try {
      // Primary: X keyword search (needs API key — may return empty)
      const xResp = await fetch(`/api/x-keyword-search?q=${encodeURIComponent(QUERIES[qIdx])}&limit=60`)
      const xData = await xResp.json()
      const xUrls: string[] = Array.isArray(xData.urls) ? xData.urls : []

      if (xUrls.length > 0) {
        setAllUrls(xUrls); setSelected(xUrls[0])
        return
      }

      // Fallback 1: search xvideos
      const xvItems = await xvSearch(QUERIES[qIdx].replace(/\s+/g, '+'), 'xvideos').catch(() => [])
      const xvUrls = xvItems.map(it => it.videoPageUrl)

      // Fallback 2: pornhub keyword search
      const phItems = await phKeywordSearch(QUERIES[qIdx]).catch(() => [])
      const phUrls = phItems.map(it => it.videoPageUrl)

      const combined = [...xvUrls, ...phUrls]
      if (combined.length > 0) {
        setAllUrls(combined); setSelected(combined[0])
      } else {
        setError('No results found — scrapers may be rate-limited. Try again shortly.')
      }
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuery(0) }, [])

  const filtered = search
    ? allUrls.filter(u => (u.match(/x\.com\/([^/]+)/)?.[1] ?? '').toLowerCase().includes(search.toLowerCase()))
    : allUrls
  const shownUrls = filtered.slice(0, visible)

  function handleSelect(url: string) {
    setSelected(url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative"
      style={{ background: `radial-gradient(ellipse 1100px 450px at 50% -5%, rgba(244,63,94,0.12), transparent 60%), ${BG}` }}>

      {/* Ambient glows */}
      <div className="fixed top-[-6%] right-[-4%] w-[380px] h-[380px] rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${AC_GLOW}, transparent 70%)`, filter: 'blur(80px)' }} />
      <div className="fixed bottom-[10%] left-[-5%] w-[280px] h-[280px] rounded-full pointer-events-none opacity-10"
        style={{ background: `radial-gradient(circle, rgba(251,113,133,0.6), transparent 70%)`, filter: 'blur(90px)' }} />

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-52"
          style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.22) 0%, rgba(136,19,55,0.28) 45%, rgba(0,0,0,0.95) 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, #000 100%)' }} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${AC}, transparent)` }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar placeholder with glow */}
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-[28px] opacity-40 animate-pulse"
                style={{ background: `conic-gradient(from 0deg, ${AC}, rgba(251,113,133,0.6), ${AC})`, filter: 'blur(20px)', animationDuration: '4s' }} />
              <div className="relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4C0519, #1F0009)', border: `2px solid ${AC}`, boxShadow: `0 0 0 4px rgba(0,0,0,0.6), 0 8px 32px ${AC_GLOW}` }}>
                <span className="text-3xl">🌸</span>
                <span className="text-[8px] font-black mt-1" style={{ color: AC_TEXT }}>MOLLY</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight"
                  style={{ textShadow: `0 0 28px rgba(244,63,94,0.45)` }}>
                  Molly Flowers
                </h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase flex items-center gap-1"
                  style={{ background: AC_DIM, color: AC_TEXT, border: `1px solid ${AC_BORDER}` }}>
                  <Lock size={8} /> LEAKS
                </span>
              </div>
              <p className="text-xs mb-3 max-w-sm" style={{ color: 'rgba(251,113,133,0.6)' }}>
                Private content, leaked directly from her socials. 20 posts at a time, tap load more to keep going.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-3">
                {[
                  { icon: Flower2, val: `${allUrls.length || '—'}`, label: 'Clips' },
                  { icon: Lock,    val: 'Leaked',                   label: 'Type' },
                  { icon: Heart,   val: '𝕏',                        label: 'Source' },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Icon size={10} style={{ color: AC }} />
                    <div>
                      <p className="text-white font-black text-xs leading-none">{val}</p>
                      <p className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Query tabs */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {QUERIES.map((q, i) => (
                  <button key={q} onClick={() => loadQuery(i)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: queryIdx === i ? AC_DIM : 'rgba(255,255,255,0.03)',
                      color: queryIdx === i ? AC_TEXT : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${queryIdx === i ? AC_BORDER : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layout ──────────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-4 pt-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Player — sticky */}
          <div className="lg:w-[500px] lg:shrink-0">
            <div className="lg:sticky lg:top-4 flex flex-col gap-3">
              <MollyPlayer url={selected} allUrls={filtered.slice(0, visible)} onNavigate={handleSelect} />
              <div className="px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${AC_BORDER}`, color: 'rgba(255,255,255,0.2)' }}>
                <span style={{ color: 'rgba(244,63,94,0.6)' }}>🔒</span> Sourced from X/Twitter · private &amp; leaked content
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: 'rgba(251,113,133,0.4)' }}>Vault</span>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${AC_BORDER}, transparent)` }} />
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(244,63,94,0.4)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by handle…"
                  className="w-full h-9 pl-8 pr-3 rounded-xl text-sm text-white placeholder-zinc-700 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AC_BORDER}` }} />
              </div>
              <button onClick={() => loadQuery(queryIdx)} disabled={loading}
                className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                style={{ background: AC_DIM, border: `1px solid ${AC_BORDER}`, color: AC_TEXT }}>
                <RefreshCw size={11} /> Refresh
              </button>
              <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold"
                style={{ color: AC_TEXT, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {filtered.length}
              </span>
            </div>

            {loading && (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: AC }} />
                <p className="text-xs" style={{ color: 'rgba(244,63,94,0.5)' }}>Fetching Molly's vault…</p>
              </div>
            )}

            {error && !loading && (
              <p className="text-sm text-center py-8" style={{ color: 'rgba(244,63,94,0.5)' }}>{error}</p>
            )}

            {!loading && !error && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {shownUrls.map(url => (
                    <MollyCard key={url} url={url} active={selected === url} onSelect={handleSelect} />
                  ))}
                </div>

                {filtered.length === 0 && !loading && (
                  <div className="text-center py-16" style={{ color: 'rgba(244,63,94,0.3)' }}>
                    No clips found. Try refreshing or another search term.
                  </div>
                )}

                {visible < filtered.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisible(v => Math.min(v + PAGE_SIZE, filtered.length))}
                      className="flex items-center gap-2 h-12 px-8 rounded-2xl font-black text-sm tracking-wider transition-all active:scale-95"
                      style={{
                        background: AC_DIM,
                        border: `1px solid ${AC_BORDER}`,
                        color: AC_TEXT,
                        boxShadow: `0 0 24px ${AC_GLOW}`,
                      }}>
                      <ChevronDown className="w-4 h-4" />
                      Load More ({filtered.length - visible} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
