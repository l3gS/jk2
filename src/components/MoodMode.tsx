import { useState, useEffect } from 'react'

export type Mood = 'soft' | 'wild' | 'dominant'

const MOODS: { id: Mood; label: string; emoji: string; css: Record<string, string>; glow: string }[] = [
  {
    id: 'soft',
    label: 'Soft',
    emoji: '🌸',
    glow: 'rgba(255,182,217,0.4)',
    css: {
      '--mood-primary': '#ffb6d9',
      '--mood-accent': '#ff6eb4',
      '--mood-glow': '255,182,217',
      '--mood-bg-tint': 'rgba(255,182,217,0.04)',
    },
  },
  {
    id: 'wild',
    label: 'Wild',
    emoji: '🔥',
    glow: 'rgba(251,113,133,0.5)',
    css: {
      '--mood-primary': '#fb7185',
      '--mood-accent': '#f43f5e',
      '--mood-glow': '251,113,133',
      '--mood-bg-tint': 'rgba(244,63,94,0.05)',
    },
  },
  {
    id: 'dominant',
    label: 'Dominant',
    emoji: '👑',
    glow: 'rgba(192,132,252,0.5)',
    css: {
      '--mood-primary': '#c084fc',
      '--mood-accent': '#a855f7',
      '--mood-glow': '192,132,252',
      '--mood-bg-tint': 'rgba(168,85,247,0.05)',
    },
  },
]

const STORAGE_KEY = 'goonit-mood-v1'

function applyMoodCss(mood: Mood) {
  const m = MOODS.find(m => m.id === mood)
  if (!m) return
  const root = document.documentElement
  Object.entries(m.css).forEach(([k, v]) => root.style.setProperty(k, v))
}

export function useMood(): [Mood, (m: Mood) => void] {
  const [mood, setMoodState] = useState<Mood>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mood | null
    return stored || 'soft'
  })

  useEffect(() => {
    applyMoodCss(mood)
  }, [mood])

  const setMood = (m: Mood) => {
    setMoodState(m)
    localStorage.setItem(STORAGE_KEY, m)
    applyMoodCss(m)
  }

  return [mood, setMood]
}

export default function MoodMode({ mood, setMood }: { mood: Mood; setMood: (m: Mood) => void }) {
  const current = MOODS.find(m => m.id === mood)!

  return (
    <div className="relative group">
      <div className="flex items-center rounded-full border border-pink-300/20 bg-pink-950/30 overflow-hidden h-7">
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            title={m.label}
            className={`h-full px-2.5 text-[11px] font-bold tracking-wide flex items-center gap-1 transition-all ${
              mood === m.id
                ? 'bg-gradient-to-r from-pink-500/60 to-fuchsia-500/60 text-white'
                : 'text-pink-300/50 hover:text-pink-200 hover:bg-white/5'
            }`}
          >
            <span>{m.emoji}</span>
            <span className="hidden lg:inline">{m.label}</span>
          </button>
        ))}
      </div>
      {/* Tooltip */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-[10px] text-pink-300 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {current.emoji} {current.label} Mode active
      </div>
    </div>
  )
}
