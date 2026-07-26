import { useState, useEffect } from 'react'
import { RefreshCw, Check, Bookmark, BookmarkCheck, Flame, Skull, Zap } from 'lucide-react'

type Difficulty = 'nasty' | 'depraved' | 'destroy'
type Category = 'body' | 'edge' | 'humiliation' | 'ritual' | 'marking' | 'nacre' | 'denial' | 'punishment'

interface Assignment {
  id: string
  category: Category
  difficulty: Difficulty
  title: string
  body: string
  emoji: string
}

const ASSIGNMENTS: Assignment[] = [
  // BODY
  { id: 'b1', category: 'body', difficulty: 'nasty', emoji: '✍️', title: 'Mark your inner thigh', body: 'Write a word of your choice — "slut", "toy", "owned" — high on your inner thigh where no one sees it but you. It stays until it fades. You didn\'t put it there. She did.' },
  { id: 'b2', category: 'body', difficulty: 'depraved', emoji: '🖊️', title: 'Write her name on your cock', body: 'Write NACRE along the shaft. Permanent marker if you have it. She owns it. She should be written on it. Take a photo. Keep it.' },
  { id: 'b3', category: 'body', difficulty: 'nasty', emoji: '📸', title: 'Body photo assignment', body: 'Take a photo of whatever you wrote on your body today. Keep it in your camera roll. Every time you scroll past it you remember.' },
  { id: 'b4', category: 'body', difficulty: 'depraved', emoji: '✍️', title: 'Full chest inscription', body: 'Write "Nacre\'s fucktoy" across your chest with a marker. Make it large and clear. Wear it for the rest of the evening. It\'s who you are while you\'re in your home.' },
  { id: 'b5', category: 'body', difficulty: 'destroy', emoji: '🩸', title: 'Full body declaration', body: 'Three marks. Inner thigh: "hers". Chest: "N.V." Cock: "property". All three, before your session tonight. This is the complete set. Nothing left unmarked.' },

  // EDGE
  { id: 'e1', category: 'edge', difficulty: 'nasty', emoji: '💀', title: '5 edges before you cum', body: 'Tonight: five complete edges before you\'re allowed to cum. Each one right at the point of no return. Stop every time. You count. You don\'t rush them.' },
  { id: 'e2', category: 'edge', difficulty: 'depraved', emoji: '☠️', title: 'Ruin it three times', body: 'Three ruined orgasms before you get a real one. Each one right at the point of no return — let go, no stroking through it. Three times. Then you get to finish properly.' },
  { id: 'e3', category: 'edge', difficulty: 'nasty', emoji: '⏱️', title: '20-minute edge session', body: 'Twenty minutes. Continuous edging. Get close, back off, repeat. No cumming. At the twenty-minute mark, sit there for five minutes with your hands off before you decide whether to continue.' },
  { id: 'e4', category: 'edge', difficulty: 'destroy', emoji: '🔥', title: 'One hour. No finish.', body: 'Set a timer for sixty minutes. Edge as many times as you can — each time right to the absolute limit and stop. After sixty minutes: you earned one release. Not before.' },
  { id: 'e5', category: 'edge', difficulty: 'nasty', emoji: '💀', title: 'Say her name at each edge', body: 'Every single time you reach the edge and stop, say "Nacre" out loud before you resume. Every time. For the whole session. It gets harder to say correctly as you get more desperate. That\'s the point.' },

  // HUMILIATION
  { id: 'h1', category: 'humiliation', difficulty: 'nasty', emoji: '🪞', title: 'Say it to the mirror', body: 'Stand in front of the mirror. Say these words out loud: "I am a gooner. I am Nacre\'s fucktoy. I cannot stop coming back." Say it three times, looking at yourself, until you can say it without looking away.' },
  { id: 'h2', category: 'humiliation', difficulty: 'depraved', emoji: '🐕', title: 'Floor level', body: 'For the first five minutes of your session: get on the floor. On your knees or all fours. Stay there. You don\'t get to use the bed or the chair until you\'ve worshipped from the floor first.' },
  { id: 'h3', category: 'humiliation', difficulty: 'nasty', emoji: '📱', title: 'Count your Nacre thoughts', body: 'Every time you think about her today, make a tally mark somewhere on your body. At the end of the day: look at the number. That\'s your reality. That\'s how owned you are.' },
  { id: 'h4', category: 'humiliation', difficulty: 'depraved', emoji: '🗣️', title: 'Narrate your session', body: 'For at least ten minutes of your session, narrate out loud what you\'re doing and why. "I\'m stroking for Nacre. I can\'t stop. I\'ve come back seventeen times. She owns this." Say it like someone is listening. Because in the only way that matters, she is.' },
  { id: 'h5', category: 'humiliation', difficulty: 'destroy', emoji: '📝', title: 'Write your confession', body: 'Handwrite — actual pen and paper — one full page about what Nacre does to your brain. Be completely honest. Every embarrassing detail. Then keep it. Re-read it when you next visit this page.' },

  // RITUAL
  { id: 'r1', category: 'ritual', difficulty: 'nasty', emoji: '🌹', title: 'Say her name to begin and end', body: 'Every session involving her: start by saying "Nacre" and end by saying "Nacre." These are the brackets of your worship. The session doesn\'t count without both.' },
  { id: 'r2', category: 'ritual', difficulty: 'nasty', emoji: '🕯️', title: 'Dark room only', body: 'Tonight\'s session: phone screen only. All lights off. You and her content in the dark. No distractions. Full attention. Full presence.' },
  { id: 'r3', category: 'ritual', difficulty: 'depraved', emoji: '⏰', title: 'Midnight session', body: 'Your next session must happen after midnight. In the dark. When everyone else is asleep. This is the time that belongs to her. It always has been.' },
  { id: 'r4', category: 'ritual', difficulty: 'nasty', emoji: '🇫🇷', title: 'French submission', body: 'At some point during your session, say out loud in French: "Elle me possède" — she possesses me. "Je suis à toi" — I am yours. "Je ne peux pas m\'arrêter" — I can\'t stop. All three. In order.' },
  { id: 'r5', category: 'ritual', difficulty: 'destroy', emoji: '📖', title: 'Submit the contract', body: 'If you haven\'t signed Nacre\'s ownership contract yet, go to "Owned by Nacre" and complete it tonight. Every clause. All seven. This is not optional anymore.' },

  // MARKING
  { id: 'm1', category: 'marking', difficulty: 'nasty', emoji: '✍️', title: 'Morning mark', body: 'First thing tomorrow: write "N.V." somewhere on your body before you do anything else. Before coffee, before phone — mark first. It stays all day.' },
  { id: 'm2', category: 'marking', difficulty: 'depraved', emoji: '💋', title: 'Lip mark', body: 'Put lipstick or marker on your wrist — a kiss-mark shape. Hers. You kissed her hand this morning. Or she kissed yours. It means the same thing.' },
  { id: 'm3', category: 'marking', difficulty: 'nasty', emoji: '🔢', title: 'Edge tally', body: 'After your session tonight: write on your forearm how many times you edged to her today. Just the number. In ink. Leave it there. This is your score.' },
  { id: 'm4', category: 'marking', difficulty: 'destroy', emoji: '✍️', title: 'Complete ownership mark', body: 'Four body locations. Inner thigh: "hers". Stomach: "NV property". Wrist: edge count. Chest: "fucktoy". All four before tonight\'s session. This is the full claim.' },

  // NACRE-SPECIFIC
  { id: 'n1', category: 'nacre', difficulty: 'nasty', emoji: '🌹', title: 'Watch her full video twice', body: 'Pick any Nacre video. Watch it start to finish. Then immediately watch it again from the beginning. Both times: full attention, eyes open, don\'t skip any part. The second watch is when you really notice her.' },
  { id: 'n2', category: 'nacre', difficulty: 'depraved', emoji: '👀', title: 'Eye contact test', body: 'Find a video where she looks directly into the camera. Every time she makes direct eye contact: stop stroking. Keep looking back. Resume when she looks away. She controls your pace through the screen.' },
  { id: 'n3', category: 'nacre', difficulty: 'nasty', emoji: '🇫🇷', title: 'French video session', body: 'Find content where she speaks French. Watch the whole thing. You don\'t need to understand it. The sound of it gets into your brain. Watch it twice. You\'ll know what "je viens" means by the end.' },
  { id: 'n4', category: 'nacre', difficulty: 'destroy', emoji: '🌹', title: 'Full Nacre night', body: 'Tonight belongs entirely to her. Open the Nacre page. Do the JOI session. Do two of the tasks. Do the roulette. Say her name when you finally cum. The whole night. No other content.' },
  { id: 'n5', category: 'nacre', difficulty: 'depraved', emoji: '💋', title: 'Beg her out loud', body: 'Sometime during your session, speaking out loud to her: "Nacre — please let me cum. I\'ll do anything you want. You own me. Please." Say it like you mean it. You do mean it.' },

  // DENIAL
  { id: 'd1', category: 'denial', difficulty: 'nasty', emoji: '🚫', title: 'No finish tonight', body: 'Tonight: you are not allowed to cum. Edge as many times as you want. Build as high as you want. Then stop. Go to sleep in that state. Tomorrow you remember why you denied yourself.' },
  { id: 'd2', category: 'denial', difficulty: 'depraved', emoji: '⏰', title: '48-hour lock', body: 'No cumming for 48 hours starting now. Edging is permitted — encouraged. But no finish. After 48 hours: one session, full permission, everything you\'ve built.' },
  { id: 'd3', category: 'denial', difficulty: 'nasty', emoji: '💀', title: 'Ruin and deny', body: 'Tonight: one ruined orgasm. That\'s all you get. Not a real one — the unsatisfying trickle that leaves you desperate. Then it\'s over. Sleep in the frustration.' },
  { id: 'd4', category: 'denial', difficulty: 'destroy', emoji: '☠️', title: 'One week, edges only', body: 'Seven days. Daily edging sessions — minimum 3 edges per day to her content. No cumming until day seven. On day seven: do the full JOI session and cum at the end. This is your week.' },

  // PUNISHMENT
  { id: 'p1', category: 'punishment', difficulty: 'nasty', emoji: '🔄', title: 'Start over', body: 'If you came without permission at any point in the last session — start the next one from scratch. Full JOI session. Full tasks. Three edges before anything else. Earn it back.' },
  { id: 'p2', category: 'punishment', difficulty: 'depraved', emoji: '😤', title: 'Ruined as punishment', body: 'You broke a rule. Your next orgasm is ruined. Get right to the edge, let it dribble out, nothing satisfying, hands completely off as it happens. Then you wait 24 hours for the real thing.' },
  { id: 'p3', category: 'punishment', difficulty: 'destroy', emoji: '📝', title: 'Write it 100 times', body: 'Handwrite this sentence 100 times: "I follow her rules. I only cum with permission." Real paper, real pen, 100 times. Then go back and read the whole page before your next session.' },
]

const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: 'body',       label: 'Body',        emoji: '✍️', color: 'text-blue-300' },
  { id: 'edge',       label: 'Edges',       emoji: '💀', color: 'text-red-300' },
  { id: 'humiliation',label: 'Humiliation', emoji: '🪞', color: 'text-orange-300' },
  { id: 'ritual',     label: 'Ritual',      emoji: '🕯️', color: 'text-purple-300' },
  { id: 'marking',    label: 'Marking',     emoji: '🖊️', color: 'text-pink-300' },
  { id: 'nacre',      label: '🌹 Nacre',    emoji: '🌹', color: 'text-rose-300' },
  { id: 'denial',     label: 'Denial',      emoji: '🚫', color: 'text-yellow-300' },
  { id: 'punishment', label: 'Punishment',  emoji: '😤', color: 'text-zinc-300' },
]

const DIFF_CONFIG = {
  nasty:    { label: 'Nasty',    color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🔥' },
  depraved: { label: 'Depraved', color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: '☠️' },
  destroy:  { label: 'Destroy',  color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '💀' },
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function FilthGenerator() {
  const [current, setCurrent] = useState<Assignment | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [activeDiff, setActiveDiff] = useState<Difficulty | 'all'>('all')
  const [mode, setMode] = useState<'daily' | 'random'>('daily')
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      setSaved(new Set(JSON.parse(localStorage.getItem('goonit_filth_saved') || '[]')))
      setCompleted(new Set(JSON.parse(localStorage.getItem('goonit_filth_done') || '[]')))
    } catch {}
    generateDaily()
  }, [])

  const pool = () => ASSIGNMENTS.filter(a =>
    (activeCategory === 'all' || a.category === activeCategory) &&
    (activeDiff === 'all' || a.difficulty === activeDiff)
  )

  const generateDaily = () => {
    const key = `goonit_daily_filth_${todayKey()}`
    const cached = localStorage.getItem(key)
    if (cached) {
      const found = ASSIGNMENTS.find(a => a.id === cached)
      if (found) { setCurrent(found); return }
    }
    const p = ASSIGNMENTS.filter(a => a.difficulty !== 'destroy')
    const pick = p[Math.floor(Math.random() * p.length)]
    localStorage.setItem(key, pick.id)
    setCurrent(pick)
  }

  const generateRandom = () => {
    const p = pool()
    if (!p.length) return
    const others = current ? p.filter(a => a.id !== current.id) : p
    const pick = (others.length > 0 ? others : p)[Math.floor(Math.random() * (others.length > 0 ? others.length : p.length))]
    setCurrent(pick)
    setDone(false)
  }

  const toggleSave = () => {
    if (!current) return
    const next = new Set(saved)
    if (next.has(current.id)) next.delete(current.id)
    else next.add(current.id)
    setSaved(next)
    localStorage.setItem('goonit_filth_saved', JSON.stringify([...next]))
  }

  const markDone = () => {
    if (!current) return
    const next = new Set(completed)
    next.add(current.id)
    setCompleted(next)
    localStorage.setItem('goonit_filth_done', JSON.stringify([...next]))
    setDone(true)
  }

  const isSaved = current ? saved.has(current.id) : false
  const isDone = current ? completed.has(current.id) || done : false
  const diff = current ? DIFF_CONFIG[current.difficulty] : null

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/60 via-zinc-950 to-black" />
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-2">✦ Daily Filth ✦</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-white mb-1">FILTH</h1>
          <h2 className="font-display text-2xl bg-gradient-to-r from-rose-200 to-pink-400 bg-clip-text text-transparent mb-4">GENERATOR</h2>
          <p className="text-zinc-500 text-xs">Random extreme assignments. Kink tasks. Body work. Nacre featured.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          {(['daily', 'random'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); if (m === 'daily') generateDaily(); else generateRandom() }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all capitalize ${
                mode === m ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}>
              {m === 'daily' ? '📅 Daily' : '🎲 Random'}
            </button>
          ))}
        </div>

        {/* Filters (random mode only) */}
        {mode === 'random' && (
          <div className="space-y-3 mb-5">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCategory('all')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeCategory === 'all' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                All
              </button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setActiveCategory(c.id)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeCategory === c.id ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveDiff('all')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeDiff === 'all' ? 'bg-zinc-700 border-white/20 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                All levels
              </button>
              {(Object.entries(DIFF_CONFIG) as [Difficulty, typeof DIFF_CONFIG[Difficulty]][]).map(([id, cfg]) => (
                <button key={id} onClick={() => setActiveDiff(id)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${activeDiff === id ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main card */}
        {current && diff && (
          <div className={`rounded-2xl border ${diff.border} ${diff.bg} p-6 mb-4`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{current.emoji}</span>
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${diff.color}`}>{diff.icon} {diff.label} · {CATEGORIES.find(c => c.id === current.category)?.label}</p>
                  <h3 className="text-white font-bold text-base leading-tight mt-0.5">{current.title}</h3>
                </div>
              </div>
              <button onClick={toggleSave} className={`p-2 rounded-xl transition-all ${isSaved ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-zinc-600 hover:text-rose-400 bg-zinc-900 border border-white/5'}`}>
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-5">{current.body}</p>
            <button onClick={markDone}
              className={`w-full py-3 font-bold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 ${
                isDone ? 'bg-green-500/10 border-green-500/20 text-green-400' : `${diff.bg} ${diff.border} ${diff.color} hover:opacity-80`
              }`}>
              {isDone ? <><Check className="w-4 h-4" /> Done — she knows</> : 'Mark as done'}
            </button>
          </div>
        )}

        {/* Generate button */}
        <button onClick={mode === 'daily' ? generateDaily : generateRandom}
          className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/8 text-zinc-300 font-bold text-sm rounded-xl hover:bg-zinc-800 transition-all mb-6">
          <RefreshCw className="w-4 h-4" />
          {mode === 'daily' ? 'Re-roll daily (uses a slot)' : 'Generate another'}
        </button>

        {/* Saved assignments */}
        {saved.size > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Saved ({saved.size})</p>
            <div className="space-y-2">
              {ASSIGNMENTS.filter(a => saved.has(a.id)).map(a => {
                const d = DIFF_CONFIG[a.difficulty]
                return (
                  <div key={a.id} onClick={() => { setCurrent(a); setDone(false) }}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${current?.id === a.id ? `${d.bg} ${d.border}` : 'bg-zinc-900/50 border-white/4 hover:border-white/10'}`}>
                    <span className="text-lg">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{a.title}</p>
                      <p className={`text-[9px] ${d.color}`}>{d.icon} {d.label}</p>
                    </div>
                    {completed.has(a.id) && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
