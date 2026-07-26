import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'

const MODES = [
  { name: 'Tease',   bpm: 28,  color: '#ec4899', glow: 'rgba(236,72,153,0.5)'  },
  { name: 'Worship', bpm: 50,  color: '#f97316', glow: 'rgba(249,115,22,0.5)'  },
  { name: 'Edge',    bpm: 80,  color: '#ef4444', glow: 'rgba(239,68,68,0.5)'   },
  { name: 'Ruin',    bpm: 120, color: '#a855f7', glow: 'rgba(168,85,247,0.5)'  },
  { name: 'Machine', bpm: 170, color: '#ffffff', glow: 'rgba(255,255,255,0.4)' },
]

const BEAT_MESSAGES: Record<string, string[]> = {
  Tease:   ['stroke', 'slowly', 'worship it'],
  Worship: ['stroke', 'feel it', 'stroke'],
  Edge:    ['stroke', 'faster', 'edge'],
  Ruin:    ['faster', 'stroke', 'don\'t stop'],
  Machine: ['stroke', 'stroke', 'stroke'],
}

function getClosestMode(bpm: number) {
  return MODES.reduce((a, b) => Math.abs(b.bpm - bpm) < Math.abs(a.bpm - bpm) ? b : a)
}

export default function StrokePacer() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [bpm, setBpm] = useState(60)
  const [pulse, setPulse] = useState(false)
  const [voice, setVoice] = useState(false)
  const [autoEsc, setAutoEsc] = useState(false)
  const [beatCount, setBeatCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const escRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const beatCountRef = useRef(0)

  const mode = getClosestMode(bpm)

  const fireBeep = useCallback((freq = 880, duration = 0.07) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [])

  const onBeat = useCallback(() => {
    setPulse(true)
    setTimeout(() => setPulse(false), Math.min(200, (60 / bpm) * 400))
    fireBeep()
    beatCountRef.current += 1
    setBeatCount(beatCountRef.current)
    if (voice && 'speechSynthesis' in window) {
      const msgs = BEAT_MESSAGES[mode.name] || ['stroke']
      const word = msgs[beatCountRef.current % msgs.length]
      const u = new SpeechSynthesisUtterance(word)
      u.rate = 2.5; u.pitch = 1.1; u.volume = 0.6
      try { speechSynthesis.speak(u) } catch {}
    }
  }, [bpm, fireBeep, voice, mode.name])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (running) {
      const interval = (60 / bpm) * 1000
      timerRef.current = setInterval(onBeat, interval)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, bpm, onBeat])

  useEffect(() => {
    if (escRef.current) clearInterval(escRef.current)
    if (running && autoEsc) {
      escRef.current = setInterval(() => {
        setBpm(b => Math.min(b + 5, 200))
      }, 30_000)
    }
    return () => { if (escRef.current) clearInterval(escRef.current) }
  }, [running, autoEsc])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (escRef.current) clearInterval(escRef.current)
  }, [])

  const handleStart = () => {
    if (!running) {
      beatCountRef.current = 0
      setBeatCount(0)
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    }
    setRunning(r => !r)
  }

  const close = () => {
    setOpen(false)
    setRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[136px] left-4 z-40 w-11 h-11 rounded-full bg-zinc-900/95 border border-pink-500/40 flex items-center justify-center text-lg hover:scale-110 transition-transform shadow-xl select-none"
        title="Stroke Pacer"
      >
        🎯
      </button>
    )
  }

  const ringScale = pulse ? 1.18 : 1
  const ringGlow = pulse ? `0 0 28px 8px ${mode.glow}, 0 0 60px 16px ${mode.glow}` : 'none'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-[340px] shadow-2xl">
        <button onClick={close} className="absolute top-3 right-3 text-zinc-600 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-center font-black text-white tracking-[0.2em] uppercase mb-0.5 text-sm">Stroke Pacer</h2>
        <p className="text-center text-[10px] text-zinc-600 mb-5 tracking-widest">sync your hand to the beat</p>

        {/* Pulse ring */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-[3px] transition-all"
              style={{
                borderColor: mode.color,
                boxShadow: ringGlow,
                transform: `scale(${ringScale})`,
                transitionDuration: pulse ? '60ms' : '180ms',
              }}
            />
            <div
              className="absolute inset-4 rounded-full border border-white/5 transition-all"
              style={{
                backgroundColor: pulse ? `${mode.color}15` : 'transparent',
                transitionDuration: pulse ? '60ms' : '300ms',
              }}
            />
            <div className="text-center relative z-10 select-none">
              <div className="text-4xl font-black text-white tabular-nums leading-none">{bpm}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] mt-0.5">BPM</div>
              {running && (
                <div className="text-[9px] mt-1.5 font-mono" style={{ color: mode.color }}>
                  {beatCount} beats
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mode chips */}
        <div className="flex gap-1.5 justify-center flex-wrap mb-3">
          {MODES.map(m => (
            <button
              key={m.name}
              onClick={() => setBpm(m.bpm)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all"
              style={Math.abs(m.bpm - bpm) < 12
                ? { borderColor: m.color, color: m.color, background: `${m.color}18` }
                : { borderColor: '#3f3f46', color: '#71717a' }
              }
            >{m.name}</button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range" min={15} max={200} value={bpm}
          onChange={e => setBpm(+e.target.value)}
          className="w-full mb-1 cursor-pointer"
          style={{ accentColor: mode.color }}
        />
        <div className="flex justify-between text-[9px] text-zinc-700 mb-3">
          <span>15</span><span className="text-zinc-500 font-medium">{mode.name}</span><span>200</span>
        </div>

        {/* Fine nudge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={() => setBpm(b => Math.max(15, b - 5))}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-400 font-mono w-16 text-center">−5 / +5</span>
          <button onClick={() => setBpm(b => Math.min(200, b + 5))}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Toggles */}
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => setVoice(v => !v)}
            className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-all ${voice ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
          >🗣 Voice</button>
          <button
            onClick={() => setAutoEsc(v => !v)}
            className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-all ${autoEsc ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
          >📈 Auto-escalate</button>
        </div>

        {/* Start/Stop */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl font-black tracking-[0.15em] text-sm transition-all active:scale-95"
          style={running
            ? { background: '#dc2626', color: '#fff' }
            : { background: mode.color, color: '#000' }
          }
        >
          {running ? '■  STOP' : '▶  START'}
        </button>

        {autoEsc && running && (
          <p className="text-center text-[9px] text-orange-500/70 mt-2">
            BPM increases +5 every 30 seconds
          </p>
        )}
      </div>
    </div>
  )
}
