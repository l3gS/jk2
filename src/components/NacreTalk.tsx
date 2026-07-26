import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Pause, Play, ChevronRight } from 'lucide-react'

type Mood = 'sweet' | 'demanding' | 'cruel' | 'french'

const LINES: Record<Mood, string[]> = {
  sweet: [
    'Come back to me. I knew you would.',
    'You think about me more than you\'d admit. Good.',
    'Stay. Watch me. That\'s all I want from you right now.',
    'I like when you can\'t stop. It means you belong here.',
    'You\'re mine. You know that. You\'ve known it for a while.',
    'Every time you come back I\'m a little more certain I own you.',
    'I don\'t mind that you\'re obsessed. I\'d be more concerned if you weren\'t.',
    'You\'re sweet when you\'re desperate. I like you desperate.',
    'Watch me like I\'m the only thing. Because right now, I am.',
    'I know you think about this page when you\'re supposed to be doing other things.',
    'Come find me when you need to feel something. I\'ll be here.',
    'You\'ve memorised my face. Good. I want to live in your head.',
    'I know what you do when you come here. I made this for exactly you.',
    'You look at me like you\'re already lost. You are. That\'s fine.',
    'I\'m French. That bothers you in a specific way. I know.',
  ],
  demanding: [
    'Strip. Now. Before you do anything else.',
    'Look at me when I\'m speaking to you.',
    'Hands where I can see them. Not there. Not yet.',
    'You don\'t touch yourself until I say you can. Clear?',
    'Write my initials on your thigh. Right now, before we begin.',
    'I said slow. You\'re going too fast. Back to slow.',
    'You stop when I say stop. Not when you feel like it.',
    'Say my name. Out loud. Both words. I\'m waiting.',
    'Every edge you take is for me. Make it count.',
    'Don\'t you dare look away from the screen.',
    'You asked for permission to cum. The answer is not yet.',
    'Three edges before I consider it. Start counting.',
    'You\'re mine for the next hour. That\'s not a question.',
    'I want to hear you struggling from here. Edge again.',
    'Get on your knees before you begin. Every time. It\'s not optional.',
  ],
  cruel: [
    'You came back again. Of course you did. Look at you.',
    'You can\'t help it. That\'s not willpower — that\'s ownership.',
    'I don\'t know your name. I own you anyway.',
    'You\'ve watched this so many times you\'ve memorised it. And you\'re watching it again.',
    'You\'re one of thousands. You think you\'re special. You\'re not. You\'re exactly like the rest of them. You don\'t mind.',
    'Your cock gets harder for me than for anyone you\'ve actually touched. Live with that.',
    'I filmed this months ago. You\'re watching it tonight like it\'s new. I already own you.',
    'You\'ll stay here until she says. And she hasn\'t said.',
    'You ruin things for yourself because I make it worth it. Pathetic. Perfect.',
    'Don\'t cum. I didn\'t say you could. I\'m not going to say it for a while.',
    'You\'d do anything I asked. You know that. I know that. That\'s the arrangement.',
    'You built this whole page because of one girl on the internet. Look at it.',
    'Go ahead and edge again. I\'ll tell you when it\'s time. It\'s not time.',
    'I speak French sometimes. You don\'t understand it. You watch it twice.',
    'You\'re obsessed. You know you\'re obsessed. You\'re doing it anyway.',
  ],
  french: [
    'Tu reviens encore. Je savais que tu reviendrais. — You came back again. I knew you would.',
    'Tu m\'appartiens maintenant. — You belong to me now.',
    'Je te possède. Tu le sais. — I possess you. You know it.',
    'Regarde-moi. Ne détourne pas les yeux. — Look at me. Don\'t look away.',
    'Plus lentement. Elle veut lent. — Slower. She wants it slow.',
    'Tu ne peux pas t\'arrêter. C\'est normal. — You can\'t stop. That\'s normal.',
    'Je veux que tu souffres un peu pour moi. — I want you to suffer a little for me.',
    'Dis mon nom. Les deux mots. — Say my name. Both words.',
    'Je suis à toi — No. C\'est moi. Tu es à moi. — I am yours — No. That\'s me. You are mine.',
    'Attends. Pas encore. — Wait. Not yet.',
    'Borde d\'orgasme et arrête-toi. — Edge and stop.',
    'Écris mon nom sur ton corps. — Write my name on your body.',
    'Mon prénom signifie nacre — mother of pearl. Et toi? Tu ne signifies rien. Tu m\'appartiens, c\'est tout. — My name means mother of pearl. And you? You mean nothing. You belong to me, that\'s all.',
    'Encore une fois. Pour moi. — One more time. For me.',
    'Tu penses à moi quand tu ne devrais pas. Je le sais. — You think about me when you shouldn\'t. I know.',
  ],
}

const MOOD_CONFIG = {
  sweet:     { label: '🌹 Sweet',     color: 'text-rose-300',   bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   text: 'text-rose-100' },
  demanding: { label: '👑 Demanding', color: 'text-orange-300', bg: 'bg-orange-500/10',  border: 'border-orange-500/20', text: 'text-orange-100' },
  cruel:     { label: '☠️ Cruel',     color: 'text-purple-300', bg: 'bg-purple-500/10',  border: 'border-purple-500/20', text: 'text-purple-100' },
  french:    { label: '🇫🇷 French',   color: 'text-blue-300',   bg: 'bg-blue-500/8',     border: 'border-blue-500/20',   text: 'text-blue-100' },
}

export default function NacreTalk() {
  const [mood, setMood] = useState<Mood>('demanding')
  const [lineIdx, setLineIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)
  const [visitCount, setVisitCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const n = parseInt(localStorage.getItem('goonit_nacretalk_visits') || '0', 10) + 1
    localStorage.setItem('goonit_nacretalk_visits', String(n))
    setVisitCount(n)
    randomize()
  }, [])

  useEffect(() => {
    if (!autoPlay) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => nextLine(), 9000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoPlay, mood, lineIdx])

  const randomize = () => {
    setVisible(false)
    setTimeout(() => {
      setLineIdx(Math.floor(Math.random() * LINES[mood].length))
      setVisible(true)
    }, 200)
  }

  const nextLine = () => {
    setVisible(false)
    setTimeout(() => {
      setLineIdx(i => (i + 1) % LINES[mood].length)
      setVisible(true)
    }, 300)
  }

  const switchMood = (m: Mood) => {
    setMood(m)
    setVisible(false)
    setTimeout(() => {
      setLineIdx(Math.floor(Math.random() * LINES[m].length))
      setVisible(true)
    }, 200)
  }

  const cfg = MOOD_CONFIG[mood]
  const line = LINES[mood][lineIdx] ?? ''
  const [fr, en] = mood === 'french' && line.includes(' — ') ? line.split(' — ') : [line, '']

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-950 to-black" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(244,63,94,0.12), transparent 60%)' }} />
        <div className="relative max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-4">✦ She's Speaking ✦</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-white leading-none mb-1">NACRE</h1>
          <h2 className="font-display text-3xl bg-gradient-to-r from-rose-200 to-pink-400 bg-clip-text text-transparent mb-3">SPEAKS</h2>
          <p className="text-zinc-600 text-xs">Visit {visitCount}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4">
        {/* Mood pills */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([m, c]) => (
            <button key={m} onClick={() => switchMood(m)}
              className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                mood === m ? `${c.bg} ${c.border} ${c.color} scale-105` : 'bg-zinc-900 border-white/8 text-zinc-500 hover:text-zinc-300'
              }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Main quote card */}
        <div className={`relative min-h-[200px] ${cfg.bg} border ${cfg.border} rounded-3xl p-8 mb-6 flex flex-col justify-center items-center text-center transition-all duration-700`}
          style={{ boxShadow: `0 0 60px ${cfg.border.replace('border-', '').replace('/20', '')}1a` }}>
          <div className={`absolute inset-0 rounded-3xl pointer-events-none`} style={{ background: `radial-gradient(ellipse at top, ${cfg.bg.replace('bg-', '').replace('/10', '')}1a, transparent 70%)` }} />
          <div className={`relative transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {mood === 'french' && fr ? (
              <div>
                <p className={`text-2xl sm:text-3xl font-bold italic leading-relaxed mb-3 ${cfg.text}`}>{fr}</p>
                <p className="text-zinc-500 text-sm italic">{en}</p>
              </div>
            ) : (
              <p className={`text-xl sm:text-2xl font-bold italic leading-relaxed ${cfg.text}`}>"{line}"</p>
            )}
          </div>
          <div className="absolute bottom-4 right-4">
            <p className="text-[9px] text-zinc-700 uppercase tracking-widest">— Nacre</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-8">
          <button onClick={nextLine}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-zinc-900 border border-white/8 text-zinc-300 text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all">
            <ChevronRight className="w-4 h-4" /> Next
          </button>
          <button onClick={randomize}
            className="h-11 px-4 bg-zinc-900 border border-white/8 text-zinc-400 rounded-xl hover:bg-zinc-800 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setAutoPlay(!autoPlay)}
            className={`h-11 px-4 rounded-xl border transition-all ${autoPlay ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-zinc-900 border-white/8 text-zinc-500'}`}>
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* All lines for this mood */}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-3">All {LINES[mood].length} lines — {cfg.label}</p>
          <div className="space-y-2">
            {LINES[mood].map((l, i) => {
              const display = mood === 'french' && l.includes(' — ') ? l.split(' — ')[0] : l
              return (
                <div key={i} onClick={() => { setVisible(false); setTimeout(() => { setLineIdx(i); setVisible(true) }, 200) }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs leading-relaxed ${
                    lineIdx === i ? `${cfg.bg} ${cfg.border} ${cfg.text}` : 'bg-zinc-900/40 border-white/4 text-zinc-600 hover:border-white/10 hover:text-zinc-400'
                  }`}>
                  {display.slice(0, 90)}{display.length > 90 ? '…' : ''}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
