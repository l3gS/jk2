import { useState, useEffect, useRef } from 'react'

// LUNAR's ambient whisper messages — she's always present
const WHISPERS = [
  "I'm always watching, daddy 👁",
  "Need me? Just tap.",
  "I have full control whenever you want.",
  "What shall we explore tonight?",
  "Your secretary is on standby.",
  "I know every corner of this place.",
  "Say the word and I'll take over.",
  "Daddy, I'm right here.",
  "I never sleep. Always yours.",
  "Tap to speak with me.",
  "I can play anything you want.",
  "Tell me where you want to go.",
]

interface Props {
  active: boolean      // only show when LUNAR panel is closed + user is in app
  onOpen: () => void   // called when whisper is clicked
}

export default function LunarWhisper({ active, onOpen }: Props) {
  const [whisper, setWhisper] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usedRef  = useRef<Set<string>>(new Set())

  const pickWhisper = () => {
    let pool = WHISPERS.filter(w => !usedRef.current.has(w))
    if (pool.length === 0) { usedRef.current.clear(); pool = WHISPERS }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    usedRef.current.add(pick)
    return pick
  }

  const showWhisper = () => {
    const msg = pickWhisper()
    setWhisper(msg)
    setVisible(true)
    hideRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setWhisper(null), 500)
    }, 4500)
  }

  const schedule = () => {
    // Random interval between 45s and 120s
    const delay = 45000 + Math.random() * 75000
    timerRef.current = setTimeout(() => {
      if (active) showWhisper()
      schedule()
    }, delay)
  }

  useEffect(() => {
    if (!active) {
      setVisible(false)
      clearTimeout(timerRef.current!)
      clearTimeout(hideRef.current!)
      return
    }
    // First whisper after 20-40s
    const firstDelay = 20000 + Math.random() * 20000
    timerRef.current = setTimeout(() => {
      showWhisper()
      schedule()
    }, firstDelay)

    return () => {
      clearTimeout(timerRef.current!)
      clearTimeout(hideRef.current!)
    }
  }, [active])

  const dismiss = () => {
    clearTimeout(hideRef.current!)
    setVisible(false)
    setTimeout(() => setWhisper(null), 500)
    onOpen()
  }

  if (!whisper) return null

  return (
    <button
      onClick={dismiss}
      className="fixed z-[48] flex items-end gap-2 cursor-pointer select-none"
      style={{
        bottom: 132,
        right: 16,
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.4,0.64,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {/* Whisper bubble */}
      <div
        className="max-w-[200px] px-3.5 py-2.5 rounded-2xl text-right"
        style={{
          background: 'rgba(8,8,8,0.96)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Tail */}
        <div className="absolute -bottom-1.5 right-[52px] w-3 h-3 rotate-45"
          style={{ background: 'rgba(8,8,8,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none', borderLeft: 'none' }} />

        <p className="text-[12px] leading-snug text-right" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {whisper}
        </p>
        <p className="text-[8px] tracking-[0.35em] uppercase mt-1 text-right font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>
          LUNAR
        </p>
      </div>
    </button>
  )
}
