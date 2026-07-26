import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Heart, Flame, BellOff, Bell, Loader2 } from 'lucide-react'

interface PopupGif {
  id: string
  hd?: string
  sd?: string
  poster?: string
  cat?: string
}

type PopupVariant = 'hentai' | 'heysam'

interface ActivePopup {
  variant: PopupVariant
  // For 'hentai' variant we use a still image (drawn art from /api/gallery).
  // For 'heysam' variant we use a real-people clip (video from /api/gif/random).
  imageUrl?: string
  gif?: PopupGif
  message?: string
}

const STORAGE_KEY = 'goonit_popups_enabled'

// Auto-popup cadence — first one fires after INITIAL_GRACE; subsequent ones
// stagger every MIN_DELAY..MAX_DELAY ms while the tab is visible.
const INITIAL_GRACE = 25_000
const MIN_DELAY = 75_000
const MAX_DELAY = 180_000
const AUTO_DISMISS = 12_000

// Extremely kinky messages used by the "Hey sam..." real-people popup variant.
// Designed to read like raw, anonymous, dirty whispers — explicit sex acts,
// commands, and confessions. Kept first-name only ("sam") so each one feels
// like a personal DM from someone real.
const HEY_SAM_MESSAGES = [
  "Hey sam… i want your cock down my throat right now",
  "Hey sam… i'm fingering myself thinking about you",
  "Hey sam… cum on my tits, i'll lick it off",
  "Hey sam… spread me open and use me",
  "Hey sam… i need your tongue on my clit",
  "Hey sam… fuck me until i can't walk tomorrow",
  "Hey sam… let me ride your face",
  "Hey sam… choke me and call me your dirty slut",
  "Hey sam… i'm soaking wet and begging for you",
  "Hey sam… cum inside me, i don't care",
  "Hey sam… pull my hair while you fuck me from behind",
  "Hey sam… i want to swallow every drop",
  "Hey sam… my pussy is throbbing for your cock",
  "Hey sam… bend me over and breed me",
  "Hey sam… i'm playing with my ass thinking of you",
  "Hey sam… show me your cock, i'll send mine first",
  "Hey sam… eat my pussy until i scream",
  "Hey sam… i want you to fill me up",
  "Hey sam… stroke that big dick for me baby",
  "Hey sam… cum on my face like the slut i am",
  "Hey sam… i'll take it in every hole tonight",
  "Hey sam… tell me how you'd fuck me",
  "Hey sam… my mouth, my pussy, my ass — pick one",
  "Hey sam… make me your dirty little fuckdoll",
  "Hey sam… i'm dripping down my thighs for you",
  "Hey sam… ruin me, please, i'm begging",
  "Hey sam… i need a load on my tongue right now",
  "Hey sam… i'm naked in bed waiting",
  "Hey sam… use me however you want, i'm yours",
  "Hey sam… make me cum on your fingers first then your cock",
]

// Real-people redgifs categories used by the "Hey sam" variant. Strict mode
// is OFF so we get actual human content, NOT drawn hentai.
const HEYSAM_CATS = ['cosplay', 'lewd', 'amateur', 'ecchi']
// Hentai image categories — same source as the gallery (waifu.pics +
// danbooru + gelbooru). Used by the drawn-only "hentai" popup variant so
// it never accidentally shows real people.
const HENTAI_IMAGE_CATS = ['hentai', 'ahegao', 'waifu', 'neko', 'pinup', 'paizuri']

export default function HentaiPopup({ enabled = true }: { enabled?: boolean }) {
  const [active, setActive] = useState<ActivePopup | null>(null)
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== '0' } catch { return true }
  })
  const dismissTimer = useRef<number | null>(null)
  const scheduleTimer = useRef<number | null>(null)
  // Used to alternate between the two popup variants on the auto-schedule.
  const popCounter = useRef(0)

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(() => { setActive(null); setClosing(false) }, 250)
  }, [])

  // Fetch + show one popup. `forced` lets the caller pin the variant; otherwise
  // we alternate so the user gets a healthy mix of hentai drops and real-people
  // "Hey sam…" whispers. The hentai variant pulls a still drawn image from
  // the SAME gallery sources (waifu.pics + danbooru + gelbooru) used by the
  // main gallery — so it can never accidentally surface a real-life clip.
  // The hey-sam variant pulls a real-people redgifs clip.
  const fetchOne = useCallback(async (auto: boolean, forced?: PopupVariant) => {
    if (loading) return
    if (auto && document.hidden) return
    setLoading(true)
    try {
      const variant: PopupVariant = forced
        ? forced
        : (popCounter.current % 2 === 0 ? 'hentai' : 'heysam')
      popCounter.current += 1

      if (variant === 'hentai') {
        const cat = HENTAI_IMAGE_CATS[Math.floor(Math.random() * HENTAI_IMAGE_CATS.length)]
        const r = await fetch(`/api/gallery/random?cat=${cat}`)
        if (!r.ok) return
        const j = await r.json()
        if (!j?.url) return
        setActive({ variant, imageUrl: j.url })
      } else {
        const cat = HEYSAM_CATS[Math.floor(Math.random() * HEYSAM_CATS.length)]
        const r = await fetch(`/api/gif/random?cat=${cat}`)
        if (!r.ok) return
        const j = await r.json()
        if (!j?.hd && !j?.sd) return
        const message = HEY_SAM_MESSAGES[Math.floor(Math.random() * HEY_SAM_MESSAGES.length)]
        setActive({ variant, gif: j, message })
      }

      if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
      if (auto) dismissTimer.current = window.setTimeout(close, AUTO_DISMISS)
    } catch {} finally {
      setLoading(false)
    }
  }, [close, loading])

  // Scheduling loop for AUTO popups only
  useEffect(() => {
    if (!enabled || !autoEnabled) return
    let cancelled = false
    if (!active) {
      const delay = INITIAL_GRACE + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY))
      scheduleTimer.current = window.setTimeout(() => {
        if (!cancelled) fetchOne(true)
      }, delay)
    }
    return () => {
      cancelled = true
      if (scheduleTimer.current) window.clearTimeout(scheduleTimer.current)
    }
  }, [enabled, autoEnabled, active, fetchOne])

  // Persist mute toggle
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, autoEnabled ? '1' : '0') } catch {}
  }, [autoEnabled])

  const cancelAutoDismiss = () => { if (dismissTimer.current) window.clearTimeout(dismissTimer.current) }
  const restartAutoDismiss = () => {
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    dismissTimer.current = window.setTimeout(close, AUTO_DISMISS)
  }

  return (
    <>
      {/* Floating action stack — instant popup on tap, mute toggle below.
          The two side buttons let the user manually trigger either flavor. */}
      <div className="fixed z-40 bottom-20 md:bottom-6 right-4 flex flex-col items-center gap-2">
        <button
          onClick={() => fetchOne(false, 'hentai')}
          disabled={loading}
          title="Drop a random hentai gif"
          aria-label="Drop a random hentai gif"
          className="group relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-pink-300/50 text-white bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 hover:scale-110 active:scale-95 transition animate-pulse-soft disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6 fill-white/30" />}
          <span className="absolute -bottom-6 right-0 text-[9px] font-bold tracking-widest uppercase text-pink-300 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition">
            DROP A GIF
          </span>
        </button>
        <button
          onClick={() => fetchOne(false, 'heysam')}
          disabled={loading}
          title="A naughty whisper from someone real"
          aria-label="A naughty whisper from someone real"
          className="group relative w-11 h-11 rounded-full flex items-center justify-center shadow-xl border border-rose-300/50 text-white bg-gradient-to-br from-rose-500 to-fuchsia-600 hover:scale-110 active:scale-95 transition disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5 fill-white/40" />}
        </button>
        <button
          onClick={() => setAutoEnabled(v => !v)}
          title={autoEnabled ? 'Mute auto pop-ups' : 'Resume auto pop-ups'}
          aria-label={autoEnabled ? 'Mute auto pop-ups' : 'Resume auto pop-ups'}
          className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-lg transition ${
            autoEnabled
              ? 'bg-black/70 border-white/20 text-pink-300 hover:bg-black/90'
              : 'bg-pink-500/10 border-pink-400/30 text-xgrab-gray hover:text-white'
          }`}
        >
          {autoEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      </div>

      {active && (
        <div
          className={`fixed z-[90] bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-24 md:w-72 ${closing ? 'animate-pop-out' : 'animate-pop-in'}`}
          onMouseEnter={cancelAutoDismiss}
          onMouseLeave={restartAutoDismiss}
        >
          <div className={`relative rounded-2xl overflow-hidden border bg-black shadow-[0_0_50px_rgba(236,72,153,0.5)] ${
            active.variant === 'heysam' ? 'border-fuchsia-400/60' : 'border-pink-400/50'
          }`}>
            {active.variant === 'hentai' && active.imageUrl ? (
              <img
                src={active.imageUrl}
                alt=""
                className="w-full max-h-[60vh] object-cover bg-black"
              />
            ) : active.gif ? (
              <video
                src={active.gif.sd || active.gif.hd}
                poster={active.gif.poster}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full max-h-[60vh] object-cover bg-black"
                onCanPlay={(e) => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}) }}
              />
            ) : null}
            <button
              onClick={close}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top-left badge — flavor depends on variant */}
            {active.variant === 'hentai' ? (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pink-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                <Heart className="w-3 h-3 fill-white" /> SURPRISE
              </div>
            ) : (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-fuchsia-500/95 text-white text-[10px] font-bold flex items-center gap-1">
                <Heart className="w-3 h-3 fill-white" /> NEW MSG
              </div>
            )}

            {/* "Hey sam…" message overlay — sits over the gif so it reads
                like a notification from someone real. */}
            {active.variant === 'heysam' && active.message && (
              <div className="absolute top-10 left-2 right-2 max-w-[90%]">
                <div className="rounded-2xl rounded-tl-sm bg-fuchsia-600/95 backdrop-blur-sm text-white px-3 py-2 shadow-2xl border border-fuchsia-300/30">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-100/80 mb-0.5">
                    Anonymous · just now
                  </p>
                  <p className="text-sm font-semibold leading-snug">{active.message}</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/85 to-transparent text-white text-xs flex items-center justify-between">
              <span>
                {active.variant === 'hentai' ? 'Random hentai drop' : 'Someone wants you'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setAutoEnabled(false); close() }}
                className="text-pink-300 hover:text-white text-[10px] underline-offset-2 hover:underline"
              >
                stop these
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
