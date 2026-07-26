import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { getStreamUrl } from '../api'

interface HlsPlayerProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  onError?: () => void
}

/**
 * Drop-in <video> replacement that transparently handles HLS (.m3u8) streams
 * via hls.js on Chrome/Firefox while falling back to native playback on Safari.
 */
export default function HlsPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  onError,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    // Tear down any previous hls instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

    const proxied = getStreamUrl(src)
    const isHls = /\.m3u8(\?|$)/i.test(src) || /\.m3u8(\?|$)/i.test(proxied)

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 30 })
      hlsRef.current = hls
      hls.loadSource(proxied)
      hls.attachMedia(el)
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) onError?.()
      })
    } else {
      // Direct mp4 or Safari (which supports HLS natively)
      el.src = proxied
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      className={className}
      onError={onError}
    />
  )
}
