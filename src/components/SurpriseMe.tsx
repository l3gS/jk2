import { useState, useCallback } from 'react'
import { Dices } from 'lucide-react'

const SURPRISE_CATS = ['waifu','neko','ahegao','boobs','ass','feet','anal','pussy','paizuri','realistic3d','yuri','futanari']

interface SurpriseMeProps {
  onImageReady: (url: string) => void
}

export default function SurpriseMe({ onImageReady }: SurpriseMeProps) {
  const [spinning, setSpinning] = useState(false)

  const fire = useCallback(async () => {
    if (spinning) return
    setSpinning(true)
    try {
      const cat = SURPRISE_CATS[Math.floor(Math.random() * SURPRISE_CATS.length)]
      const page = Math.floor(Math.random() * 5) + 1
      const r = await fetch(`/api/gallery?cat=${cat}&page=${page}&count=30`)
      const data = await r.json()
      if (Array.isArray(data?.files) && data.files.length > 0) {
        const imgs = data.files.filter((f: string) => /\.(jpe?g|png|webp)(\?|$)/i.test(f))
        if (imgs.length) {
          const url = imgs[Math.floor(Math.random() * imgs.length)]
          onImageReady(url)
        }
      }
    } finally {
      setTimeout(() => setSpinning(false), 600)
    }
  }, [spinning, onImageReady])

  return (
    <button
      onClick={fire}
      disabled={spinning}
      title="Surprise Me — random image"
      className="hidden md:block fixed bottom-6 right-20 z-[90] group"
      aria-label="Surprise Me"
    >
      <div className={`
        relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl
        transition-all duration-200 hover:scale-110 active:scale-95
        ${spinning ? 'animate-spin-slow' : ''}
      `}
        style={{
          background: 'linear-gradient(135deg, #ff6eb4, #ffb6d9, #c084fc, #f472b6, #ff6eb4)',
          backgroundSize: '300% 300%',
          animation: spinning ? 'surprise-spin 0.6s linear' : 'surprise-gradient 3s ease infinite',
          boxShadow: '0 0 20px rgba(255,110,180,0.6), 0 0 40px rgba(255,110,180,0.3)',
        }}
      >
        <Dices className="w-7 h-7 text-white drop-shadow" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl border-2 border-pink-300/50 animate-ping opacity-60 pointer-events-none" />
      </div>
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-[10px] text-pink-300 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold tracking-wider">
        SURPRISE ME
      </span>
      <style>{`
        @keyframes surprise-gradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes surprise-spin {
          0%   { transform: rotate(0deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1.1); }
        }
      `}</style>
    </button>
  )
}
