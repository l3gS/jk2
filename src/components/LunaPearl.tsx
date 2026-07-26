import WorshipPage, { type StarConfig } from './WorshipPage'

const CFG: StarConfig = {
  id:          'lunapearl',
  name:        'Luna Pearl',
  displayName: { line1: 'LUNA', line2: 'PEARL' },
  emoji:       '🌙',
  heroGradient:     'from-indigo-950 via-zinc-950 to-black',
  heroGlowRgb:      'rgba(99,102,241,0.18)',
  accentTextClass:  'text-indigo-300',
  accentBgClass:    'bg-indigo-500/15',
  accentBorderClass:'border-indigo-500/30',
  accentFromClass:  'from-indigo-200',
  accentViaClass:   'via-violet-300',
  accentToClass:    'to-purple-400',
  country:        '🌙 Online',
  born:           'Not publicly disclosed',
  nationality:    'Unknown',
  height:         'Not disclosed',
  tags:           ['OnlyFans', 'Leaked', 'Content Creator', 'Petite', 'Brunette', 'Exclusive Content'],
  stats: [
    { label: 'Stage Name',  value: 'Luna Pearl' },
    { label: 'X Handle',    value: '@LunaPearlx' },
    { label: 'OnlyFans',    value: 'lunapearliex' },
    { label: 'Content',     value: 'Exclusive adult content' },
    { label: 'Known For',   value: 'OnlyFans · leaked archive' },
    { label: 'Status',      value: 'Active creator' },
  ],
  shortBio:
    'Luna Pearl operates under the handles @LunaPearlx (X/Twitter) and lunapearliex (OnlyFans). She keeps her personal details private but has built a dedicated following through exclusive content on her platforms. The leaked archive is one of the most searched in her category.',
  paragraphs: [
    'Luna Pearl maintains strict privacy about her personal life — real name, age, and background remain undisclosed. What is known: she goes by @LunaPearlx on X/Twitter and lunapearliex on OnlyFans, and she\'s built a substantial following that treats her content as exactly the kind of thing you\'d search for on a site like this.',
    'The content itself is the point. Luna Pearl produces the kind of material that gets people to specifically seek out her archive rather than generic content. There\'s a reason her leaked posts get a disproportionate number of saves compared to more famous creators — the quality and the type of content she makes hit a specific target extremely well.',
    'For Sam: this page pulls from her search result archive. The gallery below will surface whatever has been indexed from her platforms. Start from the top, save anything worth keeping, and use the coomer.su search for her full archive.',
  ],
  tasks: [
    {
      emoji: '🌙',
      title: 'Watch one full video without skipping',
      body: 'Her full-length content is the point of this page. Find one video from the gallery, watch it completely without skipping to the end. Appreciate the craft before you appreciate anything else.',
      level: 1,
    },
    {
      emoji: '💜',
      title: 'Find her best photo set and save every image',
      body: 'Browse until you find the photo set that hits hardest. Save all of them. Not just the best one — all of them. You\'ll want them later. She made them knowing people would do exactly this.',
      level: 2,
    },
    {
      emoji: '🔮',
      title: 'Tribute session — one video, complete focus, full screen',
      body: 'Her best video. Full screen. No other tabs. Complete attention from start to finish. When it\'s over, you\'ve earned the save. Luna Pearl specifically and intentionally. Not incidentally.',
      level: 3,
    },
    {
      emoji: '☠️',
      title: 'Edge marathon — her archive, no finishing until the last video',
      body: 'Three of her videos back to back. You may not finish until the third one has played in full. Edge as many times as needed between them. This is what the archive is for.',
      level: 4,
    },
  ],
  searchQuery:  'luna pearl onlyfans',
  galleryCats:  ['waifu', 'neko'],
  leaksTitle:   'Leaks & Content',
  leaksIntro:   'Luna Pearl leaked content from her OnlyFans and X. Refresh for new results.',
  heroPhotoUrl: 'https://unavatar.io/twitter/LunaPearlx',
  worshipKey:   'goonit_lunapearl_worship_v1',
  faveKey:      'goonit_lunapearl_faves_v1',
  curatedXLinks: [
    'https://x.com/LunaPearlx/status/1936791820698972430',
    'https://x.com/LunaPearlx/status/1932838700162498742',
    'https://x.com/LunaPearlx/status/1928853212498542870',
    'https://x.com/LunaPearlx/status/1920155044226281803',
    'https://x.com/LunaPearlx/status/1915116988891308200',
    'https://x.com/LunaPearlx/status/1908951026516353300',
    'https://x.com/LunaPearlx/status/1904229648714887400',
    'https://x.com/LunaPearlx/status/1899869430256152000',
    'https://x.com/xx_vidz/status/2060244663303393792',
    'https://x.com/bunhubtv/status/2061840265493537048',
    'https://x.com/IISHubX/status/2056359191300723101',
    'https://x.com/lunapearl_of/status/1897468501726781400',
  ],
}

interface Props {
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string; sourcePageUrl?: string }) => void
}

export default function LunaPearl({ onSaveToVault }: Props) {
  return <WorshipPage cfg={CFG} onSaveToVault={onSaveToVault} />
}
