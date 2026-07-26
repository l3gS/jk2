import WorshipPage, { type StarConfig } from './WorshipPage'

const CFG: StarConfig = {
  id:          'sky-bri',
  name:        'Sky Bri',
  displayName: { line1: 'SKY', line2: 'BRI' },
  emoji:       '☀️',
  heroGradient:     'from-sky-950 via-zinc-950 to-black',
  heroGlowRgb:      'rgba(56,189,248,0.13)',
  accentTextClass:  'text-sky-300',
  accentBgClass:    'bg-sky-500/15',
  accentBorderClass:'border-sky-500/30',
  accentFromClass:  'from-sky-200',
  accentViaClass:   'via-blue-300',
  accentToClass:    'to-cyan-400',
  country:        '🇺🇸 USA (California)',
  born:           '2000',
  nationality:    'American',
  height:         '5\'7"',
  tags:           ['American', 'Blonde', 'Busty', 'Tall', 'California', 'Social Media', 'OnlyFans', 'POV', 'Natural', 'Girlfriend Experience'],
  stats: [
    { label: 'Nationality', value: 'American 🇺🇸' },
    { label: 'Born',        value: '2000' },
    { label: 'Height',      value: '5\'7"' },
    { label: 'Origin',      value: 'California' },
    { label: 'Hair',        value: 'Blonde' },
    { label: 'Energy',      value: 'California sunshine' },
  ],
  shortBio:
    'Sky Bri is what happens when the internet\'s attention finds someone who was already impossibly pretty and working the checkout line at Trader Joe\'s. In a matter of months she went from being a grocery store employee in Lancaster, Pennsylvania to one of the most-searched names in adult entertainment — and she did it entirely on her own terms.',
  paragraphs: [
    'The trajectory is genuinely remarkable. TikTok discovered her first — a blonde, tall, effortlessly charismatic girl with a camera and no apparent filter between her brain and the record button. By the time the mainstream found her, a much larger audience had already claimed her. The crossover was inevitable and it was enormous.',
    'What Sky Bri does better than almost anyone is the illusion of proximity. She has a way of filming herself — a specific casualness, a particular lighting choice, a directness of eye contact — that makes everything feel like it was made for one person specifically. You are that person. She was talking to you. She is always talking to you.',
    'Physically, she is exactly what California summer has always promised: tall, blonde, blue-eyed, with a smile that arrives a full second before the joke does. But she\'s also sharp and funny and self-aware in a way that makes her content feel less like performance and more like hanging out with someone who happens to be stunning and who happens to know it and who isn\'t remotely sorry about it.',
    'She made the transition from social media to adult content with the kind of casual confidence that made her entire existing audience follow her over, plus an entirely new one. No apologies, no hand-wringing, no curated PR statement. Just: here I am, here\'s what I\'m doing now, keep up. The response was predictably deafening.',
    'For Sam: she\'s the impossibly pretty girl who would have been completely out of your league at Trader Joe\'s, but who is now, somehow, here — on your screen, looking directly at you, and apparently very pleased about it. You don\'t question it. You just make sure the door is locked.',
  ],
  tasks: [
    {
      emoji: '☀️',
      title: 'Go outside first — then come back',
      body: 'Before you start: step outside for five minutes. Stand in actual daylight. Think about her the entire time. California energy. Then come back inside, close the door, and let the contrast do its work. You\'ll be surprised how much hotter the screen looks after actual sun.',
      level: 1,
    },
    {
      emoji: '📱',
      title: 'Find her socials and stay there for five minutes first',
      body: 'Before any explicit content: find her public social media presence. Just look. Five minutes of the version of her the whole world gets to see. Then and only then do you open the content. The buildup is part of the experience. She designed it that way.',
      level: 1,
    },
    {
      emoji: '🏄',
      title: 'Stand up while you watch',
      body: 'For at least one full video, you stand. Feet shoulder width apart. Posture decent. Stroke standing up. California energy is not a slouching-on-the-couch vibe. If your legs give out and you have to sit — that means she won. She usually wins.',
      level: 2,
    },
    {
      emoji: '🌊',
      title: 'Say her name every time you get close',
      body: 'Every time you feel yourself approaching the edge, you say "Sky Bri" out loud clearly before you stop. Full name. Not under your breath. This happens every time. You say it, then you stop. You say it, then you stop. By the fourth time, even saying the name will make you twitch.',
      level: 3,
    },
    {
      emoji: '🔆',
      title: 'Lights fully on — no darkness allowed',
      body: 'This session runs with every light on in the room. No privacy of darkness. She films in California sunshine. You watch in California sunshine. The self-consciousness of being fully lit while you do this is part of the point. Hold eye contact with the screen the entire time.',
      level: 3,
    },
    {
      emoji: '☠️',
      title: 'The Sky Bri Tribute — all four edges, written proof',
      body: 'Four edges minimum. Between each one, write down what you were thinking at the moment you stopped — one sentence, anything, honest. After the fourth edge and your final permission, you read the four sentences back to yourself out loud. Then you\'re done. She would think this was funny. She would also be correct.',
      level: 4,
    },
  ],
  searchQuery: 'sky bri',
  galleryCats: ['boobs', 'pinup'],
  leaksTitle:  'Gallery Collection',
  leaksIntro:  'Themed gallery for your session. Blonde energy, California sunshine, all curated for you. Refresh for a new set.',
  worshipKey:  'goonit_skybri_worship_v1',
  faveKey:     'goonit_skybri_faves_v1',
}

interface Props {
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string; sourcePageUrl?: string }) => void
}

export default function SkyBri({ onSaveToVault }: Props) {
  return <WorshipPage cfg={CFG} onSaveToVault={onSaveToVault} />
}
