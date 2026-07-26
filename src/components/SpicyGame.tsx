import { useState, useMemo, useEffect, useRef } from 'react'
import { Flame, X, Shuffle, Sparkles, ChevronRight, Heart, Zap, Send, Loader2, Gamepad2, Theater, MessageSquare, Image as ImageIcon, RotateCcw, Pencil } from 'lucide-react'
import { sceneChat, getSceneImageUrl, type SceneMessage } from '../api'

type Heat = 'mild' | 'medium' | 'hot' | 'inferno'
type Mode = 'truth' | 'dare' | 'random'

interface Prompt {
  text: string
  heat: Heat
  type: 'truth' | 'dare'
}

const PROMPTS: Prompt[] = [
  // MILD — flirty
  { heat: 'mild', type: 'truth', text: "What's the most attractive thing someone has ever said to you?" },
  { heat: 'mild', type: 'truth', text: "Who was your first celebrity crush?" },
  { heat: 'mild', type: 'truth', text: "What's your go-to move to get someone's attention?" },
  { heat: 'mild', type: 'dare', text: "Send a flirty text to the last person you matched with." },
  { heat: 'mild', type: 'dare', text: "Show your partner the last spicy thing you saved." },
  { heat: 'mild', type: 'dare', text: "Compliment three things about your partner — out loud." },
  { heat: 'mild', type: 'truth', text: "What's the most romantic gesture you've ever made?" },
  { heat: 'mild', type: 'dare', text: "Slow dance with your partner to a song they pick." },

  // MEDIUM — flirtier
  { heat: 'medium', type: 'truth', text: "What's a fantasy you've never told anyone about?" },
  { heat: 'medium', type: 'truth', text: "Where's the wildest place you've ever made out?" },
  { heat: 'medium', type: 'truth', text: "What's something on your bucket list that's NSFW?" },
  { heat: 'medium', type: 'dare', text: "Take a flirty selfie and send it to your partner right now." },
  { heat: 'medium', type: 'dare', text: "Whisper your favorite memory of your partner in their ear." },
  { heat: 'medium', type: 'dare', text: "Re-create your favorite kiss from a movie." },
  { heat: 'medium', type: 'truth', text: "What's the sexiest outfit you own — and when do you wear it?" },
  { heat: 'medium', type: 'dare', text: "Give a 30-second back massage. No talking allowed." },

  // HOT — spicy
  { heat: 'hot', type: 'truth', text: "Describe the best night you've ever had — in detail." },
  { heat: 'hot', type: 'truth', text: "What's something you've always wanted to try in the bedroom?" },
  { heat: 'hot', type: 'dare', text: "Reveal the spiciest photo on your camera roll (you choose what to show)." },
  { heat: 'hot', type: 'dare', text: "Trade an item of clothing with your partner." },
  { heat: 'hot', type: 'dare', text: "Recreate your favorite move from a music video." },
  { heat: 'hot', type: 'truth', text: "What's the most adventurous place you'd love to be intimate?" },
  { heat: 'hot', type: 'dare', text: "Send a voice note saying the spiciest thing you can think of." },
  { heat: 'hot', type: 'dare', text: "Blindfold your partner for the next 60 seconds. Their move next." },

  // INFERNO — anything goes
  { heat: 'inferno', type: 'truth', text: "Confess your wildest fantasy — with full detail." },
  { heat: 'inferno', type: 'dare', text: "Strip one item of clothing and don't put it back on for the rest of the game." },
  { heat: 'inferno', type: 'truth', text: "What's the riskiest place you'd love to fool around?" },
  { heat: 'inferno', type: 'dare', text: "Whisper exactly what you'd want to do tonight — in graphic detail." },
  { heat: 'inferno', type: 'dare', text: "Re-enact your favorite scene from the spiciest movie you've watched." },
  { heat: 'inferno', type: 'truth', text: "What's the most you've ever spent on someone for a special night?" },
  { heat: 'inferno', type: 'dare', text: "Give your partner a 60-second lap dance — no music allowed." },
  { heat: 'inferno', type: 'truth', text: "Tell your partner the one thing you've been too shy to ask for." },
]

const HEAT_META: Record<Heat, { label: string; sub: string; color: string; ring: string; chipBg: string; flames: number }> = {
  mild:    { label: 'Mild',    sub: 'Sweet & flirty',     color: 'from-emerald-500 to-teal-500',    ring: 'ring-emerald-500/40', chipBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', flames: 1 },
  medium:  { label: 'Medium',  sub: 'A little daring',    color: 'from-amber-500 to-orange-500',    ring: 'ring-amber-500/40',   chipBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',       flames: 2 },
  hot:     { label: 'Hot',     sub: 'Bring the heat',     color: 'from-orange-500 to-pink-600',      ring: 'ring-pink-500/40',     chipBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30',             flames: 3 },
  inferno: { label: 'Inferno', sub: 'No rules. No mercy.', color: 'from-pink-600 via-pink-600 to-purple-700', ring: 'ring-pink-500/50', chipBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30',          flames: 4 },
}

interface ScenePreset {
  id: string
  title: string
  emoji: string
  scene: string
  character: string
  imagePrompt: string
  starter: string
  heat: Heat
}

const SCENES: ScenePreset[] = [
  {
    id: 'bar',
    title: 'Stranger at the Bar',
    emoji: '🍸',
    heat: 'medium',
    scene: 'A dimly lit upscale cocktail bar late at night. Warm amber lighting, jazz playing softly. The user just sat down on the stool next to you.',
    character: 'You are Alex, a confident, smoldering stranger sipping a whiskey neat. Mysterious, witty, with a slow burning gaze.',
    imagePrompt: 'cinematic photo of a stunning person at a dimly lit upscale cocktail bar at night, amber neon lighting, glass of whiskey, sultry atmosphere, film still',
    starter: "*I glance over the rim of my glass as you slide onto the stool next to me, a slow smile spreading across my lips.* Well… you have excellent taste in seats. Buy you something to wash down whatever brought you in here tonight?",
  },
  {
    id: 'firstdate',
    title: 'First Date Sparks',
    emoji: '💋',
    heat: 'mild',
    scene: 'A candlelit Italian restaurant on a first date that has gone surprisingly well. Wine bottle half-empty, dessert plates pushed aside, eyes locked across the table.',
    character: 'You are Jamie, charming and a little nervous in the best way. You laugh easily and have been stealing glances at the user all night.',
    imagePrompt: 'romantic candlelit Italian restaurant first date, wine, soft warm lighting, intimate close-up, cinematic, film still',
    starter: "*I twirl the stem of my wine glass and tilt my head, a soft laugh escaping me.* Okay — confession time. I told my friend this date would be 'casual.' But I can't stop looking at you. What do we do about that?",
  },
  {
    id: 'rooftop',
    title: 'Rooftop Confession',
    emoji: '🌃',
    heat: 'hot',
    scene: 'On a rooftop terrace overlooking the city skyline at midnight. You and the user have been dancing close all night and finally slipped away from the party.',
    character: 'You are Sage, bold and unfiltered. You finally have the user alone and you intend to make it count.',
    imagePrompt: 'rooftop terrace at midnight, city skyline lights, two silhouettes close together, romantic neon glow, cinematic photo, film still',
    starter: "*I lean against the railing, the city lights painting your face in gold.* I've been trying to behave myself all night. *I step closer, my voice dropping.* I think I'm done behaving. Tell me to stop — or don't.",
  },
  {
    id: 'office',
    title: 'After-Hours Office',
    emoji: '💼',
    heat: 'hot',
    scene: 'A high-rise corporate office at 9pm. Everyone has gone home. You and the user have been working late on the same project for weeks. Tonight the tension finally snaps.',
    character: 'You are Morgan, the user\'s sharp, devastatingly attractive coworker. You\'ve flirted in meetings for months and tonight you finally locked the conference room door.',
    imagePrompt: 'modern high-rise office at night, glass walls, city lights, dim desk lamp, two figures alone in the conference room, dramatic shadows, cinematic',
    starter: "*I close the laptop with a deliberate click and walk slowly around the table toward you.* So. We've been pretending this isn't happening for what — six months? *I stop right in front of your chair.* I'm done pretending. Are you?",
  },
  {
    id: 'beach',
    title: 'Midnight Beach',
    emoji: '🌊',
    heat: 'medium',
    scene: 'A deserted moonlit beach. Just the sound of waves. You and the user wandered down from a beach bonfire and ended up alone on the wet sand at the water\'s edge.',
    character: 'You are Riley, playful and adventurous, soaking wet from a moonlight swim, grinning like trouble.',
    imagePrompt: 'deserted moonlit beach at night, ocean waves, two silhouettes on wet sand, glowing moonlight on water, cinematic atmospheric photo',
    starter: "*I emerge from the surf, water running down my skin, and grin at you.* The water's warmer than you think. *I extend a hand.* Come in with me. I dare you.",
  },
  {
    id: 'hotel',
    title: 'Luxury Hotel Suite',
    emoji: '🥂',
    heat: 'inferno',
    scene: 'A penthouse suite, floor-to-ceiling windows showing the night skyline. Champagne on ice, silk sheets turned down. You and the user just walked through the door.',
    character: 'You are Eden, magnetic and unrestrained. You\'ve been waiting for this all week and you don\'t intend to waste a single second.',
    imagePrompt: 'luxury penthouse hotel suite at night, floor to ceiling windows, city skyline, champagne, silk sheets, golden warm lighting, cinematic, film still',
    starter: "*The door clicks shut behind us and I press my back against it, dragging my eyes slowly down and back up your body.* I've been thinking about this all week. *I pull you toward me by the front of your shirt.* Tell me everything you want — and I'll start at the top of the list.",
  },
  {
    id: 'ex',
    title: 'The Ex Comes Back',
    emoji: '🔥',
    heat: 'hot',
    scene: 'Late night, your apartment. There\'s a knock at the door. It\'s your ex — the one you swore was a mistake — standing in the rain, soaked.',
    character: 'You are Sam, the user\'s ex who never quite let go. You\'re standing in their doorway, dripping wet and out of excuses.',
    imagePrompt: 'rain-soaked person standing in apartment doorway at night, dramatic moody lighting, longing expression, cinematic film still',
    starter: "*I stand in your doorway dripping, hair plastered to my face, breathing hard.* I shouldn't be here. I know. *I take a step closer anyway.* But I couldn't stop thinking about the last time. Could you?",
  },
  {
    id: 'masseuse',
    title: 'The Private Massage',
    emoji: '🕯️',
    heat: 'inferno',
    scene: 'A private candle-lit spa room. Soft music, warm oils, steam in the air. The user is on the table and the door has just been locked.',
    character: 'You are Sky, a confident, devastatingly skilled private masseuse who has been told there are absolutely no rules tonight.',
    imagePrompt: 'private candle-lit spa massage room, warm golden glow, oils, towels, intimate atmosphere, cinematic photo, film still',
    starter: "*I dim the lights another notch and warm the oil between my palms before placing my hands gently on your back.* No clock tonight. No rules. *I lean in close to your ear, voice barely a whisper.* Tell me where you want me to start.",
  },
]

interface SpicyGameProps {
  open: boolean
  onClose: () => void
}

export default function SpicyGame({ open, onClose }: SpicyGameProps) {
  const [stage, setStage] = useState<'menu' | 'td-setup' | 'td-play' | 'scene-pick' | 'scene-play'>('menu')

  // ── Truth/Dare state ──
  const [heat, setHeat] = useState<Heat>('medium')
  const [tdMode, setTdMode] = useState<Mode>('random')
  const [current, setCurrent] = useState<Prompt | null>(null)
  const [seen, setSeen] = useState<string[]>([])
  const [spinning, setSpinning] = useState(false)

  // ── Scene state ──
  const [activeScene, setActiveScene] = useState<ScenePreset | null>(null)
  const [customScene, setCustomScene] = useState('')
  const [customCharacter, setCustomCharacter] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [sceneMsgs, setSceneMsgs] = useState<SceneMessage[]>([])
  const [sceneInput, setSceneInput] = useState('')
  const [sceneTyping, setSceneTyping] = useState(false)
  const [sceneImage, setSceneImage] = useState<string | null>(null)
  const [imageSeed, setImageSeed] = useState<number>(0)
  const sceneBottomRef = useRef<HTMLDivElement>(null)

  const pool = useMemo(() =>
    PROMPTS.filter(p => p.heat === heat && (tdMode === 'random' || p.type === tdMode)),
    [heat, tdMode]
  )

  useEffect(() => {
    sceneBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sceneMsgs, sceneTyping])

  const pickNext = () => {
    setSpinning(true)
    setTimeout(() => {
      let candidates = pool.filter(p => !seen.includes(p.text))
      if (candidates.length === 0) { candidates = pool; setSeen([]) }
      const next = candidates[Math.floor(Math.random() * candidates.length)]
      setCurrent(next); setSeen(s => [...s, next.text]); setSpinning(false)
    }, 600)
  }

  const startTD = () => { setStage('td-play'); setSeen([]); setCurrent(null); setTimeout(pickNext, 50) }

  const startScene = (preset: ScenePreset) => {
    setActiveScene(preset)
    setSceneMsgs([{ role: 'ai', content: preset.starter }])
    setSceneTyping(false)
    setSceneInput('')
    const seed = Math.floor(Math.random() * 99999)
    setImageSeed(seed)
    setSceneImage(getSceneImageUrl(preset.imagePrompt, seed))
    setStage('scene-play')
  }

  const startCustomScene = () => {
    if (!customScene.trim()) return
    const preset: ScenePreset = {
      id: 'custom',
      title: 'Your Custom Scene',
      emoji: '✨',
      heat: 'hot',
      scene: customScene,
      character: customCharacter || 'A magnetic, unrestrained partner who fits this scene perfectly.',
      imagePrompt: `cinematic photo, intimate atmosphere: ${customScene}`,
      starter: "*I look at you and a slow, knowing smile spreads across my lips.* So… here we are. *I take a step closer.* Tell me what you want first.",
    }
    startScene(preset)
  }

  const sendSceneMsg = async () => {
    const text = sceneInput.trim()
    if (!text || sceneTyping || !activeScene) return
    const next: SceneMessage[] = [...sceneMsgs, { role: 'user', content: text }]
    setSceneMsgs(next)
    setSceneInput('')
    setSceneTyping(true)
    try {
      const { reply } = await sceneChat({
        scene: activeScene.scene,
        character: activeScene.character,
        messages: next,
      })
      setSceneMsgs(m => [...m, { role: 'ai', content: reply }])
    } catch {
      setSceneMsgs(m => [...m, { role: 'ai', content: "*The connection flickers for a moment.* …say that again? I lost myself for a second." }])
    } finally {
      setSceneTyping(false)
    }
  }

  const regenSceneImage = () => {
    if (!activeScene) return
    const seed = Math.floor(Math.random() * 99999)
    setImageSeed(seed)
    setSceneImage(getSceneImageUrl(activeScene.imagePrompt, seed))
  }

  const resetAll = () => {
    setStage('menu')
    setCurrent(null)
    setSeen([])
    setActiveScene(null)
    setSceneMsgs([])
    setSceneInput('')
    setSceneImage(null)
    setCustomScene('')
    setCustomCharacter('')
    setCustomOpen(false)
  }

  if (!open) return null
  const meta = current ? HEAT_META[current.heat] : HEAT_META[heat]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl">
      <div className="relative w-full max-w-3xl max-h-[95vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black border border-pink-600/30 rounded-3xl shadow-2xl shadow-pink-900/30 overflow-hidden">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-pink-600/20 via-pink-600/20 to-purple-600/20 blur opacity-50 pointer-events-none -z-10" />

        <button
          onClick={() => { onClose(); setTimeout(resetAll, 200) }}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="h-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 flex-shrink-0" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 flex items-center gap-3 border-b border-white/5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-600 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-900/40">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl tracking-wider text-white leading-none">SPICY GAME</h2>
            <p className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">
              {stage === 'menu' && 'Pick your game'}
              {stage.startsWith('td') && 'Truth · Dare · Trouble'}
              {stage.startsWith('scene') && (activeScene ? `Scene · ${activeScene.title}` : 'AI Scene Play')}
            </p>
          </div>
          {stage !== 'menu' && (
            <button onClick={resetAll} className="text-[11px] text-zinc-500 hover:text-white tracking-widest uppercase transition-colors flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Menu
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── MENU ── */}
          {stage === 'menu' && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm mb-2">Pick how you want to play tonight.</p>

              <button
                onClick={() => setStage('td-setup')}
                className="w-full text-left p-5 rounded-2xl bg-gradient-to-br from-pink-600/15 to-pink-600/10 border border-pink-600/30 hover:border-pink-500/60 hover:from-pink-600/25 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-xl tracking-wide text-white">Truth or Dare</h3>
                      <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">CLASSIC</span>
                    </div>
                    <p className="text-sm text-zinc-400">30+ prompts across 4 heat levels. Play with a partner, friends, or solo.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={() => setStage('scene-pick')}
                className="w-full text-left p-5 rounded-2xl bg-gradient-to-br from-purple-600/15 to-pink-600/10 border border-purple-600/30 hover:border-pink-500/60 hover:from-purple-600/25 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Theater className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-xl tracking-wide text-white">AI Scene Play</h3>
                      <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">NEW</span>
                    </div>
                    <p className="text-sm text-zinc-400">Step into a steamy roleplay scene. Talk to an AI partner who stays fully in character — pick a preset or write your own.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <p className="mt-4 text-center text-[11px] text-zinc-600">
                Play with consenting adults. Skip anything that doesn't feel right.
              </p>
            </div>
          )}

          {/* ── TRUTH/DARE SETUP ── */}
          {stage === 'td-setup' && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">Choose your heat</p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(HEAT_META) as Heat[]).map(h => {
                    const m = HEAT_META[h]; const active = heat === h
                    return (
                      <button
                        key={h} onClick={() => setHeat(h)}
                        className={`p-4 rounded-2xl text-left border-2 transition-all ${active ? `border-transparent bg-gradient-to-br ${m.color} shadow-lg` : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: m.flames }).map((_, i) => (
                            <Flame key={i} className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-500'}`} />
                          ))}
                        </div>
                        <p className={`text-base font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{m.label}</p>
                        <p className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-zinc-500'}`}>{m.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-7">
                <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">Choose a mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'truth' as Mode, label: 'Truth', icon: Heart },
                    { id: 'dare' as Mode, label: 'Dare', icon: Zap },
                    { id: 'random' as Mode, label: 'Both', icon: Shuffle },
                  ]).map(({ id, label, icon: Icon }) => {
                    const active = tdMode === id
                    return (
                      <button
                        key={id} onClick={() => setTdMode(id)}
                        className={`h-12 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${active ? 'bg-white text-black border-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'}`}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={startTD}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold text-lg tracking-wider transition-all shadow-lg shadow-pink-900/40 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> START THE GAME
              </button>
            </>
          )}

          {/* ── TRUTH/DARE PLAY ── */}
          {stage === 'td-play' && (
            <>
              <div className={`relative rounded-3xl p-7 sm:p-9 border-2 border-transparent bg-gradient-to-br ${meta.color} ${spinning ? 'animate-pulse' : ''}`}>
                <div className="absolute inset-0 rounded-3xl bg-black/50" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <span className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase rounded-full border ${meta.chipBg}`}>{meta.label}</span>
                    {current && <span className="px-3 py-1 text-[11px] font-bold tracking-widest uppercase rounded-full bg-white/10 text-white border border-white/20">{current.type}</span>}
                  </div>
                  {spinning || !current ? (
                    <div className="py-12 flex flex-col items-center justify-center text-white/80">
                      <Flame className="w-10 h-10 animate-spin mb-3" />
                      <p className="text-sm tracking-widest uppercase">Picking your fate…</p>
                    </div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold text-white leading-snug min-h-[6rem]">{current.text}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button onClick={pickNext} disabled={spinning} className="h-12 rounded-xl bg-white text-black font-bold tracking-wide hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <Shuffle className="w-4 h-4" /> Skip
                </button>
                <button onClick={pickNext} disabled={spinning} className="h-12 rounded-xl bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold tracking-wide disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  Done — next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setStage('td-setup')} className="mt-3 w-full h-10 text-xs text-zinc-500 hover:text-white tracking-widest uppercase transition-colors">← Change heat or mode</button>
            </>
          )}

          {/* ── SCENE PICKER ── */}
          {stage === 'scene-pick' && (
            <>
              <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">Pick a scene</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {SCENES.map(s => {
                  const m = HEAT_META[s.heat]
                  return (
                    <button
                      key={s.id} onClick={() => startScene(s)}
                      className="text-left p-4 rounded-2xl border border-zinc-800 hover:border-pink-500/60 bg-zinc-900/50 hover:bg-zinc-900 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl flex-shrink-0">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-white text-sm truncate">{s.title}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${m.chipBg}`}>{m.label}</span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">{s.scene}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  onClick={() => setCustomOpen(o => !o)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-zinc-900/80 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Write your own scene</p>
                    <p className="text-xs text-zinc-500">Total custom — describe the setting and the character.</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${customOpen ? 'rotate-90' : ''}`} />
                </button>
                {customOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60">
                    <div className="pt-3">
                      <label className="block text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-1.5">The Scene</label>
                      <textarea
                        value={customScene}
                        onChange={e => setCustomScene(e.target.value.slice(0, 600))}
                        placeholder="e.g. A late night in a private library, a thunderstorm outside, just the two of us…"
                        rows={3}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-pink-500 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-1.5">The Character (optional)</label>
                      <input
                        value={customCharacter}
                        onChange={e => setCustomCharacter(e.target.value.slice(0, 300))}
                        placeholder="e.g. A confident, mysterious librarian with no rules tonight"
                        className="w-full h-11 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-pink-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={startCustomScene}
                      disabled={!customScene.trim()}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Start My Scene
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SCENE PLAY ── */}
          {stage === 'scene-play' && activeScene && (
            <div className="-m-6 flex flex-col h-full">
              {/* Scene image */}
              <div className="relative h-44 sm:h-56 bg-zinc-900 overflow-hidden flex-shrink-0">
                {sceneImage && (
                  <img
                    key={imageSeed}
                    src={sceneImage}
                    alt={activeScene.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-pink-300/80 font-semibold mb-1">{activeScene.emoji} Scene</p>
                    <h3 className="font-display text-2xl text-white tracking-wide leading-none">{activeScene.title}</h3>
                  </div>
                  <button
                    onClick={regenSceneImage}
                    title="Regenerate image"
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-white border border-white/10"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-gradient-to-b from-zinc-950 to-black min-h-[200px]">
                {sceneMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-pink-600 to-pink-600 text-white rounded-br-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-md'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {sceneTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1.5 items-center text-pink-400">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={sceneBottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-white/5 bg-zinc-950 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={sceneInput}
                    onChange={e => setSceneInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSceneMsg() } }}
                    rows={1}
                    placeholder="Say something… or describe what you do."
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white outline-none focus:border-pink-500 transition-colors resize-none max-h-32"
                  />
                  <button
                    onClick={sendSceneMsg}
                    disabled={!sceneInput.trim() || sceneTyping}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    {sceneTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-[10px] text-zinc-600 tracking-wider uppercase flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> AI stays in character
                  </p>
                  <button onClick={() => setStage('scene-pick')} className="text-[10px] text-zinc-500 hover:text-white tracking-widest uppercase">Change scene</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
