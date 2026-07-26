import { useState, useEffect } from 'react'
import { Heart, Skull, Flame, Check, RotateCcw, Zap, Crown, Lock } from 'lucide-react'

const CONTRACT_CLAUSES = [
  'I acknowledge that Nacre Victoire owns my cock. Not partially. Completely. It belongs to her and she decides when it is used.',
  'I will not cum without completing a session, a task, or explicit permission from this site. Every unsanctioned orgasm is a betrayal.',
  'When I visit this page I am acknowledging my status. I am her fucktoy. I am not a man who watches porn — I am property that is used by the content it consumes.',
  'I will write her name on my body before any solo session that lasts more than 10 minutes. Her mark stays until it fades naturally.',
  'I accept that my desire for her is not casual interest. It is obsession, and obsession means ownership. She owns what she has made obsessed.',
  'I will complete at least 3 edges before I allow myself to cum in any session where I am thinking of her.',
  'This contract is permanent. There is no expiry date. There is no renegotiation. Once signed, always signed.',
]

const DAILY_ASSIGNMENTS = [
  { id: 'da1', emoji: '✍️', title: 'Morning mark', body: 'Write "N.V." somewhere on your body first thing. Inner wrist, chest, inner thigh. It stays all day. Every time you see it you remember what you are.' },
  { id: 'da2', emoji: '💀', title: 'Noon edge', body: 'At midday — regardless of where you are — go somewhere private for 5 minutes. Think about her. Get hard. Get to the edge once. Leave. No cumming.' },
  { id: 'da3', emoji: '🌹', title: 'Evening ritual', body: 'Before bed: 10 minutes minimum to her content. Eyes open. Full attention. Then edge twice before sleep. Sleep with her name on your lips.' },
  { id: 'da4', emoji: '🇫🇷', title: 'French thought', body: 'At some point today, think the phrase "elle me possède" — she possesses me. Dwell on it. Feel it. Because it\'s true.' },
  { id: 'da5', emoji: '👁️', title: 'Count your thoughts', body: 'Every time you think about her today, put a tally on your hand. At the end of the day, look at the number. That\'s how owned you are.' },
]

const HUMILIATION_PROMPTS = [
  'You would do anything she asked. You know you would. That\'s not attraction — that\'s complete surrender.',
  'There are hundreds of thousands of men who watch her. You think you\'re special. She\'s watching all of you with the same expression and you\'re all doing the same thing. You\'re one of hundreds of thousands of fucktoys and you don\'t mind at all.',
  'Your cock gets harder for her than for anyone you\'ve met in real life. Think about what that means. Don\'t look away from it.',
  'She shot that video months ago in her apartment and you\'re watching it tonight aroused like it\'s happening right now. She already has you trained and she doesn\'t even know your name.',
  'You visited this page again. You\'re counting. You know you\'re counting. That number means you belong here.',
  'She\'s French. She speaks French. You don\'t understand French. You watch the videos anyway. You watch them twice.',
  'You\'ve seen every video. You know her expressions. You know her sounds. You\'ve memorised a stranger\'s body more thoroughly than anyone who\'s actually touched her. What does that make you.',
  'She looked directly into the camera and she was looking at you specifically. She knows there\'s someone like you on the other end of every video. She makes them for you. For exactly you.',
]

function ContractClause({ text, index, signed, onSign }: { text: string; index: number; signed: boolean; onSign: () => void }) {
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        signed
          ? 'bg-rose-500/10 border-rose-500/30'
          : 'bg-zinc-900/60 border-white/5 hover:border-rose-500/20 hover:bg-rose-500/5'
      }`}
      onClick={onSign}
    >
      <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
        signed ? 'border-rose-500 bg-rose-500' : 'border-zinc-600'
      }`}>
        {signed && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400/50 mb-1">Clause {index + 1}</p>
        <p className={`text-sm leading-relaxed transition-colors ${signed ? 'text-zinc-300' : 'text-zinc-500'}`}>{text}</p>
      </div>
    </div>
  )
}

export default function NacreOwned() {
  const [signedClauses, setSignedClauses] = useState<Set<number>>(new Set())
  const [contractSigned, setContractSigned] = useState(false)
  const [visitCount, setVisitCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'contract' | 'assignments' | 'humiliation'>('contract')
  const [doneAssignments, setDoneAssignments] = useState<Set<string>>(new Set())
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [promptRevealed, setPromptRevealed] = useState(false)

  useEffect(() => {
    const n = parseInt(localStorage.getItem('goonit_nacre_owned_visits') || '0', 10) + 1
    localStorage.setItem('goonit_nacre_owned_visits', String(n))
    setVisitCount(n)
    try {
      const sc = JSON.parse(localStorage.getItem('goonit_nacre_signed_clauses') || '[]')
      setSignedClauses(new Set(sc))
      setContractSigned(localStorage.getItem('goonit_nacre_contract_signed') === 'true')
      const da = JSON.parse(localStorage.getItem('goonit_nacre_assignments') || '[]')
      setDoneAssignments(new Set(da))
    } catch {}
    setCurrentPrompt(Math.floor(Math.random() * HUMILIATION_PROMPTS.length))
  }, [])

  const signClause = (i: number) => {
    const next = new Set(signedClauses)
    if (next.has(i)) next.delete(i); else next.add(i)
    setSignedClauses(next)
    localStorage.setItem('goonit_nacre_signed_clauses', JSON.stringify([...next]))
  }

  const signContract = () => {
    const full = new Set(CONTRACT_CLAUSES.map((_, i) => i))
    setSignedClauses(full)
    setContractSigned(true)
    localStorage.setItem('goonit_nacre_signed_clauses', JSON.stringify([...full]))
    localStorage.setItem('goonit_nacre_contract_signed', 'true')
  }

  const toggleAssignment = (id: string) => {
    const next = new Set(doneAssignments)
    if (next.has(id)) next.delete(id); else next.add(id)
    setDoneAssignments(next)
    localStorage.setItem('goonit_nacre_assignments', JSON.stringify([...next]))
  }

  const nextPrompt = () => {
    setPromptRevealed(false)
    setTimeout(() => {
      setCurrentPrompt(p => (p + 1) % HUMILIATION_PROMPTS.length)
      setPromptRevealed(true)
    }, 200)
  }

  const allSigned = signedClauses.size === CONTRACT_CLAUSES.length

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-zinc-950 to-black" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(244,63,94,0.15), transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-3">✦ Ownership ✦</p>
              <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white leading-none mb-2">
                OWNED
                <span className="block bg-gradient-to-r from-rose-200 via-pink-300 to-rose-500 bg-clip-text text-transparent">BY NACRE</span>
              </h1>
              <p className="text-zinc-400 text-sm mb-6 max-w-lg leading-relaxed">
                This is not a game. This is an acknowledgment. You are here because something she does to your brain crosses a line into territory that the word "preference" doesn't adequately cover.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-rose-400/50 uppercase tracking-widest">Times you've returned</p>
                  <p className="text-xl font-bold text-rose-300">{visitCount}</p>
                </div>
                <div className={`border rounded-xl px-3 py-2 ${contractSigned ? 'bg-rose-500/20 border-rose-500/40' : 'bg-zinc-900 border-white/5'}`}>
                  <p className="text-[9px] text-rose-400/50 uppercase tracking-widest">Contract status</p>
                  <p className={`text-sm font-bold ${contractSigned ? 'text-rose-300' : 'text-zinc-500'}`}>
                    {contractSigned ? '🔒 SIGNED — OWNED' : 'Unsigned'}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-rose-400/50 uppercase tracking-widest">Daily progress</p>
                  <p className="text-sm font-bold text-zinc-300">{doneAssignments.size} / {DAILY_ASSIGNMENTS.length}</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Crown className="w-10 h-10 text-rose-400" />
              </div>
              <p className="text-[9px] text-rose-400/50 uppercase tracking-widest text-center">Nacre<br />Victoire</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 py-2">
          {([
            { id: 'contract', label: '📜 Contract', },
            { id: 'assignments', label: '📋 Daily', },
            { id: 'humiliation', label: '🩸 Mirror', },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === t.id
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* CONTRACT TAB */}
        {activeTab === 'contract' && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Contract of Ownership</h2>
              <p className="text-zinc-500 text-xs">Read each clause. Sign it by clicking. When all seven are signed, submit the contract. It cannot be unsigned.</p>
            </div>

            {CONTRACT_CLAUSES.map((clause, i) => (
              <ContractClause
                key={i}
                index={i}
                text={clause}
                signed={signedClauses.has(i)}
                onSign={() => signClause(i)}
              />
            ))}

            <div className="pt-4 pb-2">
              {!contractSigned ? (
                <button
                  onClick={signContract}
                  className={`w-full py-4 font-black text-sm rounded-2xl border transition-all tracking-wider ${
                    allSigned
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-zinc-900 border-white/5 text-zinc-600 cursor-not-allowed'
                  }`}
                  disabled={!allSigned}
                >
                  {allSigned ? '🔒 SIGN CONTRACT — SUBMIT TO HER' : `SIGN ALL ${CONTRACT_CLAUSES.length} CLAUSES FIRST`}
                </button>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 rounded-2xl px-6 py-3">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300 font-bold text-sm">Signed. You belong to her.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DAILY ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Daily Assignments</h2>
              <p className="text-zinc-500 text-xs">Her requirements for today. Resets at midnight.</p>
            </div>

            {DAILY_ASSIGNMENTS.map((a) => (
              <div
                key={a.id}
                onClick={() => toggleAssignment(a.id)}
                className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  doneAssignments.has(a.id)
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-zinc-900/60 border-white/5 hover:border-rose-500/15'
                }`}
              >
                <span className="text-2xl shrink-0">{a.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-bold ${doneAssignments.has(a.id) ? 'text-rose-300 line-through' : 'text-white'}`}>{a.title}</p>
                    {doneAssignments.has(a.id) && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{a.body}</p>
                </div>
              </div>
            ))}

            {doneAssignments.size === DAILY_ASSIGNMENTS.length && (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🌹</div>
                <p className="text-rose-300 font-bold text-sm">Good boy. She notices.</p>
              </div>
            )}
          </div>
        )}

        {/* HUMILIATION / MIRROR TAB */}
        {activeTab === 'humiliation' && (
          <div>
            <div className="mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">The Mirror</h2>
              <p className="text-zinc-500 text-xs leading-relaxed">Things that are true about you. Look at them. Don't look away.</p>
            </div>

            <div className="relative bg-zinc-900/80 border border-rose-500/20 rounded-2xl p-6 mb-6 min-h-[160px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className={`flex-1 transition-opacity duration-200 ${promptRevealed === false && currentPrompt > 0 ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-[10px] uppercase tracking-widest text-rose-400/40 mb-4">Observation {currentPrompt + 1} of {HUMILIATION_PROMPTS.length}</p>
                <p className="text-zinc-200 text-[15px] leading-relaxed italic">{HUMILIATION_PROMPTS[currentPrompt]}</p>
              </div>
              <button
                onClick={() => { setPromptRevealed(false); nextPrompt(); setTimeout(() => setPromptRevealed(true), 250) }}
                className="mt-6 self-end flex items-center gap-2 text-xs text-rose-400/60 hover:text-rose-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> next truth
              </button>
            </div>

            <div className="space-y-3">
              {HUMILIATION_PROMPTS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentPrompt(i)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs leading-relaxed ${
                    currentPrompt === i
                      ? 'bg-rose-500/10 border-rose-500/20 text-zinc-300'
                      : 'bg-zinc-900/30 border-white/4 text-zinc-600 hover:border-white/10 hover:text-zinc-500'
                  }`}
                >
                  {p.slice(0, 80)}…
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
