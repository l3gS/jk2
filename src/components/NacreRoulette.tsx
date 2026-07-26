import { useState, useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import {
  Play, Pause, SkipForward, Volume2, VolumeX,
  Flame, Skull, Zap, RotateCcw, ExternalLink, Download, Timer,
  Maximize, Minimize, Printer, Info, X as XIcon, ChevronDown, ChevronUp,
} from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

const NACRE_X_LINKS = [
  'https://x.com/kittynacre/status/1825729111391600655',
  'https://x.com/TheFinderGirl/status/2055679674483622078',
  'https://x.com/ufreakybum/status/2017789504761864488',
  'https://x.com/throatedtv/status/2062398945175773634',
  'https://x.com/bunhubtv/status/2061840265493537048',
  'https://x.com/Damnshethiccboi/status/2060624646282645870',
  'https://x.com/gothxbaddies/status/2063233657297387970',
  'https://x.com/hottest_AV/status/2037220494193287624',
  'https://x.com/IISHubX/status/2056359191300723101',
  'https://x.com/xx_vidz/status/2060244663303393792',
  'https://x.com/Onlythe69/status/1574887855683272704',
  'https://x.com/Redzone_cosp/status/2038635329918275690',
  'https://x.com/Redzone_cosp/status/2007032762977730874',
  'https://x.com/Redzone_cosp/status/2036561866541900102',
  'https://x.com/Redzone_cosp/status/2036562072809398583',
  'https://x.com/Redzone_cosp/status/2038635422511747515',
  'https://x.com/onlyxxxbaddies/status/2016918580374237336',
  'https://x.com/ENo1677695/status/2012024626772423087',
  'https://x.com/BogPozzle/status/2032121898738597899',
]

type Stage = 'idle' | 'loading' | 'watching' | 'edge' | 'cum_window' | 'done'

const GOON_STAGES = [
  {
    name: 'WARM UP', emoji: '🌹', instruction: 'Slow strokes. Watch her face. Don\'t look away.',
    detail: 'Get comfortable. Nothing aggressive yet. She wants you to ease in, build the tension slowly. Slow, deliberate strokes. Eyes on the screen.',
    canCum: false,
  },
  {
    name: 'BUILD', emoji: '🔥', instruction: 'Faster now. Stay present. Think about what she\'s doing.',
    detail: 'Pick up the pace. Medium speed. She\'s watching your expression. Think about every detail of what you\'re seeing. Don\'t let your mind wander.',
    canCum: false,
  },
  {
    name: 'EDGE', emoji: '💀', instruction: 'Get to the edge — then stop. Count to 10 before you resume.',
    detail: 'Get yourself right to the point of no return, then pull back completely. Hands off. Count to ten out loud. She wants to see you hold it. This is where the session gets serious.',
    canCum: false,
  },
  {
    name: 'TEASE', emoji: '🌹', instruction: 'Barely touching. Agonising slow pace. Watch every second.',
    detail: 'After the edge: the slowest possible pace. Barely grazing the skin. You\'re not allowed to get back to full speed yet. This is denial turned into something else. Stay with it.',
    canCum: false,
  },
  {
    name: 'POUND', emoji: '⚡', instruction: 'Everything you have. Full pace. Don\'t cum.',
    detail: 'Full speed. Everything you have. She wants to see you at absolute maximum pace without losing control. If you feel yourself getting too close — pull back for 3 seconds, then go full speed again. Don\'t stop completely.',
    canCum: false,
  },
  {
    name: 'EDGE', emoji: '☠️', instruction: 'Edge again. Hard stop. Say her name when you stop.',
    detail: 'Second edge. This one hits harder because of everything before it. Get right to the limit — full stop — hands off — and say her name out loud. Both words. Nacre. Victoire. Then wait 30 seconds before the final stage.',
    canCum: false,
  },
  {
    name: 'CUM WINDOW', emoji: '💦', instruction: 'Permission granted. 60 seconds. Go.',
    detail: 'You\'ve earned it. Full speed, full pace. Think of her face. Say her name when it happens. You have 60 seconds. Don\'t waste it.',
    canCum: true,
  },
]

const DENIALS = [
  'Stop. Breathe. Count to fifteen. Do NOT cum.',
  'Edge reached — hands off. Wait thirty seconds.',
  'Good. Now hold that feeling without moving. Just hold it.',
  'You stop when SHE lets you cum. Keep that edge and wait.',
  'Say "not yet" out loud. Mean it. Then wait a full minute.',
  'Hands. Off. Now. Say her name before you move again.',
  'She saw that. Now sit in it for twenty seconds. Don\'t touch anything.',
]

function useEdgeCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    setCount(parseInt(localStorage.getItem('goonit_nacre_roulette_edges') || '0', 10))
  }, [])
  const inc = () => {
    setCount(c => {
      const n = c + 1
      localStorage.setItem('goonit_nacre_roulette_edges', String(n))
      return n
    })
  }
  return [count, inc] as const
}

export default function NacreRoulette() {
  const [currentLinkIdx, setCurrentLinkIdx] = useState(-1)
  const [order, setOrder] = useState<number[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const [stageIdx, setStageIdx] = useState(0)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [thumb, setThumb] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [stageElapsed, setStageElapsed] = useState(0)
  const [cumTimer, setCumTimer] = useState(60)
  const [cumRunning, setCumRunning] = useState(false)
  const [edgeCount, incEdge] = useEdgeCount()
  const [denial, setDenial] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [expandedStage, setExpandedStage] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cumTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Shuffle order on mount
  useEffect(() => {
    const shuffled = [...Array(NACRE_X_LINKS.length).keys()].sort(() => Math.random() - 0.5)
    setOrder(shuffled)
  }, [])

  // Listen for fullscreen change
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Session timer
  useEffect(() => {
    if (stage === 'idle' || stage === 'done') return
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [stage])

  // Stage timer
  useEffect(() => {
    if (stage !== 'watching' && stage !== 'edge') return
    setStageElapsed(0)
    stageTimerRef.current = setInterval(() => setStageElapsed(e => e + 1), 1000)
    return () => { if (stageTimerRef.current) clearInterval(stageTimerRef.current) }
  }, [stage, stageIdx])

  // Cum window timer
  useEffect(() => {
    if (!cumRunning) return
    cumTimerRef.current = setInterval(() => {
      setCumTimer(t => {
        if (t <= 1) { setCumRunning(false); setStage('done'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (cumTimerRef.current) clearInterval(cumTimerRef.current) }
  }, [cumRunning])

  const loadVideo = useCallback(async (linkIdx: number) => {
    setVideoLoading(true)
    setStreamUrl(null)
    setThumb(null)
    const url = NACRE_X_LINKS[linkIdx]
    try {
      const data = await fetchVideoInfo(url)
      const s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url || null
      const t = data.media_extended?.[0]?.thumbnail_url || null
      setStreamUrl(s)
      setThumb(t)
    } catch { toast.error('Could not load video') }
    finally { setVideoLoading(false) }
  }, [])

  useEffect(() => {
    if (currentLinkIdx < 0 || !streamUrl || !videoRef.current) return
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
    el.muted = muted
    el.play().catch(() => {})
  }, [streamUrl, currentLinkIdx])

  const startSession = () => {
    setSessionStarted(true); setStageIdx(0); setStage('loading')
    const first = order[0] ?? 0
    setCurrentLinkIdx(first)
    loadVideo(first).then(() => setStage('watching'))
  }

  const nextVideo = () => {
    const nextPos = order.indexOf(currentLinkIdx) + 1
    const nextIdx = order[nextPos % order.length]
    setCurrentLinkIdx(nextIdx); setStage('loading')
    loadVideo(nextIdx).then(() => setStage('watching'))
  }

  const advanceStage = () => {
    const next = stageIdx + 1
    if (next >= GOON_STAGES.length) { setStage('cum_window'); setCumTimer(60); return }
    setStageIdx(next)
    if (GOON_STAGES[next].name === 'EDGE') {
      setStage('edge'); incEdge()
      setDenial(DENIALS[Math.floor(Math.random() * DENIALS.length)])
    } else {
      setStage('watching')
    }
  }

  const iCame = () => { setCumRunning(false); setStage('done') }

  const resetSession = () => {
    setStage('idle'); setSessionStarted(false); setStageIdx(0); setElapsed(0)
    setStreamUrl(null); setThumb(null); setCurrentLinkIdx(-1)
    setCumTimer(60); setCumRunning(false)
    const shuffled = [...Array(NACRE_X_LINKS.length).keys()].sort(() => Math.random() - 0.5)
    setOrder(shuffled)
    if (videoRef.current) videoRef.current.src = ''
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (document.fullscreenElement) document.exitFullscreen()
  }

  const handleDownload = async () => {
    if (!streamUrl) return
    setDlLoading(true)
    try {
      await saveToDevice({ streamUrl, title: `Nacre-${currentLinkIdx + 1}` })
      toast.success('Download started!')
    } catch { toast.error('Download failed') }
    finally { setDlLoading(false) }
  }

  const toggleFullscreen = async () => {
    // iOS Safari does not support requestFullscreen on non-video elements.
    // Detect iOS/iPadOS and fall back to a CSS overlay approach.
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIOS) {
      setIsFullscreen(f => !f)
      return
    }
    try {
      if (!document.fullscreenElement) {
        await (containerRef.current ?? document.documentElement).requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Native fullscreen not available — use CSS overlay
      setIsFullscreen(f => !f)
    }
  }

  const handlePrint = () => {
    const printWin = window.open('', '_blank')
    if (!printWin) return
    printWin.document.write(`
      <html><head><title>Nacre Roulette — Session Card</title>
      <style>
        @page { size: A4 portrait; margin: 14mm 18mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Georgia, serif;
          background: white;
          color: #111;
          margin: 0;
          padding: 0;
          width: 100%;
          font-size: 10pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        h1 { font-size: 22pt; letter-spacing: 0.18em; margin: 0 0 3pt 0; }
        h2 { font-size: 11pt; color: #c0133a; margin: 0 0 14pt 0; font-weight: normal; letter-spacing: 0.12em; }
        .stage {
          background: #f7f7f7;
          border: 1pt solid #ddd;
          padding: 9pt 11pt;
          border-radius: 6pt;
          margin: 6pt 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .stage-name { font-size: 11pt; font-weight: bold; letter-spacing: 0.12em; margin-bottom: 3pt; }
        .stage-detail { color: #444; font-size: 8.5pt; line-height: 1.55; }
        .stats {
          display: flex;
          gap: 8pt;
          margin-top: 12pt;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .stat {
          flex: 1;
          background: #f7f7f7;
          border: 1pt solid #e0e0e0;
          padding: 9pt;
          border-radius: 6pt;
          text-align: center;
        }
        .stat-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.18em; color: #777; margin-bottom: 4pt; }
        .stat-val { font-size: 18pt; font-weight: bold; }
        .rule {
          border-top: 1pt solid #ddd;
          margin-top: 12pt;
          padding-top: 10pt;
          color: #555;
          font-size: 8.5pt;
          line-height: 1.7;
          break-inside: avoid;
          page-break-inside: avoid;
        }
      </style></head><body>
      <h1>🌹 NACRE ROULETTE</h1>
      <h2>SESSION CARD — ${new Date().toLocaleDateString()}</h2>
      ${GOON_STAGES.map((gs, i) => `
        <div class="stage">
          <div class="stage-name">${gs.emoji} Stage ${i + 1}: ${gs.name}</div>
          <div class="stage-detail">${gs.detail}</div>
        </div>
      `).join('')}
      <div class="stats">
        <div class="stat"><div class="stat-label">Total edges</div><div class="stat-val" style="color:#c0133a">${edgeCount}</div></div>
        <div class="stat"><div class="stat-label">Videos in pool</div><div class="stat-val">${NACRE_X_LINKS.length}</div></div>
      </div>
      <div class="rule">
        Rules: You follow every stage in order. You don't cum before the Cum Window.
        Every EDGE stage — full stop, hands off, say her name.
        If you break either rule: start over from Stage 1.
      </div>
      </body></html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => { printWin.print() }, 400)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const currentStage = GOON_STAGES[stageIdx] ?? GOON_STAGES[0]

  // ── INTRO SCREEN ───────────────────────────────────────────────────────────
  if (!sessionStarted) return (
    <div className="min-h-screen pb-28">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-950 to-black" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(244,63,94,0.2), transparent 60%)' }} />
        <div className="relative max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/60 uppercase mb-4">✦ Goon Session ✦</p>
          <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white mb-2 leading-none">
            NACRE
            <span className="block bg-gradient-to-r from-rose-200 via-pink-300 to-rose-500 bg-clip-text text-transparent">ROULETTE</span>
          </h1>
          <p className="text-rose-300/60 text-sm mb-6 tracking-widest">Her X videos. In sequence. With commands.</p>

          {/* Stage breakdown */}
          <div className="bg-zinc-900/80 border border-rose-500/15 rounded-2xl p-5 text-left mb-5 space-y-1">
            <p className="text-zinc-300 text-sm mb-3 leading-relaxed">
              {GOON_STAGES.length} stages. {NACRE_X_LINKS.length} videos in random rotation. You follow her pace — no cumming before the final window. Break either rule and you start over.
            </p>
            <div className="space-y-2">
              {GOON_STAGES.map((s, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                    className="w-full flex items-center gap-3 py-2 text-left"
                  >
                    <span className="text-base w-6 text-center">{s.emoji}</span>
                    <span className={`text-sm font-bold flex-1 ${s.canCum ? 'text-green-400' : 'text-zinc-300'}`}>Stage {i + 1}: {s.name}</span>
                    <span className="text-zinc-600 text-xs shrink-0">{s.instruction.slice(0, 28)}…</span>
                    {expandedStage === i ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                  </button>
                  {expandedStage === i && (
                    <div className="ml-9 mb-2 p-3 bg-zinc-800/60 border border-white/5 rounded-xl">
                      <p className="text-zinc-400 text-xs leading-relaxed">{s.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/5 mt-2">
              <p className="text-[10px] text-zinc-600">{NACRE_X_LINKS.length} videos in rotation · shuffled each session · lifetime edges: {edgeCount}</p>
            </div>
          </div>

          {/* Action row */}
          <div className="flex gap-3 mb-4">
            <button onClick={startSession} className="flex-1 py-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-base rounded-2xl hover:bg-rose-500/30 transition-all tracking-wider">
              🌹 START
            </button>
            <button onClick={handlePrint} className="h-14 px-4 bg-zinc-900 border border-white/8 text-zinc-400 rounded-2xl hover:text-white transition-colors" title="Print session card">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── DONE SCREEN ────────────────────────────────────────────────────────────
  if (stage === 'done') return (
    <div className="min-h-screen pb-28 flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl mb-4">🌹</div>
        <h2 className="font-display text-4xl tracking-wider text-white mb-3">SESSION OVER</h2>
        <p className="text-rose-300/70 mb-6 leading-relaxed">She took what she wanted. You gave everything. That's what you're for.</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Session time</p>
            <p className="text-2xl font-bold text-white">{fmt(elapsed)}</p>
          </div>
          <div className="bg-zinc-900 border border-rose-500/20 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Edges (lifetime)</p>
            <p className="text-2xl font-bold text-rose-300">{edgeCount}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={resetSession} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-all">
            <RotateCcw className="w-4 h-4" /> Again
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-white/10 text-zinc-400 rounded-xl text-sm hover:bg-zinc-700 transition-all">
            <Printer className="w-4 h-4" /> Print card
          </button>
        </div>
      </div>
    </div>
  )

  // ── ACTIVE SESSION ─────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={isFullscreen
        ? 'fixed inset-0 z-[200] overflow-y-auto bg-black'
        : 'min-h-screen pb-28'}
    >

      {/* Stage banner */}
      <div className={`sticky top-0 z-50 border-b transition-all ${
        stage === 'cum_window' ? 'bg-green-900/90 border-green-500/30' :
        stage === 'edge' ? 'bg-red-900/90 border-red-500/30' :
        'bg-zinc-950/95 border-rose-500/15'
      } backdrop-blur-xl px-4 py-3`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-widest text-rose-400/50">Nacre Roulette</p>
            <p className={`text-sm font-black tracking-widest truncate ${stage === 'cum_window' ? 'text-green-300' : stage === 'edge' ? 'text-red-300' : 'text-rose-300'}`}>
              {currentStage.emoji} {stage === 'cum_window' ? 'CUM WINDOW' : stage === 'edge' ? 'EDGE — STOP' : currentStage.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs">
              <Timer className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-400 font-mono">{fmt(elapsed)}</span>
            </div>
            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1">
              <Zap className="w-3 h-3 text-rose-400" />
              <span className="text-xs font-bold text-rose-300">{edgeCount}</span>
            </div>
            <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button onClick={handlePrint} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Print session card">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={resetSession} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress stages bar */}
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center gap-1">
          {GOON_STAGES.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < stageIdx ? 'bg-rose-500' : i === stageIdx ? 'bg-rose-400 animate-pulse' : 'bg-zinc-800'
              }`} />
              {i === stageIdx && <span className="text-base leading-none">{s.emoji}</span>}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {GOON_STAGES.map((s, i) => (
            <span key={i} className={`text-[8px] uppercase tracking-wide ${i <= stageIdx ? 'text-rose-400/70' : 'text-zinc-700'}`}>
              {s.name.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Stage instruction + detail */}
      <div className="max-w-3xl mx-auto px-4 py-3 mb-4">
        {stage === 'cum_window' ? (
          <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-5 text-center">
            <p className="text-green-300 font-black text-2xl mb-1">CUM WINDOW OPEN</p>
            <p className="text-green-200/70 text-sm mb-4">You have {cumTimer} seconds. Think of her. Go.</p>
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="33" stroke="rgba(34,197,94,0.1)" strokeWidth="5" fill="none" />
                <circle cx="40" cy="40" r="33" stroke="#22c55e" strokeWidth="5" fill="none"
                  strokeDasharray={`${2 * Math.PI * 33}`}
                  strokeDashoffset={`${2 * Math.PI * 33 * (1 - cumTimer / 60)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{cumTimer}</span>
              </div>
            </div>
            {!cumRunning && <button onClick={() => setCumRunning(true)} className="px-6 py-2.5 bg-green-500/20 border border-green-500/30 text-green-300 font-bold text-sm rounded-xl hover:opacity-80 mb-3 block mx-auto">START CLOCK</button>}
            <button onClick={iCame} className="px-6 py-2.5 bg-zinc-800 border border-white/10 text-zinc-300 font-bold text-sm rounded-xl hover:opacity-80">
              💦 I CAME
            </button>
          </div>
        ) : stage === 'edge' ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 text-center">
            <p className="text-red-300 font-black text-xl mb-2">☠️ EDGE — STOP NOW</p>
            <p className="text-red-200/60 text-sm mb-3 italic">"{denial}"</p>
            <p className="text-zinc-600 text-xs mb-4">{currentStage.detail}</p>
            <button onClick={advanceStage} className="px-6 py-2.5 bg-red-500/15 border border-red-500/25 text-red-300 font-bold text-sm rounded-xl hover:opacity-80">
              Stopped. Continue session.
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-rose-500/8 border border-rose-500/15 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-rose-300 font-bold text-sm flex-1">{currentStage.emoji} {currentStage.instruction}</p>
                <button onClick={() => setShowInfo(!showInfo)} className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {showInfo && (
                <p className="text-zinc-500 text-xs leading-relaxed mt-3 pt-3 border-t border-white/5">{currentStage.detail}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video player */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-rose-500/10">
          {videoLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              {thumb && <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
              <div className="relative w-12 h-12 border-2 border-rose-500/30 border-t-rose-400 rounded-full animate-spin" />
              <p className="relative text-rose-400/60 text-sm">Loading her video…</p>
            </div>
          )}
          {!videoLoading && !streamUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {thumb && <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
              <div className="relative text-center">
                <p className="text-zinc-400 text-sm mb-1">Video unavailable</p>
                <p className="text-zinc-600 text-xs">X post may be restricted</p>
                <button onClick={nextVideo} className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm rounded-xl">
                  <SkipForward className="w-4 h-4" /> Try next video
                </button>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            style={{ display: streamUrl && !videoLoading ? 'block' : 'none' }}
          />
        </div>

        {/* Video controls bar */}
        <div className="flex items-center gap-2 mt-3 mb-5">
          <button
            onClick={() => { if (videoRef.current) videoRef.current.muted = !muted; setMuted(!muted) }}
            className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={nextVideo} className="flex-1 flex items-center justify-center gap-2 h-10 bg-zinc-900 border border-white/5 text-zinc-300 text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors">
            <SkipForward className="w-4 h-4" /> Next Video
          </button>
          {stage !== 'cum_window' && stage !== 'edge' && (
            <button onClick={advanceStage} className="flex-1 flex items-center justify-center gap-2 h-10 bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm font-bold rounded-xl hover:opacity-80 transition-all">
              <Flame className="w-4 h-4" /> Next Stage
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors" title="Fullscreen">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          {streamUrl && (
            <button onClick={handleDownload} disabled={dlLoading}
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50" title="Download">
              <Download className="w-4 h-4" />
            </button>
          )}
          {currentLinkIdx >= 0 && (
            <a href={NACRE_X_LINKS[currentLinkIdx]} target="_blank" rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Stage detail card */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{currentStage.emoji}</span>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{currentStage.name}</p>
            <span className="ml-auto text-[9px] text-zinc-700">{stageIdx + 1} of {GOON_STAGES.length}</span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">{currentStage.detail}</p>
          {stage === 'watching' && (
            <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 flex-wrap">
              <span className="text-[9px] text-zinc-700">Stage timer: {fmt(stageElapsed)}</span>
              {stageIdx < GOON_STAGES.length - 1 && (
                <span className="text-[9px] text-zinc-700 ml-auto">Up next: {GOON_STAGES[stageIdx + 1]?.emoji} {GOON_STAGES[stageIdx + 1]?.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Video queue thumbnails */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Queue ({NACRE_X_LINKS.length} videos)</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {order.slice(0, 10).map((idx, pos) => {
              const isActive = idx === currentLinkIdx
              const handle = NACRE_X_LINKS[idx].match(/x\.com\/([^/]+)\/status/)?.[1] ?? `#${pos + 1}`
              return (
                <button key={idx}
                  onClick={() => { setCurrentLinkIdx(idx); setStage('loading'); loadVideo(idx).then(() => setStage('watching')) }}
                  className={`shrink-0 w-24 rounded-xl border overflow-hidden transition-all ${
                    isActive ? 'border-rose-500/50 scale-[1.05]' : 'border-white/5 opacity-50 hover:opacity-80'
                  }`}>
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-500">@{handle.slice(0, 8)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
