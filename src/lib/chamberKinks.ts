// ─── Kinky content pool for the Goon Chamber ───────────────────────────
// Centralised arrays so the chamber stays readable and content can be
// expanded freely without touching component code.

export type StrokePattern = {
  id: string;
  label: string;
  desc: string;
  /** Multiplies the base beat interval to vary the rhythm. The pacer
   *  walks through this array on a loop, giving a real "pattern" feel. */
  multipliers: number[];
};

export const STROKE_PATTERNS: StrokePattern[] = [
  {
    id: "steady",
    label: "Steady",
    desc: "Same speed, every beat. Pure metronome.",
    multipliers: [1],
  },
  {
    id: "slowfast",
    label: "Slow → Fast",
    desc: "Builds slow then explodes. Repeats.",
    multipliers: [2, 1.6, 1.2, 0.9, 0.7, 0.5],
  },
  {
    id: "edgehold",
    label: "Edge Hold",
    desc: "Stroke fast, then freeze. Don't move on the long ones.",
    multipliers: [0.7, 0.7, 0.7, 0.7, 4, 4],
  },
  {
    id: "tease",
    label: "Tease & Deny",
    desc: "Soft slow strokes with sudden bursts. Cruel.",
    multipliers: [2.2, 2.2, 0.6, 0.6, 0.6, 3.5],
  },
  {
    id: "ramp",
    label: "Endless Ramp",
    desc: "Speeds up forever — until you tap edge.",
    multipliers: [1.8, 1.5, 1.25, 1.0, 0.85, 0.7, 0.6, 0.5],
  },
  {
    id: "denial",
    label: "Denial Cycle",
    desc: "Three frenzies, then a hold. Ruined orgasms incoming.",
    multipliers: [0.5, 0.5, 0.5, 5, 0.5, 0.5, 0.5, 5],
  },
  {
    id: "hypno",
    label: "Hypno Drip",
    desc: "Slow-slow-slow. Sink in. Stop thinking.",
    multipliers: [2.5, 2.5, 2.5, 2.0],
  },
];

export const KINK_COMMANDS: string[] = [
  "Two-finger grip only. No palm.",
  "Switch hands. Right now.",
  "Stop. Hands off the cock for 10 seconds.",
  "Lick your fingers. Use spit.",
  "Edge for 30 seconds. Don't you dare cum.",
  "Stroke ONLY the head. Slow circles.",
  "Cup your balls with the other hand.",
  "Pinch a nipple while you stroke.",
  "Open your mouth. Tongue out. Pant like a slut.",
  "Slow drag — five seconds up, five seconds down.",
  "Squeeze the base. Hold. Throb for me.",
  "Eyes open. Don't look away from the screen.",
  "Spit on it. Make it messy.",
  "Stroke to the orb only. Match the beat.",
  "Tease your tip with your thumb.",
  "Bite your lip. Whimper out loud.",
  "Hands behind your head. NO touching for 15s.",
  "One full minute of frenzy. GO.",
  "Slow it WAY down. Feel every inch.",
  "Edge again. Bank another one.",
  "Beg the screen out loud. Say her name.",
  "Two strokes per beat. Catch up.",
  "Squeeze your throat lightly while you stroke.",
  "Stroke like you mean it. Pretend it's her mouth.",
  "Hold it deep. Don't move. Just throb.",
  "Ruin yourself. Edge then stop dead.",
  "Drool. Don't wipe it.",
  "Whisper 'thank you' between every stroke.",
  "Use the other hand to slap your thigh.",
  "Stroke to the moans, not the beat.",
  "Slow flick of the tip. That's all you get.",
  "Picture her smiling at how desperate you are.",
  "Press your tongue to the roof of your mouth and moan.",
  "Stop and just stare for a full breath.",
  "Stroke 10 times. Then stop. Then 9. Then 8.",
  "Stand up. Stroke standing for the next minute.",
  "Sit back. Spread your legs wide. Show off.",
  "Look down at yourself. Watch the precum drip.",
  "Spit on your palm again. It needs to be sloppy.",
  "Edge — bring it to the line, then PULL OFF.",
  "Squeeze the head until it pulses. Don't move.",
  "Three deep breaths. In through the nose, out moaning.",
  "Stroke and pinch your nipple at the same time.",
  "Slap your cock on your thigh five times. Count.",
  "Stroke with one finger and thumb. Featherlight only.",
  "Lay back. Stroke flat against your stomach.",
  "Lick your hand again. Make it wetter.",
  "Run your nails down your inner thigh. Tease yourself.",
  "Speed up to match the moans. Now match the bpm. Switch.",
  "Pull your hand off. Look at how desperate it twitches.",
  "Squeeze the base hard. Build pressure for 15 seconds.",
  "Switch to backhand grip. Awkward feels good, doesn't it?",
  "Tongue out for the next 30 seconds. No swallowing.",
  "Pinch the head between thumb and finger. Pulse only.",
  "Imagine her on top of you. Stroke at her pace.",
  "Rest both hands on your stomach. Just throb for me.",
  "Beg out loud — five times — for permission to keep going.",
  "Stroke harder than you think you should. Faster.",
  "Slow it to one stroke every three seconds. Suffer.",
  "Edge again. Bank a third. You're being good.",
  "Stop dead. Hands off. Watch the screen breathe.",
  "Two hands now. Stack them. Twist on the upstroke.",
  "Tap the head against your stomach to the beat.",
  "Whisper 'yes mistress' between every stroke. Out loud.",
];

export const PUNISHMENTS: string[] = [
  "30 second edge hold. Hands off after.",
  "Switch to your weak hand for 2 minutes.",
  "Stop completely for one full minute.",
  "Stroke at half-speed for the next 60 seconds.",
  "Refresh the wall and only stroke to the new pic.",
  "Edge twice in a row before you're allowed to move on.",
  "Slap your thigh ten times. Count out loud.",
  "Tongue out for the next minute. Drool freely.",
  "Take your hand off the cock. Just throb.",
  "Beg for permission out loud. Say it five times.",
];

export const REWARDS: string[] = [
  "Free 20 seconds of frenzy. Go wild.",
  "Both hands allowed. Use them.",
  "Speed up — stroke as fast as you can.",
  "Switch to your favourite category for 2 minutes.",
  "Pick the next mantra out loud and live by it.",
  "Skip to the next moan clip. Audio louder.",
  "Add 50 strokes to your level meter for free.",
  "Choose any position filter. Stroke to it.",
  "Take a long deep breath in — exhale moaning.",
  "Caress yourself anywhere you want for 30 seconds.",
];

export const WHISPERS: string[] = [
  "good boy…",
  "don't stop…",
  "harder…",
  "you're so close…",
  "keep going for me…",
  "such a needy slut…",
  "cum for me…",
  "not yet…",
  "edge it…",
  "deeper…",
  "yes… just like that…",
  "look at you drooling…",
  "you can't help it, can you…",
  "obedient little gooner…",
  "stroke for me, baby…",
  "again… again…",
  "hold it…",
  "almost…",
  "ruin yourself…",
  "moan louder…",
  "show me how desperate you are…",
  "make a mess…",
];

export type Achievement = {
  id: string;
  label: string;
  emoji: string;
  /** Either a stroke threshold OR an edge threshold OR a level threshold. */
  unlockStrokes?: number;
  unlockEdges?: number;
  unlockLevel?: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_beat",  label: "First Beat",   emoji: "💓", unlockStrokes: 1     },
  { id: "warm_up",     label: "Warmed Up",    emoji: "🔥", unlockStrokes: 25    },
  { id: "century",     label: "Centurion",    emoji: "💯", unlockStrokes: 100   },
  { id: "drooling",    label: "Drooling",     emoji: "💦", unlockStrokes: 250   },
  { id: "frenzied",    label: "Frenzied",     emoji: "⚡", unlockStrokes: 500   },
  { id: "marathon",    label: "Marathon",     emoji: "🏃", unlockStrokes: 1000  },
  { id: "first_edge",  label: "First Edge",   emoji: "🪜", unlockEdges:  1      },
  { id: "edge_lord",   label: "Edge Lord",    emoji: "🗡️", unlockEdges:  5      },
  { id: "edge_god",    label: "Edge God",     emoji: "👑", unlockEdges:  20     },
  { id: "level_3",     label: "Hard Mode",    emoji: "🥵", unlockLevel:  3      },
  { id: "level_5",     label: "Pounder",      emoji: "🔨", unlockLevel:  5      },
  { id: "level_8",     label: "Goon God",     emoji: "🌟", unlockLevel:  7      },
];

export const HYPNO_TRIGGERS: string[] = [
  "Sink.",
  "Drain.",
  "Empty your mind.",
  "Just stroke.",
  "Obey.",
  "Drift.",
  "Stare deeper.",
  "Let go.",
];

export function pickFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
