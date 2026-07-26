import { useState, useRef, useCallback, useEffect } from 'react'
import Hls from 'hls.js'
import { X, Shuffle, Loader2, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { xvChannel, fetchVideoInfo, getStreamUrl, type XvResult } from '../api'
import { toast } from 'sonner'

const CHANNEL = 'creamyspot'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreamyShufflePopup({ open, onClose }: Props) {
  const [videos, setVideos] = useState<XvResult[]>([])
  const [current, setCurrent] = useState<XvResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const pickRandom = useCallback((pool: XvResult[]) => {
    if (!pool.length) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setCurrent(pick)
    setStreamUrl(null)
  }, [])

  // Load channel on first open
  useEffect(() => {
    if (!open) return
    if (videos.length > 0) { pickRandom(videos); return }
    setLoading(true)
    xvChannel(CHANNEL)
      .then(r => {
        if (!r.length) { toast.error('Could not load videos'); return }
        const shuffled = [...r].sort(() => Math.random() - 0.5)
        setVideos(shuffled)
        pickRandom(shuffled)
      })
      .catch(() => toast.error('Could not load videos'))
      .finally(() => setLoading(false))
  }, [open]) // eslint-disable-line

  // Resolve current video URL
  useEffect(() => {
    if (!current) return
    let cancelled = false
    setResolving(true)
    setStreamUrl(null)
    fetchVideoInfo(current.videoPageUrl)
      .then(data => {
        if (cancelled) return
        const url = data.mediaURLs?.[0]
        if (url) setStreamUrl(url)
        else pickRandom(videos)
      })
      .catch(() => { if (!cancelled) pickRandom(videos) })
      .finally(() => { if (!cancelled) setResolving(false) })
    return () => { cancelled = true }
  }, [current?.videoPageUrl]) // eslint-disable-line

  // Wire HLS / direct src to the video element
  const setupVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el || !streamUrl) return
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    el.pause()
    const proxied = getStreamUrl(streamUrl)
    const isHls = /\.m3u8(\?|$)/i.test(streamUrl)
    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(proxied)
      hls.attachMedia(el)
      hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}))
    } else if (el.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      el.src = proxied
      el.load()
      el.play().catch(() => {})
    } else {
      el.src = proxied
      el.load()
      el.play().catch(() => {})
    }
  }, [streamUrl])

  // Cleanup HLS on close
  useEffect(() => {
    if (!open && hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col" style={{ background: 'rgba(0,0,0,0.97)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: 'rgba(5,0,8,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/IMG_9789.jpeg" alt="Nacre" className="w-7 h-7 rounded-full object-cover" style={{ border: '1.5px solid rgba(244,63,94,0.5)' }} />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Creamy Spot 💦</p>
            {current && <p className="text-zinc-500 text-[10px] leading-tight truncate max-w-[160px] sm:max-w-xs">{current.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { pickRandom(videos) }}
            disabled={loading || videos.length === 0}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-bold text-xs tracking-wider text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.8), rgba(190,18,60,0.9))', border: '1px solid rgba(244,63,94,0.3)' }}
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {(loading || resolving) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="text-zinc-500 text-sm">{loading ? 'Loading channel…' : 'Fetching video…'}</p>
          </div>
        )}

        {!loading && !resolving && !streamUrl && current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {current.thumbnail && (
              <img src={current.thumbnail} alt="" className="w-full h-full object-cover opacity-20 absolute inset-0" />
            )}
            <p className="text-zinc-400 text-sm relative z-10">Could not load stream — shuffle to try another</p>
            <button onClick={() => pickRandom(videos)} className="relative z-10 flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm text-white" style={{ background: 'rgba(244,63,94,0.7)' }}>
              <Shuffle className="w-4 h-4" /> Next Video
            </button>
          </div>
        )}

        {streamUrl && (
          <video
            ref={setupVideo}
            autoPlay
            playsInline
            loop
            muted={muted}
            controls
            className="max-h-full max-w-full w-full h-full object-contain"
            style={{ background: '#000' }}
          />
        )}
      </div>

      {/* Footer strip */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(5,0,8,0.9)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-zinc-600 text-[10px] tracking-widest uppercase">{videos.length > 0 ? `${videos.length} videos in pool` : 'Loading…'}</p>
        <button
          onClick={() => pickRandom(videos)}
          disabled={loading || videos.length === 0}
          className="flex items-center gap-2 h-9 px-4 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af' }}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Another one
        </button>
      </div>
    </div>
  )
}
