import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Download, Heart, ExternalLink,
  Loader2, Film, Users, Bookmark, Search, Repeat, Sparkles,
  MapPin, Eye, Share2, Bot, X as XIcon,
} from 'lucide-react'
import Hls from 'hls.js'
import { xvChannel, phChannel, phProfile, fetchVideoInfo, getStreamUrl, getStoredAccountId, getStoredUsername, postToFeed } from '../api'
import type { XvResult } from '../api'

// ─── Constants ────────────────────────────────────────────────────────────────
const HOVER_CACHE = new Map<string, string>()
type VideoSource = 'xvideos' | 'pornhub'

// ─── Grey sleek theme ─────────────────────────────────────────────────────────
const RED = '#9CA3AF'            // zinc/grey-400
const RED_DIM = 'rgba(156,163,175,0.14)'
const RED_BORDER = 'rgba(156,163,175,0.25)'
const RED_GLOW = 'rgba(156,163,175,0.30)'
const RED_TEXT = 'rgba(220,220,220,0.92)'
const BG = '#000000'

// iOS detection — used for native fullscreen
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

// ─── SVG sharpening filters ────────────────────────────────────────────────────
const SVG_SHARPEN = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0">
  <defs>
    <filter id="cs-sharpen">
      <feConvolveMatrix order="3" kernelMatrix="0 -0.5 0  -0.5 3 -0.5  0 -0.5 0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.06"/>
        <feFuncG type="linear" slope="1.06"/>
        <feFuncB type="linear" slope="1.06"/>
      </feComponentTransfer>
    </filter>
    <filter id="cs-ultra">
      <feConvolveMatrix order="3" kernelMatrix="0 -1 0  -1 5 -1  0 -1 0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.12" intercept="-0.04"/>
        <feFuncG type="linear" slope="1.12" intercept="-0.04"/>
        <feFuncB type="linear" slope="1.15" intercept="-0.05"/>
      </feComponentTransfer>
    </filter>
  </defs>
</svg>
`

// ─── Custom video controls ─────────────────────────────────────────────────────
function VideoControls({
  vidRef, hq, onHqToggle, onFullscreen, isFullscreen, title, streamUrl, onNext, onPrev, hasPrev, hasNext,
  onPlayingChange,
}: {
  vidRef: React.RefObject<HTMLVideoElement | null>
  hq: boolean
  onHqToggle: () => void
  onFullscreen: () => void
  isFullscreen: boolean
  title: string
  streamUrl: string | null
  onNext: () => void
  onPrev: () => void
  hasPrev: boolean
  hasNext: boolean
  onPlayingChange?: (playing: boolean) => void
}) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [looping, setLooping] = useState(false)
  const [showSpeed, setShowSpeed] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [visible, setVisible] = useState(true)
  const [showVolSlider, setShowVolSlider] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const showControls = useCallback(() => {
    setVisible(true)
    clearTimeout(hideTimer.current!)
    hideTimer.current = setTimeout(() => setVisible(false), 3000)
  }, [])

  useEffect(() => {
    const v = vidRef.current
    if (!v) return
    const onPlay  = () => { setPlaying(true);  onPlayingChange?.(true) }
    const onPause = () => { setPlaying(false); onPlayingChange?.(false) }
    const onTime  = () => !scrubbing && setCurrent(v.currentTime)
    const onMeta  = () => setDuration(v.duration || 0)
    const onVol   = () => { setMuted(v.muted); setVolume(v.volume) }
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('durationchange', onMeta)
    v.addEventListener('volumechange', onVol)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('durationchange', onMeta)
      v.removeEventListener('volumechange', onVol)
    }
  }, [vidRef, scrubbing])

  useEffect(() => {
    const v = vidRef.current
    if (v) v.loop = looping
  }, [looping, vidRef])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const v = vidRef.current
      if (!v) return
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.code === 'Space')      { e.preventDefault(); v.paused ? v.play() : v.pause() }
      if (e.code === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(duration, v.currentTime + 10) }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10) }
      if (e.code === 'KeyM')       { v.muted = !v.muted }
      if (e.code === 'KeyF')       { onFullscreen() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [duration, onFullscreen, vidRef])

  // ── LUNAR remote control events ────────────────────────────────────────────
  useEffect(() => {
    const onPause = () => { vidRef.current?.pause() }
    const onDownload = () => {
      if (streamUrl) {
        const url = `/api/download?url=${encodeURIComponent(streamUrl)}&filename=creamyspot-${Date.now()}.mp4`
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        if (isIOSDevice) {
          window.open(url, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = url
          a.download = `creamyspot-${Date.now()}.mp4`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => { try { document.body.removeChild(a) } catch {} }, 200)
        }
      }
    }
    window.addEventListener('lunar:pause-video', onPause)
    window.addEventListener('lunar:download-video', onDownload)
    return () => {
      window.removeEventListener('lunar:pause-video', onPause)
      window.removeEventListener('lunar:download-video', onDownload)
    }
  }, [vidRef, streamUrl, title])

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = vidRef.current; const bar = progressRef.current
    if (!v || !bar || !duration) return
    const pct = Math.max(0, Math.min(1, (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth))
    v.currentTime = pct * duration
    setCurrent(pct * duration)
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, zIndex: 10 }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onTouchStart={showControls}
    >
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, transparent 100%)' }} />

      {/* Prev/Next arrows */}
      {hasPrev && (
        <button onClick={onPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${RED_BORDER}`, zIndex: 11 }}>
          <ChevronLeft size={20} style={{ color: RED_TEXT }}/>
        </button>
      )}
      {hasNext && (
        <button onClick={onNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${RED_BORDER}`, zIndex: 11 }}>
          <ChevronRight size={20} style={{ color: RED_TEXT }}/>
        </button>
      )}

      {/* Controls bar */}
      <div className="relative z-10 px-3 pb-3 flex flex-col gap-1.5">
        <p className="text-white text-xs font-semibold truncate opacity-70 px-1">{title}</p>

        {/* Progress */}
        <div ref={progressRef}
          className="relative h-1.5 rounded-full cursor-pointer group/bar"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onClick={seek}
          onMouseDown={() => setScrubbing(true)}
          onMouseUp={() => setScrubbing(false)}>
          <div className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${pct}%`, background: RED }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${pct}% - 6px)`, boxShadow: `0 0 6px ${RED}` }} />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1">
          <button onClick={() => { const v = vidRef.current; v?.paused ? v.play() : v.pause() }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition active:scale-90">
            {playing ? <Pause size={18} fill="white"/> : <Play size={18} fill="white"/>}
          </button>
          <button onClick={() => { const v = vidRef.current; if (v) v.currentTime -= 10 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition text-[10px] font-bold">
            -10
          </button>
          <span className="text-[11px] font-mono text-white/40 min-w-[68px] text-center">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
          <button onClick={() => { const v = vidRef.current; if (v) v.currentTime += 10 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition text-[10px] font-bold">
            +10
          </button>
          <div className="flex-1"/>

          {/* Loop */}
          <button onClick={() => setLooping(l => !l)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:bg-white/10"
            style={{ color: looping ? RED : 'rgba(255,255,255,0.35)' }}>
            <Repeat size={13}/>
          </button>

          {/* HQ */}
          <button onClick={onHqToggle}
            className="h-7 px-2 rounded-lg text-[10px] font-black transition border"
            style={{
              background: hq ? `${RED_DIM}` : 'rgba(255,255,255,0.04)',
              borderColor: hq ? RED_BORDER : 'rgba(255,255,255,0.08)',
              color: hq ? RED_TEXT : 'rgba(255,255,255,0.35)',
            }}>
            {hq ? '✦ HQ' : 'HQ'}
          </button>

          {/* Speed */}
          <div className="relative">
            <button onClick={() => setShowSpeed(s => !s)}
              className="h-7 px-2 rounded-lg text-[10px] font-black text-white/35 hover:text-white border border-white/8 hover:bg-white/8 transition">
              {speed}×
            </button>
            {showSpeed && (
              <div className="absolute bottom-full right-0 mb-1 rounded-xl overflow-hidden border shadow-2xl z-30"
                style={{ background: '#0A0000', borderColor: RED_BORDER, minWidth: 70 }}>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3].map(s => (
                  <button key={s} onClick={() => {
                    const v = vidRef.current; if (v) v.playbackRate = s
                    setSpeed(s); setShowSpeed(false)
                  }}
                    className="block w-full text-center px-4 py-1.5 text-xs font-bold hover:bg-white/5 transition"
                    style={{ color: speed === s ? RED_TEXT : 'rgba(255,255,255,0.55)' }}>
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="relative flex items-center">
            <button
              onClick={() => { const v = vidRef.current; if (v) v.muted = !v.muted }}
              onMouseEnter={() => setShowVolSlider(true)}
              onMouseLeave={() => setShowVolSlider(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
              {muted || volume === 0 ? <VolumeX size={13}/> : <Volume2 size={13}/>}
            </button>
            {showVolSlider && (
              <div className="absolute bottom-full right-0 mb-1 px-2 py-2 rounded-xl border flex flex-col items-center gap-1 z-30"
                style={{ background: '#0A0000', borderColor: RED_BORDER }}
                onMouseEnter={() => setShowVolSlider(true)}
                onMouseLeave={() => setShowVolSlider(false)}>
                <input type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={e => {
                    const v = vidRef.current; if (!v) return
                    v.volume = parseFloat(e.target.value); v.muted = false
                  }}
                  className="w-20 accent-red-600" style={{ writingMode: 'horizontal-tb' }}/>
                <span className="text-[10px] text-white/35">{Math.round((muted ? 0 : volume) * 100)}%</span>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={onFullscreen}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition active:scale-90">
            {isFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Embedded player ───────────────────────────────────────────────────────────
function EmbeddedPlayer({
  video, allVideos, onNavigate, source, onSaveToVault, onSendToDownloader, onRepost, onPlayingChange,
  dominanceActive, dominanceMsg, lunarAutoFull,
}: {
  video: XvResult | null
  allVideos: XvResult[]
  onNavigate: (v: XvResult) => void
  source: VideoSource
  onSaveToVault?: (item: XvResult, streamUrl: string) => void
  onSendToDownloader?: (pageUrl: string) => void
  onRepost?: (item: XvResult) => void
  onPlayingChange?: (playing: boolean) => void
  dominanceActive?: boolean
  dominanceMsg?: string
  lunarAutoFull?: boolean
}) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hq, setHq] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reposted, setReposted] = useState(false)
  const vidRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const idx = video ? allVideos.findIndex(v => v.videoPageUrl === video.videoPageUrl) : -1
  const hasPrev = idx > 0
  const hasNext = idx < allVideos.length - 1

  // Fetch stream URL (skip HOVER_CACHE for pornhub — signed URLs expire)
  useEffect(() => {
    if (!video) return
    const url = video.videoPageUrl
    setStreamUrl(null); setSaved(false); setReposted(false); setLoading(true)
    if (source !== 'pornhub' && HOVER_CACHE.has(url)) {
      setStreamUrl(HOVER_CACHE.get(url)!)
      setLoading(false)
      return
    }
    fetchVideoInfo(url)
      .then(d => {
        const s = d.mediaURLs?.[0] || d.media_extended?.[0]?.url
        if (s) { if (source !== 'pornhub') HOVER_CACHE.set(url, s); setStreamUrl(s) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [video?.videoPageUrl, source])

  // Load stream into HLS or <video src>
  useEffect(() => {
    const v = vidRef.current
    if (!v || !streamUrl) return
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    // iOS has native HLS — bypass HLS.js so webkitEnterFullscreen works
    if (isIOS && /\.m3u8/i.test(streamUrl)) {
      v.src = getStreamUrl(streamUrl)
      v.load()
      v.addEventListener('loadedmetadata', () => v.play().catch(() => {}), { once: true })
      return
    }
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 60,
        xhrSetup: xhr => { xhr.withCredentials = false } })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}))
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hlsRef.current?.destroy(); hlsRef.current = null
          v.src = getStreamUrl(streamUrl)
          v.load(); v.play().catch(() => {})
        }
      })
    } else {
      v.src = streamUrl.startsWith('/') ? streamUrl : getStreamUrl(streamUrl)
      v.load()
      v.addEventListener('loadedmetadata', () => v.play().catch(() => {}), { once: true })
    }
    return () => { hlsRef.current?.destroy() }
  }, [streamUrl])

  // iOS-aware fullscreen
  function handleFullscreen() {
    if (isIOS) {
      const v = vidRef.current
      if (v) {
        if ((v as any).webkitEnterFullscreen) {
          // Ensure video has src before requesting fullscreen
          if (!v.src && streamUrl) { v.src = getStreamUrl(streamUrl); v.load() }
          ;(v as any).webkitEnterFullscreen()
        } else {
          // Fallback: show native controls so iOS toolbar appears
          v.controls = true
          v.play().catch(() => {})
        }
      }
      return
    }
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.(); setIsFullscreen(true)
    } else {
      document.exitFullscreen?.(); setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    const v = vidRef.current
    const onWkBegin = () => setIsFullscreen(true)
    const onWkEnd   = () => setIsFullscreen(false)
    v?.addEventListener('webkitbeginfullscreen', onWkBegin)
    v?.addEventListener('webkitendfullscreen', onWkEnd)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      v?.removeEventListener('webkitbeginfullscreen', onWkBegin)
      v?.removeEventListener('webkitendfullscreen', onWkEnd)
    }
  }, [])

  // LUNAR auto-fullscreen: trigger after stream loads when requested by LUNAR AI
  useEffect(() => {
    if (!lunarAutoFull || !streamUrl || isFullscreen) return
    const t = setTimeout(() => handleFullscreen(), 1800)
    return () => clearTimeout(t)
  }, [lunarAutoFull, streamUrl])

  const hqFilter = hq ? 'url(#cs-ultra) contrast(1.1) saturate(1.22) brightness(1.04)' : 'none'

  if (!video) return (
    <div className="w-full rounded-2xl flex items-center justify-center"
      style={{ background: '#050000', aspectRatio: '16/9', border: `1px solid ${RED_BORDER}` }}>
      <div className="text-center">
        <div className="text-3xl mb-2 opacity-40">▶</div>
        <p className="text-sm font-bold" style={{ color: 'rgba(255,80,80,0.3)' }}>Select a video</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Player */}
      <div ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ background: BG, aspectRatio: '16/9', border: `1px solid ${RED_BORDER}`,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.8), 0 8px 40px rgba(0,0,0,0.6)` }}>
        <div dangerouslySetInnerHTML={{ __html: SVG_SHARPEN }} />
        <video
          ref={vidRef}
          playsInline
          className="w-full h-full object-contain"
          style={{ display: streamUrl ? 'block' : 'none', filter: hqFilter, transition: 'filter 0.3s' }}
        />
        {(!streamUrl || loading) && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: BG }}>
            {loading
              ? <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: RED }}/>
                  <p className="text-xs" style={{ color: 'rgba(255,80,80,0.5)' }}>Loading stream…</p>
                </div>
              : <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-20"/>
            }
          </div>
        )}
        <VideoControls
          vidRef={vidRef} hq={hq} onHqToggle={() => setHq(q => !q)}
          onFullscreen={handleFullscreen} isFullscreen={isFullscreen}
          title={video.title} streamUrl={streamUrl}
          onNext={() => hasNext && onNavigate(allVideos[idx + 1])}
          onPrev={() => hasPrev && onNavigate(allVideos[idx - 1])}
          hasPrev={hasPrev} hasNext={hasNext}
          onPlayingChange={onPlayingChange}
        />
        {/* Source badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider pointer-events-none"
          style={{ background: source === 'pornhub' ? 'rgba(255,140,0,0.9)' : `rgba(204,0,0,0.9)`, color: '#fff' }}>
          {source === 'pornhub' ? 'PH 1080p' : 'XV'}
        </div>
        {/* Dominance overlay — sits inside the player container, absolute so it covers
            only the video on iOS. On PC it follows the element into fullscreen naturally. */}
        {dominanceActive && dominanceMsg && (
          <div
            className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.18)' }}
          >
            <div
              className="mx-4 px-5 py-3 rounded-2xl text-center"
              style={{
                background: 'rgba(0,0,0,0.80)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                animation: 'csOwnPulse 4s ease-in-out infinite',
              }}
            >
              <p
                className="text-white font-black text-lg sm:text-xl tracking-tight leading-snug"
                style={{ animation: 'csOwnFade 4s ease-in-out' }}
              >
                {dominanceMsg}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug line-clamp-2">{video.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,80,80,0.4)' }}>
            {idx + 1} of {allVideos.length}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end items-center">
          {/* Like */}
          <button onClick={() => setLiked(l => !l)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition border active:scale-90"
            style={{
              background: liked ? RED_DIM : 'rgba(255,255,255,0.04)',
              borderColor: liked ? RED_BORDER : 'rgba(255,255,255,0.07)',
              color: liked ? RED_TEXT : 'rgba(255,255,255,0.35)',
            }}>
            <Heart size={12} className={liked ? 'fill-current' : ''}/>
          </button>
          {/* Vault */}
          {onSaveToVault && (
            <button
              onClick={() => { if (video && streamUrl) { onSaveToVault(video, streamUrl); setSaved(true) } }}
              title="Save to Vault"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition border active:scale-90"
              style={{
                background: saved ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                borderColor: saved ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)',
                color: saved ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              }}>
              <Bookmark size={12} className={saved ? 'fill-current' : ''}/>
            </button>
          )}
          {/* Repost to profile */}
          {onRepost && (
            <button
              onClick={() => { if (video) { onRepost(video); setReposted(true) } }}
              title={reposted ? 'Reposted!' : 'Repost to your profile feed'}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition border active:scale-90"
              style={{
                background: reposted ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
                borderColor: reposted ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.07)',
                color: reposted ? 'rgba(134,239,172,0.9)' : 'rgba(255,255,255,0.35)',
              }}>
              <Share2 size={12} className={reposted ? 'fill-current' : ''} />
            </button>
          )}
          {/* DL (send to downloader) */}
          {onSendToDownloader && video?.videoPageUrl && (
            <button
              onClick={() => onSendToDownloader(video.videoPageUrl)}
              title="Download via home downloader"
              className="h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition border active:scale-90"
              style={{ background: 'rgba(20,100,20,0.18)', borderColor: 'rgba(34,197,94,0.25)', color: 'rgba(134,239,172,0.8)' }}>
              <Download size={11}/> DL
            </button>
          )}
          {/* Direct download — iOS-safe */}
          {video.videoPageUrl && (
            <button
              onClick={() => {
                const url = `/api/ytdl?url=${encodeURIComponent(video.videoPageUrl)}&filename=creamyspot-${Date.now()}.mp4`
                const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
                if (isIOSDevice) {
                  window.open(url, '_blank')
                } else {
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `creamyspot-${Date.now()}.mp4`
                  document.body.appendChild(a)
                  a.click()
                  setTimeout(() => { try { document.body.removeChild(a) } catch {} }, 200)
                }
              }}
              title="Download"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition border active:scale-90"
              style={{ background: RED_DIM, borderColor: RED_BORDER, color: RED_TEXT }}>
              <Download size={12}/>
            </button>
          )}
          {/* External link */}
          <a href={video.videoPageUrl} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
            <ExternalLink size={12}/>
          </a>
        </div>
      </div>

      {hq && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: RED_DIM, border: `1px solid ${RED_BORDER}`, color: RED_TEXT }}>
          <Sparkles size={11}/>
          <span>HQ Ultra active — sharpening + contrast + saturation boost.</span>
        </div>
      )}
    </div>
  )
}

// ─── Video grid card ───────────────────────────────────────────────────────────
function VideoCard({ video, active, onSelect }: {
  video: XvResult; active: boolean; onSelect: () => void
}) {
  const [hoverStream, setHoverStream] = useState<string | null>(null)
  const [loadingHover, setLoadingHover] = useState(false)
  const vidRef  = useRef<HTMLVideoElement>(null)
  const hlsRef  = useRef<Hls | null>(null)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startHover() {
    timer.current = setTimeout(async () => {
      const url = video.videoPageUrl; if (!url) return
      if (HOVER_CACHE.has(url)) { setHoverStream(HOVER_CACHE.get(url)!); return }
      setLoadingHover(true)
      try {
        const d = await fetchVideoInfo(url)
        const s = d.mediaURLs?.[0] || d.media_extended?.[0]?.url
        if (s) { HOVER_CACHE.set(url, s); setHoverStream(s) }
      } catch {}
      setLoadingHover(false)
    }, 500)
  }

  function stopHover() {
    clearTimeout(timer.current!)
    setHoverStream(null); setLoadingHover(false)
    const v = vidRef.current
    if (v) { v.pause(); v.src = '' }
    hlsRef.current?.destroy(); hlsRef.current = null
  }

  useEffect(() => {
    const v = vidRef.current
    if (!v || !hoverStream) return
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (Hls.isSupported() && /\.m3u8/i.test(hoverStream)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(hoverStream))
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        v.currentTime = Math.random() * 30 + 5; v.play().catch(() => {})
      })
    }
    return () => hlsRef.current?.destroy()
  }, [hoverStream])

  return (
    <div
      className="cursor-pointer group rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
      style={{
        border: active ? `2px solid ${RED}` : '1px solid rgba(255,255,255,0.05)',
        background: active ? RED_DIM : '#050000',
        boxShadow: active ? `0 0 16px ${RED_GLOW}` : 'none',
      }}
      onClick={onSelect}
      onMouseEnter={startHover}
      onMouseLeave={stopHover}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <img src={video.thumbnail} alt={video.title}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          loading="lazy"
          style={{ opacity: hoverStream ? 0 : 1, position: 'absolute', inset: 0 }}/>
        <video ref={vidRef} muted playsInline
          className="w-full h-full object-cover absolute inset-0"
          style={{ opacity: hoverStream ? 1 : 0, transition: 'opacity 0.3s' }}/>
        {loadingHover && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={14} className="animate-spin" style={{ color: RED }}/>
          </div>
        )}
        {active && (
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full animate-pulse"
            style={{ background: RED }}/>
        )}
        {!active && !hoverStream && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: RED, boxShadow: `0 0 16px ${RED_GLOW}` }}>
              <Play size={14} fill="white" className="text-white ml-0.5"/>
            </div>
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs leading-tight line-clamp-2 transition-colors"
          style={{ color: active ? 'rgba(255,160,160,0.9)' : 'rgba(255,255,255,0.6)' }}>
          {video.title}
        </p>
      </div>
    </div>
  )
}

// ─── Source tabs ───────────────────────────────────────────────────────────────
function SourceTabs({ source, onChange }: { source: VideoSource; onChange: (s: VideoSource) => void }) {
  return (
    <div className="flex rounded-xl p-0.5 gap-0.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${RED_BORDER}` }}>
      {(['xvideos', 'pornhub'] as VideoSource[]).map(s => {
        const active = source === s
        const label = s === 'xvideos' ? 'XVideos' : 'PornHub 1080p'
        return (
          <button key={s} onClick={() => onChange(s)}
            className="flex-1 h-8 rounded-lg text-xs font-black tracking-wider uppercase transition-all"
            style={{
              background: active ? (s === 'pornhub' ? 'rgba(255,140,0,0.85)' : RED) : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.35)',
              boxShadow: active ? `0 2px 12px ${s === 'pornhub' ? 'rgba(255,140,0,0.3)' : RED_GLOW}` : 'none',
            }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── AI overview bot ───────────────────────────────────────────────────────────
function AiOverviewBot({ video }: { video: XvResult | null }) {
  const [reply, setReply]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  // Auto-clear when video changes
  useEffect(() => { setReply(null); setOpen(false) }, [video?.videoPageUrl])

  async function getOverview() {
    if (!video || loading) return
    setOpen(true); setLoading(true); setReply(null)
    try {
      const resp = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [{
            role: 'user',
            content: `You are an explicit adult AI. Analyse this porn video title and give a short, vivid, naughty overview in 3–4 sentences. Be explicit, descriptive, and sensual. Focus on what the viewer can expect. Title: "${video.title}"`,
          }],
          stream: false,
        }),
        signal: AbortSignal.timeout(18000),
      })
      if (!resp.ok) throw new Error('AI unavailable')
      const data = await resp.json()
      setReply(data.choices?.[0]?.message?.content || 'Could not generate overview.')
    } catch {
      setReply('AI temporarily unavailable — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: RED_BORDER }}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/5"
        onClick={() => { if (!open) { getOverview() } else { setOpen(false) } }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: RED_DIM, border: `1px solid ${RED_BORDER}` }}>
          <Bot size={13} style={{ color: RED_TEXT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black" style={{ color: RED_TEXT }}>AI Overview</p>
          <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {video ? `"${video.title.slice(0, 48)}${video.title.length > 48 ? '…' : ''}"` : 'Select a video first'}
          </p>
        </div>
        {open
          ? <XIcon size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
          : <span className="text-[10px] font-bold shrink-0" style={{ color: RED_TEXT }}>Analyse ✦</span>}
      </button>

      {/* Body */}
      {open && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: RED_BORDER }}>
          {loading && (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={12} className="animate-spin" style={{ color: RED }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Generating overview…</span>
            </div>
          )}
          {reply && !loading && (
            <>
              <p className="text-xs leading-relaxed pt-2.5 whitespace-pre-wrap"
                style={{ color: 'rgba(255,200,235,0.85)' }}>
                {reply}
              </p>
              <button
                onClick={getOverview}
                className="mt-2 text-[10px] font-bold px-2 py-1 rounded-lg transition"
                style={{ background: RED_DIM, color: RED_TEXT, border: `1px solid ${RED_BORDER}` }}>
                ↺ Regenerate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main CreamySpotPlayer ─────────────────────────────────────────────────────
export default function CreamySpotPlayer({ onSaveToVault, onSendToDownloader }: {
  onSaveToVault?: (item: XvResult, streamUrl: string) => void
  onSendToDownloader?: (pageUrl: string) => void
} = {}) {
  const [videos, setVideos]   = useState<XvResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [selected, setSelected] = useState<XvResult | null>(null)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [source, setSource]   = useState<VideoSource>('xvideos')
  const [repostToast, setRepostToast] = useState<string | null>(null)
  const [dominanceMode, setDominanceMode] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const PAGE_SIZE = 30

  // ── Dominance overlay messages (rotate every 4 seconds while playing) ──
  const DOMINANCE_MSGS = [
    'She owns you 👑',
    'Porn controls your mind',
    'You were always going to watch',
    'Stop fighting it. Give in.',
    'She knows what you are',
    'You belong to this screen',
    'Addicted and you love it',
    'She owns every second of your attention',
    'You are hers. You always were.',
    'Porn owns you and you know it',
  ]
  const [domMsgIdx, setDomMsgIdx] = useState(0)
  useEffect(() => {
    if (!dominanceMode || !videoPlaying) return
    const t = setInterval(() => setDomMsgIdx(i => (i + 1) % DOMINANCE_MSGS.length), 4000)
    return () => clearInterval(t)
  }, [dominanceMode, videoPlaying])

  // Live-scraped PH profile
  const [profile, setProfile] = useState({
    name: 'Creamy Spot',
    avatar: null as string | null,
    bio: 'Spanish queen of creampies & squirting. POV content, solo play, and dripping finishes.',
    subscribers: '',
    videoCount: '',
    country: '🇪🇸 Spain',
    profileViews: '',
  })

  // Fetch live profile on mount
  useEffect(() => {
    phProfile('creamy-spot').then(p => {
      setProfile(prev => ({
        name: p.name || prev.name,
        avatar: p.avatar || prev.avatar,
        bio: p.bio || prev.bio,
        subscribers: p.subscribers || prev.subscribers,
        videoCount: p.videoCount || prev.videoCount,
        country: p.country || prev.country,
        profileViews: p.profileViews || prev.profileViews,
      }))
    })
  }, [])

  function loadSource(src: VideoSource) {
    setSource(src); setVideos([]); setSelected(null)
    setLoading(true); setError(null); setPage(0)
    if (src === 'xvideos') {
      xvChannel('creamyspot')
        .then(vids => { setVideos(vids); if (vids.length) setSelected(vids[Math.floor(Math.random() * vids.length)]) })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    } else {
      phChannel('creamy-spot', true)
        .then(({ results, avatar }) => {
          setVideos(results); if (results.length) setSelected(results[Math.floor(Math.random() * results.length)])
          if (avatar) setProfile(p => ({ ...p, avatar }))
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { loadSource('xvideos') }, [])

  // ── LUNAR AI control ────────────────────────────────────────────────────────
  const [lunarAutoFull, setLunarAutoFull] = useState(false)
  useEffect(() => {
    const handler = () => {
      setLunarAutoFull(true)
      loadSource('pornhub')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('lunar:play-creamyspot', handler)
    return () => window.removeEventListener('lunar:play-creamyspot', handler)
  }, [])

  const filtered  = videos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()))
  const pages     = Math.ceil(filtered.length / PAGE_SIZE)
  const pageVideos = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSelect(v: XvResult) {
    setSelected(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleRandom() {
    if (!filtered.length) return
    handleSelect(filtered[Math.floor(Math.random() * filtered.length)])
  }

  const TAGS = ['creampie', 'squirting', 'solo', 'POV', 'latina', 'amateur', 'dripping', 'fishnets', 'dildo', 'orgasm']

  return (
    <div className="min-h-screen relative" style={{ background: `radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(224,86,171,0.14), transparent 60%), ${BG}` }}>

      {/* Ambient floating glow orbs */}
      <div className="fixed top-[-10%] left-[-5%] w-[420px] h-[420px] rounded-full pointer-events-none opacity-30"
        style={{ background: `radial-gradient(circle, ${RED_GLOW}, transparent 70%)`, filter: 'blur(60px)' }}/>
      <div className="fixed top-[20%] right-[-8%] w-[360px] h-[360px] rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, rgba(255,140,0,0.5), transparent 70%)`, filter: 'blur(70px)' }}/>

      {/* ─── Profile hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Decorative banner */}
        <div className="absolute inset-x-0 top-0 h-40 sm:h-48"
          style={{
            background: `linear-gradient(135deg, rgba(224,86,171,0.25) 0%, rgba(107,19,32,0.35) 45%, rgba(0,0,0,0.9) 100%)`,
          }}>
          <div className="absolute inset-0 opacity-40"
            style={{ backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 40%)` }}/>
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, ${BG} 100%)` }}/>
        </div>
        {/* Subtle top pink line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${RED}, transparent)` }}/>

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-[28px] opacity-60 animate-pulse"
                style={{ background: `conic-gradient(from 0deg, ${RED}, rgba(255,140,0,0.6), ${RED})`, filter: 'blur(14px)', animationDuration: '4s' }}/>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${RED}`, boxShadow: `0 0 0 4px rgba(0,0,0,0.6), 0 8px 32px rgba(224,86,171,0.35)` }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white"
                    style={{ background: `linear-gradient(135deg, ${RED}, #6B0000)` }}>
                    CS
                  </div>
                )}
              </div>
              {/* Verified dot */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: RED, boxShadow: `0 0 0 3px ${BG}, 0 0 12px ${RED_GLOW}` }}>
                ✓
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {/* Name + badge */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight"
                  style={{ textShadow: `0 0 24px rgba(224,86,171,0.4)` }}>{profile.name}</h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: RED_DIM, color: RED_TEXT, border: `1px solid ${RED_BORDER}` }}>
                  VERIFIED
                </span>
              </div>

              {/* Handle + location */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 text-xs flex-wrap">
                <span style={{ color: 'rgba(255,130,190,0.55)' }}>@creamy-spot</span>
                {profile.country && (
                  <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <MapPin size={10}/> {profile.country}
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-xs leading-relaxed mb-3 max-w-lg"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {profile.bio.slice(0, 200)}{profile.bio.length > 200 ? '…' : ''}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 flex-wrap">
                {[
                  { icon: Film,  val: profile.videoCount || `${videos.length || '94'}+`, label: 'Videos' },
                  { icon: Users, val: profile.subscribers || '250K+',                   label: 'Fans' },
                  ...(profile.profileViews ? [{ icon: Eye, val: profile.profileViews, label: 'Views' }] : []),
                  { icon: null,  val: source === 'pornhub' ? '1080p' : '720p', label: 'Quality', emoji: '⭐' },
                ].map(({ icon: Icon, val, label, emoji }) => (
                  <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {Icon ? <Icon size={11} style={{ color: RED }}/> : <span className="text-xs">{emoji}</span>}
                    <div>
                      <p className="text-white font-black text-xs leading-none">{val}</p>
                      <p className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {TAGS.map(t => (
                  <button key={t} onClick={() => { setSearch(t); setPage(0) }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: RED_DIM, color: 'rgba(255,170,215,0.75)', border: `1px solid ${RED_BORDER}` }}>
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: links */}
            <div className="shrink-0 flex flex-col items-center sm:items-end gap-2">
              <SourceTabs source={source} onChange={loadSource}/>
              <div className="flex gap-1.5">
                {[
                  { href: 'https://www.xvideos.com/channels/creamyspot', label: 'XV', color: 'rgba(224,86,171,0.15)', textColor: RED_TEXT, borderColor: RED_BORDER },
                  { href: 'https://www.pornhub.com/model/creamy-spot',   label: 'PH', color: 'rgba(255,140,0,0.12)', textColor: 'rgba(255,180,80,0.9)', borderColor: 'rgba(255,140,0,0.25)' },
                  { href: 'https://onlyfans.com/creamyspot',             label: 'OF', color: 'rgba(0,174,224,0.1)',  textColor: 'rgba(80,210,255,0.8)',  borderColor: 'rgba(0,174,224,0.2)' },
                ].map(({ href, label, color, textColor, borderColor }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="h-7 px-3 rounded-lg text-[10px] font-black transition hover:opacity-90"
                    style={{ background: color, border: `1px solid ${borderColor}`, color: textColor }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main layout ──────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-4 pt-5 pb-20">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT — sticky player */}
          <div className="lg:w-[500px] lg:shrink-0">
            <div className="lg:sticky lg:top-4 flex flex-col gap-3">
              {/* Repost toast */}
              {repostToast && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold animate-pulse"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'rgba(134,239,172,0.9)' }}>
                  <Share2 size={11}/> {repostToast}
                </div>
              )}

              {/* ── Dominance override toggle ── */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: dominanceMode ? 'rgba(139,0,0,0.25)' : 'rgba(255,255,255,0.03)', border: dominanceMode ? '1px solid rgba(220,20,60,0.4)' : '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{dominanceMode ? '👑' : '💀'}</span>
                  <div>
                    <p className="text-[11px] font-black tracking-wider" style={{ color: dominanceMode ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.4)' }}>
                      {dominanceMode ? 'DOMINANT MODE ON' : 'Dominant Mode'}
                    </p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {dominanceMode ? (videoPlaying ? 'Overlay active — she owns you' : 'Play video to activate') : 'Overlays when video plays'}
                    </p>
                  </div>
                </div>
                <button
                  onPointerDown={() => setDominanceMode(m => !m)}
                  className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0"
                  style={{ background: dominanceMode ? 'rgba(220,20,60,0.8)' : 'rgba(255,255,255,0.1)', boxShadow: dominanceMode ? '0 0 12px rgba(220,20,60,0.5)' : 'none' }}>
                  <span className="absolute top-0.5 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: dominanceMode ? '22px' : '2px' }} />
                </button>
              </div>

                      <EmbeddedPlayer
                video={selected} allVideos={filtered}
                onNavigate={setSelected} source={source}
                onSaveToVault={onSaveToVault}
                onSendToDownloader={onSendToDownloader}
                onPlayingChange={setVideoPlaying}
                dominanceActive={dominanceMode && videoPlaying}
                dominanceMsg={DOMINANCE_MSGS[domMsgIdx]}
                lunarAutoFull={lunarAutoFull}
                onRepost={video => {
                  const accountId = getStoredAccountId()
                  const username  = getStoredUsername()
                  if (!accountId) {
                    setRepostToast('Sign in to repost videos to your profile ↗')
                    setTimeout(() => setRepostToast(null), 3500)
                    return
                  }
                  postToFeed(accountId, {
                    title: video.title,
                    thumbnail: video.thumbnail,
                    videoPageUrl: video.videoPageUrl,
                    source: source === 'pornhub' ? 'Creamy Spot · PornHub' : 'Creamy Spot · XVideos',
                  })
                  setRepostToast(`Reposted to ${username || 'your profile'}!`)
                  setTimeout(() => setRepostToast(null), 3500)
                }}
              />
              {/* AI Overview bot */}
              <AiOverviewBot video={selected} />
              {/* Source info */}
              <div className="px-3 py-2 rounded-xl text-xs leading-relaxed backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.05)`, color: 'rgba(255,255,255,0.25)' }}>
                {source === 'pornhub'
                  ? <><span style={{ color: 'rgba(255,160,60,0.75)' }}>■</span> Pornhub 1080p — streamed via proxy from <code className="text-zinc-500">pornhub.com/model/creamy-spot</code></>
                  : <><span style={{ color: RED_TEXT }}>■</span> XVideos — full channel via <code className="text-zinc-500">xvideos.com/channels/creamyspot</code></>
                }
              </div>
            </div>
          </div>

          {/* RIGHT — scrollable grid */}
          <div className="flex-1 min-w-0">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: 'rgba(255,170,215,0.4)' }}>Library</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(224,86,171,0.25), transparent)' }}/>
            </div>
            {/* Search + controls */}
            <div className="flex gap-2 mb-4 items-center">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,130,190,0.4)' }}/>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0) }}
                  placeholder="Search videos…"
                  className="w-full h-9 pl-8 pr-3 rounded-xl text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${RED_BORDER}` }}
                />
              </div>
              <button onClick={handleRandom}
                className="h-9 px-3 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shrink-0"
                style={{ background: RED_DIM, border: `1px solid ${RED_BORDER}`, color: RED_TEXT }}>
                🎲
              </button>
              <span className="text-xs shrink-0 px-2.5 py-1.5 rounded-lg font-bold"
                style={{ color: RED_TEXT, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {filtered.length}
              </span>
            </div>

            {loading && (
              <div className="flex flex-col items-center py-16 gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: RED }}/>
                <p className="text-xs" style={{ color: 'rgba(255,80,80,0.45)' }}>
                  {source === 'pornhub' ? 'Fetching from Pornhub…' : 'Loading library…'}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-center py-8" style={{ color: 'rgba(255,80,80,0.5)' }}>
                Couldn't load videos: {error}
              </p>
            )}

            {!loading && !error && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {pageVideos.map((v, i) => (
                    <VideoCard key={v.videoPageUrl || i} video={v}
                      active={selected?.videoPageUrl === v.videoPageUrl}
                      onSelect={() => handleSelect(v)}/>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-16 text-sm" style={{ color: 'rgba(255,80,80,0.3)' }}>
                    No videos{search ? ` matching "${search}"` : ''}
                  </div>
                )}

                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="h-8 px-4 rounded-lg text-xs font-bold disabled:opacity-30 transition"
                      style={{ background: RED_DIM, border: `1px solid ${RED_BORDER}`, color: RED_TEXT }}>
                      ← Prev
                    </button>
                    <span className="text-xs px-2" style={{ color: 'rgba(255,80,80,0.4)' }}>
                      {page + 1} / {pages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
                      className="h-8 px-4 rounded-lg text-xs font-bold disabled:opacity-30 transition"
                      style={{ background: RED_DIM, border: `1px solid ${RED_BORDER}`, color: RED_TEXT }}>
                      Next →
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
