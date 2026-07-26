import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Loader2, ChevronDown, Search, ExternalLink, Download,
  Sword, Star, Zap, RefreshCw,
} from 'lucide-react'
import Hls from 'hls.js'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'

// ─── Theme ─────────────────────────────────────────────────────────────────────
const EV        = '#7C3AED'
const EV_DIM    = 'rgba(124,58,237,0.18)'
const EV_BORDER = 'rgba(124,58,237,0.32)'
const EV_GLOW   = 'rgba(124,58,237,0.5)'
const EV_TEXT   = 'rgba(221,214,254,0.95)'
const BG        = '#000000'
const PAGE_SIZE = 20

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

// ─── Lazy-loading video card ───────────────────────────────────────────────────
function EveCard({ url, active, onSelect }: {
  url: string; active: boolean; onSelect: (url: string) => void
}) {
  const [thumb, setThumb]       = useState<string | null>(null)
  const [loaded, setLoaded]     = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const handle = url.match(/x\.com\/([^/]+)\/status/)?.[1] ?? 'clip'

  useEffect(() => {
    const el = cardRef.current
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
    <div
      ref={cardRef}
      className="cursor-pointer group rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.97]"
      style={{
        border: active ? `2px solid ${EV}` : '1px solid rgba(255,255,255,0.06)',
        background: active ? EV_DIM : 'rgba(10,0,20,0.8)',
        boxShadow: active ? `0 0 18px ${EV_GLOW}` : 'none',
      }}
      onClick={() => onSelect(url)}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {thumb ? (
          <img src={thumb} alt={`@${handle}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            {loaded
              ? <span className="text-[9px] font-bold" style={{ color: 'rgba(124,58,237,0.4)' }}>No preview</span>
              : <Loader2 className="w-4 h-4 animate-spin" style={{ color: EV_GLOW }} />}
          </div>
        )}
        {active && (
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full animate-pulse"
            style={{ background: EV }} />
        )}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: EV, boxShadow: `0 0 16px ${EV_GLOW}` }}>
              <Play size={14} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        )}
        <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-black/70 px-1.5 py-0.5 rounded"
          style={{ color: EV_TEXT }}>@{handle}</span>
        <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-black/70 px-1.5 py-0.5 rounded text-white/40">𝕏</span>
      </div>
    </div>
  )
}

// ─── Embedded player ──────────────────────────────────────────────────────────
function EvePlayer({ url, allUrls, onNavigate }: {
  url: string | null
  allUrls: string[]
  onNavigate: (url: string) => void
}) {
  const [streamUrl, setStreamUrl]   = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [playing, setPlaying]       = useState(false)
  const [muted, setMuted]           = useState(false)
  const [volume, setVolume]         = useState(1)
  const [currentTime, setCurrent]   = useState(0)
  const [duration, setDuration]     = useState(0)
  const [isFullscreen, setFullscreen] = useState(false)
  const [dlLoading, setDlLoading]   = useState(false)

  const vidRef       = useRef<HTMLVideoElement>(null)
  const hlsRef       = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const idx = url ? allUrls.indexOf(url) : -1

  useEffect(() => {
    if (!url) return
    setStreamUrl(null); setLoading(true)
    setPlaying(false); setCurrent(0); setDuration(0)
    fetchVideoInfo(url)
      .then(data => {
        const s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null
        setStreamUrl(s)
      })
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
    const onTime = () => setCurrent(el.currentTime)
    const onDur  = () => setDuration(el.duration)
    const onPlay = () => setPlaying(true)
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

  const fmtTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const handleDownload = async () => {
    if (!url) return
    setDlLoading(true)
    const preTab = isIOS ? window.open('', '_blank') : null
    try {
      let stream = streamUrl
      if (!stream) {
        const data = await fetchVideoInfo(url)
        stream = data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null
      }
      if (!stream) { preTab?.close(); return }
      const result = await saveToDevice({
        streamUrl: stream,
        title: `Eve — @${url.match(/x\.com\/([^/]+)/)?.[1] ?? 'clip'}`,
        preOpenedTab: preTab,
      })
      if (result !== 'ios-tab') {
        // success
      }
    } catch {}
    finally { setDlLoading(false) }
  }

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }, [])

  if (!url) {
    return (
      <div className="rounded-2xl aspect-video flex items-center justify-center"
        style={{ background: 'rgba(10,0,20,0.6)', border: `1px solid ${EV_BORDER}` }}>
        <div className="text-center">
          <span className="text-5xl mb-3 block">⚔️</span>
          <p className="text-xs" style={{ color: 'rgba(124,58,237,0.4)' }}>Select a video</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${EV_BORDER}`, background: '#000' }}>
      <div ref={containerRef} className="relative aspect-video bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: EV }} />
          </div>
        )}
        <video ref={vidRef} className="w-full h-full object-contain" playsInline />

        {/* Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
          {/* Scrubber */}
          {duration > 0 && (
            <input type="range" min={0} max={duration} step={0.1} value={currentTime}
              onChange={e => { const t = Number(e.target.value); if (vidRef.current) vidRef.current.currentTime = t; setCurrent(t) }}
              className="w-full h-1 mb-2 appearance-none cursor-pointer"
              style={{ accentColor: EV }} />
          )}
          <div className="flex items-center gap-3">
            {/* Play/pause */}
            <button onClick={() => { const v = vidRef.current; if (v) { playing ? v.pause() : v.play() } }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: EV, boxShadow: `0 0 12px ${EV_GLOW}` }}>
              {playing ? <Pause size={14} fill="white" className="text-white" /> : <Play size={14} fill="white" className="text-white ml-0.5" />}
            </button>
            {/* Prev/Next */}
            {idx > 0 && (
              <button onClick={() => onNavigate(allUrls[idx - 1])}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition"
                style={{ background: 'rgba(255,255,255,0.06)' }}>◂</button>
            )}
            {idx < allUrls.length - 1 && (
              <button onClick={() => onNavigate(allUrls[idx + 1])}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition"
                style={{ background: 'rgba(255,255,255,0.06)' }}>▸</button>
            )}
            {/* Time */}
            <span className="text-[10px] font-mono" style={{ color: EV_TEXT }}>
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
            <div className="flex-1" />
            {/* Mute */}
            <button onClick={() => { const v = vidRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted) } }}
              className="text-white/40 hover:text-white transition">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            {/* Download */}
            <button onClick={handleDownload} disabled={dlLoading}
              className="text-white/40 hover:text-white transition disabled:opacity-40">
              {dlLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            </button>
            {/* Open original */}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition">
              <ExternalLink size={14} />
            </a>
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/40 hover:text-white transition">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.7)', color: EV_TEXT, border: `1px solid ${EV_BORDER}` }}>𝕏</div>
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(10,0,20,0.9)', borderTop: `1px solid ${EV_BORDER}` }}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: EV_TEXT }}>@{url.match(/x\.com\/([^/]+)/)?.[1] ?? 'clip'}</p>
          <p className="text-[10px]" style={{ color: 'rgba(124,58,237,0.4)' }}>{idx + 1} of {allUrls.length}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition border shrink-0"
          style={{ background: EV_DIM, borderColor: EV_BORDER, color: EV_TEXT }}>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

// ─── Main StellarBladeEve page ─────────────────────────────────────────────────
const QUERIES = [
  'stellar blade eve porn',
  'stellar blade eve nude',
  'stellar blade eve cosplay sex',
  'stellar blade eve rule34',
]

export default function StellarBladeEve() {
  const [allUrls, setAllUrls]   = useState<string[]>([])
  const [visible, setVisible]   = useState(PAGE_SIZE)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [queryIdx, setQueryIdx] = useState(0)
  const [search, setSearch]     = useState('')

  function loadQuery(qIdx: number) {
    setLoading(true); setError(null); setQueryIdx(qIdx)
    setAllUrls([]); setVisible(PAGE_SIZE); setSelected(null)
    const q = QUERIES[qIdx]
    fetch(`/api/x-keyword-search?q=${encodeURIComponent(q)}&limit=60`)
      .then(r => r.json())
      .then(data => {
        const urls: string[] = Array.isArray(data.urls) ? data.urls : []
        setAllUrls(urls)
        if (urls.length) setSelected(urls[0])
        else setError('No results for this search — try another term.')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadQuery(0) }, [])

  const filtered = search
    ? allUrls.filter(u => u.toLowerCase().includes(search.toLowerCase()) ||
        (u.match(/x\.com\/([^/]+)/)?.[1] ?? '').toLowerCase().includes(search.toLowerCase()))
    : allUrls

  const shownUrls = filtered.slice(0, visible)

  function handleSelect(url: string) {
    setSelected(url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative"
      style={{ background: `radial-gradient(ellipse 1200px 500px at 50% -5%, rgba(124,58,237,0.18), transparent 60%), ${BG}` }}>

      {/* Ambient glows */}
      <div className="fixed top-[-8%] left-[-4%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-25"
        style={{ background: `radial-gradient(circle, ${EV_GLOW}, transparent 70%)`, filter: 'blur(70px)' }} />
      <div className="fixed top-[30%] right-[-6%] w-[300px] h-[300px] rounded-full pointer-events-none opacity-15"
        style={{ background: `radial-gradient(circle, rgba(167,139,250,0.6), transparent 70%)`, filter: 'blur(80px)' }} />

      {/* ─── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-44"
          style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(49,7,120,0.4) 45%, rgba(0,0,0,0.9) 100%)` }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, #000 100%)' }} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${EV}, transparent)` }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-[28px] opacity-50 animate-pulse"
                style={{ background: `conic-gradient(from 0deg, ${EV}, rgba(167,139,250,0.7), ${EV})`, filter: 'blur(16px)', animationDuration: '5s' }} />
              <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                style={{ background: `linear-gradient(135deg, #3B0764, #1E0038)`, border: `2px solid ${EV}`, boxShadow: `0 0 0 4px rgba(0,0,0,0.6), 0 8px 32px ${EV_GLOW}` }}>
                ⚔️
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight"
                  style={{ textShadow: `0 0 28px rgba(124,58,237,0.5)` }}>Eve</h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: EV_DIM, color: EV_TEXT, border: `1px solid ${EV_BORDER}` }}>
                  STELLAR BLADE
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(167,139,250,0.6)' }}>
                The last survivor of the 7th Airborne Squad — and the internet's hottest cosplay obsession.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-3">
                {[
                  { icon: Sword, val: `${allUrls.length || '—'}`, label: 'Clips',    color: EV },
                  { icon: Star,  val: 'Cosplay',                   label: 'Category', color: '#f59e0b' },
                  { icon: Zap,   val: '𝕏 / Twitter',              label: 'Source',   color: '#6366f1' },
                ].map(({ icon: Icon, val, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Icon size={11} style={{ color }} />
                    <div>
                      <p className="text-white font-black text-xs leading-none">{val}</p>
                      <p className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search query tabs */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {QUERIES.map((q, i) => (
                  <button key={q} onClick={() => loadQuery(i)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: queryIdx === i ? EV_DIM : 'rgba(255,255,255,0.03)',
                      color: queryIdx === i ? EV_TEXT : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${queryIdx === i ? EV_BORDER : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main layout ─────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-4 pt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT — sticky player */}
          <div className="lg:w-[500px] lg:shrink-0">
            <div className="lg:sticky lg:top-4 flex flex-col gap-3">
              <EvePlayer url={selected} allUrls={filtered.slice(0, visible)} onNavigate={handleSelect} />
              <div className="px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${EV_BORDER}`, color: 'rgba(255,255,255,0.25)' }}>
                <span style={{ color: 'rgba(167,139,250,0.75)' }}>𝕏</span> Streamed live from X/Twitter · cosplay &amp; adult content
              </div>
            </div>
          </div>

          {/* RIGHT — scrollable grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: 'rgba(167,139,250,0.4)' }}>Library</span>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${EV_BORDER}, transparent)` }} />
            </div>

            <div className="flex gap-2 mb-4 items-center">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(167,139,250,0.4)' }} />
                <input value={search} onChange={e => { setSearch(e.target.value) }}
                  placeholder="Filter by handle…"
                  className="w-full h-9 pl-8 pr-3 rounded-xl text-sm text-white placeholder-zinc-700 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${EV_BORDER}` }} />
              </div>
              <button onClick={() => loadQuery(queryIdx)}
                className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
                style={{ background: EV_DIM, border: `1px solid ${EV_BORDER}`, color: EV_TEXT }}>
                <RefreshCw size={11} /> Refresh
              </button>
              <span className="text-xs shrink-0 px-2.5 py-1.5 rounded-lg font-bold"
                style={{ color: EV_TEXT, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {filtered.length}
              </span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: EV }} />
                <p className="text-xs" style={{ color: 'rgba(124,58,237,0.5)' }}>Searching X for Eve content…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <p className="text-sm text-center py-8" style={{ color: 'rgba(124,58,237,0.5)' }}>{error}</p>
            )}

            {/* Grid */}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {shownUrls.map((url) => (
                    <EveCard key={url} url={url}
                      active={selected === url}
                      onSelect={handleSelect} />
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-16 text-sm" style={{ color: 'rgba(124,58,237,0.3)' }}>
                    No clips found — try refreshing or another query above.
                  </div>
                )}

                {/* Load More */}
                {visible < filtered.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisible(v => Math.min(v + PAGE_SIZE, filtered.length))}
                      className="flex items-center gap-2 h-12 px-8 rounded-2xl font-black text-sm tracking-wider transition-all active:scale-95"
                      style={{
                        background: EV_DIM,
                        border: `1px solid ${EV_BORDER}`,
                        color: EV_TEXT,
                        boxShadow: `0 0 24px ${EV_GLOW}`,
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
