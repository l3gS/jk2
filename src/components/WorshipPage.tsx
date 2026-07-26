import { useState, useEffect, useCallback, useRef } from 'react'
import Hls from 'hls.js'
import {
  Download, Play, Heart, X, ChevronDown, Shuffle, Maximize2,
  Volume2, VolumeX, Flame, Skull, Star, ChevronRight, Image as ImageIcon,
  ExternalLink, Loader2,
} from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

export interface StarTask {
  emoji: string
  title: string
  body: string
  level: 1 | 2 | 3 | 4
}

export interface StarConfig {
  id: string
  name: string
  displayName: { line1: string; line2: string }
  emoji: string
  heroGradient: string
  heroGlowRgb: string
  accentTextClass: string
  accentBgClass: string
  accentBorderClass: string
  accentFromClass: string
  accentViaClass: string
  accentToClass: string
  country: string
  born: string
  nationality: string
  height: string
  tags: string[]
  stats: Array<{ label: string; value: string }>
  shortBio: string
  paragraphs: string[]
  tasks: StarTask[]
  searchQuery: string
  galleryCats: string[]
  leaksTitle: string
  leaksIntro: string
  worshipKey: string
  faveKey: string
  curatedXLinks?: string[]
  /** When true the xvideos/pornhub search section is hidden and the curated X links are the sole video source shown at the top */
  hideSearchVideos?: boolean
  /** If set, fetch gallery images from this URL instead of the generic anime /api/gallery endpoint */
  customGalleryUrl?: string
  /** Optional portrait photo shown in the hero right panel (overrides the icon-api fallback) */
  heroPhotoUrl?: string
  /** Optional intro video shown as a second square below the portrait */
  introVideoUrl?: string
  /** Marks this page as Sam's #1 favourite — triggers crown banner, milestone messages, love letter, bigger photo grid */
  isFavourite?: boolean
  /** Personal letter paragraphs shown in the Love Letter section (only when isFavourite) */
  loveLetterParagraphs?: string[]
}

interface VideoItem {
  id: string
  eid: string
  title: string
  thumbnail: string
  videoPageUrl: string
  source: 'xvideos' | 'pornhub'
}

// ── Heat level config ──────────────────────────────────────────────────────

const HEAT = {
  1: { label: 'Mild',    icon: '💋', color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
  2: { label: 'Spicy',   icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  3: { label: 'Intense', icon: '💀', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  4: { label: 'Inferno', icon: '☠️', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
} as const

// ── VideoCard ──────────────────────────────────────────────────────────────

function VideoCard({
  video, onPlay, isFaved, onFave, cfg,
}: { video: VideoItem; onPlay: (v: VideoItem) => void; isFaved: boolean; onFave: (v: VideoItem) => void; cfg: StarConfig }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={video.thumbnail} alt={video.title}
          className={`w-full h-full object-cover transition-all duration-300 ${hovered ? 'scale-105 brightness-60' : ''}`}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full ${cfg.accentBgClass} border ${cfg.accentBorderClass} flex items-center justify-center shadow-2xl`}>
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        <span className="absolute top-2 right-2 text-[9px] font-bold bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded">
          {video.source === 'xvideos' ? 'XV' : 'PH'}
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-xs text-white/80 line-clamp-2 leading-snug">{video.title}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-zinc-500">{video.source}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFave(video) }}
            className={`p-1 rounded-full transition-colors ${isFaved ? cfg.accentTextClass : 'text-zinc-600 hover:text-white'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PlayDialog ─────────────────────────────────────────────────────────────

function PlayDialog({
  video, onClose, onNext, cfg,
}: { video: VideoItem; onClose: () => void; onNext?: () => void; cfg: StarConfig }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    setLoading(true)
    setStreamUrl(null)
    fetchVideoInfo(video.videoPageUrl)
      .then((d) => setStreamUrl(d.mediaURLs?.[0] || d.media_extended?.[0]?.url || null))
      .catch(() => setStreamUrl(null))
      .finally(() => setLoading(false))
    return () => { hlsRef.current?.destroy() }
  }, [video])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !streamUrl) return
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(el)
    } else {
      el.src = getStreamUrl(streamUrl)
    }
    el.muted = muted
  }, [streamUrl])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleDownload = async () => {
    setDlLoading(true)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const preTab = isIOSDevice ? window.open('', '_blank') : null
    try {
      const result = await saveToDevice({
        pageUrl: video.videoPageUrl,
        title: video.title,
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch {
      preTab?.close()
      toast.error('Download failed')
    } finally {
      setDlLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-3xl bg-zinc-950 rounded-2xl overflow-hidden border ${cfg.accentBorderClass} shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <span className="text-lg">{cfg.emoji}</span>
          <p className="flex-1 text-sm font-medium text-white/90 line-clamp-1">{video.title}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {onNext && (
              <button onClick={onNext} className={`text-[10px] font-bold ${cfg.accentTextClass} ${cfg.accentBgClass} border ${cfg.accentBorderClass} px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity`}>
                NEXT ▶
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-10 h-10 border-2 ${cfg.accentBorderClass} border-t-current ${cfg.accentTextClass} rounded-full animate-spin`} />
            </div>
          ) : streamUrl ? (
            <video ref={videoRef} poster={video.thumbnail} controls autoPlay className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <img src={video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 rounded-full ${cfg.accentBgClass} border ${cfg.accentBorderClass} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-3xl">{cfg.emoji}</span>
                </div>
                <p className="text-white/70 text-sm mb-1">Preview not available</p>
                <p className="text-zinc-500 text-xs">Click Download to save the full video</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={dlLoading}
            className={`flex-1 h-10 ${cfg.accentBgClass} hover:opacity-90 border ${cfg.accentBorderClass} ${cfg.accentTextClass} font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50`}
          >
            <Download className="w-4 h-4" />
            {dlLoading ? 'Preparing…' : 'DOWNLOAD'}
          </button>
          <a href={video.videoPageUrl} target="_blank" rel="noopener noreferrer"
            className="h-10 px-4 bg-white/5 hover:bg-white/10 text-zinc-400 text-sm font-medium rounded-xl flex items-center gap-2 border border-white/10 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Open
          </a>
        </div>
      </div>
    </div>
  )
}

// ── ImageLightbox ──────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/98 backdrop-blur-md" />
      <button className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
      <img src={src} alt="" className="relative z-10 max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

// ── TaskCard ───────────────────────────────────────────────────────────────

function TaskCard({ task, index, expanded, onToggle }: { task: StarTask; index: number; expanded: boolean; onToggle: () => void }) {
  const h = HEAT[task.level]
  return (
    <div className={`rounded-2xl border ${h.border} ${h.bg} overflow-hidden transition-all`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all"
        onClick={onToggle}
      >
        <span className="text-xl shrink-0">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{task.title}</p>
          <span className={`text-[10px] font-bold ${h.color} uppercase tracking-wider`}>{h.icon} {h.label}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="h-px bg-white/5 mb-3" />
          <p className="text-sm text-white/70 leading-relaxed">{task.body}</p>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${h.bg} border ${h.border}`}>
            <span className="text-xs">{h.icon}</span>
            <span className={`text-[10px] font-bold ${h.color} uppercase tracking-wider`}>Task {index + 1} of {h.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── XLeakCard ──────────────────────────────────────────────────────────────

function XLeakCard({ url, index, cfg }: { url: string; index: number; cfg: StarConfig }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [thumb, setThumb] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handle = url.match(/x\.com\/([^/]+)\/status/)?.[1] ?? `leak${index + 1}`

  // Lazy-load thumbnail + pre-cache stream URL when card scrolls into view
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

  // Download: resolve stream URL first (faster than ytdl), open in new tab on iOS
  const handleDownload = async () => {
    setDlLoading(true)
    // Pre-open a blank tab synchronously (user gesture still active) so iOS
    // Safari's popup blocker doesn't kill the window.open() inside saveToDevice.
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
        title: `${cfg.name} - @${handle}`,
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch { preTab?.close(); toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  return (
    <div ref={cardRef} className={`rounded-xl border ${cfg.accentBorderClass} bg-zinc-900/60 overflow-hidden`}>
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
          <div className={`relative w-12 h-12 rounded-full ${cfg.accentBgClass} border ${cfg.accentBorderClass} flex items-center justify-center shadow-lg`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
          </div>
          <span className={`absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 ${cfg.accentTextClass} px-2 py-0.5 rounded`}>
            @{handle}
          </span>
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded">𝕏</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <p className={`flex-1 text-xs ${cfg.accentTextClass} opacity-70 truncate`}>@{handle}</p>
        <button onClick={handleDownload} disabled={dlLoading}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 ${cfg.accentBgClass} border ${cfg.accentBorderClass} ${cfg.accentTextClass} rounded-lg transition-all disabled:opacity-50 hover:opacity-80`}
        >
          {dlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Download
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 bg-white/5 border border-white/10 text-zinc-400 rounded-lg hover:text-white transition-colors"
          title="Open on X"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

// ── Main WorshipPage ───────────────────────────────────────────────────────

interface Props {
  cfg: StarConfig
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string; sourcePageUrl?: string }) => void
}

export default function WorshipPage({ cfg, onSaveToVault: _onSaveToVault }: Props) {
  const [videos, setVideos]               = useState<VideoItem[]>([])
  const [loading, setLoading]             = useState(false)
  const [page, setPage]                   = useState(1)
  const [hasMore, setHasMore]             = useState(true)
  const [activeVideo, setActiveVideo]     = useState<VideoItem | null>(null)
  const [worshipCount, setWorshipCount]   = useState(0)
  const [faves, setFaves]                 = useState<Set<string>>(new Set())
  const [filter, setFilter]               = useState<'all' | 'saved'>('all')
  const [worshipMode, setWorshipMode]     = useState(false)
  const [galleryImgs, setGalleryImgs]     = useState<string[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [lightboxImg, setLightboxImg]     = useState<string | null>(null)
  const [expandedTask, setExpandedTask]   = useState<number | null>(0)

  useEffect(() => {
    const n = parseInt(localStorage.getItem(cfg.worshipKey) || '0', 10) + 1
    localStorage.setItem(cfg.worshipKey, String(n))
    setWorshipCount(n)
    try { setFaves(new Set(JSON.parse(localStorage.getItem(cfg.faveKey) || '[]'))) } catch {}
    loadGallery()
  }, [])

  const loadGallery = async () => {
    setGalleryLoading(true)
    try {
      const imgs: string[] = []
      if (cfg.customGalleryUrl) {
        // Real-photo gallery from a dedicated endpoint
        const r = await fetch(cfg.customGalleryUrl)
        if (r.ok) {
          const data = await r.json()
          const items: string[] = (data.images || data || []).map((x: { url?: string } | string) =>
            typeof x === 'string' ? x : x?.url
          ).filter(Boolean)
          imgs.push(...items)
        }
      } else {
        for (const cat of cfg.galleryCats.slice(0, 2)) {
          const r = await fetch(`/api/gallery?cat=${encodeURIComponent(cat)}&n=6&page=${Math.floor(Math.random() * 3) + 1}`)
          if (r.ok) {
            const data = await r.json()
            const items: string[] = (data.images || data || []).map((x: { url?: string } | string) =>
              typeof x === 'string' ? x : x?.url
            ).filter(Boolean)
            imgs.push(...items)
          }
        }
      }
      setGalleryImgs(imgs.slice(0, 24))
    } catch { /* silently fail */ }
    finally { setGalleryLoading(false) }
  }

  const loadVideos = useCallback(async (pg: number) => {
    if (loading) return
    setLoading(true)
    try {
      const [xvRes] = await Promise.allSettled([
        fetch(`/api/xvsearch?q=${encodeURIComponent(cfg.searchQuery)}&page=${pg}`).then(r => r.json()),
      ])
      const xvItems: VideoItem[] = ((xvRes.status === 'fulfilled' ? xvRes.value.results : []) || [])
        .filter((v: VideoItem) => v.title && v.thumbnail)
        .map((v: VideoItem) => ({ ...v, source: 'xvideos' as const }))
      const combined = [...xvItems]
      if (combined.length === 0) setHasMore(false)
      else setVideos(prev => pg === 1 ? combined : [...prev, ...combined])
    } catch { toast.error('Failed to load videos') }
    finally { setLoading(false) }
  }, [loading, cfg.searchQuery])

  useEffect(() => { loadVideos(1) }, [])

  const loadMore = () => { const next = page + 1; setPage(next); loadVideos(next) }

  const toggleFave = (v: VideoItem) => {
    setFaves(prev => {
      const next = new Set(prev)
      if (next.has(v.id)) next.delete(v.id); else next.add(v.id)
      localStorage.setItem(cfg.faveKey, JSON.stringify([...next]))
      return next
    })
  }

  const shuffle = () => { if (videos.length > 0) setActiveVideo(videos[Math.floor(Math.random() * videos.length)]) }
  const nextVideo = () => {
    if (!activeVideo) return
    const idx = videos.findIndex(v => v.id === activeVideo.id)
    setActiveVideo(videos[(idx + 1) % videos.length])
  }

  const displayVideos = filter === 'saved' ? videos.filter(v => faves.has(v.id)) : videos

  // ── Milestone devotion message (favourite pages only) ──────────────────
  const devotionMessage = cfg.isFavourite
    ? worshipCount >= 50 ? '50+ visits. You live here now. She owns you completely.'
    : worshipCount >= 25 ? `${worshipCount} visits. This isn't casual anymore. You're devoted.`
    : worshipCount >= 10 ? `${worshipCount} times back. You know every video. You keep coming anyway.`
    : worshipCount >= 5  ? `${worshipCount} visits. You keep coming back. She knows.`
    : worshipCount >= 2  ? 'Second visit. You knew you had to come back.'
    : 'First time here. Not the last.'
    : null

  return (
    <div className="min-h-screen pb-28">

      {/* ── #1 FAVOURITE CROWN BANNER ── */}
      {cfg.isFavourite && (
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-950 via-amber-900/60 to-yellow-950 border-b border-yellow-600/30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
            <span className="text-yellow-400/80 text-base">♛</span>
            <p className="text-[11px] font-black tracking-[0.35em] uppercase text-yellow-300/90">
              Sam's #1 Favourite
            </p>
            <span className="text-yellow-400/80 text-base">♛</span>
            <span className="hidden sm:inline text-[9px] text-yellow-600/70 tracking-widest uppercase ml-2">· absolute favourite · she owns you ·</span>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.heroGradient}`} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top right, ${cfg.heroGlowRgb}, transparent 65%)` }} />
        {/* Extra golden shimmer for favourite */}
        {cfg.isFavourite && (
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(234,179,8,0.08), transparent 60%)' }} />
        )}
        <div className="relative px-4 sm:px-6 pt-10 pb-8 max-w-5xl mx-auto">
          <p className={`text-[10px] font-bold tracking-[0.5em] ${cfg.accentTextClass} opacity-60 uppercase mb-2`}>✦ Nacre's Hub Worship Zone ✦</p>
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1">
              <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white mb-1 leading-none">
                {cfg.displayName.line1}
                <span className={`block bg-gradient-to-r ${cfg.accentFromClass} ${cfg.accentViaClass} ${cfg.accentToClass} bg-clip-text text-transparent`}>
                  {cfg.displayName.line2}
                </span>
              </h1>
              <p className={`${cfg.accentTextClass} opacity-70 text-sm mb-5`}>
                {cfg.country} · Born {cfg.born} · {cfg.nationality}
              </p>

              {/* Short bio */}
              <p className="text-zinc-300 text-sm leading-relaxed mb-5 max-w-xl">{cfg.shortBio}</p>

              {/* Detailed bio paragraphs */}
              <div className="space-y-3 max-w-xl">
                {cfg.paragraphs.map((p, i) => (
                  <p key={i} className="text-zinc-400 text-[13px] leading-relaxed">{p}</p>
                ))}
              </div>

              {/* Stats row */}
              {cfg.stats.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-5">
                  {cfg.stats.map((s) => (
                    <div key={s.label} className={`${cfg.accentBgClass} border ${cfg.accentBorderClass} rounded-xl px-3 py-2`}>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500">{s.label}</p>
                      <p className={`text-sm font-bold ${cfg.accentTextClass}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {cfg.tags.map(t => (
                  <span key={t} className={`text-[10px] font-medium ${cfg.accentBgClass} border ${cfg.accentBorderClass} ${cfg.accentTextClass} px-2 py-0.5 rounded-full`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-2 lg:items-end lg:min-w-[180px]">
              {/* Hero portrait */}
              <div className="w-full lg:w-44 aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/8 shadow-xl">
                <img
                  src={cfg.heroPhotoUrl ?? `/api/icon/${cfg.id}`}
                  alt={cfg.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              {/* Intro video */}
              {cfg.introVideoUrl && (
                <div className="w-full lg:w-44 aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-rose-500/20 shadow-xl relative group">
                  <video
                    src={cfg.introVideoUrl}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    onError={() => {}}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-bold text-white/80 bg-black/60 rounded px-1.5 py-0.5 text-center tracking-wider uppercase">
                      {cfg.name.split(' ')[0]}'s Intro
                    </p>
                  </div>
                </div>
              )}
              <div className={`flex items-center gap-2 ${cfg.accentBgClass} border ${cfg.accentBorderClass} rounded-xl px-4 py-2.5`}>
                <span className="text-2xl">{cfg.emoji}</span>
                <div>
                  <p className={`text-[10px] ${cfg.accentTextClass} opacity-60 uppercase tracking-widest`}>Times Worshipped</p>
                  <p className={`text-2xl font-bold ${cfg.accentTextClass}`}>{worshipCount.toLocaleString()}</p>
                </div>
              </div>
              {devotionMessage && (
                <div className="bg-yellow-950/40 border border-yellow-600/25 rounded-xl px-3 py-2 w-full">
                  <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-0.5">Devotion</p>
                  <p className="text-xs text-yellow-200/80 italic leading-snug">{devotionMessage}</p>
                </div>
              )}
              <button
                onClick={shuffle}
                className={`flex items-center gap-2 ${cfg.accentBgClass} hover:opacity-90 border ${cfg.accentBorderClass} ${cfg.accentTextClass} font-bold text-sm px-5 py-2.5 rounded-xl transition-all w-full justify-center`}
              >
                <Shuffle className="w-4 h-4" /> Shuffle Play
              </button>
              <button
                onClick={() => setWorshipMode(!worshipMode)}
                className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all border w-full justify-center ${
                  worshipMode ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${worshipMode ? 'fill-red-400 text-red-400 animate-pulse' : ''}`} />
                {worshipMode ? 'Worship Mode ON' : 'Worship Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Worship-mode overlay banner */}
      {worshipMode && (
        <div className={`sticky top-16 z-50 ${cfg.accentBgClass} border-b ${cfg.accentBorderClass} px-4 py-2 text-center`}>
          <p className={`text-xs font-bold ${cfg.accentTextClass} animate-pulse`}>
            💋 WORSHIP MODE ACTIVE — every video is for {cfg.name.split(' ')[0]}. Don't you dare look away.
          </p>
        </div>
      )}

      {/* ── TASKS ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">Sam's Tasks</h2>
          <span className="text-[10px] text-zinc-600">— complete before you're allowed to cum</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cfg.tasks.map((task, i) => (
            <TaskCard
              key={i}
              task={task}
              index={i}
              expanded={expandedTask === i}
              onToggle={() => setExpandedTask(expandedTask === i ? null : i)}
            />
          ))}
        </div>
      </div>

      {/* ── LOVE LETTER (favourite pages only) ── */}
      {cfg.isFavourite && cfg.loveLetterParagraphs && cfg.loveLetterParagraphs.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-10">
          <div className="relative bg-gradient-to-br from-zinc-950 via-rose-950/20 to-zinc-950 border border-rose-500/20 rounded-2xl p-6 sm:p-8 overflow-hidden">
            {/* Decorative corner glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/30" />
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-rose-400/60">A Letter</p>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/30" />
              </div>
              <div className="space-y-4">
                {cfg.loveLetterParagraphs.map((p, i) => (
                  <p key={i} className={`leading-relaxed ${i === 0 ? 'text-zinc-200 text-[15px] italic' : 'text-zinc-400 text-[13px]'}`}>{p}</p>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/20" />
                <span className="text-rose-400/40 text-xs">— Sam</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE GALLERY (Leaks) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">{cfg.leaksTitle}</h2>
            {cfg.isFavourite && <span className="text-[9px] text-yellow-500/60 font-bold tracking-widest uppercase">♛ Favourite</span>}
          </div>
          <button onClick={loadGallery} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium">
            Refresh ↺
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed max-w-2xl">{cfg.leaksIntro}</p>
        {/* Bigger grid for real photos (favourite + customGalleryUrl), smaller grid for anime */}
        {(() => {
          const bigGrid = cfg.isFavourite && !!cfg.customGalleryUrl
          const gridClass = bigGrid
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
            : 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2'
          const skeletonCount = bigGrid ? 8 : 12
          const emptySpan = bigGrid ? 'col-span-4' : 'col-span-6'
          return galleryLoading ? (
            <div className={gridClass}>
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className={`${bigGrid ? 'aspect-[3/4]' : 'aspect-square'} rounded-xl bg-zinc-900 animate-pulse`} />
              ))}
            </div>
          ) : (
            <div className={gridClass}>
              {galleryImgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxImg(src)}
                  className={`${bigGrid ? 'aspect-[3/4]' : 'aspect-square'} rounded-xl overflow-hidden bg-zinc-900 hover:scale-[1.02] transition-transform ring-0 hover:ring-1 hover:ring-rose-500/30`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).closest('button')!.style.display = 'none' }} />
                </button>
              ))}
              {galleryImgs.length === 0 && (
                <div className={`${emptySpan} text-center py-10 text-zinc-600 text-sm`}>No images loaded — hit Refresh</div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── CURATED X VIDEOS (primary when hideSearchVideos) ── */}
      {cfg.curatedXLinks && cfg.curatedXLinks.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
          <div className={`flex items-center gap-2 mb-2 ${cfg.accentBorderClass} pb-3 border-b`}>
            <span className="text-base">🎬</span>
            <h2 className={`text-sm font-bold tracking-widest uppercase ${cfg.accentTextClass}`}>
              {cfg.hideSearchVideos ? 'Her Videos' : 'Exclusive X Videos'}
            </h2>
            <span className="text-[10px] text-zinc-600">— {cfg.curatedXLinks.length} curated clips · tap to play · save to device</span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Tap any card to stream inline. Use the Save button to download directly to your device.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cfg.curatedXLinks.map((link, i) => (
              <XLeakCard key={i} url={link} index={i} cfg={cfg} />
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH VIDEOS (hidden when hideSearchVideos=true) ── */}
      {!cfg.hideSearchVideos && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">More Videos</h2>
            <span className="text-[10px] text-zinc-600">— XVideos + PornHub</span>
          </div>

          {/* Filter bar */}
          <div className={`flex items-center gap-3 mb-5 pb-3 border-b border-white/5`}>
            {(['all', 'saved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  filter === f ? `${cfg.accentBgClass} ${cfg.accentTextClass} border ${cfg.accentBorderClass}` : 'text-zinc-500 hover:text-white'
                }`}
              >
                {f === 'all' ? `All (${videos.length})` : `Saved (${faves.size})`}
              </button>
            ))}
          </div>

          {displayVideos.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">{cfg.emoji}</p>
              <p className="text-zinc-500 text-lg">
                {filter === 'saved' ? 'No saved videos yet' : 'Loading her collection…'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayVideos.map(v => (
              <VideoCard key={`${v.source}-${v.id}`} video={v} onPlay={setActiveVideo} isFaved={faves.has(v.id)} onFave={toggleFave} cfg={cfg} />
            ))}
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 border border-white/5 animate-pulse">
                <div className="aspect-video bg-zinc-800" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>

          {hasMore && !loading && displayVideos.length > 0 && filter === 'all' && (
            <div className="text-center mt-8">
              <button onClick={loadMore}
                className={`px-8 py-3 ${cfg.accentBgClass} border ${cfg.accentBorderClass} ${cfg.accentTextClass} font-semibold rounded-xl hover:opacity-80 transition-opacity flex items-center gap-2 mx-auto`}
              >
                <ChevronDown className="w-4 h-4" /> Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SKULL FOOTER ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 text-center">
        <Skull className="w-5 h-5 mx-auto text-zinc-700 mb-2" />
        <p className="text-xs text-zinc-700">This page was built for Sam and Sam only. {cfg.emoji}</p>
      </div>

      {activeVideo && (
        <PlayDialog video={activeVideo} onClose={() => setActiveVideo(null)} onNext={videos.length > 1 ? nextVideo : undefined} cfg={cfg} />
      )}
      {lightboxImg && <ImageLightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />}
    </div>
  )
}
