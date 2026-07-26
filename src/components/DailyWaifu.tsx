import { useEffect, useRef, useState } from 'react'
import { Sparkles, Heart, RefreshCw, Calendar } from 'lucide-react'
import { getOrCreateAccountId, patchAccount } from '../api'

const STORAGE_KEY = 'goonit_daily_waifu_v1'

interface Cached {
  date: string  // YYYY-MM-DD
  url: string
  cat: string
}

const CATS = ['waifu', 'neko', 'trap']
const todayKey = () => new Date().toISOString().slice(0, 10)

export default function DailyWaifu() {
  const [data, setData] = useState<Cached | null>(null)
  const [reloading, setReloading] = useState(false)
  const fetchedRef = useRef(false)

  // Persist the cache both locally (for instant reads on the next page-load)
  // and to the user's server-side account so it follows them across devices.
  const persistCache = (next: Cached) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
    try {
      const id = getOrCreateAccountId()
      void patchAccount(id, { dailyWaifu: next })
    } catch {}
  }

  const loadFresh = async (forceCat?: string) => {
    setReloading(true)
    try {
      const cat = forceCat || CATS[Math.floor(Math.random() * CATS.length)]
      const r = await fetch(`/api/gallery?cat=${cat}`)
      if (!r.ok) throw new Error()
      const j = await r.json()
      const files: string[] = j.files || []
      if (!files.length) throw new Error()
      const url = files[Math.floor(Math.random() * files.length)]
      const next: Cached = { date: todayKey(), url, cat }
      setData(next)
      persistCache(next)
    } catch {} finally {
      setReloading(false)
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    let cached: Cached | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) cached = JSON.parse(raw)
    } catch {}
    if (cached && cached.date === todayKey() && cached.url) setData(cached)
    else loadFresh()
  }, [])

  return (
    <div className="relative rounded-3xl overflow-hidden border border-pink-400/30 bg-gradient-to-br from-pink-950/40 via-black to-purple-950/40 shadow-[0_0_40px_rgba(236,72,153,0.15)]">
      <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-0">
        {/* Image */}
        <div className="relative aspect-[3/4] sm:aspect-auto sm:h-full bg-black">
          {data ? (
            <img
              key={data.url}
              src={data.url}
              alt="Daily waifu"
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-gradient-to-br from-pink-900/40 to-purple-900/40" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80" />
        </div>

        {/* Copy */}
        <div className="relative p-5 sm:p-7 flex flex-col justify-between min-h-[14rem]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-pink-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Waifu of the day</span>
              <span className="opacity-60 normal-case tracking-normal flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {todayKey()}
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl tracking-wider text-white leading-tight mb-2">
              Today's <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">featured waifu</span> is waiting for you 🌸
            </h3>
            <p className="text-xgrab-gray text-sm">
              A fresh waifu drops every day at midnight. Tap below for an instant re-roll.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => loadFresh()}
              disabled={reloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white text-sm font-semibold shadow-lg shadow-pink-900/40 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
              Re-roll
            </button>
            <span className="text-xs text-xgrab-gray flex items-center gap-1">
              <Heart className="w-3 h-3 fill-pink-400 text-pink-400" /> {data?.cat || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
