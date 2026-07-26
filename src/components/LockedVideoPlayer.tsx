import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { fetchVideoInfo, getStreamUrl } from '../api'

interface Props {
  url: string
  label?: string
  caption?: string
  className?: string
}

export default function LockedVideoPlayer({ url, label, caption, className = '' }: Props) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchVideoInfo(url)
      .then(d => {
        const s = d.mediaURLs?.[0] || d.media_extended?.[0]?.url || null
        setStreamUrl(s)
        if (!s) setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [url])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !streamUrl) return

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

    // Force muted via property AND attribute (React muted prop is unreliable)
    el.muted = true
    el.setAttribute('muted', '')
    el.loop = true
    el.playsInline = true

    const tryPlay = () => {
      el.muted = true
      el.play().catch(() => {})
    }

    const proxied = getStreamUrl(streamUrl)

    if (Hls.isSupported() && /\.m3u8/i.test(proxied)) {
      const hls = new Hls({ enableWorker: false, autoStartLoad: true })
      hlsRef.current = hls
      hls.loadSource(proxied)
      hls.attachMedia(el)
      hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay())
    } else {
      el.src = proxied
      el.load()
      el.addEventListener('loadedmetadata', tryPlay, { once: true })
      el.addEventListener('canplay', tryPlay, { once: true })
      setTimeout(tryPlay, 200)
    }

    return () => { hlsRef.current?.destroy() }
  }, [streamUrl])

  return (
    <div
      className={`relative rounded-2xl overflow-hidden select-none ${className}`}
      style={{ border: '1px solid rgba(220,38,38,0.22)', boxShadow: '0 0 50px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)', userSelect: 'none' }}
    >
      {/* Full interaction blocker */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: 'all', cursor: 'default' }}
        onContextMenu={e => e.preventDefault()}
      />

      {loading ? (
        <div className="w-full bg-black flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-rose-500/50 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="w-full bg-black flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <p className="text-zinc-700 text-xs">Video unavailable</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full bg-black"
          style={{ maxHeight: '58vh', display: 'block', objectFit: 'cover' }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />

      {label && (
        <div className="absolute bottom-3 left-3 z-20">
          <span className="text-[9px] font-black tracking-[0.35em] uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(220,38,38,0.4)', color: 'rgba(252,165,165,0.85)', backdropFilter: 'blur(10px)' }}>
            {label}
          </span>
        </div>
      )}

      {caption && (
        <div className="px-4 py-2.5 border-t border-white/5 relative z-20"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}>
          <p className="text-[10px] text-white/30 italic leading-snug">{caption}</p>
        </div>
      )}
    </div>
  )
}
