import { useState, useEffect } from 'react'
import { Send, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface Confession {
  id: string
  text: string
  ts: number
  reactions: Record<string, number>
  mine?: boolean
}

const SEED: Omit<Confession, 'reactions'>[] = [
  { id: 's1',  ts: Date.now() - 900000,  text: 'I edged for 3 hours to Nacre Victoire before I was allowed to cum. My legs were shaking when I finally finished.' },
  { id: 's2',  ts: Date.now() - 1800000, text: 'I\'ve been gooning every single day for 3 weeks. I can barely think about anything else. I don\'t want to stop.' },
  { id: 's3',  ts: Date.now() - 2700000, text: 'I wrote her name on my inner thigh with a marker and kept it there all week at work. Nobody knew.' },
  { id: 's4',  ts: Date.now() - 3600000, text: 'Set a 4-hour denial timer. Failed after 90 minutes. Set it again immediately. Failed again. Did this 6 times.' },
  { id: 's5',  ts: Date.now() - 4500000, text: 'I paid for her OnlyFans, watched every single video in one sitting, then ruined my orgasm on purpose as punishment for cumming without permission.' },
  { id: 's6',  ts: Date.now() - 5400000, text: 'I use the Stroke Pacer on Machine mode and don\'t let myself stop until I\'m begging. Then I edge and repeat. My record is 7 times before I gave in.' },
  { id: 's7',  ts: Date.now() - 7200000, text: 'I confess I have a dedicated playlist I\'ve been building for 2 years. 847 videos. Still growing. I call it the archive.' },
  { id: 's8',  ts: Date.now() - 10800000, text: 'Anytime I hit an edge I have to say out loud what I am. Helps me stay in the zone and makes denial so much harder.' },
  { id: 's9',  ts: Date.now() - 14400000, text: 'I ruined on purpose for the first time last month. Never going back to regular. The frustration after is indescribably good.' },
  { id: 's10', ts: Date.now() - 21600000, text: 'I took a 7-day denial challenge. Day 4 was the hardest. Finished on day 8 because I was too far gone to stop after just 7.' },
  { id: 's11', ts: Date.now() - 28800000, text: 'I have a Pavlovian response now. Just opening this site makes me hard before I\'ve even clicked anything.' },
  { id: 's12', ts: Date.now() - 43200000, text: 'I once edged 12 times before the final. Couldn\'t walk properly for about an hour. I wrote it in my notes app like a trophy.' },
  { id: 's13', ts: Date.now() - 72000000, text: 'I confess the Goon Corner video has been my background tab for so long I know every frame.' },
  { id: 's14', ts: Date.now() - 86400000, text: 'Every morning I spend 20 minutes here before I\'m allowed to get out of bed. It\'s become non-negotiable. It started my day perfectly.' },
  { id: 's15', ts: Date.now() - 172800000, text: 'I haven\'t cum without edging at least 5 times first in over a year. The idea of just going for it feels wrong now.' },
]

const REACTIONS = ['💦', '🔥', '😈', '👑', '🫠']

const STORAGE_KEY = 'goonit_confessions_v2'
const REACT_KEY   = 'goonit_confession_reactions_v2'

function load(): Confession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const mine: Confession[] = raw ? JSON.parse(raw) : []
    const reactRaw = localStorage.getItem(REACT_KEY)
    const reacts: Record<string, Record<string, number>> = reactRaw ? JSON.parse(reactRaw) : {}
    const seeded = SEED.map(s => ({
      ...s,
      reactions: reacts[s.id] ?? { '💦': 0, '🔥': 0, '😈': 0, '👑': 0, '🫠': 0 },
    }))
    return [...mine, ...seeded].sort((a, b) => b.ts - a.ts)
  } catch {
    return SEED.map(s => ({ ...s, reactions: { '💦': 0, '🔥': 0, '😈': 0, '👑': 0, '🫠': 0 } }))
  }
}

function saveUserConfessions(items: Confession[]) {
  const mine = items.filter(c => c.mine)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mine))
}

function saveReactions(items: Confession[]) {
  const map: Record<string, Record<string, number>> = {}
  items.forEach(c => { map[c.id] = c.reactions })
  localStorage.setItem(REACT_KEY, JSON.stringify(map))
}

function timeAgo(ts: number) {
  const d = (Date.now() - ts) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

export default function ConfessionWall() {
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [draft, setDraft] = useState('')
  const [sort, setSort] = useState<'new' | 'hot'>('new')
  const [myReacted, setMyReacted] = useState<Record<string, string>>({})

  useEffect(() => {
    setConfessions(load())
    try {
      const raw = localStorage.getItem('goonit_my_reacts_v2')
      if (raw) setMyReacted(JSON.parse(raw))
    } catch {}
  }, [])

  const submit = () => {
    const text = draft.trim()
    if (text.length < 10) { toast.error('Too short — confess properly'); return }
    if (text.length > 280) { toast.error('Max 280 characters'); return }
    const item: Confession = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text,
      ts: Date.now(),
      reactions: { '💦': 0, '🔥': 0, '😈': 0, '👑': 0, '🫠': 0 },
      mine: true,
    }
    const updated = [item, ...confessions]
    setConfessions(updated)
    saveUserConfessions(updated)
    setDraft('')
    toast.success('Confession received 🙈')
  }

  const react = (id: string, emoji: string) => {
    if (myReacted[id]) { toast('Already reacted', { duration: 1500 }); return }
    const updated = confessions.map(c => {
      if (c.id !== id) return c
      return { ...c, reactions: { ...c.reactions, [emoji]: (c.reactions[emoji] || 0) + 1 } }
    })
    setConfessions(updated)
    saveReactions(updated)
    const newReacted = { ...myReacted, [id]: emoji }
    setMyReacted(newReacted)
    localStorage.setItem('goonit_my_reacts_v2', JSON.stringify(newReacted))
  }

  const sorted = [...confessions].sort((a, b) => {
    if (sort === 'hot') {
      const aTotal = Object.values(a.reactions).reduce((s, v) => s + v, 0)
      const bTotal = Object.values(b.reactions).reduce((s, v) => s + v, 0)
      return bTotal - aTotal
    }
    return b.ts - a.ts
  })

  return (
    <div className="min-h-screen bg-black pt-2 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange-400" />
            <h1 className="text-lg font-black tracking-widest uppercase text-white">Confession Wall</h1>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-xs text-zinc-500">anonymous. no judgment. say what you actually did.</p>
        </div>

        {/* Submit */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Your confession</p>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Confess what you actually did. No holding back."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 resize-none focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-zinc-700">{draft.length}/280</span>
            <button
              onClick={submit}
              disabled={draft.trim().length < 10}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              Confess
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="flex gap-2 mb-4">
          {(['new', 'hot'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${sort === s ? 'bg-white/10 border-white/20 text-white' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
            >
              {s === 'new' ? '🕐 New' : '🔥 Hottest'}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-zinc-700 self-center">{confessions.length} confessions</span>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {sorted.map(c => {
            const totalReacts = Object.values(c.reactions).reduce((s, v) => s + v, 0)
            return (
              <div key={c.id} className={`bg-zinc-950 border rounded-xl p-4 ${c.mine ? 'border-orange-500/25' : 'border-zinc-800/70'}`}>
                {c.mine && (
                  <span className="text-[9px] font-bold text-orange-500/70 uppercase tracking-widest mb-1.5 block">you</span>
                )}
                <p className="text-sm text-zinc-200 leading-relaxed mb-3">{c.text}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1 flex-wrap">
                    {REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => react(c.id, emoji)}
                        className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-md border transition-all ${myReacted[c.id] === emoji ? 'bg-white/10 border-white/20' : 'border-zinc-800 hover:border-zinc-600'}`}
                      >
                        <span>{emoji}</span>
                        {(c.reactions[emoji] || 0) > 0 && (
                          <span className="text-[9px] text-zinc-400">{c.reactions[emoji]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-[9px] text-zinc-700">{timeAgo(c.ts)}</span>
                  {totalReacts > 0 && (
                    <span className="text-[9px] text-zinc-600">{totalReacts} reacts</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
