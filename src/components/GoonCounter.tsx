import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

const STORAGE_KEY = 'goonit_goon_count_v1'
const SESSION_FLAG = 'goonit_goon_session_v1'

// Lightweight visit / streak counter shown in the nav. Increments once per
// browser session (not on every render) so the number actually means something.
export default function GoonCounter() {
  const [count, setCount] = useState<number>(0)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    let prev = 0
    try { prev = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0 } catch {}
    let countedSession = false
    try { countedSession = sessionStorage.getItem(SESSION_FLAG) === '1' } catch {}
    if (!countedSession) {
      prev += 1
      try {
        localStorage.setItem(STORAGE_KEY, String(prev))
        sessionStorage.setItem(SESSION_FLAG, '1')
      } catch {}
      setBump(true)
      window.setTimeout(() => setBump(false), 1200)
    }
    setCount(prev)
  }, [])

  if (count <= 0) return null

  return (
    <div
      title={`${count} session${count === 1 ? '' : 's'} gooned`}
      className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/15 to-rose-500/15 border border-pink-400/30 text-[11px] font-bold tracking-wider text-pink-200 ${bump ? 'animate-pop-in' : ''}`}
    >
      <Flame className="w-3 h-3 fill-pink-400 text-pink-400" />
      <span>{count}</span>
    </div>
  )
}
