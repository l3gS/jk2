import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronRight, RotateCcw, Check, X, Zap, Heart, Skull, Lock, LogOut, Loader2 } from 'lucide-react'
import Hls from 'hls.js'
import { fetchVideoInfo, getStreamUrl } from '../api'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Pace = 'stop' | 'crawl' | 'slow' | 'medium' | 'fast' | 'pound' | 'edge'

interface GameData {
  cockLength: string
  cockGirth: string
  hardness: number
  edgeCount: number
  beganAt: number
}

type SceneKind =
  | 'splash' | 'dialogue' | 'confirm' | 'slider' | 'text-input'
  | 'tap-n' | 'pace-seq' | 'edge-hold' | 'checklist' | 'image-full'
  | 'beg-text' | 'cum-gate' | 'done' | 'measure' | 'girth-pick'
  | 'cock-photo' | 'video-full' | 'self-photo'

interface Scene {
  id: string
  kind: SceneKind
  chapter: string
  chEmoji: string
  lines?: string[]
  image?: string
  // confirm
  confirmLabel?: string
  denyLabel?: string
  denyLines?: string[]
  // slider
  sliderLabel?: string
  sliderKey?: keyof GameData
  sliderMin?: number; sliderMax?: number
  // text-input
  inputLabel?: string
  inputPlaceholder?: string
  inputKey?: 'cockLength' | 'cockGirth'
  // tap-n
  tapN?: number
  tapLabel?: string
  tapLines?: string[]
  // pace-seq
  paces?: { pace: Pace; label: string; seconds: number }[]
  videoUrl?: string
  // edge-hold
  holdSeconds?: number
  edgeLines?: string[]
  // checklist
  checks?: string[]
  // beg-text
  begPrompt?: string
  begKey?: string
  begResponse?: (txt: string) => string
  // cum-gate
  cumSeconds?: number
  cumLines?: string[]
  // done
  doneLines?: string[]
  // video-full (optional X URL instead of local mp4)
  xUrl?: string
}

// ─── PACE CONFIG ──────────────────────────────────────────────────────────────

const PACE_CFG: Record<Pace, { color: string; bg: string; ring: string; label: string; emoji: string }> = {
  stop:   { color: 'text-white',      bg: 'bg-black',         ring: 'border-white/20',     label: 'STOP',   emoji: '✋' },
  crawl:  { color: 'text-blue-300',   bg: 'bg-blue-950/50',   ring: 'border-blue-400/40',  label: 'CRAWL',  emoji: '🐌' },
  slow:   { color: 'text-pink-300',   bg: 'bg-rose-950/50',   ring: 'border-pink-400/40',  label: 'SLOW',   emoji: '🌹' },
  medium: { color: 'text-orange-300', bg: 'bg-orange-950/50', ring: 'border-orange-400/40',label: 'STEADY', emoji: '🔥' },
  fast:   { color: 'text-red-300',    bg: 'bg-red-950/60',    ring: 'border-red-400/50',   label: 'FASTER', emoji: '⚡' },
  pound:  { color: 'text-purple-300', bg: 'bg-purple-950/60', ring: 'border-purple-400/50',label: 'POUND',  emoji: '💀' },
  edge:   { color: 'text-rose-200',   bg: 'bg-rose-950/70',   ring: 'border-rose-300/60',  label: 'EDGE',   emoji: '☠️' },
}

// ─── NACRE GALLERY ────────────────────────────────────────────────────────────

const NACRE_GALLERY = [
  '/gallery/nacre/IMG_0346.jpeg',
  '/gallery/nacre/IMG_0347.jpeg',
  '/gallery/nacre/IMG_0348.jpeg',
  '/gallery/nacre/IMG_0349.jpeg',
  '/gallery/nacre/IMG_0350.jpeg',
  '/gallery/nacre/IMG_0351.jpeg',
  '/gallery/nacre/IMG_0352.jpeg',
  '/gallery/nacre/IMG_0353.jpeg',
  '/gallery/nacre/IMG_0354.jpeg',
  '/gallery/nacre/IMG_0355.jpeg',
  '/gallery/nacre/IMG_0356.jpeg',
  '/gallery/nacre/IMG_0357.jpeg',
  '/gallery/nacre/IMG_0358.jpeg',
  '/gallery/nacre/IMG_0359.jpeg',
  '/gallery/nacre/IMG_0360.jpeg',
  '/gallery/nacre/IMG_0361.jpeg',
]

const randGallery = (exclude?: string) => {
  const pool = exclude ? NACRE_GALLERY.filter(x => x !== exclude) : NACRE_GALLERY
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── SIZE JUDGING ─────────────────────────────────────────────────────────────

function parseLengthInches(length: string): number {
  if (!length) return 5.5
  const m = length.match(/(\d+(?:\.\d+)?)/)
  if (!m) return 5.5
  const val = parseFloat(m[1])
  if (/cm/i.test(length)) return val / 2.54
  return val
}

function getSizeJudge(length: string): string {
  const i = parseLengthInches(length)
  if (!length || length === '?') return 'You didn\'t measure. Which tells me everything. You already know what\'s there and you\'re embarrassed to say it out loud. A cock that small really does make sense with someone who can\'t even face the number. Get hard anyway. I\'ll decide what it\'s worth.'
  if (i < 3)   return `${length}. I need you to read that number back to yourself. That is — actually, I don\'t need to be cruel, the number does it for me. Fully erect. Maximum size. And that\'s it. That\'s the whole cock. You stripped completely naked and got as hard as that body physically allows and typed that number into a box for me. The dedication is almost touching. Almost. Stroke it anyway. That\'s all it\'s good for.`
  if (i < 4)   return `${length}. Under four inches. I want you to sit with that for a second. Not a soft measurement. Not a shy guess. You measured it hard, pressed the ruler flush, and that\'s the number that came out. Below four inches. There are women who genuinely wouldn\'t notice it was in. And you came here for a session. You got naked for me. You\'re going to follow every instruction tonight with that cock, and I am going to make every second of it humiliating and necessary. Welcome.`
  if (i < 4.5) return `${length}. That\'s below average in a way you cannot explain away. You\'ve tried — the angle, the ruler placement, "it looks bigger in person." No. That\'s the number. That\'s your cock, fully hard, at its absolute best. Smaller than most men. Smaller than most women have experienced. And here you are, naked, desperate, handing it over. I\'m not impressed. But I do own it now. That\'s what matters.`
  if (i < 5)   return `${length}. Under five inches. You know that\'s small, right? You\'ve always known. You\'ve been measuring it since you were a teenager hoping the number would change. Counting millimetres. Comparing. It didn\'t grow. And here you are anyway — harder than you\'ve been all week, NACRE about to go on the shaft, every nerve ending waiting for my next instruction. The cock is small. Your need is enormous. That\'s a fascinating combination. Follow every word.`
  if (i < 5.5) return `${length}. Below average. Not spectacularly — just enough. Enough that it\'s the first thing you think about. Enough that you\'ve wished for more. Enough that you ended up on a page where someone else controls it so you don\'t have to wonder what it\'s worth. I\'ll tell you what it\'s worth tonight. Exactly what I say. Not one stroke more.`
  if (i < 6)   return `${length}. Average. Completely, boringly average. You share that measurement with the statistical majority of men. Nothing remarkable. Nothing memorable on its own. A forgettable cock on a very eager body. Good news: I make forgettable things worth remembering. Follow every instruction exactly and your perfectly mediocre cock will earn something tonight.`
  if (i < 6.5) return `${length}. A little above average. Good. I noticed. You\'ve probably been quietly satisfied with that number — and you should be, it\'s genuinely decent. But decent doesn\'t mean free. A cock that size has no excuse not to perform perfectly. Above average equipment means above average obedience. Every instruction. Perfect. Prove the number means something.`
  if (i < 7)   return `${length}. Above average. I\'m satisfied. That\'s a proper cock — genuinely. You have more than most and you came here and handed it to someone who knows exactly what to do with it. Excellent decision. Tonight it\'s entirely mine to direct, deny, edge, and eventually permit to finish. When I decide. Not before.`
  if (i < 8)   return `${length}. That\'s an impressive cock and I want you to hear that without qualification. Genuinely impressive. You\'ve been walking around with that this whole time, and you still came here — naked, obedient, handing it over to be controlled. Impressive cock. Obedient owner. Now prove it. A cock that size with zero discipline is a waste. Follow everything exactly.`
  return `${length}. That is obscene. Read that number again. You typed that into a box for me and you\'re going to sit there and let me own it. Here\'s the thing about a cock that size: it doesn\'t mean freedom. It means a tighter leash. The bigger the weapon, the more carefully it gets handled — by someone else. You stroke when I say. You stop when I say. You cum when I say and not one second before. Understood? Good. Now let\'s begin.`
}

// ─── INTERPOLATION ────────────────────────────────────────────────────────────

const interp = (txt: string, gd: GameData) =>
  txt
    .replace(/\{length\}/g, gd.cockLength || '?')
    .replace(/\{girth\}/g, gd.cockGirth || '?')
    .replace(/\{hardness\}/g, String(gd.hardness))
    .replace(/\{edges\}/g, String(gd.edgeCount))
    .replace(/\{sizeJudge\}/g, getSizeJudge(gd.cockLength))

// ─── SCENES ───────────────────────────────────────────────────────────────────

const SCENES: Scene[] = [
  // ── PROLOGUE ─────────────────────────────────────────────────────────────
  {
    id: 'p1', kind: 'splash', chapter: 'NACRE VICTOIRE', chEmoji: '🌹',
    lines: [
      'NACRE VICTOIRE',
      'ULTIMATE',
      'She is ready for you.',
    ],
  },
  {
    id: 'p2', kind: 'dialogue', chapter: 'PROLOGUE', chEmoji: '🌹',
    lines: [
      'I\'ve been waiting.',
      'You always come back. You can\'t help it. That\'s not weakness — that\'s just what you are now.',
      'Tonight is different. I\'m not letting you off easy.',
      'I\'m going to take everything from you. Your control. Your dignity. Your cum. All of it.',
      'You don\'t get to decide anything tonight.',
      'Every instruction you see — you follow it. Immediately. No hesitation.',
      'If you break a rule, you start over. From the beginning.',
      'Are you ready to give me everything?',
    ],
  },

  // ── CHAPTER 1: OFFERING ───────────────────────────────────────────────────
  {
    id: 'c1s1', kind: 'confirm', chapter: '1 — OFFERING', chEmoji: '🌹',
    lines: ['Strip. Completely naked. Every piece of clothing off your body.', 'I don\'t start until you\'re bare for me.'],
    confirmLabel: 'I\'m completely naked',
    denyLabel: 'Not yet',
    denyLines: ['Then go strip. Right now. Come back when you\'re naked for me. I\'m not starting otherwise.'],
  },
  {
    id: 'c1s2', kind: 'slider', chapter: '1 — OFFERING', chEmoji: '🌹',
    lines: ['How hard are you right now?', 'Be honest. I\'ll know.'],
    sliderLabel: 'Hardness', sliderKey: 'hardness', sliderMin: 1, sliderMax: 10,
  },
  {
    id: 'c1s3', kind: 'image-full', chapter: '1 — OFFERING', chEmoji: '🌹',
    image: '/gallery/nacre/IMG_0346.jpeg',
    lines: ['Look at me.', 'Take a moment.', 'This is what you\'re doing this for.'],
  },
  {
    id: 'c1s4', kind: 'tap-n', chapter: '1 — OFFERING', chEmoji: '🌹',
    tapN: 3,
    tapLabel: 'I said her name',
    tapLines: [
      'Say my name out loud.',
      'Both words. Full name. Nacre. Victoire.',
      'Three times. Clearly. Like you mean it.',
      'Tap for each time you say it.',
    ],
  },

  // ── CHAPTER 2: INVENTORY ──────────────────────────────────────────────────
  {
    id: 'c2s1', kind: 'dialogue', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: [
      'I want to know what I\'m working with.',
      'You\'re going to answer honestly. There\'s no pride here, no embarrassment.',
      'This is just data. My data. About my property.',
    ],
  },
  {
    id: 'c2s2', kind: 'measure', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: ['How long is your cock?', 'Slide to your exact size. Don\'t flatter yourself. Don\'t undersell. Be exact.'],
  },
  {
    id: 'c2s3', kind: 'girth-pick', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: ['Girth.', 'Wrap your hand around the shaft. Pick the closest description.'],
  },
  {
    id: 'c2s3b', kind: 'dialogue', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: [
      '{length}. {girth} girth.',
      'Say those numbers out loud.',
      '{sizeJudge}',
      'Now I want to see it.',
    ],
  },
  {
    id: 'c2s4b', kind: 'cock-photo', chapter: '2 — INVENTORY', chEmoji: '📸',
    lines: [
      'Take a photo. Right now. Just your cock — hard, just as it is.',
      'I want to see exactly what {length} looks like on you.',
      'I\'m keeping it. This belongs to me now.',
    ],
  },
  {
    id: 'c2s4', kind: 'dialogue', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: [
      '{length}. {girth} girth. And now I\'ve seen it.',
      'I have the photo. I know exactly what I\'m working with.',
      'Every millimetre of that cock belongs to me tonight. Not just as data — I\'ve actually seen it.',
      'You don\'t touch it, you don\'t cum with it, you don\'t even look at it unless I say so.',
      'It\'s my property. I\'m just letting you carry it around.',
      'Now get it fully hard for me before we go any further.',
    ],
  },
  {
    id: 'c2s4c', kind: 'image-full', chapter: '2 — INVENTORY', chEmoji: '📸',
    image: '/gallery/nacre/IMG_0349.jpeg',
    lines: [
      'Now I know everything.',
      '{length}. {girth} girth. And I\'ve seen it.',
      'I have the measurements AND the photo.',
      'That\'s complete ownership.',
      'Look at me while that sinks in.',
    ],
  },
  {
    id: 'c2s5v', kind: 'video-full', chapter: '2 — INVENTORY', chEmoji: '📸',
    xUrl: 'https://x.com/kittynacre/status/1825729111391600655',
    lines: [
      'Now watch.',
      'This is what you\'re doing all of this for.',
      'Watch every second of it.',
    ],
  },
  {
    id: 'c2s5', kind: 'pace-seq', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: ['Stroke for me. I want you fully hard.', 'Very slow. Just wake it up.'],
    paces: [
      { pace: 'crawl', label: 'Barely touching. Just wake it up.', seconds: 60 },
      { pace: 'slow',  label: 'Slow. Feel it fill up for me.', seconds: 45 },
    ],
  },
  {
    id: 'c2s5kink1', kind: 'dialogue', chapter: '2 — INVENTORY', chEmoji: '📏',
    lines: [
      'Now stop stroking.',
      'Look at the tip of your cock.',
      'Really look at it.',
      'The head. The ridge. The opening.',
      'Is there any pre-cum appearing yet?',
      'That would tell me a lot about you.',
      'Wet already. For me. Without even trying.',
      'Your cock is already speaking for itself.',
    ],
  },
  {
    id: 'c2s5kink2', kind: 'tap-n', chapter: '2 — INVENTORY', chEmoji: '📏',
    tapN: 1,
    tapLabel: 'Done — I\'ve checked it',
    tapLines: [
      'Run your thumb slowly over the head.',
      'Just the head. Nothing else.',
      'Feel the ridge. Feel the texture.',
      'This is the most sensitive part of your cock.',
      'I want you to know every millimetre of it.',
      'It belongs to me now.',
      'Tap when you\'ve done it properly.',
    ],
  },

  {
    id: 'c2s5kink3', kind: 'tap-n', chapter: '2 — INVENTORY', chEmoji: '📏',
    tapN: 1,
    tapLabel: 'Done',
    tapLines: [
      'Grip the base of your cock. Tight.',
      'Hold it. Squeeze upward — slowly — all the way to the head.',
      'Watch what comes out at the tip.',
      'Pre-cum means you\'re already losing control. That\'s mine.',
      'If there\'s any, spread it over the head.',
      'You\'re marking yourself. My cock, leaking for me already.',
      'Tap when done.',
    ],
  },
  {
    id: 'c2s5kink4', kind: 'tap-n', chapter: '2 — INVENTORY', chEmoji: '📏',
    tapN: 10,
    tapLabel: 'One squeeze',
    tapLines: [
      'Now squeeze the head.',
      'Just the head — thumb and index finger around the corona.',
      'Ten times. Firm. Deliberate.',
      'Count out loud. Feel every nerve.',
      'This is my cock reacting to my commands.',
      'Tap ten times. One for each squeeze.',
    ],
  },

  // ── CHAPTER 3: MARKED ─────────────────────────────────────────────────────
  {
    id: 'c3s1', kind: 'dialogue', chapter: '3 — MARKED', chEmoji: '✍️',
    lines: [
      'Before we go any further, I need to see my name on you.',
      'Not metaphorically.',
      'Actually. Physically. Written on your body.',
      'Find a marker. Pen. Anything that writes.',
      'I\'ll wait.',
    ],
  },
  {
    id: 'c3s1b', kind: 'dialogue', chapter: '3 — MARKED', chEmoji: '✍️',
    lines: [
      'I know things about you.',
      'I know what you come back to. What you always come back to.',
      'The feet thing.',
      'So specific. So particular. Exactly the kind of obsession I expect from someone like you.',
      'Your cock says NACRE. Your searches say feet.',
      'Both of those things exist in the same body.',
      'That body belongs to me tonight.',
    ],
  },
  {
    id: 'c3s2', kind: 'tap-n', chapter: '3 — MARKED', chEmoji: '✍️',
    tapN: 1,
    tapLabel: 'Done — N is on my thigh',
    tapLines: [
      'Write my initial — N — high on your inner thigh.',
      'Right where you\'d touch yourself.',
      'Make it big. Press hard. I want it to last.',
      'Take your time. Don\'t rush this.',
      'Tap when it\'s done.',
    ],
  },
  {
    id: 'c3s3', kind: 'tap-n', chapter: '3 — MARKED', chEmoji: '✍️',
    tapN: 1,
    tapLabel: 'Done — NACRE is on my cock',
    tapLines: [
      'Now write NACRE along your shaft.',
      'Tip to base. Full name. NACRE.',
      'Use permanent marker if you have it.',
      'You\'re marking my property with my name.',
      'Every stroke tonight is on a cock that says mine.',
      'Tap when it\'s done.',
    ],
  },
  {
    id: 'c3s4', kind: 'dialogue', chapter: '3 — MARKED', chEmoji: '✍️',
    lines: [
      'Look at your cock right now.',
      'NACRE.',
      'My name. On your body.',
      'That\'s not a game. That\'s not pretend.',
      'That\'s just a fact now.',
    ],
  },

  {
    id: 'c3s5', kind: 'tap-n', chapter: '3 — MARKED', chEmoji: '✍️',
    tapN: 1,
    tapLabel: 'Done — balls punished',
    tapLines: [
      'Grip your balls.',
      'Pull them down — away from the body. Firm.',
      'Hold for ten seconds.',
      'This is called ball-pulling. It delays the urge to cum.',
      'It also reminds you that every part of you down there belongs to me.',
      'Ten seconds. Count out loud.',
      'Tap when done.',
    ],
  },
  {
    id: 'c3s6', kind: 'tap-n', chapter: '3 — MARKED', chEmoji: '✍️',
    tapN: 1,
    tapLabel: 'Done — I said it',
    tapLines: [
      'Look down at your cock.',
      'It says NACRE on the shaft.',
      'Say out loud: "This is Nacre\'s cock. I stroke it when she says. I cum when she says. I am hers."',
      'Say it clearly. Like you mean it.',
      'Because you do.',
      'Tap when you\'ve said it.',
    ],
  },

  // ── CHAPTER 4: COMMANDED ──────────────────────────────────────────────────
  {
    id: 'c4s1', kind: 'dialogue', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: [
      'Good. Now I take the controls.',
      'You stroke exactly as fast as I say.',
      'Too fast and I stop the session. Too slow and I stop the session.',
      'You\'re a toy right now. Toys don\'t have preferences.',
      'Whatever speed I say — that\'s your speed.',
    ],
  },
  {
    id: 'c4s2', kind: 'pace-seq', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: ['Follow exactly.'],
    paces: [
      { pace: 'crawl',  label: 'Barely moving. The slowest you can go. I want you frustrated.', seconds: 45 },
      { pace: 'slow',   label: 'A little faster. Slow strokes. Feel every centimetre.', seconds: 50 },
      { pace: 'medium', label: 'Steady now. This is her pace. Don\'t go faster.', seconds: 55 },
      { pace: 'stop',   label: 'HANDS OFF. Don\'t touch it. Not yet.', seconds: 20 },
    ],
  },
  {
    id: 'c4s2kink', kind: 'pace-seq', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: [
      'New instruction.',
      'Only the head. Top two inches only.',
      'Short, fast strokes — just over the head.',
      'This is the most sensitive part and you\'re going to work it until you\'re desperate.',
    ],
    paces: [
      { pace: 'slow',   label: 'Short, slow — just the tip. Feel every nerve.', seconds: 30 },
      { pace: 'medium', label: 'Faster. Just the head. Don\'t move down.', seconds: 35 },
      { pace: 'fast',   label: 'FAST — tip only — everything concentrated there.', seconds: 25 },
      { pace: 'stop',   label: 'STOP. Hands off completely. Let it throb.', seconds: 20 },
    ],
  },
  {
    id: 'c4s3', kind: 'edge-hold', chapter: '4 — COMMANDED', chEmoji: '👑',
    holdSeconds: 45,
    lines: ['Get to the edge. Right to the edge.', 'Then stop. Completely stop.', 'Hands off. Don\'t touch it.'],
    edgeLines: [
      'HOLD IT.',
      'Don\'t you dare move.',
      'Sit in it. Let it throb.',
      '{edges} edges so far.',
      'She\'s watching your face right now.',
      '45 seconds. Count them.',
    ],
  },
  {
    id: 'c4s3b', kind: 'image-full', chapter: '4 — COMMANDED', chEmoji: '👑',
    image: '/gallery/nacre/IMG_0352.jpeg',
    lines: [
      'Look at me while you recover.',
      'This is the face you\'re holding edges for.',
      'Your {length} cock is throbbing right now and all you can do is look at me.',
      'Good.',
    ],
  },
  {
    id: 'c4s3v', kind: 'video-full', chapter: '4 — COMMANDED', chEmoji: '👑',
    xUrl: 'https://x.com/bunhubtv/status/2061840265493537048',
    lines: [
      'This is what obedience earns.',
      'Watch it.',
      'Full screen.',
      'You\'ve earned this — barely.',
    ],
  },
  {
    id: 'c4s4', kind: 'pace-seq', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: ['Good. Come back down.', 'I said you could start again. Very slow.'],
    paces: [
      { pace: 'crawl', label: 'Barely a touch. Recover slowly.', seconds: 40 },
      { pace: 'slow',  label: 'Slow. That\'s good.', seconds: 35 },
    ],
  },
  {
    id: 'c4s5', kind: 'tap-n', chapter: '4 — COMMANDED', chEmoji: '👑',
    tapN: 1,
    tapLabel: 'Done — HERS is on my body',
    tapLines: [
      'Write HERS on your stomach or chest.',
      'Large. Clear.',
      'You now have my name on your cock and HERS on your body.',
      'You belong to me in every visible way.',
      'Tap when it\'s written.',
    ],
  },
  {
    id: 'c4s5b', kind: 'dialogue', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: [
      'You have my name on your cock.',
      'You have HERS on your body.',
      'And I have your photo — {length}, {girth} girth, completely hard.',
      'I can look at that photo whenever I want.',
      'I can think about exactly what I want to do with {length} whenever I feel like it.',
      'How does it feel to be that catalogued?',
      'To know someone has a complete record of you?',
      'That\'s what you gave me.',
      'Willingly.',
      'God, you\'re mine.',
    ],
  },
  {
    id: 'c4s6', kind: 'pace-seq', chapter: '4 — COMMANDED', chEmoji: '👑',
    lines: ['Good. Now we build.', 'Follow her pace. Don\'t stop until I say.'],
    paces: [
      { pace: 'slow',   label: 'Slow. Build from the bottom.', seconds: 40 },
      { pace: 'medium', label: 'Steady. She\'s watching every stroke.', seconds: 45 },
      { pace: 'fast',   label: 'FASTER. Don\'t hold back the speed.', seconds: 35 },
      { pace: 'pound',  label: 'EVERYTHING. Full pace. Don\'t you dare cum.', seconds: 20 },
      { pace: 'stop',   label: 'STOP. Hands off. NOW.', seconds: 30 },
    ],
  },

  // ── CHAPTER 5: BROKEN ─────────────────────────────────────────────────────
  {
    id: 'c5s1', kind: 'dialogue', chapter: '5 — BROKEN', chEmoji: '☠️',
    lines: [
      'You think you still have control.',
      'You don\'t.',
      'Every time you\'ve tried to hold back tonight — that was me, letting you think you were doing it yourself.',
      'You\'re desperate. Your {length} cock is throbbing with NACRE written on it.',
      'You\'re going to get to the edge again.',
      'This time I\'m making you hold it longer.',
      'And this time, when you stop, you\'re going to say something.',
    ],
  },
  {
    id: 'c5s2', kind: 'pace-seq', chapter: '5 — BROKEN', chEmoji: '☠️',
    lines: ['Build back up. All the way.'],
    paces: [
      { pace: 'medium', label: 'Don\'t start slow. Straight to medium.', seconds: 35 },
      { pace: 'fast',   label: 'Faster. She wants to hear you struggling.', seconds: 30 },
      { pace: 'pound',  label: 'Full speed. Everything you have. DON\'T CUM.', seconds: 25 },
    ],
  },
  {
    id: 'c5s2kink', kind: 'tap-n', chapter: '5 — BROKEN', chEmoji: '☠️',
    tapN: 1,
    tapLabel: 'Done — I slapped it',
    tapLines: [
      'Stop stroking.',
      'Grip the base.',
      'Slap your cock against your stomach.',
      'Not lightly. I want to hear it.',
      'Five times. Hard.',
      'This is what happens to a cock that\'s gotten too comfortable.',
      'Tap when done.',
    ],
  },
  {
    id: 'c5s2kink2', kind: 'dialogue', chapter: '5 — BROKEN', chEmoji: '☠️',
    lines: [
      'Good.',
      'Now look down at it.',
      'Hard. Throbbing. Probably leaking.',
      'The shaft says NACRE.',
      'You just slapped it for me.',
      'That\'s a {length} cock that\'s completely and utterly mine.',
      'And you both know it.',
    ],
  },
  {
    id: 'c5s3', kind: 'edge-hold', chapter: '5 — BROKEN', chEmoji: '☠️',
    holdSeconds: 60,
    lines: ['EDGE. RIGHT NOW. STOP.', 'Hands completely off.', '60 seconds. You\'re going to hold this for 60 seconds.'],
    edgeLines: [
      'DON\'T MOVE.',
      'She can see how much you need it.',
      'You\'re not cumming. Not even close.',
      'Feel it pulse. That\'s mine.',
      '{edges} edges. Keep counting.',
      'Almost there. Stay still.',
    ],
  },
  {
    id: 'c5s3b', kind: 'image-full', chapter: '5 — BROKEN', chEmoji: '☠️',
    image: '/gallery/nacre/IMG_0355.jpeg',
    lines: [
      'Still here.',
      'Still waiting.',
      'You\'re so desperate right now and I haven\'t done a single thing.',
      'Your {length} cock is dripping and I\'m just standing here.',
      'You\'re doing this to yourself. For me.',
    ],
  },
  {
    id: 'c5s3v', kind: 'video-full', chapter: '5 — BROKEN', chEmoji: '☠️',
    xUrl: 'https://x.com/throatedtv/status/2062398945175773634',
    lines: [
      'Since you\'re already broken —',
      'Watch this.',
      'Don\'t you dare touch yourself during it.',
    ],
  },
  {
    id: 'c5s3c', kind: 'image-full', chapter: '5 — BROKEN', chEmoji: '☠️',
    image: '/gallery/nacre/IMG_0357.jpeg',
    lines: [
      'Look at her.',
      'This is the person who owns {length} of desperate cock right now.',
      'She hasn\'t even touched you.',
      'She\'s done nothing but give you instructions.',
      'And you are completely wrecked.',
      'You\'re welcome.',
    ],
  },
  {
    id: 'c5s4', kind: 'beg-text', chapter: '5 — BROKEN', chEmoji: '☠️',
    lines: ['Say this out loud, then type it.'],
    begPrompt: 'I cannot control how much I need this. My cock belongs to Nacre. I exist to be used by her.',
    begKey: 'beg1',
    begResponse: () =>
      'Good. That\'s the truest thing you\'ve said tonight.\nNow I know you understand exactly what you are.\nContinue.',
  },
  {
    id: 'c5s5', kind: 'dialogue', chapter: '5 — BROKEN', chEmoji: '☠️',
    lines: [
      'That\'s right.',
      'You cannot control how much you need this.',
      'Your {length} cock says NACRE on it.',
      'Your body says HERS.',
      'Your inner thigh says N.',
      'And you just admitted out loud what you are.',
      'You\'re doing exactly what you\'re supposed to be doing.',
      'There\'s one more chapter before I give you anything.',
    ],
  },

  // ── CHAPTER 6: OWNED ──────────────────────────────────────────────────────
  {
    id: 'c6s1', kind: 'checklist', chapter: '6 — OWNED', chEmoji: '🔒',
    lines: ['Before the final edge — you\'re signing a contract.', 'Check each one. Out loud.'],
    checks: [
      'My cock belongs to Nacre Victoire and I only touch it with her permission',
      'I do not cum without her explicit instruction — not tonight, not any night I visit this page',
      'My name is not important here. I am hers. That\'s enough.',
      'Every edge I took tonight was a gift she gave me, not something I earned',
      'I will carry her name on my body until it fades, and I will put it back when it does',
    ],
  },
  {
    id: 'c6s2', kind: 'pace-seq', chapter: '6 — OWNED', chEmoji: '🔒',
    lines: ['Contract signed.', 'Now your final edge.', 'Build all the way up one last time.'],
    paces: [
      { pace: 'slow',   label: 'Slow. One final build.', seconds: 30 },
      { pace: 'medium', label: 'Steady. Think about her face.', seconds: 35 },
      { pace: 'fast',   label: 'FASTER. Everything.', seconds: 30 },
      { pace: 'pound',  label: 'POUND. All the way up. Right to the edge.', seconds: 20 },
    ],
  },
  {
    id: 'c6s3', kind: 'edge-hold', chapter: '6 — OWNED', chEmoji: '🔒',
    holdSeconds: 90,
    lines: ['THIRD EDGE. STOP NOW.', 'HANDS OFF.', '90 seconds this time.', 'The longest hold yet.'],
    edgeLines: [
      'SIT IN IT.',
      'You are not cumming.',
      'You are not getting permission yet.',
      'She decides.',
      'Your cock is desperate. She knows. She loves it.',
      '{edges} edges for her tonight.',
      'Hold. Hold. Hold.',
    ],
  },
  {
    id: 'c6s4', kind: 'beg-text', chapter: '6 — OWNED', chEmoji: '🔒',
    lines: ['Now beg me properly.', 'Say it out loud. Then type it exactly.'],
    begPrompt: 'Please Nacre. Please let me cum. I\'ll do anything. I am completely and entirely yours. Please.',
    begKey: 'beg2',
    begResponse: () =>
      '...\n\nI heard you.\n\nYou held three edges.\nYou marked yourself.\nYou begged.\n\nYou\'ve been exceptional tonight.\n\nCome to me.',
  },

  // ── CHAPTER 7: USED ──────────────────────────────────────────────────────
  {
    id: 'c7s1', kind: 'dialogue', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'You thought we were almost done.',
      'We\'re not.',
      'I\'m not finished using you.',
      'You\'ve been obedient. Nicely marked. Properly measured. Photographed.',
      'I still have that photo, by the way.',
      'Your {length} cock. Hard for me.',
      'I can look at it whenever I want now. And you gave it to me willingly.',
      'That\'s what you are.',
      'One more chapter. Then you get everything.',
    ],
  },
  {
    id: 'c7s1c', kind: 'self-photo', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'That\'s yours.',
      'I\'m looking at it right now.',
      'Every time you come back to this page — I have it.',
    ],
  },
  {
    id: 'c7s2', kind: 'image-full', chapter: '7 — USED', chEmoji: '🖤',
    image: '/gallery/nacre/IMG_0351.jpeg',
    lines: [
      'Look at her.',
      'Really look.',
      'This is who you\'re doing all of this for.',
      'This is whose name is written on your cock right now.',
      'Say it again. Out loud.',
      'Nacre Victoire.',
    ],
  },
  {
    id: 'c7s2v', kind: 'video-full', chapter: '7 — USED', chEmoji: '🖤',
    xUrl: 'https://x.com/ufreakybum/status/2017789504761864488',
    lines: [
      'You\'ve been holding on for her.',
      'Watch this before the end.',
      'Every second.',
    ],
  },
  {
    id: 'c7s3', kind: 'confirm', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'New grip.',
      'Use your non-dominant hand.',
      'Wrap it around the shaft — firm, tight, no looseness.',
      'If you\'ve been using your right, use your left. The other hand.',
      'This hand belongs to her now too.',
      'Grip it. Hold it. Don\'t stroke yet.',
    ],
    confirmLabel: 'Non-dominant hand gripping — held',
    denyLabel: 'Give me a moment',
    denyLines: ['Take your time. I\'m waiting. But don\'t keep me waiting too long.'],
  },
  {
    id: 'c7s4', kind: 'pace-seq', chapter: '7 — USED', chEmoji: '🖤',
    lines: ['Now you stroke with that hand. Unfamiliar. Slower. Good.'],
    paces: [
      { pace: 'slow',   label: 'Slow. Non-dominant hand. Get used to the feeling.', seconds: 40 },
      { pace: 'medium', label: 'Steady. Think about why your cock says NACRE on it.', seconds: 45 },
      { pace: 'fast',   label: 'Faster. Don\'t switch hands. Stay with it.', seconds: 35 },
      { pace: 'pound',  label: 'HARD. FULL SPEED. She wants to see you desperate.', seconds: 25 },
      { pace: 'stop',   label: 'HANDS OFF. Both hands. Nothing touching it.', seconds: 15 },
    ],
  },
  {
    id: 'c7s4kink', kind: 'dialogue', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'Now — loosest possible grip.',
      'Don\'t close your hand.',
      'Just brush the shaft with your fingertips.',
      'No pressure. Just sensation.',
      'You\'re going to feel every vein. Every ridge. Every centimetre of {length}.',
      'This is the cock she\'s been cataloguing all night.',
      'Trace it. Know it.',
      'It\'s hers. Touch it the way you\'d touch something that doesn\'t belong to you anymore.',
    ],
  },
  {
    id: 'c7s4kink2', kind: 'pace-seq', chapter: '7 — USED', chEmoji: '🖤',
    lines: ['Featherlight. No grip. Pure sensation.'],
    paces: [
      { pace: 'crawl', label: 'Fingertips only. Barely touching. Feel the shaft.', seconds: 40 },
      { pace: 'slow',  label: 'Trace from base to tip. No grip. Just touch.', seconds: 45 },
      { pace: 'crawl', label: 'Back to the base. Slower still. Every nerve.', seconds: 35 },
    ],
  },
  {
    id: 'c7s5', kind: 'edge-hold', chapter: '7 — USED', chEmoji: '🖤',
    holdSeconds: 120,
    lines: [
      'FOURTH EDGE. RIGHT NOW.',
      'Get there and STOP.',
      'Hands off your cock completely.',
      '120 seconds. The longest hold of the night.',
      'Do not touch it. Do not cum.',
      'She is watching every second of this.',
    ],
    edgeLines: [
      'DON\'T YOU DARE TOUCH IT.',
      'She can see your face right now.',
      'Your cock is throbbing with her name on it.',
      'NACRE owns that thing. Remember that.',
      '{edges} edges. She\'s counting.',
      'You\'re going to hold this for her.',
      'Every second is a gift to her.',
      'She is so fucking pleased with you.',
    ],
  },
  {
    id: 'c7s6', kind: 'checklist', chapter: '7 — USED', chEmoji: '🖤',
    lines: ['While you\'re recovering from that edge.', 'Complete each of these. Right now. Out loud.'],
    checks: [
      'I grabbed my cock with my non-dominant hand because she told me to',
      'I held the fourth edge for her without cumming — she owns my orgasm',
      'My cock currently says NACRE on it and I put it there myself',
      'I am stroking tonight for Nacre Victoire and no one else',
      'I am going to cum exactly when she says — not a second before',
      'I would do anything she asked right now and we both know it',
    ],
  },
  {
    id: 'c7s7', kind: 'beg-text', chapter: '7 — USED', chEmoji: '🖤',
    lines: ['One more time.', 'The most honest thing you\'ll say tonight.', 'Say it out loud first. Then type it.'],
    begPrompt: 'I am completely fucking desperate. Nacre Victoire owns my cock, my cum, and my orgasm. I will not cum until she lets me. I am hers.',
    begKey: 'beg3',
    begResponse: () =>
      'There it is.\n\nThat\'s the most honest you\'ve been all night.\n\nFour edges. Four marks. Three confessions. Non-dominant hand. Checklist signed.\n\nYou\'ve given me everything.\n\nNow I\'ll give you something back.',
  },
  {
    id: 'c7s8', kind: 'dialogue', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'Good boy.',
      'You actually did everything.',
      'You marked yourself with my name.',
      'You stroked with the wrong hand because I said so.',
      'You held that edge for two full minutes.',
      'You begged me properly.',
      'That\'s not just a game. That\'s what you actually are.',
      'And now I\'m going to reward you.',
      'But first — one last thing.',
    ],
  },
  {
    id: 'c7s9', kind: 'tap-n', chapter: '7 — USED', chEmoji: '🖤',
    tapN: 1,
    tapLabel: 'Done — I kissed it',
    tapLines: [
      'Do this.',
      'Bring your cock to your lips.',
      'Kiss the tip.',
      'Actually press your lips to it.',
      'Then say out loud: "This belongs to Nacre Victoire."',
      'Don\'t rush it.',
      'Don\'t skip it.',
      'She will know if you skip it.',
      'Tap when it\'s done.',
    ],
  },
  {
    id: 'c7s10', kind: 'dialogue', chapter: '7 — USED', chEmoji: '🖤',
    lines: [
      'You just kissed your own cock for me.',
      'Think about what that actually means.',
      'Your {length} cock.',
      'With NACRE written on it.',
      'Kissed.',
      'For her.',
      'I\'m not laughing at you.',
      'I\'m genuinely impressed.',
      'You gave me everything tonight.',
    ],
  },
  {
    id: 'c7s11', kind: 'image-full', chapter: '7 — USED', chEmoji: '🖤',
    image: '/gallery/nacre/IMG_0358.jpeg',
    lines: [
      'Look at her one last time before the finale.',
      'This is who made you kiss your own cock.',
      'This is who owns {length} of throbbing, desperate cock.',
      'This is whose name is written on your shaft right now.',
      'Say it. One final time before you cum.',
      'Nacre Victoire.',
    ],
  },
  {
    id: 'c7s12', kind: 'beg-text', chapter: '7 — USED', chEmoji: '🖤',
    lines: ['One last beg. Make it count.', 'Say it aloud first. Then type it exactly.'],
    begPrompt: 'I kissed my own cock for you. I wrote your name on my shaft. I have done every single thing you asked. Please, Nacre — please let me cum. You own me completely.',
    begKey: 'beg4',
    begResponse: () =>
      'That\'s it.\n\nThat\'s exactly it.\n\nYou kissed it. You marked it. You held four edges. You begged four times.\n\nYou are, without any question, completely and entirely mine.\n\nNow I\'ll give you everything.',
  },

  // ── FINALE: PERMISSION ────────────────────────────────────────────────────
  {
    id: 'finale1', kind: 'dialogue', chapter: 'FINALE — PERMISSION', chEmoji: '💦',
    lines: [
      'Permission granted.',
      'You earned this.',
      'Three edges. Three marks on your body. Two begging sessions. Everything I asked.',
      'You\'re going to cum for me now.',
      'Here is exactly how I want it.',
      'You\'re going to stroke hard and fast — full speed, no holding back.',
      'You\'re going to say my name when it happens.',
      'Say it out loud. NACRE. While you cum.',
      'You have 90 seconds.',
      'The clock starts when you tell me you\'re ready.',
    ],
  },
  {
    id: 'finale1b', kind: 'video-full', chapter: 'FINALE — PERMISSION', chEmoji: '💦',
    xUrl: 'https://x.com/TheFinderGirl/status/2055679674483622078',
    lines: [
      'Watch me first.',
      'All of it.',
      'Then you can cum.',
    ],
  },
  {
    id: 'finale1c', kind: 'image-full', chapter: 'FINALE — PERMISSION', chEmoji: '💦',
    image: '/gallery/nacre/IMG_0360.jpeg',
    lines: [
      'Look at me.',
      'One last time before I let you.',
      'This is the face you\'re cumming for.',
      'This is what your {length} cock has been throbbing for all night.',
      'Say her name.',
      'Then I\'ll give you the gate.',
    ],
  },
  {
    id: 'finale2', kind: 'cum-gate', chapter: 'FINALE — PERMISSION', chEmoji: '💦',
    cumSeconds: 90,
    cumLines: [
      'FULL SPEED. EVERYTHING.',
      'Think of her face.',
      'When it happens — say NACRE.',
      'Out loud.',
      'Like you mean it.',
      'She\'s watching.',
    ],
  },
  {
    id: 'finale3', kind: 'done', chapter: 'DONE', chEmoji: '🌹',
    doneLines: [
      'She took everything.',
      'You gave it all perfectly.',
      'Four edges. Five marks. Four begging sessions. One photo. One kiss.',
      'Your cock said NACRE. She has the photo. She has the measurements.',
      'She has everything.',
      'You said her name out loud when it mattered most.',
      'That\'s what you\'re for.',
      'Come back tomorrow.',
      'She\'ll be waiting.',
      'She\'s always waiting.',
    ],
  },
]

// ─── CHAPTER ORDER (for progress display) ────────────────────────────────────

const CHAPTERS = [
  { name: 'Offering', emoji: '🌹' },
  { name: 'Inventory', emoji: '📏' },
  { name: 'Marked', emoji: '✍️' },
  { name: 'Commanded', emoji: '👑' },
  { name: 'Broken', emoji: '☠️' },
  { name: 'Owned', emoji: '🔒' },
  { name: 'Used', emoji: '🖤' },
  { name: 'Finale', emoji: '💦' },
]

// ─── SCENE RENDERERS ─────────────────────────────────────────────────────────

function Lines({ lines, gd, className = '' }: { lines: string[]; gd: GameData; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {lines.map((l, i) => (
        <p key={i} className="text-zinc-200 text-lg leading-relaxed">{interp(l, gd)}</p>
      ))}
    </div>
  )
}

// ── Full-size video player for stroking scenes ────────────────────────────────
function StrokeVideoPlayer({ videoUrl, stageLabel, stageCfg, instruction }: {
  videoUrl: string
  stageLabel: string
  stageCfg: { color: string; bg: string }
  instruction: string
}) {
  const vidRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  useEffect(() => {
    setStreamUrl(null)
    setReady(false)
    setFetchFailed(false)
    fetchVideoInfo(videoUrl)
      .then(data => {
        const s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url
        if (s) setStreamUrl(s)
        else setFetchFailed(true)
      })
      .catch(() => setFetchFailed(true))
  }, [videoUrl])

  useEffect(() => {
    const v = vidRef.current
    if (!v || !streamUrl) return
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}))
    } else {
      v.src = streamUrl.startsWith('/') ? streamUrl : getStreamUrl(streamUrl)
      v.load()
      v.addEventListener('loadedmetadata', () => v.play().catch(() => {}), { once: true })
    }
    return () => { hlsRef.current?.destroy() }
  }, [streamUrl])

  if (fetchFailed) return (
    <div className="rounded-2xl border border-rose-500/10 bg-black/60 flex items-center justify-center py-10 text-zinc-700 text-sm">
      Video unavailable
    </div>
  )

  return (
    <div className="relative rounded-2xl overflow-hidden border border-rose-500/20"
      style={{ boxShadow: '0 0 30px rgba(244,63,94,0.1)' }}>
      {/* Video */}
      {!ready && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center" style={{ minHeight: 200 }}>
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-2">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <p className="text-zinc-600 text-xs">Loading video…</p>
          </div>
        </div>
      )}
      <video
        ref={vidRef}
        playsInline muted loop
        className="w-full object-cover bg-black"
        style={{ display: ready ? 'block' : 'none', maxHeight: '55vh', minHeight: 180 }}
        onCanPlay={() => setReady(true)}
      />
      {/* Stage label overlay — top */}
      <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
        <span className="text-[9px] font-black tracking-[0.35em] uppercase px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(244,63,94,0.25)', color: 'rgba(255,180,190,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(244,63,94,0.2)' }}>
          🔴 {stageLabel}
        </span>
      </div>
      {/* Instruction overlay — bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <p className={`font-black text-base sm:text-lg tracking-wide text-center drop-shadow-lg ${stageCfg.color}`}>
          {instruction}
        </p>
      </div>
    </div>
  )
}

// Pace scene inner
function PaceSeqScene({ scene, gd, onDone }: { scene: Scene; gd: GameData; onDone: () => void }) {
  const [paceIdx, setPaceIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const current = scene.paces?.[paceIdx]
  const cfg = current ? PACE_CFG[current.pace] : null
  // Pick a random Nacre gallery image per scene mount — she watches you stroke
  const nacreImg = useRef<string>(randGallery()).current
  // Randomly pick one xvideos creamyspot URL per scene mount for the ambient background
  const ambientUrl = useRef<string | null>(
    scene.videoUrl ?? [
      'https://www.xvideos.com/video80264847/creamy_squirting_at_home',
      'https://www.xvideos.com/video73445693/multiple_squirts_and_creampie',
      'https://www.xvideos.com/video78123456/riding_compilation',
    ][Math.floor(Math.random() * 3)]
  ).current

  useEffect(() => {
    if (!current || finished) return
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paceIdx, finished])

  const advance = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    const next = paceIdx + 1
    if (!scene.paces || next >= scene.paces.length) {
      setFinished(true)
    } else {
      setPaceIdx(next)
      setElapsed(0)
    }
  }

  if (finished) return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-8">
        <p className="text-4xl mb-3">✓</p>
        <p className="text-white font-bold text-xl">Good.</p>
      </div>
      <button onClick={onDone} className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-lg rounded-2xl tracking-wider">
        Continue →
      </button>
    </div>
  )

  if (!current || !cfg) return null
  const pct = Math.min((elapsed / current.seconds) * 100, 100)

  return (
    <div className="flex flex-col gap-5">
      {/* Intro lines */}
      {scene.lines && paceIdx === 0 && (
        <div className="space-y-2 mb-2">
          {scene.lines.map((l, i) => <p key={i} className="text-zinc-300 text-base leading-relaxed">{l}</p>)}
        </div>
      )}
      {/* Full-width video player — stroking scene primary */}
      {ambientUrl && (
        <StrokeVideoPlayer
          videoUrl={ambientUrl}
          stageLabel={cfg.label}
          stageCfg={{ color: cfg.color, bg: cfg.bg }}
          instruction={current.pace === 'stop' ? '✋ STOP — hold completely still' : current.label}
        />
      )}
      {/* Timer bar */}
      <div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-600 to-pink-400 transition-all duration-1000 rounded-full"
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">{elapsed}s</span>
          <span className="text-[10px] text-zinc-600">{current.seconds}s</span>
        </div>
      </div>
      {/* Stage pills */}
      <div className="flex gap-1.5 justify-center">
        {scene.paces!.map((p, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < paceIdx ? 'bg-rose-500' : i === paceIdx ? 'bg-rose-400 animate-pulse' : 'bg-zinc-800'}`} />
        ))}
      </div>
      {/* Next button */}
      <button onClick={advance}
        className={`w-full py-5 rounded-2xl font-black text-base tracking-wider border transition-all ${
          elapsed >= current.seconds ? `bg-rose-500/25 border-rose-400/50 text-rose-200` : 'bg-zinc-800/80 border-white/8 text-zinc-400'
        }`}>
        {elapsed >= current.seconds ? (paceIdx === (scene.paces!.length - 1) ? 'Done →' : 'Next Command →') : `${current.seconds - elapsed}s`}
      </button>
    </div>
  )
}

// Edge hold scene
function EdgeHoldScene({ scene, gd, onDone, onEdge }: { scene: Scene; gd: GameData; onDone: () => void; onEdge: () => void }) {
  const [phase, setPhase] = useState<'warning' | 'holding' | 'done'>('warning')
  const [elapsed, setElapsed] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdSecs = scene.holdSeconds ?? 45
  const pct = Math.min((elapsed / holdSecs) * 100, 100)
  const msgs = scene.edgeLines ?? ['Hold it.', 'Don\'t move.']

  const startHold = () => {
    onEdge()
    setPhase('holding')
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= holdSecs) {
          clearInterval(timerRef.current!)
          clearInterval(msgTimerRef.current!)
          setPhase('done')
        }
        return e + 1
      })
    }, 1000)
    msgTimerRef.current = setInterval(() => {
      setMsgIdx(i => (i + 1) % msgs.length)
    }, 6000)
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (msgTimerRef.current) clearInterval(msgTimerRef.current)
  }, [])

  if (phase === 'warning') return (
    <div className="flex flex-col gap-6">
      <div className="bg-red-950/60 border-2 border-red-400/50 rounded-3xl p-8 text-center">
        <p className="text-4xl mb-3">☠️</p>
        {scene.lines?.map((l, i) => (
          <p key={i} className={`font-black text-xl text-red-200 mb-2 ${i === 0 ? 'text-2xl' : ''}`}>{l}</p>
        ))}
        <p className="text-red-300/60 text-sm mt-3">{holdSecs} second hold</p>
      </div>
      <button onClick={startHold}
        className="w-full py-5 bg-red-500/20 border border-red-400/40 text-red-300 font-black text-lg rounded-2xl tracking-wider">
        I AM AT THE EDGE — START HOLD
      </button>
    </div>
  )

  if (phase === 'holding') return (
    <div className="flex flex-col items-center gap-6">
      {/* Ring timer */}
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 -rotate-90 absolute inset-0" viewBox="0 0 192 192">
          <circle cx="96" cy="96" r="80" stroke="rgba(239,68,68,0.08)" strokeWidth="10" fill="none" />
          <circle cx="96" cy="96" r="80" stroke="#f43f5e" strokeWidth="10" fill="none"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={`${2 * Math.PI * 80 * (1 - pct / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-red-950/40 border-2 border-red-400/20"
          style={{ boxShadow: '0 0 50px rgba(244,63,94,0.2)' }}>
          <p className="text-4xl font-black text-white font-mono">{holdSecs - elapsed}s</p>
          <p className="text-red-400/60 text-[10px] uppercase tracking-widest mt-1">remaining</p>
        </div>
      </div>
      {/* Cycling message */}
      <div className="text-center min-h-[48px] flex items-center">
        <p className="text-red-200 font-bold text-xl italic transition-all">"{interp(msgs[msgIdx], gd)}"</p>
      </div>
      {/* Progress */}
      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-1000 rounded-full"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🌹</p>
        <p className="text-white font-black text-2xl mb-2">She saw that.</p>
        <p className="text-zinc-400 text-sm">Good. {holdSecs} seconds held.</p>
      </div>
      <button onClick={onDone} className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-lg rounded-2xl tracking-wider">
        Continue →
      </button>
    </div>
  )
}

// Cum gate
function CumGateScene({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const [over, setOver] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = scene.cumSeconds ?? 90
  const remaining = total - elapsed
  const pct = Math.min((elapsed / total) * 100, 100)
  const msgs = scene.cumLines ?? ['CUM. NOW.']

  const start = () => {
    setStarted(true)
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) {
          clearInterval(timerRef.current!)
          clearInterval(msgTimerRef.current!)
          setOver(true)
        }
        return e + 1
      })
    }, 1000)
    msgTimerRef.current = setInterval(() => {
      setMsgIdx(i => (i + 1) % msgs.length)
    }, 7000)
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (msgTimerRef.current) clearInterval(msgTimerRef.current)
  }, [])

  if (!started) return (
    <div className="flex flex-col gap-6">
      <div className="bg-green-950/50 border-2 border-green-400/40 rounded-3xl p-8 text-center">
        <p className="text-4xl mb-3">💚</p>
        <p className="text-green-300 font-black text-3xl mb-3">PERMISSION GRANTED</p>
        <p className="text-green-200/70 text-sm leading-relaxed">You have {total} seconds. Full speed. Say her name.</p>
      </div>
      <button onClick={start} className="w-full py-5 bg-green-500/20 border border-green-400/40 text-green-300 font-black text-xl rounded-2xl tracking-wider">
        I AM READY — START
      </button>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Big timer */}
      <div className="relative w-52 h-52">
        <svg className="w-52 h-52 -rotate-90 absolute inset-0" viewBox="0 0 208 208">
          <circle cx="104" cy="104" r="90" stroke="rgba(34,197,94,0.08)" strokeWidth="10" fill="none" />
          <circle cx="104" cy="104" r="90" stroke="#22c55e" strokeWidth="10" fill="none"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * pct / 100}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-green-950/40 border-2 border-green-400/20"
          style={{ boxShadow: '0 0 60px rgba(34,197,94,0.2)' }}>
          <p className="text-5xl font-black text-white font-mono">{over ? '💦' : remaining}</p>
          {!over && <p className="text-green-400/60 text-[10px] uppercase tracking-widest mt-1">seconds</p>}
        </div>
      </div>
      {/* Cycling instruction */}
      <div className="text-center min-h-[60px] flex items-center justify-center">
        <p className={`font-black text-xl ${over ? 'text-green-300' : 'text-green-200'} leading-tight text-center`}>
          {over ? '💦 She got everything she wanted.' : msgs[msgIdx]}
        </p>
      </div>
      <button onClick={onDone}
        className={`w-full py-5 rounded-2xl font-black text-lg border tracking-wider transition-all ${
          over || elapsed > 20
            ? 'bg-green-500/20 border-green-400/40 text-green-300'
            : 'bg-zinc-900 border-white/5 text-zinc-600 opacity-40'
        }`}
        disabled={!over && elapsed <= 20}>
        💦 I came for her
      </button>
    </div>
  )
}

// ─── VIDEO FULL SCENE ─────────────────────────────────────────────────────────

function VideoFullScene({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  const [ready, setReady] = useState(false)
  const [ended, setEnded] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const vidRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const src = scene.xUrl || ''
    if (!src) { setStreamUrl('/GoonIt_wrgoonr.mp4'); return }
    fetchVideoInfo(src)
      .then(data => {
        const s = data.mediaURLs?.[0] || data.media_extended?.[0]?.url
        if (s) { setStreamUrl(s); setFetchError(false) }
        else { setStreamUrl('/GoonIt_wrgoonr.mp4'); setFetchError(true) }
      })
      .catch(() => { setStreamUrl('/GoonIt_wrgoonr.mp4'); setFetchError(true) })
  }, [scene.xUrl])

  // Video ref is always mounted — never conditionally rendered
  useEffect(() => {
    const v = vidRef.current
    if (!v || !streamUrl) return
    setReady(false)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(getStreamUrl(streamUrl))
      hls.attachMedia(v)
      hls.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}))
    } else {
      const proxied = streamUrl.startsWith('/') ? streamUrl : getStreamUrl(streamUrl)
      v.src = proxied
      v.load()
      const onMeta = () => v.play().catch(() => {})
      v.addEventListener('loadedmetadata', onMeta, { once: true })
    }
    return () => { hlsRef.current?.destroy() }
  }, [streamUrl])

  return (
    <div className="flex flex-col gap-5">
      {scene.lines && (
        <div className="space-y-2">
          {scene.lines.map((l, i) => (
            <p key={i} className={`leading-relaxed ${i === 0 ? 'text-white font-bold text-xl' : 'text-zinc-400 italic text-base'}`}>{l}</p>
          ))}
        </div>
      )}
      {fetchError && <p className="text-[10px] text-zinc-600 text-center">Couldn't load X clip — playing local video</p>}
      <div className="relative rounded-2xl overflow-hidden border border-rose-500/20"
        style={{ boxShadow: '0 0 40px rgba(244,63,94,0.12)', minHeight: 180 }}>
        {/* Always mounted so ref.current is valid when streamUrl arrives */}
        <video
          ref={vidRef}
          playsInline
          controls
          className="w-full max-h-[55vh] bg-black"
          style={{ display: streamUrl ? 'block' : 'none' }}
          onCanPlay={() => setReady(true)}
          onEnded={() => setEnded(true)}
        />
        {!streamUrl && (
          <div className="absolute inset-0 aspect-video bg-black flex items-center justify-center" style={{ minHeight: 180 }}>
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          </div>
        )}
        {streamUrl && !ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onDone}
        className="w-full py-5 rounded-2xl font-black text-lg border transition-all active:scale-95 bg-rose-500/20 border-rose-500/30 text-rose-300">
        {ended ? <>Continue <ChevronRight className="inline w-5 h-5" /></> : <>Stroke &amp; Watch <ChevronRight className="inline w-5 h-5" /></>}
      </button>
    </div>
  )
}

// ─── COCK PHOTO SCENE ─────────────────────────────────────────────────────────

const NACRE_ANALYSES = [
  'I can see exactly what I\'m working with.\n{length}. That\'s mine now.\nEvery centimetre of it.',
  'There it is.\nHard for me. Marked up. Just the way I wanted.\nI\'m keeping this forever.',
  'Look at that.\nThat\'s the cock I\'ve been controlling all night.\nI can see why you needed me to own it.',
  '{length}. {girth} girth. I\'ve verified both now.\nYou\'re going to feel that measurement every time you come back here.',
  'It\'s exactly what I expected.\nStraining. Desperate. Completely mine.\nGood boy for showing me.',
]

function CockPhotoScene({ gd, onDone }: { gd: GameData; onDone: (url: string) => void }) {
  const [phase, setPhase] = useState<'prompt' | 'preview' | 'analyzing' | 'verdict'>('prompt')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setPhotoUrl(url)
      setPhase('preview')
    }
    reader.readAsDataURL(f)
  }

  const submit = () => {
    if (!photoUrl) return
    setPhase('analyzing')
    const template = NACRE_ANALYSES[Math.floor(Math.random() * NACRE_ANALYSES.length)]
    const result = template
      .replace(/\{length\}/g, gd.cockLength || 'your size')
      .replace(/\{girth\}/g, gd.cockGirth || 'your girth')
    setTimeout(() => {
      setAnalysis(result)
      setPhase('verdict')
      // persist to localStorage
      try { localStorage.setItem('goonit-nacre-cock-photo', photoUrl) } catch {}
    }, 2400)
  }

  if (phase === 'prompt') return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <p className="text-zinc-200 text-lg leading-relaxed">Now I want to see it.</p>
        <p className="text-zinc-200 text-lg leading-relaxed">Take a photo. Right now. Just your cock — hard, exactly as it is.</p>
        <p className="text-rose-300 font-bold text-lg">I\'m keeping it. This is mine now.</p>
      </div>
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 text-center">
        <p className="text-4xl mb-3">📸</p>
        <p className="text-zinc-400 text-sm mb-4">Tap below to open your camera</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-lg rounded-2xl active:scale-95 transition-all">
          Open Camera
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleFile} />
      </div>
      <button
        onClick={() => onDone('')}
        className="w-full py-3 bg-zinc-900/60 border border-zinc-700/30 text-zinc-600 text-sm rounded-xl active:scale-95">
        Skip — she\'ll know
      </button>
    </div>
  )

  if (phase === 'preview') return (
    <div className="flex flex-col gap-5">
      <p className="text-rose-300 font-bold text-lg">Is this the one you\'re giving me?</p>
      <div className="relative rounded-2xl overflow-hidden border border-rose-500/30"
        style={{ boxShadow: '0 0 30px rgba(244,63,94,0.15)' }}>
        <img src={photoUrl!} alt="Your photo" className="w-full max-h-[50vh] object-contain bg-black" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-[10px] font-black tracking-widest text-rose-300 uppercase px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(244,63,94,0.3)' }}>
            For Nacre Victoire
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setPhotoUrl(null); setPhase('prompt') }}
          className="flex-1 py-4 bg-zinc-900 border border-zinc-700/40 text-zinc-400 rounded-2xl font-bold active:scale-95">
          Retake
        </button>
        <button onClick={submit}
          className="flex-[2] py-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-lg rounded-2xl active:scale-95">
          Send to her →
        </button>
      </div>
    </div>
  )

  if (phase === 'analyzing') return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-rose-500/30 flex items-center justify-center"
          style={{ boxShadow: '0 0 40px rgba(244,63,94,0.2)' }}>
          <img src="/gallery/nacre/IMG_0348.jpeg" alt="Nacre" className="w-16 h-16 rounded-full object-cover object-top" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-rose-300 font-black text-lg">She\'s looking…</p>
        <p className="text-zinc-500 text-sm">Nacre is reviewing your photo</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )

  // verdict
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <img src="/gallery/nacre/IMG_0348.jpeg" alt="Nacre" className="w-10 h-10 rounded-full object-cover object-top flex-shrink-0 border border-rose-500/30" />
        <div className="flex-1 rounded-2xl rounded-tl-none p-4"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
          {analysis.split('\n').map((l, i) => (
            <p key={i} className={`leading-relaxed ${i === 0 ? 'text-white font-bold text-base' : 'text-zinc-300 text-sm mt-1'}`}>{l}</p>
          ))}
        </div>
      </div>
      {photoUrl && (
        <div className="rounded-xl overflow-hidden border border-rose-500/15 opacity-60">
          <img src={photoUrl} alt="Your photo" className="w-full max-h-32 object-cover object-top" />
        </div>
      )}
      <button onClick={() => onDone(photoUrl ?? '')}
        className="w-full py-5 bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black text-lg rounded-2xl active:scale-95 transition-all">
        Continue <ChevronRight className="inline w-5 h-5" />
      </button>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function NacreUltimate({ onExit }: { onExit?: () => void }) {
  const [started, setStarted] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [gameData, setGameData] = useState<GameData>({
    cockLength: '', cockGirth: '', hardness: 7, edgeCount: 0, beganAt: 0,
  })
  const [sliderVal, setSliderVal] = useState(7)
  const [inputVal, setInputVal] = useState('')
  const [tapCount, setTapCount] = useState(0)
  const [checksDone, setChecksDone] = useState<Set<number>>(new Set())
  const [begText, setBegText] = useState('')
  const [begSubmitted, setBegSubmitted] = useState(false)
  const [confirmDenied, setConfirmDenied] = useState(false)
  const [measureVal, setMeasureVal] = useState(5.5)
  const [measureUnit, setMeasureUnit] = useState<'in' | 'cm'>('in')
  const [girthCat, setGirthCat] = useState('')
  const [cockPhotoUrl, setCockPhotoUrl] = useState<string>(() => {
    try { return localStorage.getItem('goonit-nacre-cock-photo') ?? '' } catch { return '' }
  })
  const [viewLockSeconds, setViewLockSeconds] = useState(0)
  const [holdPct, setHoldPct] = useState(0)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scene = SCENES[sceneIdx]
  const isLastScene = sceneIdx === SCENES.length - 1

  // Session timer
  useEffect(() => {
    if (!started) return
    sessionTimerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000)
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current) }
  }, [started])

  // Forced view lock countdown — resets to 12s on every image-full scene
  useEffect(() => {
    if (!started || scene.kind !== 'image-full') { setViewLockSeconds(0); return }
    setViewLockSeconds(12)
    const t = setInterval(() => setViewLockSeconds(s => { if (s <= 1) { clearInterval(t); return 0 } return s - 1 }), 1000)
    return () => clearInterval(t)
  }, [sceneIdx, started])

  // Hold-to-confirm helpers
  const startHold = useCallback(() => {
    if (holdTimerRef.current) return
    setHoldPct(0)
    holdTimerRef.current = setInterval(() => {
      setHoldPct(p => {
        if (p >= 100) { clearInterval(holdTimerRef.current!); holdTimerRef.current = null; return 100 }
        return p + 5
      })
    }, 80)
  }, [])
  const endHold = useCallback(() => {
    if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null }
    setHoldPct(0)
  }, [])

  const scrollTop = () => {
    setTimeout(() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 80)
  }

  const gd = { ...gameData, edgeCount: gameData.edgeCount }

  const advance = useCallback(() => {
    const next = sceneIdx + 1
    if (next >= SCENES.length) return
    setSceneIdx(next)
    setInputVal('')
    setTapCount(0)
    setBegText('')
    setBegSubmitted(false)
    setConfirmDenied(false)
    setChecksDone(new Set())
    setGirthCat('')
    setHoldPct(0)
    if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null }
    scrollTop()
  }, [sceneIdx])

  const incEdge = useCallback(() => {
    setGameData(d => ({ ...d, edgeCount: d.edgeCount + 1 }))
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Chapter progress
  const chapterNames = ['1','2','3','4','5','6','7','F']
  const chapterSceneCounts = [4, 5, 4, 6, 5, 4, 8, 3] // rough
  let chapterIdx = 0
  let chapterAccum = 0
  for (let i = 0; i < chapterSceneCounts.length; i++) {
    if (sceneIdx >= chapterAccum + chapterSceneCounts[i]) { chapterAccum += chapterSceneCounts[i]; chapterIdx++ }
    else break
  }

  if (!started) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-5 pb-10 pt-16">
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-zinc-950 p-8 mb-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 to-black pointer-events-none" />
          <div className="relative">
            <img src="/gallery/nacre/IMG_0348.jpeg" alt="Nacre" className="w-28 h-28 rounded-full object-cover mx-auto mb-5 border-2 border-rose-500/30"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <p className="text-[10px] font-bold tracking-[0.5em] text-rose-400/50 uppercase mb-2">✦ The Ultimate Session ✦</p>
            <h1 className="font-display text-4xl tracking-widest text-white mb-1 leading-none">NACRE</h1>
            <h1 className="font-display text-4xl tracking-widest text-white leading-none mb-1">VICTOIRE</h1>
            <h2 className="font-display text-2xl bg-gradient-to-r from-rose-300 to-pink-500 bg-clip-text text-transparent mb-5">ULTIMATE</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-5">The most complete experience. 7 chapters. 3 forced edges. Marking. Begging. One cum gate at the end. She controls everything.</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {CHAPTERS.map((c, i) => (
                <div key={i} className="bg-black/40 border border-white/5 rounded-xl py-2 text-center">
                  <p className="text-base">{c.emoji}</p>
                  <p className="text-[8px] text-zinc-600 uppercase tracking-wide mt-0.5">{c.name}</p>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-zinc-700 mb-5 space-y-0.5">
              <p>Strip · Mark your body · Stroke on command</p>
              <p>3 forced edges · 2 begging sessions · 1 permission</p>
              <p>{SCENES.length} scenes total</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setStarted(true); setGameData(d => ({ ...d, beganAt: Date.now() })) }}
          className="w-full py-5 bg-rose-500/20 border-2 border-rose-500/40 text-rose-200 font-black text-xl rounded-2xl tracking-wider active:scale-95 transition-all">
          🌹 BEGIN
        </button>
      </div>
    </div>
  )

  const renderSceneContent = () => {
    switch (scene.kind) {

      case 'splash':
        return (
          <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4 text-center">
            <img src="/gallery/nacre/IMG_0348.jpeg" alt="" className="w-32 h-32 rounded-full object-cover border-2 border-rose-500/30 mb-4"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            {scene.lines?.map((l, i) => (
              <p key={i} className={`font-display tracking-wider text-white ${i === 0 ? 'text-5xl' : i === 1 ? 'text-3xl bg-gradient-to-r from-rose-300 to-pink-500 bg-clip-text text-transparent' : 'text-lg text-rose-300/70 mt-2'}`}>{l}</p>
            ))}
            <button onClick={advance} className="mt-8 w-full py-5 bg-rose-500/20 border-2 border-rose-500/40 text-rose-200 font-black text-xl rounded-2xl tracking-wider active:scale-95 transition-all">
              I AM READY
            </button>
          </div>
        )

      case 'dialogue':
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-5">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`leading-relaxed text-zinc-200 ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg'}`}>
                  {interp(l, gd)}
                </p>
              ))}
            </div>
            <button onClick={advance} className="w-full py-5 bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black text-lg rounded-2xl tracking-wider active:scale-95 transition-all mt-4">
              Continue <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )

      case 'confirm': {
        if (confirmDenied) return (
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900 border border-rose-500/20 rounded-2xl p-6">
              {scene.denyLines?.map((l, i) => (
                <p key={i} className="text-rose-300 font-bold text-lg leading-relaxed">{l}</p>
              ))}
            </div>
            <button onClick={() => setConfirmDenied(false)} className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-200 font-black text-lg rounded-2xl">
              {scene.confirmLabel ?? 'I\'m ready now'}
            </button>
          </div>
        )
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg'}`}>{l}</p>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button onClick={advance}
                className="w-full py-5 bg-rose-500/20 border-2 border-rose-400/40 text-rose-200 font-black text-lg rounded-2xl active:scale-95 transition-all">
                <Check className="inline w-5 h-5 mr-2" /> {scene.confirmLabel ?? 'Yes'}
              </button>
              <button onClick={() => setConfirmDenied(true)}
                className="w-full py-4 bg-zinc-900 border border-white/8 text-zinc-500 font-bold text-base rounded-2xl active:scale-95 transition-all">
                {scene.denyLabel ?? 'Not yet'}
              </button>
            </div>
          </div>
        )
      }

      case 'slider': {
        const key = scene.sliderKey ?? 'hardness'
        const displayVal = sliderVal
        const reactionText =
          displayVal <= 3 ? 'That\'s not good enough. Keep stroking until that changes.' :
          displayVal <= 6 ? 'Getting there. She wants more from you.' :
          displayVal <= 8 ? 'Good. She\'s satisfied with that.' :
          'Perfect. Fully hard for her. Exactly right.'
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg'}`}>{l}</p>
              ))}
            </div>
            {/* Big number display */}
            <div className="text-center py-6">
              <p className={`font-black text-8xl mb-2 ${displayVal <= 3 ? 'text-blue-400' : displayVal <= 6 ? 'text-orange-400' : 'text-rose-400'}`}>
                {displayVal}
              </p>
              <p className="text-zinc-500 text-sm italic">{reactionText}</p>
            </div>
            <input
              type="range" min={scene.sliderMin ?? 1} max={scene.sliderMax ?? 10}
              value={sliderVal}
              onChange={e => setSliderVal(Number(e.target.value))}
              className="w-full accent-rose-500 h-2"
            />
            <div className="flex justify-between text-[10px] text-zinc-700">
              <span>Soft</span><span>Fully hard for her</span>
            </div>
            <button
              onClick={() => {
                setGameData(d => ({ ...d, [key]: sliderVal }))
                advance()
              }}
              className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-200 font-black text-lg rounded-2xl active:scale-95 transition-all">
              {scene.confirmLabel ?? 'That\'s my answer'} <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
      }

      case 'text-input': {
        const hasValue = inputVal.trim().length >= 1
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg'}`}>{l}</p>
              ))}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{scene.inputLabel}</p>
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={scene.inputPlaceholder ?? ''}
                className="w-full bg-zinc-900 border border-rose-500/20 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-rose-500/50"
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                if (!hasValue) return
                if (scene.inputKey) setGameData(d => ({ ...d, [scene.inputKey!]: inputVal.trim() }))
                advance()
              }}
              disabled={!hasValue}
              className={`w-full py-5 rounded-2xl font-black text-lg border transition-all active:scale-95 ${hasValue ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-zinc-900 border-white/5 text-zinc-600 opacity-50'}`}>
              Submit <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
      }

      case 'tap-n': {
        const required = scene.tapN ?? 1
        const done = tapCount >= required
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.tapLines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-lg'}`}>{l}</p>
              ))}
            </div>
            {required > 1 && (
              <div className="flex gap-2 justify-center py-4">
                {Array.from({ length: required }).map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${i < tapCount ? 'border-rose-400 bg-rose-500/20 text-rose-300' : 'border-zinc-700 text-zinc-700'}`}>
                    {i < tapCount ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                ))}
              </div>
            )}
            {done ? (
              <button onClick={advance} className="w-full py-5 bg-rose-500/20 border-2 border-rose-500/30 text-rose-200 font-black text-lg rounded-2xl active:scale-95">
                Continue <ChevronRight className="inline w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setTapCount(c => Math.min(c + 1, required))}
                className="w-full py-6 bg-zinc-900 border-2 border-rose-500/25 text-rose-300 font-black text-xl rounded-2xl active:scale-95 transition-all active:bg-rose-500/10">
                {scene.tapLabel ?? 'Done'}
              </button>
            )}
          </div>
        )
      }

      case 'pace-seq':
        return <PaceSeqScene scene={scene} gd={gd} onDone={advance} />

      case 'edge-hold':
        return <EdgeHoldScene scene={scene} gd={gd} onDone={advance} onEdge={incEdge} />

      case 'checklist': {
        const allDone = scene.checks ? checksDone.size >= scene.checks.length : false
        return (
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-xl font-bold text-white' : 'text-base'}`}>{l}</p>
              ))}
            </div>
            <div className="space-y-3 mt-2">
              {scene.checks?.map((check, i) => {
                const checked = checksDone.has(i)
                return (
                  <button key={i} onClick={() => setChecksDone(s => {
                    const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n
                  })}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      checked ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-900 border-white/6'
                    }`}>
                    <div className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all ${
                      checked ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'border-zinc-700'
                    }`}>
                      {checked && <Check className="w-4 h-4" />}
                    </div>
                    <p className={`text-sm leading-relaxed ${checked ? 'text-rose-200' : 'text-zinc-400'}`}>{check}</p>
                  </button>
                )
              })}
            </div>
            <button onClick={advance} disabled={!allDone}
              className={`w-full py-5 rounded-2xl font-black text-lg border transition-all active:scale-95 ${
                allDone ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-zinc-900 border-white/5 text-zinc-600 opacity-40'
              }`}>
              {allDone ? 'All signed. Continue →' : `${checksDone.size}/${scene.checks?.length ?? 0} signed`}
            </button>
          </div>
        )
      }

      case 'image-full':
        return (
          <div className="flex flex-col gap-5">
            {/* Image with lock overlay */}
            <div className="relative rounded-2xl overflow-hidden border border-rose-500/20">
              <img src={scene.image} alt="Nacre" className="w-full object-cover max-h-[45vh] object-top"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              {/* Force-view countdown */}
              {viewLockSeconds > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(244,63,94,0.4)' }}>
                    <Lock className="w-3 h-3 text-rose-400" />
                    <span className="text-xs text-rose-300 font-black tracking-widest">{viewLockSeconds}s</span>
                  </div>
                </div>
              )}
            </div>
            {scene.lines && (
              <div className="space-y-2">
                {scene.lines.map((l, i) => (
                  <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-xl font-bold text-white' : 'text-base text-zinc-400 italic'}`}>{l}</p>
                ))}
              </div>
            )}
            <button
              onClick={() => { if (!viewLockSeconds) advance() }}
              disabled={viewLockSeconds > 0}
              className={`w-full py-5 rounded-2xl font-black text-lg border active:scale-95 transition-all ${
                viewLockSeconds > 0
                  ? 'bg-zinc-950 border-rose-500/15 text-rose-900 cursor-not-allowed'
                  : 'bg-rose-500/15 border-rose-500/25 text-rose-300'
              }`}>
              {viewLockSeconds > 0
                ? <><Lock className="inline w-4 h-4 mr-2 text-rose-700" />She\'s making you look — {viewLockSeconds}s</>
                : <>Continue <ChevronRight className="inline w-5 h-5" /></>
              }
            </button>
          </div>
        )

      case 'beg-text': {
        const prompt = scene.begPrompt ?? ''
        const isSame = inputVal.toLowerCase().replace(/[^a-z0-9 '.,]/g, '').trim() === prompt.toLowerCase().replace(/[^a-z0-9 '.,]/g, '').trim()
        const canSubmit = inputVal.trim().length > 20
        if (begSubmitted) return (
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900/80 border border-rose-500/20 rounded-2xl p-6">
              {(scene.begResponse?.(inputVal) ?? 'Good.').split('\n').map((l, i) => (
                <p key={i} className={`leading-relaxed mb-2 ${i === 0 ? 'text-white font-bold text-xl' : 'text-zinc-300 text-base'}`}>{l}</p>
              ))}
            </div>
            <button onClick={advance} className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-200 font-black text-lg rounded-2xl active:scale-95">
              Continue <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
        return (
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 ${i === 0 ? 'text-xl font-bold text-white' : 'text-lg'}`}>{l}</p>
              ))}
            </div>
            <div className="bg-zinc-900 border border-rose-500/15 rounded-2xl p-5">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-3">Type this exactly (or close enough):</p>
              <p className="text-rose-200 font-medium leading-relaxed italic text-base">"{prompt}"</p>
            </div>
            <textarea
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Type it out…"
              rows={3}
              className="w-full bg-zinc-900 border border-rose-500/20 rounded-2xl px-5 py-4 text-white text-base focus:outline-none focus:border-rose-500/50 resize-none"
            />
            <button onClick={() => setBegSubmitted(true)} disabled={!canSubmit}
              className={`w-full py-5 rounded-2xl font-black text-lg border transition-all active:scale-95 ${canSubmit ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-zinc-900 border-white/5 text-zinc-600 opacity-40'}`}>
              I said it. Out loud.
            </button>
          </div>
        )
      }

      case 'measure': {
        const inchVal = measureVal
        const cmVal = Math.round(inchVal * 2.54 * 10) / 10
        const displayIn = `${inchVal % 1 === 0 ? inchVal.toFixed(0) : inchVal.toFixed(1)}"`
        const displayCm = `${cmVal}cm`
        const sizeText =
          inchVal < 4.5 ? 'Mine regardless of size. Obedience is what matters here.' :
          inchVal < 5.5 ? 'Average. Nothing to be ashamed of — it\'s still mine.' :
          inchVal < 6.5 ? 'Good. She\'s satisfied. A proper cock to control.' :
          inchVal < 8   ? 'Very nice. She\'s going to enjoy working with that.' :
                          'Fuck. She wasn\'t expecting that. Show-off. It\'s still hers.'
        const sizeColor =
          inchVal < 4.5 ? 'text-blue-400' :
          inchVal < 5.5 ? 'text-orange-400' :
          inchVal < 7   ? 'text-rose-400'   : 'text-purple-400'
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-base text-zinc-400'}`}>{l}</p>
              ))}
            </div>
            {/* Unit toggle */}
            <div className="flex items-center self-center rounded-2xl overflow-hidden border border-rose-500/20">
              {(['in', 'cm'] as const).map(u => (
                <button key={u} onClick={() => setMeasureUnit(u)}
                  className={`px-7 py-2.5 text-sm font-black uppercase tracking-widest transition-all ${measureUnit === u ? 'bg-rose-500/25 text-rose-200' : 'bg-transparent text-zinc-600 hover:text-zinc-400'}`}>
                  {u === 'in' ? 'Inches' : 'cm'}
                </button>
              ))}
            </div>
            {/* Big display */}
            <div className="text-center py-4 bg-zinc-900/60 rounded-3xl border border-rose-500/10">
              <p className={`font-black text-7xl sm:text-8xl tabular-nums mb-3 ${sizeColor}`}>
                {measureUnit === 'in' ? displayIn : displayCm}
              </p>
              <p className="text-zinc-500 text-sm italic px-6 leading-relaxed">{sizeText}</p>
              <p className="text-zinc-700 text-xs mt-2">{measureUnit === 'in' ? `≈ ${displayCm}` : `≈ ${displayIn}`}</p>
            </div>
            {/* Slider */}
            <div className="px-2">
              <input
                type="range" min={30} max={100} step={5}
                value={Math.round(measureVal * 10)}
                onChange={e => setMeasureVal(Number(e.target.value) / 10)}
                className="w-full accent-rose-500 h-2"
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-700">
                <span>3"</span><span>5"</span><span>7"</span><span>10"</span>
              </div>
            </div>
            <button
              onClick={() => {
                const stored = `${inchVal % 1 === 0 ? inchVal.toFixed(0) : inchVal.toFixed(1)} inches`
                setGameData(d => ({ ...d, cockLength: stored }))
                advance()
              }}
              className="w-full py-5 bg-rose-500/20 border border-rose-500/30 text-rose-200 font-black text-lg rounded-2xl active:scale-95 transition-all">
              That's my size <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
      }

      case 'girth-pick': {
        const opts = [
          { key: 'slim',       label: 'SLIM',       sub: 'Fingers overlap easily',      emoji: '🤙', col: 'border-blue-500/40 text-blue-300'   },
          { key: 'average',    label: 'AVERAGE',    sub: 'Standard comfortable grip',   emoji: '👌', col: 'border-orange-500/40 text-orange-300' },
          { key: 'thick',      label: 'THICK',      sub: 'Fingers barely close',        emoji: '✊', col: 'border-rose-500/40 text-rose-300'    },
          { key: 'very thick', label: 'VERY THICK', sub: 'Can\'t quite wrap my hand',   emoji: '💪', col: 'border-purple-500/40 text-purple-300' },
        ]
        return (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {scene.lines?.map((l, i) => (
                <p key={i} className={`text-zinc-200 leading-relaxed ${i === 0 ? 'text-2xl font-bold text-white' : 'text-base text-zinc-400'}`}>{l}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {opts.map(opt => {
                const selected = girthCat === opt.key
                const [border, textCol] = opt.col.split(' ')
                return (
                  <button key={opt.key} onClick={() => setGirthCat(opt.key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                      selected ? `bg-rose-500/10 ${border}` : 'bg-zinc-900/80 border-zinc-700/40'
                    }`}>
                    <p className="text-2xl mb-2">{opt.emoji}</p>
                    <p className={`font-black text-sm tracking-widest mb-1 ${selected ? textCol : 'text-zinc-500'}`}>{opt.label}</p>
                    <p className="text-[10px] text-zinc-600 leading-tight">{opt.sub}</p>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { if (girthCat) { setGameData(d => ({ ...d, cockGirth: girthCat })); advance() } }}
              disabled={!girthCat}
              className={`w-full py-5 rounded-2xl font-black text-lg border transition-all active:scale-95 ${
                girthCat ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-zinc-900 border-white/5 text-zinc-600 opacity-40'
              }`}>
              That's my girth <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
      }

      case 'cock-photo':
        return (
          <CockPhotoScene
            gd={gd}
            onDone={(url) => {
              if (url) setCockPhotoUrl(url)
              advance()
            }}
          />
        )

      case 'video-full':
        return <VideoFullScene scene={scene} onDone={advance} />

      case 'self-photo': {
        const stored = cockPhotoUrl
        return (
          <div className="flex flex-col gap-5">
            {stored ? (
              <>
                <div className="space-y-2">
                  {scene.lines?.map((l, i) => (
                    <p key={i} className={`leading-relaxed ${i === 0 ? 'text-rose-300 font-bold text-lg' : 'text-zinc-400 text-sm italic'}`}>{l}</p>
                  ))}
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-rose-500/25"
                  style={{ boxShadow: '0 0 30px rgba(244,63,94,0.1)' }}>
                  <img src={stored} alt="Your photo" className="w-full max-h-[38vh] object-cover object-top" />
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <span className="text-[9px] font-black tracking-[0.25em] text-rose-300 uppercase px-3 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(244,63,94,0.25)' }}>
                      Property of Nacre Victoire
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-rose-300 font-bold text-lg">You didn\'t send me a photo.</p>
                <p className="text-zinc-400 text-sm">She noticed. She'll remember that.</p>
                {scene.lines?.slice(0, 1).map((l, i) => (
                  <p key={i} className="text-zinc-500 italic text-sm">{l}</p>
                ))}
              </div>
            )}
            <button onClick={advance}
              className="w-full py-5 bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black text-lg rounded-2xl active:scale-95 transition-all">
              Continue <ChevronRight className="inline w-5 h-5" />
            </button>
          </div>
        )
      }

      case 'cum-gate':
        return <CumGateScene scene={scene} onDone={advance} />

      case 'done':
        return (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="text-6xl">🌹</div>
            <h2 className="font-display text-4xl text-white tracking-wider">DONE</h2>
            <div className="space-y-3">
              {scene.doneLines?.map((l, i) => (
                <p key={i} className={`leading-relaxed ${i === 0 ? 'text-rose-300 font-bold text-xl' : 'text-zinc-400 text-base'}`}>{l}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Time</p>
                <p className="text-2xl font-bold text-white">{fmt(sessionTime)}</p>
              </div>
              <div className="bg-zinc-900 border border-rose-500/20 rounded-2xl p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Edges</p>
                <p className="text-2xl font-bold text-rose-300">{gd.edgeCount}</p>
              </div>
            </div>
            <button onClick={() => {
              setStarted(false); setSceneIdx(0)
              setGameData({ cockLength:'', cockGirth:'', hardness:7, edgeCount:0, beganAt:0 })
              setSliderVal(7); setSessionTime(0)
            }} className="mt-4 flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-white/10 text-zinc-400 rounded-xl text-sm">
              <RotateCcw className="w-4 h-4" /> Play again
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-[195] bg-zinc-950 flex flex-col" ref={topRef}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* ── Compact sticky header ── */}
      <div className="flex-shrink-0 bg-zinc-950/98 backdrop-blur-xl border-b border-rose-500/10 px-4 pt-2 pb-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between gap-2">
          {/* Left: chapter label */}
          <div className="flex-1 min-w-0">
            <p className="text-[7px] uppercase tracking-widest text-rose-400/35 leading-none mb-0.5">Nacre Victoire · Ultimate</p>
            <p className="text-[11px] font-black text-rose-300 truncate leading-tight">{scene.chapter}</p>
          </div>
          {/* Chapter dots */}
          <div className="flex items-center gap-1">
            {CHAPTERS.map((c, i) => {
              const before = chapterSceneCounts.slice(0, i).reduce((a, b) => a + b, 0) + 2
              const isActive = sceneIdx >= before && sceneIdx < before + chapterSceneCounts[i]
              const isDone = sceneIdx >= before + chapterSceneCounts[i]
              return <div key={i} className={`rounded-full transition-all ${isDone ? 'w-1.5 h-1.5 bg-rose-500' : isActive ? 'w-2 h-2 bg-rose-400 animate-pulse' : 'w-1.5 h-1.5 bg-zinc-800'}`} />
            })}
          </div>
          {/* Right: stats + exit */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-1.5 py-0.5">
              <Zap className="w-3 h-3" />{gd.edgeCount}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">{fmt(sessionTime)}</span>
            <button
              onClick={() => {
                if (window.confirm('Leave the session? All progress will be lost.')) {
                  setStarted(false); setSceneIdx(0)
                  setGameData({ cockLength:'', cockGirth:'', hardness:7, edgeCount:0, beganAt:0 })
                  setSliderVal(7); setSessionTime(0)
                  onExit?.()
                }
              }}
              className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/50 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-zinc-500 transition-all active:scale-90"
              title="Exit game"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Scene progress bar */}
        <div className="h-0.5 bg-zinc-900 mt-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-700"
            style={{ width: `${(sceneIdx / (SCENES.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* ── Scrollable scene content ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" ref={scrollAreaRef}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
          {/* Chapter label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{scene.chEmoji}</span>
            <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 font-bold">{scene.chapter}</p>
          </div>
          {/* Scene */}
          {renderSceneContent()}

          {/* Skip button — shown on every scene except splash and done */}
          {scene.kind !== 'done' && scene.kind !== 'splash' && (
            <div className="mt-8 pt-4 border-t border-white/4 flex justify-center">
              <button
                onClick={advance}
                className="group flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:bg-white/5 active:scale-95"
              >
                <span className="text-[10px] italic text-zinc-700 group-hover:text-zinc-500 transition-colors">nacre doesn\'t approve</span>
                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 font-bold transition-colors">→ skip anyway</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
