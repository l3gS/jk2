import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import { X, Download, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Loader2 } from 'lucide-react'
import { getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

export interface FSVideo {
  streamUrl: string
  title?: string
  xUrl?: string
  thumbnail?: string
  playlist?: FSVideo[]
  playlistIndex?: number
}

interface FSCtx {
  open: (video: FSVideo) => void
  close: () => void
  isOpen: boolean
}

const Ctx = createContext<FSCtx>({ open: () => {}, close: () => {}, isOpen: false })

export function useFullscreen() { return useContext(Ctx) }

function useVideoControls(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const handlers: [string, EventListener][] = [
      ['play',          () => setPlaying(true)],
      ['pause',         () => setPlaying(false)],
      ['volumechange',  () => { setVolume(el.volume); setMuted(el.muted) }],
      ['timeupdate',    () => { setProgress(el.currentTime); if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1)) }],
      ['durationchange',() => setDuration(el.duration || 0)],
      ['waiting',       () => setLoading(true)],
      ['playing',       () => setLoading(false)],
      ['canplay',       () => setLoading(false)],
    ]
    handlers.forEach(([e, h]) => el.addEventListener(e, h))
    return () => handlers.forEach(([e, h]) => el.removeEventListener(e, h))
  }, [videoRef])

  const toggle      = () => { const el = videoRef.current; if (!el) return; el.paused ? el.play() : el.pause() }
  const toggleMute  = () => { const el = videoRef.current; if (!el) return; el.muted = !el.muted }
  const seek        = (t: number) => { if (videoRef.current) videoRef.current.currentTime = t }
  const setVol      = (v: number) => { if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0 } }

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return { playing, muted, volume, progress, duration, buffered, loading, toggle, toggleMute, seek, setVol, fmt }
}

export function FullscreenPlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<FSVideo | null>(null)
  const [hlsReady, setHlsReady] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctrl = useVideoControls(videoRef)

  const open = useCallback((video: FSVideo) => {
    setCurrent(video)
    setHlsReady(false)
    setShowControls(true)
  }, [])

  const close = useCallback(() => {
    const el = videoRef.current
    if (el) { el.pause(); el.src = '' }
    hlsRef.current?.destroy()
    hlsRef.current = null
    setCurrent(null)
  }, [])

  // Load HLS/MP4 when current changes
  useEffect(() => {
    if (!current) return
    const el = videoRef.current
    if (!el) return

    hlsRef.current?.destroy()
    hlsRef.current = null

    const proxied = getStreamUrl(current.streamUrl)
    if (Hls.isSupported() && /\.m3u8/i.test(current.streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(proxied)
      hls.attachMedia(el)
      hls.once(Hls.Events.MANIFEST_PARSED, () => { setHlsReady(true); el.play().catch(() => {}) })
    } else {
      el.src = proxied
      setHlsReady(true)
      el.play().catch(() => {})
    }
    return () => { hlsRef.current?.destroy() }
  }, [current])

  // Auto-hide controls
  const resetHide = () => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === ' ') { e.preventDefault(); ctrl.toggle() }
      if (e.key === 'ArrowRight') { if (videoRef.current) videoRef.current.currentTime += 10 }
      if (e.key === 'ArrowLeft')  { if (videoRef.current) videoRef.current.currentTime -= 10 }
      if (e.key === 'm') ctrl.toggleMute()
    }
    if (current) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, ctrl])

  // Lock body scroll
  useEffect(() => {
    if (current) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [current])

  const handleDownload = async () => {
    if (!current || dlLoading) return
    setDlLoading(true)
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      const preTab = isIOS ? window.open('', '_blank') : null
      const result = await saveToDevice({
        streamUrl: current.streamUrl,
        title: current.title || 'video',
        onIOSHint: (msg) => toast(msg, { duration: 7000 }),
        preOpenedTab: preTab,
      })
      if (result === 'ios-tab') toast('Tap ↓ or Share ⎋ → "Save Video" in the player 📱', { duration: 7000 })
      else toast.success('Download started!')
    } catch { toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  const playlist = current?.playlist
  const pidx = current?.playlistIndex ?? 0
  const hasPrev = playlist && pidx > 0
  const hasNext = playlist && pidx < playlist.length - 1

  const goNext = () => {
    if (!playlist || !hasNext) return
    const next = { ...playlist[pidx + 1], playlist, playlistIndex: pidx + 1 }
    open(next)
  }
  const goPrev = () => {
    if (!playlist || !hasPrev) return
    const prev = { ...playlist[pidx - 1], playlist, playlistIndex: pidx - 1 }
    open(prev)
  }

  return (
    <Ctx.Provider value={{ open, close, isOpen: !!current }}>
      {children}

      {current && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
          onMouseMove={resetHide}
          onClick={resetHide}
        >
          {/* Video */}
          <div className="flex-1 relative flex items-center justify-center" onClick={ctrl.toggle}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              onClick={e => e.stopPropagation()}
            />

            {/* Centered loading/play overlay */}
            {(!hlsReady || ctrl.loading) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="w-12 h-12 animate-spin text-white/60" />
              </div>
            )}

            {/* Playlist prev/next overlays */}
            {hasPrev && (
              <button onClick={e => { e.stopPropagation(); goPrev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition">
                <SkipBack className="w-5 h-5" />
              </button>
            )}
            {hasNext && (
              <button onClick={e => { e.stopPropagation(); goNext() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition">
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Controls overlay */}
          <div
            className="transition-opacity duration-300 select-none"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-3"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)' }}>
              <button onClick={close}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0">
                <X className="w-4 h-4 text-white" />
              </button>
              {current.title && (
                <p className="text-white font-bold text-sm truncate flex-1">{current.title}</p>
              )}
              <div className="flex items-center gap-2 shrink-0">
                {current.xUrl && (
                  <a href={current.xUrl} target="_blank" rel="noopener noreferrer"
                    className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 flex items-center gap-1.5 text-white text-xs font-bold transition">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                )}
                <button onClick={handleDownload} disabled={dlLoading}
                  className="h-8 px-3 rounded-full bg-rose-500/80 hover:bg-rose-500 flex items-center gap-1.5 text-white text-xs font-bold transition disabled:opacity-50">
                  {dlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>

              {/* Progress bar */}
              <div className="relative h-1 mb-3 group cursor-pointer rounded-full bg-white/20"
                onClick={e => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  ctrl.seek(((e.clientX - rect.left) / rect.width) * ctrl.duration)
                }}>
                {/* Buffered */}
                <div className="absolute left-0 top-0 h-full rounded-full bg-white/25"
                  style={{ width: `${ctrl.duration ? (ctrl.buffered / ctrl.duration) * 100 : 0}%` }} />
                {/* Progress */}
                <div className="absolute left-0 top-0 h-full rounded-full bg-rose-500"
                  style={{ width: `${ctrl.duration ? (ctrl.progress / ctrl.duration) * 100 : 0}%` }} />
                {/* Thumb */}
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition -ml-1.5 pointer-events-none"
                  style={{ left: `${ctrl.duration ? (ctrl.progress / ctrl.duration) * 100 : 0}%` }} />
              </div>

              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button onClick={e => { e.stopPropagation(); ctrl.toggle() }}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition shrink-0">
                  {ctrl.playing
                    ? <Pause className="w-5 h-5 text-white fill-white" />
                    : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
                </button>

                {/* Time */}
                <span className="text-white/70 text-xs font-mono shrink-0">
                  {ctrl.fmt(ctrl.progress)} / {ctrl.fmt(ctrl.duration)}
                </span>

                <div className="flex-1" />

                {/* Volume */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={ctrl.toggleMute}
                    className="text-white/70 hover:text-white transition">
                    {ctrl.muted || ctrl.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={ctrl.muted ? 0 : ctrl.volume}
                    onChange={e => ctrl.setVol(parseFloat(e.target.value))}
                    className="w-16 accent-rose-500 cursor-pointer" />
                </div>

                {/* Fullscreen native */}
                <button onClick={e => {
                    e.stopPropagation()
                    const el = videoRef.current
                    if (!el) return
                    if (document.fullscreenElement) document.exitFullscreen()
                    else el.requestFullscreen?.()
                  }}
                  className="text-white/70 hover:text-white transition">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
