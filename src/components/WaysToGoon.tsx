import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'
import Hls from 'hls.js'
import { getStreamUrl } from '../api'
import { toast } from 'sonner'

// ─── Kink Tasks ───────────────────────────────────────────────────────────────
const KINK_TASKS = [
  { emoji: '⏱️', title: 'Edge Hold',         desc: 'Stroke to the very edge and freeze. Hold that edge for 60 full seconds without tipping over. If you slip, restart the timer from zero.' },
  { emoji: '🔒', title: 'Mental Chastity',   desc: 'Keep stroking — but you are not allowed to finish for 20 straight minutes. Your pleasure belongs to her, not you.' },
  { emoji: '💀', title: 'Ruin It',            desc: 'Bring yourself to the point of no return, then pull away completely. Let it ruin. Feel every pulse with zero touch.' },
  { emoji: '🎯', title: 'JOI Countdown',     desc: 'Count down from 100, one deliberate stroke per number. When you reach zero, stop and hold completely still for 2 minutes before restarting.' },
  { emoji: '🙏', title: 'Body Worship',      desc: 'Pick one part of her body on screen. Focus only on it for the next 5 minutes. Describe every detail out loud. Prove your complete devotion.' },
  { emoji: '⚡', title: 'Pace Drill',         desc: '30 seconds fast. 30 seconds agonisingly slow. Repeat 10 full cycles. You may not finish until every cycle is complete.' },
  { emoji: '🫀', title: 'Denial Loop',        desc: 'Edge once, stop completely, wait 90 seconds. Repeat this 6 times. Only on the 7th approach are you allowed to decide your own fate.' },
  { emoji: '🔁', title: 'Loop Obsession',    desc: 'Find the 10 best seconds of this video. Watch that clip 15 consecutive times before you are allowed to advance the playback.' },
  { emoji: '🎭', title: 'Object Mindset',    desc: 'You are not a person right now. You are her personal toy. Say "I exist for her pleasure" out loud on every stroke.' },
  { emoji: '📵', title: 'Total Lockdown',    desc: 'Nothing exists except her. Full screen only. No distractions. Remain locked in for exactly 15 minutes before you may do anything else.' },
  { emoji: '🕯️', title: 'Sensory Strip',     desc: 'Close your eyes for 3 full minutes — audio only. Build a complete mental picture of her. Then open your eyes for your reward.' },
  { emoji: '🐾', title: 'Submission Drill',  desc: 'Every time she makes eye contact with the camera, stop completely and whisper "I belong to you." Do not continue until you have said it.' },
  { emoji: '💦', title: 'Tribute Protocol',  desc: 'Imagine every stroke is a direct tribute to Nacre. Say her name out loud three times before you may finish. She must know it is for her.' },
  { emoji: '🌹', title: 'Worship Trance',    desc: 'Slow strokes only — agonisingly slow. No fast movement allowed. Stay perfectly matched to the video\'s slowest, most deliberate moment.' },
  { emoji: '🔑', title: 'Lock & Release',    desc: 'Set a 10-minute timer. No finishing allowed until the timer ends. Once it does, you have exactly 30 seconds — not a moment more.' },
]

interface GoonVideo {
  videoUrl: string
  thumbnail?: string
  title?: string
}

export default function WaysToGoon() {
  const [video, setVideo]         = useState<GoonVideo | null>(null)
  const [loading, setLoading]     = useState(true)
  const [taskIdx, setTaskIdx]     = useState(() => Math.floor(Math.random() * KINK_TASKS.length))
  const [taskOut, setTaskOut]     = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef   = useRef<Hls | null>(null)

  const loadVideo = useCallback(async () => {
    setLoading(true)
    setVideo(null)
    try {
      const page = Math.floor(Math.random() * 4)
      const r = await fetch(`/api/phmodel?slug=creamy-spot&page=${page}`)
      if (!r.ok) throw new Error('fetch failed')
      const data = await r.json()
      const videos: Array<{ videoPageUrl: string; title?: string; thumbnail?: string }> =
        data.results ?? data.videos ?? []
      if (!videos.length) throw new Error('no videos')
      const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 12))]
      const infoR = await fetch(`/api/video?url=${encodeURIComponent(pick.videoPageUrl)}`)
      if (!infoR.ok) throw new Error('info failed')
      const info = await infoR.json()
      const streamUrl: string | undefined = info.mediaURLs?.[0] ?? info.media_extended?.[0]?.url
      if (!streamUrl) throw new Error('no stream')
      setVideo({
        videoUrl: streamUrl,
        thumbnail: info.thumbnail ?? pick.thumbnail ?? '',
        title: info.title ?? pick.title ?? '',
      })
    } catch (err) {
      console.error('WaysToGoon load error:', err)
      toast.error('Could not load goon video — try again')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadVideo() }, [loadVideo])

  useEffect(() => {
    if (!video || !videoRef.current) return
    const el = videoRef.current
    hlsRef.current?.destroy(); hlsRef.current = null

    if (Hls.isSupported() && /\.m3u8/i.test(video.videoUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(video.videoUrl))
      hls.attachMedia(el)
      hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}))
    } else {
      el.src = getStreamUrl(video.videoUrl)
      el.play().catch(() => {})
    }

    // Force-play: prevent any pause (no controls exposed)
    const forcePlay = () => setTimeout(() => el.play().catch(() => {}), 50)
    el.addEventListener('pause', forcePlay)
    return () => {
      el.removeEventListener('pause', forcePlay)
      hlsRef.current?.destroy()
    }
  }, [video])

  const nextTask = () => {
    setTaskOut(true)
    setTimeout(() => { setTaskIdx(i => (i + 1) % KINK_TASKS.length); setTaskOut(false) }, 200)
  }
  const prevTask = () => {
    setTaskOut(true)
    setTimeout(() => { setTaskIdx(i => (i - 1 + KINK_TASKS.length) % KINK_TASKS.length); setTaskOut(false) }, 200)
  }

  const task = KINK_TASKS[taskIdx]

  return (
    <div className="min-h-screen pb-32" style={{ background: '#000', color: '#fff' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p className="text-[8px] font-black tracking-[0.5em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>Goon Session</p>
          <h2 className="font-display text-xl tracking-widest text-white leading-none">WAYS TO GOON</h2>
        </div>
        <button onClick={loadVideo} disabled={loading}
          className="flex items-center gap-2 h-9 px-3 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-90 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.5)' }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          New Video
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Forced video — no controls, no pause */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
          {loading ? (
            <div className="aspect-video flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgba(255,255,255,0.12)' }} />
              <p className="text-[9px] font-black tracking-[0.45em] uppercase" style={{ color: 'rgba(255,255,255,0.10)' }}>
                Preparing your session…
              </p>
            </div>
          ) : video ? (
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay playsInline
                style={{ pointerEvents: 'none' }}
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="text-[8px] font-black tracking-[0.4em] uppercase px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,50,50,0.9)', border: '1px solid rgba(255,0,0,0.22)', backdropFilter: 'blur(8px)' }}>
                  🔴 LIVE SESSION
                </span>
              </div>
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="text-[9px] font-black tracking-[0.3em] px-2 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                  NO PAUSE
                </span>
              </div>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-3">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.18)' }}>Video unavailable</p>
              <button onClick={loadVideo}
                className="h-8 px-4 rounded-xl text-xs font-bold transition active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Active task card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            opacity: taskOut ? 0 : 1,
            transform: taskOut ? 'translateY(6px) scale(0.98)' : 'translateY(0) scale(1)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}>
          <div className="flex items-start gap-4 mb-3">
            <span className="text-4xl leading-none shrink-0">{task.emoji}</span>
            <div>
              <p className="text-[8px] font-black tracking-[0.45em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.18)' }}>Your Task</p>
              <h3 className="font-bold text-lg text-white leading-tight">{task.title}</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{task.desc}</p>
          <div className="flex gap-2">
            <button onClick={prevTask}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-90 hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ChevronLeft className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </button>
            <button onClick={nextTask}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wider uppercase transition-all active:scale-95 hover:bg-white/8"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
              Next Task <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* All tasks grid */}
        <div>
          <p className="text-[8px] font-black tracking-[0.45em] uppercase mb-2.5" style={{ color: 'rgba(255,255,255,0.12)' }}>
            All {KINK_TASKS.length} Tasks
          </p>
          <div className="grid grid-cols-2 gap-2">
            {KINK_TASKS.map((t, i) => (
              <button key={i}
                onClick={() => { setTaskOut(true); setTimeout(() => { setTaskIdx(i); setTaskOut(false) }, 200) }}
                className="p-3 rounded-xl text-left transition-all active:scale-95"
                style={{
                  background: i === taskIdx ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === taskIdx ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="text-xl block mb-1">{t.emoji}</span>
                <p className="text-[10px] font-bold leading-snug"
                  style={{ color: i === taskIdx ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.32)' }}>
                  {t.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
