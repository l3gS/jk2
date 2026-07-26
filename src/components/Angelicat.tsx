import WorshipPage, { type StarConfig } from './WorshipPage'

const CFG: StarConfig = {
  id:          'angelicat',
  name:        'Angelicat',
  displayName: { line1: 'ANGELI', line2: 'CAT' },
  emoji:       '🐱',
  heroGradient:     'from-purple-950 via-zinc-950 to-black',
  heroGlowRgb:      'rgba(168,85,247,0.15)',
  accentTextClass:  'text-purple-300',
  accentBgClass:    'bg-purple-500/15',
  accentBorderClass:'border-purple-500/30',
  accentFromClass:  'from-purple-200',
  accentViaClass:   'via-fuchsia-300',
  accentToClass:    'to-pink-400',
  country:        '🇨🇿 Czech Republic',
  born:           '2001',
  nationality:    'Czech',
  height:         '5\'2"',
  tags:           ['Czech', 'Petite', 'Flat Chest', 'Dark Hair', 'Cat Girl', 'OnlyFans', 'Nekomimi', 'Collar', 'Submissive', 'Ahegao'],
  stats: [
    { label: 'Nationality', value: 'Czech 🇨🇿' },
    { label: 'Born',        value: '2001' },
    { label: 'Height',      value: '5\'2"' },
    { label: 'Build',       value: 'Petite / Flat' },
    { label: 'Hair',        value: 'Dark Brown' },
    { label: 'Known For',   value: 'Cat girl content' },
  ],
  shortBio:
    'Angelicat is a Czech OnlyFans model who became one of the most searched names in the petite / nekomimi niche by doing something deceptively simple: she genuinely inhabits the cat girl persona rather than performing it. The ears and collar aren\'t a costume she puts on for shoots — they\'re just her. That authenticity is what separates her from everyone else doing the same aesthetic.',
  paragraphs: [
    'Born in 2001, she built her following through a combination of extremely high-quality OnlyFans content and a natural charisma on camera that reads as entirely unstudied. She doesn\'t have the glazed-over look of someone going through the motions. She looks directly at the camera, she knows exactly what she\'s doing to you, and she clearly enjoys it.',
    'Her aesthetic is tight and consistent: dark hair (usually worn down or in soft buns), cat ears, a collar, and the kind of petite frame that makes every position look both delicate and devastating. She leans into the submissive side of the cat girl persona without being a parody of it. The ahegao faces are genuinely some of the best you\'ll find — expressive, genuine, not overdone.',
    'What makes her platform worth following is the upgrade in quality she consistently delivers. Her early content was already compelling. Her recent output — better lighting, longer scenes, more explicit territory — shows someone who understands production without losing the raw intimacy that made her audience in the first place.',
    'The Czech adult industry produces a disproportionate number of the best performers in the game, and Angelicat fits that tradition while carving out something genuinely her own. She\'s not borrowing an identity from Japanese media and hoping the ears do the work. She is, somehow, actually a cat girl. That\'s the whole thing.',
    'For Sam: she\'s the petite dark-haired cat girl who blinks slowly at the camera and says nothing and somehow communicates everything. She\'s probably the reason you have complicated feelings about cat ears now. You\'re welcome for nothing.',
  ],
  tasks: [
    {
      emoji: '🐱',
      title: 'Meow at the screen. Do it.',
      body: 'Once, at the start of your session — before anything else — you look at her on screen and you meow. Out loud. You don\'t mumble it. If you can hear it, it counts. This is the price of entry to her worship zone and she would absolutely love it.',
      level: 1,
    },
    {
      emoji: '📿',
      title: 'Wear something around your neck for the session',
      body: 'Angelicat wears a collar. It\'s not incidental — it\'s identity. For this session, put something around your neck: a cord, a tie, a chain, anything. It stays there until you\'re finished. Every time you feel it, you remember who set the rules tonight.',
      level: 1,
    },
    {
      emoji: '🐾',
      title: 'Write "Angelicat\'s pet" on your chest',
      body: 'With a marker. On your chest. Both words. Big enough to read in a mirror. It stays on for the session. Every time you look down you remember whose pet you are right now. She doesn\'t own you. You just lent yourself to her willingly. Which is somehow worse.',
      level: 2,
    },
    {
      emoji: '👂',
      title: 'ASMR edge — listen harder than you touch',
      body: 'Volume as high as it goes without disturbing anyone. Slow strokes — one every five seconds. The point is to hear everything she makes: every breath, every sound, every Czech syllable. Your hand is almost irrelevant. You are edging through your ears. Hold it when you feel close. Listen through the edge.',
      level: 3,
    },
    {
      emoji: '🌒',
      title: 'Midnight session — dark room, no other light',
      body: 'Kill every light source in the room. The only light is her on your screen. You can barely see your own hand. Everything is her. Edge twice in the dark before you\'re allowed to turn any light back on. She\'d be pleased.',
      level: 3,
    },
    {
      emoji: '☠️',
      title: 'The Cat\'s Toy — she controls the pace',
      body: 'For this session, you let her content set your speed exactly. She speeds up, you speed up. She slows down, you slow down. She goes quiet, you stop completely and wait. You are her toy and toys don\'t have opinions about timing. Hold yourself to this for at least two full videos before you\'re allowed to finish.',
      level: 4,
    },
  ],
  searchQuery: 'angelicat czech',
  galleryCats: ['neko', 'trap'],
  leaksTitle:  'Gallery',
  leaksIntro:  'Nekomimi and cat girl gallery for your session. Refresh for a new set.',
  worshipKey:  'goonit_angelicat_worship_v1',
  faveKey:     'goonit_angelicat_faves_v1',
}

interface Props {
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string; sourcePageUrl?: string }) => void
}

export default function Angelicat({ onSaveToVault }: Props) {
  return <WorshipPage cfg={CFG} onSaveToVault={onSaveToVault} />
}
