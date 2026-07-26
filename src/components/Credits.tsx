import { Heart, Star, Sparkles, Music, Code2, Eye } from 'lucide-react'

const PINK = '#FF79C6'
const PINK_DIM = 'rgba(255,121,198,0.14)'
const PINK_BORDER = 'rgba(255,121,198,0.25)'
const PINK_TEXT = 'rgba(255,200,235,0.9)'

const KINKS = [
  { emoji: '🦶', label: 'Feet & Soles', desc: 'The arch, the sole, the perfect painted toes — pure bliss.' },
  { emoji: '🩲', label: 'Panties', desc: 'Lacy, silky, barely-there. The anticipation is everything.' },
  { emoji: '💦', label: 'Creampies & Squirting', desc: 'Messy finishes, wet scenes — Creamy Spot has his heart.' },
  { emoji: '🌸', label: 'Hentai & Anime', desc: 'Drawn perfection. Waifu culture at its finest.' },
  { emoji: '🎀', label: 'E-Girls / Egirl Aesthetic', desc: 'Pink hair, thigh-highs, gamer girl energy. Belle Delphine energy.' },
  { emoji: '👑', label: 'Dominant Women / JOI', desc: 'Being told what to do. Nacre owns this page.' },
  { emoji: '🌹', label: 'Voyeurism / POV', desc: 'First-person immersion. Like you\'re actually there.' },
  { emoji: '📸', label: 'Amateur / Authentic', desc: 'Real people, real moments. No scripts, all heat.' },
]

const FAVES = [
  { name: 'Creamy Spot', handle: '@creamy-spot', emoji: '💦', note: 'The one and only. Spanish queen of creampies.' },
  { name: 'Belle Delphine', handle: '@MaryBelleKirschner', emoji: '🎀', note: 'The original e-girl. Unmatched aesthetic.' },
  { name: 'Sweetie Fox', handle: '@sweetiefox_of', emoji: '🦊', note: 'Petite, playful, absolutely irresistible.' },
  { name: 'Katiana Kay', handle: '@katianakay', emoji: '🍑', note: 'Perfect curves, incredible energy.' },
  { name: 'Luna Pearl', handle: '@lunapearl_xxx', emoji: '🌙', note: 'Mysterious and mesmerizing. Dream girl vibes.' },
]

export default function Credits() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#000' }}>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ borderBottom: `1px solid ${PINK_BORDER}` }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,121,198,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[10px] font-black tracking-widest uppercase"
            style={{ background: PINK_DIM, border: `1px solid ${PINK_BORDER}`, color: PINK_TEXT }}>
            <Sparkles size={10} /> Made with depravity
          </div>
          <h1 className="font-black text-5xl sm:text-6xl text-white mb-3 tracking-tight">
            Nacre's<span style={{ color: PINK }}> Hub</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            A private, personal hub built by one man for one purpose.
          </p>

          {/* Creator card */}
          <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${PINK_BORDER}`, backdropFilter: 'blur(20px)' }}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0"
              style={{ border: `2px solid ${PINK_BORDER}`, boxShadow: `0 0 24px ${PINK_DIM}` }}>
              <img src="/sam-pfp.jpg" alt="Samuel"
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.parentElement!).textContent = '😈' }} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Samuel</h2>
              <p className="text-sm mt-0.5" style={{ color: PINK_TEXT }}>Creator · Curator · Connoisseur</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {[
                { icon: Code2, label: 'Built the hub' },
                { icon: Eye,   label: 'Watched everything' },
                { icon: Heart, label: 'Obsessed' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                  <Icon size={11} style={{ color: PINK }} /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Kinks section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: PINK }} />
            <h2 className="font-black text-sm tracking-widest uppercase text-white">Samuel's Kink Profile</h2>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-auto"
              style={{ background: PINK_DIM, color: PINK_TEXT, border: `1px solid ${PINK_BORDER}` }}>18+</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {KINKS.map((k) => (
              <div key={k.label}
                className="flex gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-2xl shrink-0 leading-none mt-0.5">{k.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-white leading-tight">{k.label}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faves section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: PINK }} />
            <h2 className="font-black text-sm tracking-widest uppercase text-white">Hall of Worship</h2>
          </div>
          <div className="space-y-2.5">
            {FAVES.map((f, i) => (
              <div key={f.name}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}>
                  {f.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm">{f.name}</p>
                    {i === 0 && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: PINK_DIM, color: PINK_TEXT, border: `1px solid ${PINK_BORDER}` }}>
                        #1 FAV
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{f.note}</p>
                </div>
                <Star size={12} style={{ color: i === 0 ? PINK : 'rgba(255,255,255,0.12)', flexShrink: 0 }}
                  className={i === 0 ? 'fill-current' : ''} />
              </div>
            ))}
          </div>
        </div>

        {/* Built with section */}
        <div className="rounded-2xl p-5"
          style={{ background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Music size={14} style={{ color: PINK }} />
            <h3 className="font-black text-sm text-white uppercase tracking-widest">About This Hub</h3>
          </div>
          <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <p>NacreHub is a fully private, custom-built adult entertainment hub crafted exclusively for Samuel's personal use. No ads, no tracking, no subscriptions.</p>
            <p>Powered by XVideos, PornHub, X/Twitter scrapers, Grok AI image generation, and a healthy dose of degeneracy.</p>
            <p className="font-bold" style={{ color: PINK_TEXT }}>Built by Samuel. For Samuel. Owned by Nacre. 💕</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { val: '20+', label: 'Pages' },
              { val: '6', label: 'Games' },
              { val: '∞', label: 'Content' },
            ].map(({ val, label }) => (
              <div key={label} className="py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <p className="font-black text-lg" style={{ color: PINK }}>{val}</p>
                <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Version tag */}
        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
          NacreHub v2.0 · Private Build · © 2025 Samuel · 18+ only
        </p>
      </div>
    </div>
  )
}
