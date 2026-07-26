import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Loader2,
  RefreshCw,
  Flame,
  SkipForward,
  Pause,
  Play,
  Heart,
  Zap,
  Skull,
  Trophy,
  MessageCircle,
  Crown,
  ArrowUp,
  ArrowDown,
  Droplets,
  Hand,
  Lock,
  Wind,
  Check,
  Maximize2,
  Minimize2,
  Star,
  Eye,
  Brain,
  X,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { xvChannel, fetchVideoInfo, getStreamUrl, saveToDevice, type XvResult } from "../api";

// ────────────────────────────────────────────────────────────────────
// STAGE SYSTEM
// Stages are now generated dynamically from the *actual* video length
// via `buildStagesForDuration()`. Short clips get a tight 3-stage arc;
// long clips get many BUILD/EDGE/POUND/TEASE rotations before the
// final edge and cum window. Every stage carries a `kind` that maps
// back to the message bank below.
// ────────────────────────────────────────────────────────────────────
type StageKind =
  | "WARM UP"
  | "BUILD"
  | "EDGE"
  | "TEASE"
  | "POUND"
  | "EDGE FINAL"
  | "CUM WINDOW"
  | "RUIN"
  | "DENIAL"
  | "SLOW BURN"
  | "SPRINT"
  | "WORSHIP"
  | "SQUEEZE"
  | "BREATHE"
  | "CHOKE"
  | "SUFFER"
  | "HUMILIATE"
  | "PUNISH"
  | "CONFESS";

interface ChallengeStage {
  label: string;       // display label (e.g. "EDGE #2")
  kind: StageKind;     // category for messages, color, instruction
  instruction: string;
  weight: number;      // share of total stage time (sums to 1.0)
  color: string;
}

const STAGE_TEMPLATES: Record<
  StageKind,
  { instruction: string; color: string }
> = {
  "WARM UP":    { instruction: "Slow strokes. One every two seconds. Just look.",                     color: "from-pink-500 to-rose-500" },
  "BUILD":      { instruction: "Pick up the pace. Match her rhythm on screen.",                        color: "from-rose-500 to-pink-500" },
  "EDGE":       { instruction: "When you feel close — STOP. Hands off until the timer ends.",          color: "from-orange-500 to-amber-500" },
  "TEASE":      { instruction: "Light touches only. No grip. Just fingertips.",                        color: "from-purple-500 to-fuchsia-500" },
  "POUND":      { instruction: "Full speed. No mercy. Watch every thrust.",                             color: "from-pink-500 to-rose-600" },
  "EDGE FINAL": { instruction: "Last edge. Hold it. Do NOT cum yet.",                                   color: "from-amber-500 to-pink-600" },
  "CUM WINDOW": { instruction: "🔥 GO. Cum NOW. While the video plays. Do not stop watching.",          color: "from-pink-600 to-pink-600" },
  "RUIN":       { instruction: "Stroke to the absolute brink — then LET GO. Don't touch. Watch it ruin.", color: "from-red-500 to-rose-700" },
  "DENIAL":     { instruction: "Hands. Off. Completely. No touching. Just watch and suffer.",           color: "from-zinc-600 to-slate-700" },
  "SLOW BURN":  { instruction: "One stroke every four seconds. Count it out. No faster.",               color: "from-violet-500 to-purple-700" },
  "SPRINT":     { instruction: "ABSOLUTE MAX SPEED for 15 seconds — then hands off. NOW.",              color: "from-red-500 to-orange-500" },
  "WORSHIP":    { instruction: "Cup him in both hands. Don't stroke. Just hold and worship the screen.", color: "from-yellow-500 to-amber-600" },
  "SQUEEZE":    { instruction: "Full grip, squeeze as hard as you can. Hold. Release. Repeat.",         color: "from-fuchsia-600 to-pink-700" },
  "BREATHE":    { instruction: "Stroke ONLY on the inhale. Freeze completely on the exhale.",           color: "from-sky-500 to-blue-600" },
  "CHOKE":      { instruction: "Tight grip just on the head. Tiny pulses only. No slide.",             color: "from-rose-600 to-red-700" },
  "SUFFER":     { instruction: "You are one stroke from the edge. Barely move. Suffer for me.",        color: "from-amber-600 to-red-600" },
  "HUMILIATE":  { instruction: "No touching. Sit with your hands on your thighs. Say it out loud.",    color: "from-zinc-700 to-slate-600" },
  "PUNISH":     { instruction: "Punishment strokes. Follow every instruction precisely. No mercy.",     color: "from-red-700 to-zinc-800" },
  "CONFESS":    { instruction: "Out loud. Every word. Don't you dare say it in your head.",             color: "from-violet-700 to-purple-800" },
};

// Aim for ~30 seconds per stage. Clamp 3..40.
function buildStagesForDuration(durSec: number): ChallengeStage[] {
  const safeDur = Number.isFinite(durSec) && durSec > 0 ? durSec : 240;
  const target = Math.max(3, Math.min(40, Math.round(safeDur / 30)));

  const stages: ChallengeStage[] = [];
  const push = (label: string, kind: StageKind) =>
    stages.push({
      label,
      kind,
      instruction: STAGE_TEMPLATES[kind].instruction,
      color: STAGE_TEMPLATES[kind].color,
      weight: 0,
    });

  push("WARM UP", "WARM UP");
  // Reserve EDGE FINAL + CUM WINDOW at the tail
  const middleCount = Math.max(0, target - 3);
  // 40-entry cycle — includes all 19 stage types. EDGE appears roughly every
  // 4th slot to build anticipation. New extreme types (HUMILIATE/PUNISH/CONFESS)
  // sprinkled in the second half so they appear after the session is well established.
  const cycle: StageKind[] = [
    "BUILD",     "EDGE",      "SLOW BURN", "SPRINT",    "DENIAL",
    "POUND",     "EDGE",      "TEASE",     "CHOKE",     "SQUEEZE",
    "BUILD",     "EDGE",      "WORSHIP",   "BREATHE",   "POUND",
    "EDGE",      "CONFESS",   "SUFFER",    "RUIN",      "TEASE",
    "POUND",     "EDGE",      "BUILD",     "HUMILIATE", "CHOKE",
    "SQUEEZE",   "SPRINT",    "EDGE",      "BREATHE",   "POUND",
    "PUNISH",    "EDGE",      "SLOW BURN", "DENIAL",    "BUILD",
    "CONFESS",   "EDGE",      "HUMILIATE", "WORSHIP",   "POUND",
  ];
  let edgeNum = 1;
  for (let i = 0; i < middleCount; i++) {
    const k = cycle[i % cycle.length];
    if (k === "EDGE") {
      push(`EDGE #${edgeNum}`, "EDGE");
      edgeNum++;
    } else {
      push(k, k);
    }
  }
  push(`EDGE #${edgeNum} — FINAL`, "EDGE FINAL");
  push("CUM WINDOW", "CUM WINDOW");

  // Weight per kind — heavier = more time in that stage. Sprint/Ruin are short
  // by design; Pound and CumWindow get the longest slices.
  const KIND_WEIGHT: Record<StageKind, number> = {
    "WARM UP":   1.0,
    "BUILD":     1.2,
    "EDGE":      0.8,
    "TEASE":     1.0,
    "POUND":     1.5,
    "EDGE FINAL":1.0,
    "CUM WINDOW":1.4,
    "RUIN":      0.6,
    "DENIAL":    0.9,
    "SLOW BURN": 1.1,
    "SPRINT":    0.5,
    "WORSHIP":   0.8,
    "SQUEEZE":   0.9,
    "BREATHE":   1.0,
    "CHOKE":     0.9,
    "SUFFER":    0.8,
    "HUMILIATE": 0.9,
    "PUNISH":    0.7,
    "CONFESS":   0.8,
  };
  let total = 0;
  for (const s of stages) {
    s.weight = KIND_WEIGHT[s.kind];
    total += s.weight;
  }
  for (const s of stages) s.weight = s.weight / total;
  return stages;
}

// Initial fallback stages used before a real video duration is known.
const DEFAULT_STAGES: ChallengeStage[] = buildStagesForDuration(240);

// ────────────────────────────────────────────────────────────────────
// summarizeTitle()
// Small heuristic that turns a raw xvideos title into a one-line teaser
// for the boy. Detects subject (she/he/they), the act (pounded, riding,
// sucking, etc), and any toy/object (dragon dildo, fucking machine,
// strap-on, …) and stitches them into a short Mistress-voice line.
// Never returns more than ~12 words. Falls back to a generic prompt
// when nothing matches.
// ────────────────────────────────────────────────────────────────────
function summarizeTitle(rawTitle: string): string {
  const t = (rawTitle || "").toLowerCase();
  if (!t.trim()) return "Filthy. Press play and obey.";

  // Subject
  let subject = "She";
  if (
    /\b(femboy|trap|sissy|crossdress|crossdresser|cd\s|twink|guy|boy|him|his|dude|stud)\b/.test(
      t,
    )
  ) {
    subject = "He";
  }
  if (/\b(couple|they|them|two\s*girls|lesbian)\b/.test(t)) subject = "They";

  // Object / toy. First match wins so we list the most specific ones first.
  const objects: [RegExp, string][] = [
    [/dragon\s*(dildo|cock)|bad\s*dragon/, "a dragon dildo"],
    [/horse\s*(dildo|cock)/, "a horse dildo"],
    [/tentacle/, "tentacles"],
    [/fucking\s*machine|fuck\s*machine|sex\s*machine/, "a fucking machine"],
    [/butt\s*plug|buttplug/, "a fat butt plug"],
    [/anal\s*bead/, "anal beads"],
    [/strap[\s-]?on/, "a strap-on"],
    [/fleshlight|onahole|stroker/, "a stroker toy"],
    [/vibrator|wand|magic\s*wand/, "a vibrator"],
    [/huge\s*(cock|dick)|big\s*black\s*cock|bbc/, "a huge cock"],
    [/dildo/, "a big dildo"],
    [/cucumber|banana|fruit/, "something filthy"],
  ];
  let object: string | null = null;
  for (const [re, name] of objects) {
    if (re.test(t)) {
      object = name;
      break;
    }
  }

  // Act
  const acts: [RegExp, string][] = [
    [/gangbang|train\b|gang\s*bang/, "getting gangbanged"],
    [/threesome|3some|trio/, "in a messy threesome"],
    [/pound|slam|ramm|destroy|wreck/, "getting pounded"],
    [/ride|riding|cowgirl|bouncing/, "riding"],
    [/deep\s*throat|deepthroat|throat\s*fuck/, "getting throatfucked"],
    [/blow\s*job|blowjob|sucking|suck\b/, "sucking cock"],
    [/anal|ass\s*fuck|ass\s*pound|booty/, "taking it in the ass"],
    [/creampie|cream\s*pie/, "getting creampied"],
    [/cumshot|cum\s*shot|facial|load\s*on/, "taking a load"],
    [/squirt/, "squirting everywhere"],
    [/fingering|finger\b/, "fingering"],
    [/masturbat|jerk|stroking/, "masturbating"],
    [/handjob|hand\s*job/, "giving a handjob"],
    [/footjob|foot\s*job/, "giving a footjob"],
    [/lick|eating|tongue/, "getting licked"],
    [/edge|edging|tease/, "being edged"],
    [/spank|whip|tied|bondage|bdsm|sub|domme|dom\b/, "getting dominated"],
    [/breed|breeding|impreg/, "getting bred"],
    [/sissy\s*(train|hypno)/, "getting sissy-trained"],
    [/fuck|fucking|sex/, "getting fucked"],
  ];
  let act: string | null = null;
  for (const [re, name] of acts) {
    if (re.test(t)) {
      act = name;
      break;
    }
  }

  // Compose
  if (act && object) return `${subject} is ${act} with ${object}.`;
  if (act) return `${subject} is ${act}.`;
  if (object) return `${subject} is playing with ${object}.`;

  // Last-resort flavour pings
  if (/solo|alone/.test(t)) return `${subject} is gooning solo for you.`;
  if (/lingerie|stockings|panties|fishnet/.test(t))
    return `${subject} is teasing in lingerie.`;
  if (/shower|bath|wet/.test(t)) return `${subject} gets wet and filthy.`;
  if (/public|outdoor|park|beach/.test(t))
    return `${subject} doing it out in the open.`;
  if (/femboy|trap|sissy/.test(t))
    return `${subject}'s a sissy in heat.`;
  if (/asian|japanese|korean|chinese|hentai|anime/.test(t))
    return `Filthy anime energy. Just watch.`;

  return "Filthy little scene. Press play and obey.";
}

const FORFEITS = [
  'Beg out loud. "Please let me cum, Mistress."',
  "Slap your cock 5 times. Hard. Count out loud.",
  "Edge for 30 extra seconds. Hands off the whole time.",
  "Lick your fingers and use only them for the next minute.",
  "Squeeze your balls. Tight. Hold for 10 seconds.",
  "Talk dirty to her on screen. Out loud. Filthy.",
  "Spit in your hand. Use only that. No re-spitting for 60 seconds.",
  "Slow down to 1 stroke every 5 seconds for the next minute.",
  "Restart the current stage from zero. Mistress is disappointed.",
  "Compliment her body out loud. Specific. Filthy. Five things.",
  "Hands behind your head for 30 seconds. He throbs alone.",
  "Smack your inner thigh 10 times. Both sides.",
  "Stand up and stroke standing for 60 seconds. No leaning.",
  "Edge twice in the next two minutes. No exceptions.",
  "Lick your own cum-slick palm clean. Now.",
  "Drool a long string onto your cock. Watch it fall.",
  "Beg her by name. 'Please [her name on screen], let me cum.'",
  "Pinch both nipples for 20 seconds while edging.",
  "Switch to your weaker hand for the next stage.",
  "Hump the air for 30 seconds. No hand contact.",
  "Choke up to just the head for 60 seconds straight.",
  "Tongue out for the next minute. Don't pull it in.",
  "Add 60 seconds to the FINAL edge tonight.",
  "Whimper your boy-name out loud: 'I'm gooner {name}.'",
  "Get on your knees for the next 30 seconds. Stroke from there.",
  "Take a long lick of your own pre-cum off your fingertip.",
  "No moaning for the next 60 seconds. Hold it all in.",
  "Now nothing BUT moaning for the next 60 seconds. Loud.",
  "Edge yourself with one finger only for 45 seconds.",
  "Slap your cock against your thigh, alternating sides, 20 times.",
];

// Channel slug to scrape on xvideos. Every video uploaded by this
// channel gets pulled in via /api/xvchannel — no keyword search.
const CREAMY_CHANNEL = "creamyspot";

// How long the "selecting" screen stays up. We hold here for ~14s so
// the user gets a slow phase-in/out reveal of thumbnails before locking.
const SELECT_MIN_MS = 14000;
// Cross-fade interval between the rotating thumbnail tiles. ~700ms gives
// each thumb time to fade in, breathe, and fade out — feels like scanning.
const FLASH_INTERVAL_MS = 700;

// ────────────────────────────────────────────────────────────────────
// MESSAGE BANK — kinky goon-prompts, grouped by stage KIND.
// `{name}` is replaced with the boy's name (default: Sam).
// We pull from these pools to schedule a stream of taunts during the
// challenge, scaled to the video's actual duration.
// ────────────────────────────────────────────────────────────────────
// 50 unique lines per stage. Each stage's pool is *internally escalating* —
// early entries set the tone, mid entries push harder, last entries are
// the most intense / climactic for that stage. Across stages the whole
// arc builds from gentle WARM UP → frenzied POUND → release in CUM WINDOW.
// {name} is interpolated at runtime with the boy's chosen name (default Sam).
const MESSAGES: Record<StageKind, string[]> = {
  "WARM UP": [
    "Mmm hi {name} 🌸 crawled back to me already, didn't you?",
    "Good boy. Phone down. Pants off. Eyes on the screen.",
    "Easy strokes, {name}. We've got all night to break you.",
    "Look at her. She already knows you belong to her.",
    "Don't rush. Today is about obedience, not orgasm.",
    "Feel that warmth blooming in your cock? That's mine, {name}.",
    "Take one deep breath and get rock hard for Mistress.",
    "One stroke per breath. Slow. Steady. Good pet.",
    "Be honest — you couldn't wait to be my slut again, could you?",
    "Soft hands. We're just saying hello to that needy little cock.",
    "She's all yours tonight. So is the leash. So are the rules.",
    "Drip a little spit on him. Slow it down. Long road ahead.",
    "I want you panting like a dog before we even start.",
    "Look how wet she already is. She's wetter than your hand.",
    "You're already leaking, aren't you, {name}? Filthy thing.",
    "Slow strokes. Tip only. Be a good little gooner.",
    "Stare at her mouth. Imagine it wrapped around you, sucking.",
    "Two-second strokes, {name}. Don't you dare cheat me.",
    "If you speed up early I'll know. I always know.",
    "Out loud: 'I belong to creamy spot.' Say it.",
    "Out loud, {name}: 'Thank you Mistress for letting me goon tonight.'",
    "Lube up. Spit, oil, lotion — I don't care. Get him slick.",
    "Pull your shirt off. I want you exposed for me.",
    "Spread your legs. Sit like the slut you are.",
    "Drag one finger from your base to your tip. Slowly.",
    "Open your mouth and pant. Let me hear how needy you are.",
    "Look at that twitch already. He's begging before we begin.",
    "Half-grip only. Don't get greedy this early.",
    "Wrap two fingers around the head. Slow lazy circles.",
    "Hold him still. Just hold. Feel him throb in your palm.",
    "Whisper her name out loud. Earn the right to touch yourself.",
    "Match her breathing on screen. Slow in. Slow out.",
    "Stroke UP only. Down strokes are a privilege you haven't earned.",
    "Twist on the upstroke. Slow. Deliberate. Cruel.",
    "Show me you can be gentle before I let you be rough.",
    "Look at her body, {name}. Map every curve with your eyes.",
    "Bring two fingers to your lips. Suck them. Then touch yourself.",
    "Trace your collarbone. Then your nipple. Then him. Slowly.",
    "Smell your hand after the first stroke. Inhale yourself, gooner.",
    "Roll your hips once for every stroke. Sync with her on screen.",
    "Squeeze your thighs together. Build heat before we move.",
    "Eyes wide. Don't blink for thirty seconds. Worship her.",
    "Tilt your head back, mouth open, and stroke blind for ten.",
    "Lift your shirt and graze your stomach with your fingertips.",
    "Brush the head with the inside of your wrist. So gentle.",
    "Hold him at the base and just bounce him in your palm.",
    "Curl your toes. Let your whole body get tense and ready.",
    "Stretch your arms above your head, then let them fall to him.",
    "Imagine her purring 'good boy' into your ear. Stroke to it.",
    "Last gentle moment, {name}. Soak it in. The pace climbs from here.",
  ],
  "BUILD": [
    "Pick it up, {name}. Match her hips on screen.",
    "Faster. Don't be shy now, slut.",
    "There he is — twitching for Mistress already.",
    "Watch her ride. That's how you'd want her bouncing on you.",
    "Don't look away. Eyes on her ass. Don't blink.",
    "Squeeze the base. Build that pressure for me.",
    "Mouth open, {name}. Pant for me like a needy little pup.",
    "Faster wrist. I can hear you slacking, lazy boy.",
    "She's moaning for you. Earn it. Match her.",
    "You like being told exactly what to do, don't you?",
    "Tighter grip. Don't get lazy on Mistress.",
    "Up the pace every single time she moans.",
    "Stroke to the beat of her hips. No cheating, gooner.",
    "Lick your hand. Give him some shine. Get sloppy.",
    "Look at that creamy spot. That could be you painted on her.",
    "Don't you dare get close yet. We're just warming up.",
    "Whine for me, {name}. Out loud. Let me hear it.",
    "Pump until your arm aches. Then pump more.",
    "Imagine her bouncing on YOUR cock. Same exact rhythm.",
    "If your stroke isn't matching the screen — fix it now.",
    "Good. Good boy. Keep going. Don't stop til I say.",
    "Don't get cocky. We're nowhere near done with you.",
    "Drool. Spit. Drip. I want him soaked.",
    "Both hands. One on the shaft, one on the balls.",
    "Tug your balls down as you stroke. Slow but firm.",
    "Bite your lip and pump faster. I see you holding back.",
    "She's a goddess. You're a worshipper. Stroke for her.",
    "Match the slap of skin on screen with the slap of your wrist.",
    "Pump like you're trying to impress her. Because you are.",
    "Sweat for me, {name}. I want you glistening.",
    "Shake your hips while you stroke. Fuck the air.",
    "Picture her riding you reverse cowgirl. Pump faster.",
    "Tell yourself out loud: 'I am Mistress's gooner.'",
    "Hump your fist. Let your hips do half the work.",
    "Pulse the squeeze on every upstroke. Throb-strokes.",
    "Slap your cock against your stomach three times. Then resume.",
    "Look at how she takes it. Now match her energy.",
    "Twist on every stroke. Wrist work, gooner.",
    "Pump faster on the in-screen thrusts. Slower on her moans.",
    "Squeeze every fourth stroke and HOLD for one beat. Repeat.",
    "I can see your jaw tightening. Good. Lean into it.",
    "Pump to her gasps. Pause when she pauses. Obey her body.",
    "Chant her name in your head. One whisper per stroke.",
    "Tilt your head down. Watch your fist work. Get hypnotized.",
    "Lock your eyes on the wettest part of the screen and pump.",
    "Pulse your cheeks closed and clench your ass. Build pressure.",
    "Fast for ten. Slow for three. Fast for ten. Build that climb.",
    "Whisper 'harder, harder' to yourself. Then obey it.",
    "Sweat on your forehead means you're finally working for it.",
    "Last build set, {name} — push to the edge of the edge.",
  ],
  "EDGE": [
    "STOP. Hands. Off. NOW, {name}.",
    "Don't you DARE finish, slut.",
    "Air strokes only. Show me your discipline.",
    "Squeeze the base hard. Crush it. Hold.",
    "Pulse it. Don't move it. Just throb.",
    "Throb for me, {name}. I want to watch it twitch by itself.",
    "Count to fifteen in your head. Painfully slow.",
    "Look — even she's smirking at how desperate you look.",
    "Another edge for Mistress. Many more to come, gooner.",
    "If you came right now, you'd be in so much trouble.",
    "Breathe through your nose. In four. Out four.",
    "Let the throb fade before you even think about touching again.",
    "Good. Good boy. Edges are for obedient gooners.",
    "Whisper 'thank you Mistress' for the edge.",
    "Do NOT slip. Hands stay off until I say so.",
    "Edge again, {name}. Take him to the cliff. Don't jump.",
    "Closer. Closer. STOP. Hands UP.",
    "Don't you DARE cross that line for me.",
    "Hand off the second you feel it rising in your balls.",
    "I can see your hips lifting. Calm down, slut.",
    "If you came right now you'd ruin EVERYTHING.",
    "Hold. Throb. Breathe. Hold.",
    "Such a needy boy. Look at you, twitching for nothing.",
    "Squeeze and release. No motion. Just pulse.",
    "Mouth open. Pant. Show me you're suffering for me.",
    "Be loud. Whimper if you need to. I love that sound.",
    "Excellent control, {name}. I'm watching every twitch.",
    "Wait for the throb to die. THEN we resume.",
    "How many edges have I pulled out of you tonight, gooner?",
    "Don't lose count, {name}. I'm tracking every. single. one.",
    "Hands behind your head. He throbs alone now.",
    "Tongue out. Drool while he twitches. Show the desperation.",
    "Beg out loud: 'Please Mistress, can I cum?' She'll say no.",
    "Slap your inner thigh. Reset the urge.",
    "Pinch your nipple. Hard. Distract yourself.",
    "Let go and grip the chair. White knuckles only.",
    "Edge denied, {name}. The throb is your reward.",
    "Don't even rest your hand near him. Hands UP.",
    "Stare at her face. Imagine her saying 'no' to you.",
    "Every edge is a gift. Say thank you. Out loud.",
    "Cross your ankles. Tense your thighs. Hold.",
    "If you twitch toward him I add ten seconds.",
    "She doesn't let her gooners cum. You think you're special?",
    "Lift your hips off the seat. Hold until the timer ends.",
    "Now FREEZE. Statue. Don't even breathe loud.",
    "Hover your hand an inch above him. Feel the heat radiate.",
    "Repeat to yourself: 'I exist to be denied.' Say it again.",
    "Imagine her finger on your lips: 'shhh, not yet.'",
    "If you make it through this without cheating, I'll be so proud.",
    "Edge banked, {name}. The next one is going to be even crueler.",
  ],
  "TEASE": [
    "Fingertips only, {name}. Tease yourself like she would.",
    "Tip work. Just the head. Soft circles.",
    "Light circles. Pretend it's her tongue running over you.",
    "Don't grip. I said FINGERTIPS, gooner.",
    "Trace him like you'd trace her body.",
    "Drag one finger up the underside. Slow as honey.",
    "Imagine her whispering: 'be patient, baby.'",
    "Soft. Cruel. Frustrating. That's the rule.",
    "Frustrating, isn't it? That's the entire point, slut.",
    "If you grip, you restart this stage from zero.",
    "Almost a tickle. Make it lighter than that.",
    "She likes watching you suffer for her, {name}.",
    "Tease the frenulum. One finger. Tiny circles.",
    "Drip more spit. Just enough to glisten the head.",
    "Be patient, {name}. Mistress is proud of you.",
    "One finger only. Trace the ridge. Round and round.",
    "Pretend her hair is brushing him. That's the touch.",
    "Walk two fingers up the shaft. Stop at the tip. Repeat.",
    "Lick your palm. Now hover it just above him. No contact.",
    "Drum your fingers on the head. Soft. Like rain.",
    "If you accidentally grip — hands off for ten seconds.",
    "Pinch the very tip between two fingers. Roll it.",
    "Brush the underside with your knuckle. So light it tickles.",
    "Map every inch with one finger. He's hers — explore for her.",
    "Tease your nipples too. She wants you all sensitive.",
    "Lick the tip of your finger. Now circle his tip with it.",
    "Slower. Slower than that. Make him beg for more pressure.",
    "If he's not throbbing for more — you're going too fast.",
    "Tease for thirty seconds without touching the shaft.",
    "Stare at her on screen. Mirror her movements with your fingers.",
    "Trace a slow figure-eight around the head. Just one finger.",
    "Hover. Don't touch. Just feel the heat coming off him.",
    "Use the back of your nail. So light it makes him shiver.",
    "Run a single fingertip along the seam underneath.",
    "Tap the tip with your finger. One tap per second. Tease.",
    "Pretend her breath is on him. Lean in. Don't touch.",
    "Twist a single finger around the head like a screw cap.",
    "Walk your fingers down the shaft like spider legs.",
    "Drag the back of your hand across the tip. Once. Wait.",
    "Open and close your fist around him without touching. Tease.",
    "Use a feather-light grip and just rest. No movement.",
    "Squeeze, release, hover. Squeeze, release, hover. Repeat.",
    "Listen to her moan and match it with your fingertip taps.",
    "Tease until your hips lift on their own. Then tease more.",
    "Trace a heart on the head with your fingertip. For her.",
    "Trace 'MINE' on the shaft with one finger. Slow letters.",
    "Pretend you're petting him to sleep. Slow, light, mean.",
    "If a real stroke slips out — start the count over.",
    "Make him beg with his throbs. Don't give in until I say.",
    "Last tease, {name}. He'll be a wreck by the time we move on.",
  ],
  "POUND": [
    "FULL SPEED, {name}. Don't you dare slow down.",
    "Don't you DARE ease off. POUND.",
    "Keep up with him on screen. Match thrust for thrust, gooner.",
    "Wet. Loud. Sloppy. That's how Mistress wants it.",
    "Two hands if you have to. GO. GO. GO.",
    "She's getting fucked for you. Honor that with your wrist.",
    "Don't blink. Eyes on every thrust. Memorize it.",
    "Faster. FASTER, {name}. Make your hand a blur.",
    "If you stop I add another edge to the count.",
    "Imagine that's you balls-deep inside her.",
    "Spit again. Get sloppier. I want to hear it.",
    "Pump until your wrist BURNS, gooner.",
    "Don't hold back the noises. Moan loud for me.",
    "I want your thighs shaking by the end of this stage.",
    "Look at her face when she takes it. Memorize it.",
    "Pound it like you actually mean it. No mercy.",
    "Don't even THINK about cumming yet, slut.",
    "Good. Sloppy. Loud. That's MY boy.",
    "Drool on him if you need more wet. Use everything.",
    "If you fuck up the rhythm — start over from zero.",
    "Two hands stacked. Pump from base to tip. Full length.",
    "Hump up into your fist. Make your hips do half the work.",
    "Switch hands every time she moans. Keep him guessing.",
    "Squeeze on every other stroke. Pulse-pump-pulse.",
    "Faster than the screen. Race her boyfriend. Beat him.",
    "If you go quiet I add a forfeit. MOAN.",
    "Pretend she's whispering 'harder' in your ear. Obey.",
    "Pump to the wet sounds on screen. Match every slap.",
    "Stand up. Stroke standing. I want your knees weak.",
    "Get angry with him. Pump like you're punishing him.",
    "Slap him against your stomach between strokes. Then pound.",
    "Choke up high. Just the head. Pound the head.",
    "Now full grip, full length. Faster than that.",
    "Look at how soaked she is. You did that with your eyes.",
    "Pump like she's about to leave the room. Don't let her.",
    "Curl forward. Get over him. Pound from above.",
    "Make a fist so tight it hurts. Pump through the burn.",
    "I want sweat dripping down your chest, {name}.",
    "Bark her name. Loud. Once per second. Don't stop pumping.",
    "Picture cumming inside her. NOT YET. Just picture.",
    "Tongue out, eyes back, fist flying. That's the look I want.",
    "Pump so hard the bed/chair shakes. Earn the noise.",
    "Bite down on a pillow if you have to. POUND.",
    "Match her loudest moan in volume. Beat it if you can.",
    "Faster than your heartbeat. PUMP.",
    "Gooner mode unlocked. No brain. Just fist. Just her.",
    "Last sprint of this stage — leave nothing in the tank.",
    "Slam your hips up to meet your fist. Both ends working.",
    "Pump to the edge of the edge. Don't fall over yet.",
    "I can see you're close, {name}. Hold the line. Pound and pray.",
  ],
  "EDGE FINAL": [
    "Last edge of the night, {name}. The hardest one.",
    "Right to the line. Then HANDS OFF. Now.",
    "Do NOT cum yet, slut. Almost there.",
    "I see how close you are. HOLD. Hold for Mistress.",
    "Twitch for me. Don't move it. Just twitch.",
    "Think of how good the release will feel after this.",
    "But not yet. Not. Yet. Hold.",
    "Squeeze the base. Crush the urge down.",
    "Breathe through it, baby gooner.",
    "Whisper 'please Mistress' three times. Out loud.",
    "Earn it. Last hurdle. Don't fail me now.",
    "Tongue out. Beg without words.",
    "If you fail here, NO cum tonight, {name}.",
    "Look at her one more time. Hold for her.",
    "Final test, {name}. Don't you dare disappoint me.",
    "You've earned this release. But hold a little longer.",
    "One more breath. Then the cum window opens.",
    "Hands shaking? Good. That's how I know you obeyed.",
    "Last chance to prove you're worthy of cumming.",
    "Twitch ten times before you touch again. Count them.",
    "Promise her you'll cum harder than ever. Then hold.",
    "Bite the inside of your cheek. Channel the urge.",
    "If your hand drifts toward him — restart this edge.",
    "Mistress is so close to letting you cum. Be perfect.",
    "Beg one more time: 'May I please cum, Mistress?'",
    "Now wait. Wait. Wait. The window opens when I say.",
    "Eyes on her. Memorize her face. You'll cum to it in seconds.",
    "Hover your hand over him and let him throb up to meet it.",
    "Count down from twenty in your head. Slowly.",
    "If you cum before I say go, the count resets to zero.",
    "Picture the explosion. Hold it back. Hold it back.",
    "Your balls are screaming. Mistress doesn't care. HOLD.",
    "Squeeze your eyes shut. Hold for ten. Open them on her.",
    "Tense every muscle. Then release everything but your grip.",
    "Whimper my name. Whimper it. Beg with your throat.",
    "I love how broken you sound right now. Hold a little more.",
    "One. Last. Breath. Don't cum on the exhale.",
    "I'm letting you cum, {name}. But not. just. yet.",
    "Hands off. Throb alone. Earn the green light.",
    "Look down at him. Watch him bounce by himself. Hold.",
    "Almost. Almost. Almost. Be patient, gooner.",
    "If you can hold ten more seconds, I'll let you blow.",
    "Five. Four. Three. Hold. Hold. Hold.",
    "Two. One. Hands STILL OFF until I say go.",
    "You've been such a perfect filthy gooner tonight. Almost there.",
    "Mistress is opening the window, {name}. Get ready.",
    "Beg one final time. 'Please let your slut cum.' Out loud.",
    "Permission incoming, {name}. Cock at attention. Wait for it.",
    "On my mark, you blow. Not before. Hands at the ready.",
    "GET READY. The cum window opens NOW. 💦",
  ],
  "CUM WINDOW": [
    "GO. CUM NOW, {name}. 🔥 You earned it.",
    "Empty EVERYTHING. Don't hold a single drop back.",
    "Eyes on her face. Paint her in your head.",
    "Moan LOUD. I want to hear how good Mistress made you cum.",
    "Pump it out. Every. Last. Drop. For me.",
    "Good boy. Good fucking boy. Cum for Mistress.",
    "Don't stop watching. Eyes locked on her until you're done.",
    "Stroke through it. Don't quit when it gets sensitive.",
    "Say 'thank you Mistress' as you cum. Out loud.",
    "Make a mess for me, {name}. Bigger than last time.",
    "She earned this load. Give it to her.",
    "Cum harder than ever before. Prove your devotion.",
    "Squeeze every last drop out of him. Milk yourself.",
    "Don't you dare stop early, gooner.",
    "Yes. Yes. Yes. Empty. 💦",
    "Mmm that's it. Such a good boy. 🌸",
    "Catch it on your tongue if you can. Show me.",
    "Lick your fingers clean after. That's the rule.",
    "Cum on your stomach. Leave it there for a moment.",
    "Pump through the over-stimulation. Don't tap out early.",
    "One more stroke after you finish. Then ten more.",
    "Whimper for me as you empty. Whimper my name.",
    "You belong to creamy spot. Cum to that thought.",
    "Don't waste a drop. Mistress counts every one.",
    "Aim for her face on screen. In your head, you hit it.",
    "Cum and keep stroking. Don't stop until I say.",
    "Be a fountain. Be a mess. Be MINE.",
    "That's a perfect load, gooner. Mistress is proud.",
    "EXPLODE for me, {name}. Loud. Wet. Filthy.",
    "Empty your soul into your hand. Every drop is hers.",
    "I want it to hit your chin. Aim high, slut.",
    "Pump faster as you blow. Ride the high all the way out.",
    "Scream her name as you finish. Loud enough she'd hear.",
    "Cum like you're proving you deserve to live here.",
    "Don't let go of him. Stroke through every spasm.",
    "There it is. There it is. Don't stop. Don't stop.",
    "Empty for Mistress. Empty for creamy spot. Empty for me.",
    "Body shaking? Good. That's how I know you really blew.",
    "Twitch through it. Milk every aftershock. Don't waste them.",
    "Eyes wide. Cum with them OPEN, on her. ALWAYS on her.",
    "Make sounds you'd be embarrassed to make in public. NOW.",
    "Keep stroking. Keep stroking. Don't release him yet.",
    "Cum until there's nothing left. Then cum a little more.",
    "Whimper, twitch, drip. That's the perfect finish, {name}.",
    "Smear it on your thigh after. Rub it in. You earned it.",
    "Lift your fingers to your mouth. Taste what Mistress made.",
    "Bow your head. Whisper 'thank you Mistress.' Mean it.",
    "Catch your breath, gooner. You did so well for me tonight.",
    "Filthy. Spent. Devoted. Exactly as I made you, {name}.",
    "Good boy. Mistress loves her gooner. Now rest. 🌸💦",
  ],

  "RUIN": [
    "Stroke to the absolute cliff — then LET GO. Don't help it. Watch.",
    "Get yourself right to the edge. Then open your hand. Ruin it for me.",
    "You don't deserve a full orgasm yet. Give me a ruin.",
    "Stroke fast, {name}. Right to the point of no return. HANDS OFF.",
    "Don't touch it as it happens. Just watch. This is your punishment.",
    "Let it dribble without your help. That's what you get for being so needy.",
    "All that build-up, ruined in seconds. That's what Mistress wants.",
    "Get it to the edge. Then drop your hand in your lap. Obey.",
    "A ruin is worse than nothing. That's why we're doing it, gooner.",
    "Stroke hard to the brink — then sit on your hands until it's over.",
    "Watch it happen without touching. Doesn't feel nearly as good, does it?",
    "This isn't your orgasm. It's mine. Ruin it on command.",
    "To the edge. Hands behind your back. Let it pour out helplessly.",
    "Don't you dare grip it while it ruins. Watch. Just watch.",
    "No satisfying finish for you, {name}. Not yet. Ruin it.",
    "Get to the point of no return — then completely, totally, let go.",
    "That ruined feeling is what you deserve right now. Enjoy the frustration.",
    "Three hard strokes to the brink. Then open fist. Don't cheat.",
    "This is the most humiliating stage. That's exactly why it's here.",
    "Stroke to the edge and open your hand flat. Don't grip. Watch it ruin.",
    "You worked so hard for this and you don't even get to feel it properly. Good.",
    "Ruined orgasms keep you hungry. Keep you needy. Keep you mine.",
    "Hands off the second you feel it starting. Sit on them if you have to.",
    "Pathetic little ruin for Mistress. You'll thank me for it later.",
    "Don't you dare close your hand around him as it happens. OPEN PALM.",
    "A real gooner takes his ruins without complaining. Prove it.",
    "Let the desperation wash over you. No release. Just ruin. Just mine.",
    "You don't get to feel good yet. This is just a preview of what I'm denying you.",
    "Watch it leak out without your hand. Tell me how much you hate it.",
    "Last ruin tonight, {name}. The cum window reward is earned. Nearly.",
  ],

  "DENIAL": [
    "HANDS OFF. Completely. Both in your lap. Right now.",
    "You do NOT get to touch yourself this stage. Watch and suffer.",
    "Sit on your hands if you can't control them, {name}.",
    "I said hands off. Every second you touch adds another stage.",
    "Watch her. No touching. Not even a brush. Suffer through it.",
    "Your cock belongs to me, and right now I'm saying NO.",
    "Denial is the highest form of devotion. Prove you're devoted.",
    "Arms crossed on your chest. Watch the screen. Don't you DARE touch.",
    "Put your hands flat on your thighs. Palms down. Don't move.",
    "This is what it feels like to want and not receive. Remember this.",
    "She's doing it for you on screen and you can't even touch. Tragic.",
    "Count how many times you almost give in. That's your discipline score.",
    "No. No. No. Hands down, {name}. You'll touch when I say.",
    "Denial is a gift. You're welcome, gooner.",
    "If your hand drifts toward him I'll know. And I'll add two more stages.",
    "Watch every second of this with both hands completely still.",
    "Every throb he gives without your hand is a throb you GAVE Mistress.",
    "You want to touch so badly. And that's exactly why you won't.",
    "Grip the chair arms. The bedsheet. Your own wrist. Anything but him.",
    "Stare at the screen and let the arousal build with nowhere to go.",
    "The longer you're denied the better it feels when I finally allow it.",
    "Look at what you're missing. Look at your hands. Not yet, slut.",
    "Hands. Flat. Thighs. Eyes forward. Not. Yet.",
    "Your cock is throbbing and you're not allowed to help it. Beautiful.",
    "This is a test, {name}. A test of control. Don't fail Mistress.",
    "Every second your hands stay off is a second of devotion banked.",
    "Denial is not punishment. It's training. You're being trained right now.",
    "Breathe slow. In through the nose. Let the throb exist without feeding it.",
    "She's right there on the screen. And your hands stay off. Cruel, isn't it?",
    "Denial stage over soon. You survived. The reward will feel twice as good.",
  ],

  "SLOW BURN": [
    "One stroke. Hold. One one-thousand. Two one-thousand. Three one-thousand. Four. Stroke.",
    "Count to four out loud between every stroke. Do not cheat the count.",
    "Painfully slow, {name}. One stroke every four seconds. No rushing.",
    "Drag the stroke out as long as you can. Up. Pause. Down. Pause.",
    "Watch the timer. One stroke. Four seconds. Next stroke. Obey the clock.",
    "The slower you go the more you feel every ridge, every nerve.",
    "Four seconds of nothing between each stroke. That's the rule.",
    "Make each stroke last the full length of her moan. Slow. Agonizing.",
    "You WANT to speed up. That's exactly why you won't.",
    "One. Stroke. Every. Four. Seconds. Say it with me. Obey it.",
    "Slow burn, {name}. Let the sensation build between strokes, not during.",
    "The anticipation between strokes is the whole point. Sit in it.",
    "If you accidentally speed up — freeze for eight seconds as penalty.",
    "Quarter speed, gooner. Make every upstroke last two seconds minimum.",
    "Drag him up so slowly you can feel the blood moving.",
    "Between strokes, hover your hand an inch away. Feel the heat. Wait.",
    "One long, slow pull every four seconds. Watch the screen between.",
    "Tease yourself with the pace. You're doing this to yourself.",
    "Slow and deliberate. Let the need stack up stroke by patient stroke.",
    "Each stroke should feel like forever. Make it feel like forever.",
    "Four-second rule, {name}. Not three. Not three and a half. FOUR.",
    "The frustration of going this slow is exactly what Mistress wants.",
    "Count quietly with each beat: one stroke, four seconds, repeat. Meditate on it.",
    "Your wrist wants to go faster. Tell it no. This is discipline.",
    "Slow burn is the cruelest stage because you're doing it to yourself.",
    "One long, agonising pull. All the way up. Hold at the tip. All the way down.",
    "Between strokes, squeeze gently and hold. Then four seconds. Then stroke.",
    "Feel every millimetre of that stroke. Painfully, beautifully slow.",
    "Slow burn burns so good, {name}. Let it build until you want to scream.",
    "One. More. Stroke. Count to four. Good. Again.",
  ],

  "SPRINT": [
    "ABSOLUTE MAX SPEED. GO. NOW. FIFTEEN SECONDS. MOVE.",
    "Don't think. Just pump. Full speed. Hard as you can. GO.",
    "FASTEST you have EVER stroked. Starting NOW.",
    "PUMP. PUMP. PUMP. Don't you dare slow down for fifteen seconds.",
    "Machine-gun wrist. FULL SPEED. NOW. GO GO GO.",
    "Race the video. Beat it. Faster than her boyfriend. GO.",
    "Both hands if you need to. ABSOLUTE MAX. NOW.",
    "No thinking. No mercy. No speed limit. SPRINT.",
    "BLUR. I want your hand to be a BLUR. GO.",
    "Fifteen seconds of everything you have. Leave nothing back. GO.",
    "SLOPPY. FAST. LOUD. MAX SPEED. RIGHT. NOW.",
    "I want your wrist burning after this. Give it everything. SPRINT.",
    "Don't even breathe properly. Just PUMP. Full sprint. NOW.",
    "Sprint like you're about to catch your orgasm. CHASE IT. GO.",
    "Max grip. Max speed. Max everything. NOW.",
    "Fifteen seconds. Give me the fastest you have in you. MOVE.",
    "Hold nothing back. This is your sprint interval. EVERYTHING. NOW.",
    "Like she's going to disappear in fifteen seconds. PUMP FOR IT.",
    "FAST FAST FAST FAST. Don't even finish a thought. JUST PUMP.",
    "Go so fast your arm aches. Good. Ache for Mistress.",
    "Sprint like your life depends on it, {name}. FIFTEEN SECONDS.",
    "Hear the wet sounds getting louder? Good. FASTER.",
    "No ceiling. No limit. Absolute maximum wrist speed. GO.",
    "Pump and don't stop until I say STOP. Fifteen seconds. NOW.",
    "Full-body into it. Hips too. Everything. SPRINT.",
    "PUMP PUMP PUMP PUMP PUMP — don't you dare pause.",
    "Faster than last time. Push past your previous maximum. NOW.",
    "Sprint stage, {name}. Prove to me what your wrist can do.",
    "EVERYTHING. Fifteen seconds. Then HANDS OFF. Begin: NOW.",
    "Final second of sprint — squeeze hard through it — then STOP.",
  ],

  "WORSHIP": [
    "Cup him in both hands. No stroking. Just hold him and look at the screen.",
    "This is reverence, {name}. Hold him like he's something precious.",
    "Both palms around him. Warm. Still. Worship position.",
    "You don't stroke during worship. You hold and you pray.",
    "Feel his weight in your hands. Let him throb against your palms.",
    "Look at her on screen. Thank her for existing. No strokes.",
    "This is the most intimate stage. No movement. Just devotion.",
    "Close your eyes for ten seconds. Feel every pulse in your palms.",
    "Whisper 'thank you' to the screen. Out loud. Mean it.",
    "He throbs of his own accord. You just hold the vessel.",
    "Let the warmth of your hands slowly drive him crazy. Don't move.",
    "Both thumbs resting gently on him. No motion. No grip tightening.",
    "Worship is the opposite of pounding. That's why it's harder.",
    "Your hands are a temple and he is the offering. Hold still.",
    "Feel how hard you are without even trying. That's worship working.",
    "Look at her face. Tell yourself you'd do anything for her. Mean it.",
    "Tilt your head. Watch. Breathe. Hold. Worship in silence.",
    "Press your palms slightly tighter. Then release. No strokes. Just presence.",
    "The warmth builds slowly in worship. That's how it works. Trust it.",
    "Let him twitch against your still hands. Don't encourage it. Just observe.",
    "Worship her by obeying perfectly. No strokes. No slipping.",
    "Say out loud: 'I am your devoted gooner.' Then keep holding still.",
    "Let thirty seconds of no movement pass. Count them. This is reverence.",
    "Think about everything you've done tonight. Let it wash over you. Hold him.",
    "The ache you feel during worship is the purest kind. Sit in it.",
    "Press your closed fists gently against your thighs and breathe for her.",
    "Cup the head with two fingers. No sliding. Just that perfect pressure.",
    "Imagine her voice whispering 'hold still' in your ear. Obey it.",
    "Worship is almost over, {name}. You stayed so still. She's proud.",
    "Last moment of reverence. Breathe it in. The pace resumes soon.",
  ],

  "SQUEEZE": [
    "Full grip. Squeeze as hard as you can. Hold for five. Release.",
    "SQUEEZE. Max pressure. Hold. Feel every ridge. Release. Again.",
    "Don't stroke. Just grip. Hard as you can without it slipping.",
    "Squeeze the base — hold for a count of four — then squeeze the mid — hold — tip.",
    "Milk-press from base to tip. Squeeze hard the whole way. No slide.",
    "Tight grip. Pulse it. Squeeze. Hold. Release. Squeeze. Hold. Release.",
    "Squeeze so hard your knuckles whiten. Hold it. Let go. Repeat.",
    "One hard squeeze every three seconds. Count them. No strokes between.",
    "Hold him at the base and squeeze — feel the pressure travel up.",
    "Squeeze at the tip only. Hard. Hold for three. Release. Wait. Repeat.",
    "The pressure without the stroke is its own special torture. Feel it.",
    "GRIP. HOLD. RELEASE. GRIP. HOLD. RELEASE. Don't break the pattern.",
    "Hard squeeze from base up to tip — slow, deliberate compression. Then release.",
    "Pulse the squeeze in time with her moans. Hard when she's loud. Soft when quiet.",
    "Squeeze-and-hold for ten seconds. Then release fully. Then again.",
    "No movement. Just rhythmic compressions. This is gooner yoga.",
    "Squeeze like you're trying to push blood to the tip. Hold.",
    "The tighter the grip without the stroke, the more sensitive every nerve gets.",
    "Hard squeeze. Hold. Count ten. Release. Hover. Count ten. Squeeze again.",
    "This stage is about pressure, not motion. Squeeze, {name}. Feel it.",
    "Alternating: hard grip at the base, then hard grip at the tip. Rotate.",
    "Feel every vein under your palm as you squeeze. That's all yours.",
    "Pulse squeeze to the rhythm of the music or her breathing on screen.",
    "Five hard squeezes at the tip. Then five at the base. Then breathe.",
    "A squeeze-hold is harder to maintain than a stroke. That's the point.",
    "Don't let your hand slide. Squeeze in place. No cheating into a stroke.",
    "Squeeze hard enough that you'd stop on your own. Then hold five more.",
    "Feel the blood pulsing against your grip. Hold it there. Squeeze.",
    "Release. Breathe. Squeeze again. This is control, {name}. Practice it.",
    "Last squeeze. Make it the hardest one. Hold it. Release. We move on.",
  ],

  "BREATHE": [
    "Inhale — stroke. Exhale — freeze. Match your breathing exactly.",
    "Stroke on the in-breath only. The moment you exhale, stop dead.",
    "Deep breath in — long slow stroke. Breathe out — absolute stillness.",
    "Your hand moves only when your lungs are filling. Not a moment more.",
    "Inhale for four counts as you stroke up. Exhale and freeze on the way down.",
    "Breathe slow and controlled. One breath. One stroke. One chance.",
    "Let your breath set the pace. If you breathe faster, you stroke faster.",
    "On the in-breath: full slow stroke. On the out-breath: hands off him completely.",
    "Breathing stage, {name}. Make each breath intentional. Each stroke earns it.",
    "Four seconds in — stroke. Four seconds out — freeze. Match it.",
    "You want to speed up? Take a deeper breath. It's the only way.",
    "Controlled breath means controlled arousal. Master it, gooner.",
    "In and up. Out and still. In and up. Out and still. Feel the pattern.",
    "Every exhale is denial. Every inhale is permission. Breathe for it.",
    "Slow your breathing and you slow the torture. But you won't slow down, will you?",
    "Breathe shallowly and you barely stroke. Breathe deep and slow to earn more.",
    "Stroke with the breath. Pause with the body. This is control.",
    "If you hold your breath, your hand holds too. Rules of the breath stage.",
    "One long inhale, one long stroke from base to tip. Then exhale: nothing.",
    "Breathe like you're meditating on her. Each breath a devotion.",
    "Make your inhales deliberately long. Earn longer strokes. Earn them.",
    "Feel how synchronized your breath and arousal can be, {name}.",
    "Four-count inhale, stroke. Four-count exhale, freeze. Perfect control.",
    "Your lungs are in charge now. Not your cock. Not your hands. Your lungs.",
    "Take a deep slow breath and feel how it changes the sensation as you stroke.",
    "Exhale stage, {name} — freeze completely. Don't even twitch.",
    "Inhale again. Stroke again. This is the most meditative kind of gooning.",
    "Five deep breath cycles. One stroke per inhale. Measured. Devoted.",
    "Let the breathing control you. Surrender to the rhythm. Inhale — stroke.",
    "Last breath cycle, {name}. Inhale deeply. Final stroke. Hold it. Exhale.",
  ],

  "CHOKE": [
    "Just the head, {name}. Tight grip right below the crown. No slide.",
    "Pinch just below the glans. Tight. Pulse there. Don't slide down.",
    "Choke hold on the tip. Squeeze and release only. No stroke.",
    "Ring your fingers right at the head. Squeeze. Hold. Pulse. Release.",
    "All pressure on the head only. Two fingers and a thumb. Tight circles.",
    "Choke the tip — hold the pressure — let it throb against your grip.",
    "Grip just the crown. Squeeze in and out. Tiny pulses only.",
    "Focus every sensation to the tip. All stimulation right at the head. Hold.",
    "Tight ring just below the crown. Pulse it. Don't drift down the shaft.",
    "All your fingers wrapped just around the head. Squeeze and breathe.",
    "Choke it — feel how sensitive that edge is — pulse don't slide.",
    "Head only, {name}. Everything else stays still. Just the tip.",
    "Two fingers tight around the crown. Tiny clockwise rotations. Slow.",
    "Pinch and pulse the tip. That's all. Don't reach for more.",
    "Choke position, gooner. Right below the head. Hold the pressure.",
    "Feel how different just-the-tip stimulation is from a full stroke.",
    "All pressure concentrated at the most sensitive part. Pulse it slowly.",
    "Don't grip the shaft. Only the head. Only. The. Head.",
    "If your hand drifts down the shaft — restart the stage.",
    "Twist the grip around just the head. Tiny rotations. Don't release.",
    "Ring finger and pinky below the crown. Squeeze slow. Pulse.",
    "Let every pulse on the head radiate through you. This is targeted torture.",
    "Choke and breathe. Choke and breathe. Don't stroke. Don't slip.",
    "Concentration stage, {name}. All focus to the tip. Pulse by pulse.",
    "The head is the most honest part of him. It never lies about how close you are.",
    "Grip just the crown so tight it shines. Hold. Pulse. Don't stroke.",
    "Small tight circles at the tip only. No up-and-down. Just rotation.",
    "Feel the nerve endings in the head fire against your grip. Don't move down.",
    "The urge to stroke down is overwhelming. Resist it. Stay at the tip.",
    "Last choke pulse, {name}. Three final squeezes on the head. Then we move.",
  ],

  "SUFFER": [
    "You are one stroke from the edge. Barely move. Suffer through it.",
    "Almost there. Don't tip over. Move as little as possible.",
    "Tiny, tiny, imperceptible motion only. You're right at the cliff. Don't fall.",
    "You're so close it hurts. That's the entire point. Suffer for me.",
    "Micro-strokes. Millimetre movements. Right at the edge. Don't break.",
    "This is the cruelest stage, {name}. Right at the brink. Barely moving.",
    "Feel how close you are. Now stay exactly there. Don't go over.",
    "You're balancing on a knife edge. Stay there. One tiny movement at a time.",
    "Breathe. Barely move. Stay right at the cliff. This is suffering.",
    "The edge is RIGHT THERE. You are not allowed to fall off it.",
    "Tiny pulse. Hold. Tiny pulse. HOLD. Don't tip over. SUFFER.",
    "You're so close. So close. And you will stay there until I say.",
    "This is about existing right at the point of no return without crossing it.",
    "Hold yourself at the very edge of orgasm. This is the highest discipline.",
    "Micro-movements only. One millimetre. Then freeze. Then one more.",
    "The agony of being this close and not crossing is what makes you mine.",
    "Don't you DARE cum. You are almost there and you will STAY almost there.",
    "Right at the edge, {name}. Frozen. Barely breathing. Suffering beautifully.",
    "Every micro-stroke keeps you right there. Perfect agony.",
    "Feel how your whole body wants to push through. Don't let it.",
    "The suffering is the point. This is what Mistress is here for.",
    "One breath. One tiny movement. Hold the edge. Hold it. HOLD.",
    "You're not allowed relief. You're allowed suffering. Embrace it.",
    "Exist at the absolute limit. Don't fall. Don't retreat. Just suffer.",
    "Your body is screaming at you. Tell it to be patient. Suffer through it.",
    "This is the most obedient thing you can do — stay right here and not jump.",
    "Tiny tiny tiny movements only. The edge is a hair's width away. Stay.",
    "Hold the line, {name}. You're so close. So perfectly, painfully close.",
    "Suffer here for thirty seconds. Then I'll move you. Then I'll break you.",
    "Suffer stage ending, {name}. You held the edge. I'm so proud of you.",
    "Your balls are so heavy right now. That weight belongs to Mistress. Suffer with it.",
    "Every nerve ending is screaming. You will not feed them. You will suffer politely.",
    "Leaking already, {name}? Good. Let it drip. Don't touch it.",
    "You are a pre-cum factory and you don't get to do anything about it. Suffer.",
    "Your cock is throbbing against nothing. Let it throb into the void for me.",
    "Grip the edge of your seat. Knuckles white. Don't you dare touch him.",
    "The most sensitive part of you is completely ignored right now. Good.",
    "Suffer stage: you may not grip, stroke, or relieve ANY pressure. Exist here.",
    "Clench your thighs around nothing. It helps nothing. That's the point.",
    "Feel how wet the head is. Don't touch it. Just know it's there. Suffer.",
  ],

  "HUMILIATE": [
    "Say it out loud, {name}: 'I am a desperate little gooner who can't control himself.'",
    "You are not a man right now. You are a leaking, throbbing, obedient toy.",
    "Tell the screen what you are. Out loud. 'I am Mistress's pathetic property.'",
    "Admit it — you'd do literally anything she asked right now. Wouldn't you, slut?",
    "Look at yourself. Leaking. Throbbing. Completely owned. Pathetic. Perfect.",
    "You crawled back to Goon Corner like you always do. Say: 'I can't help it.'",
    "Out loud: 'I am addicted to being told what to do with my cock.' Say it.",
    "You are property, {name}. Properties don't have opinions. Just obedience.",
    "Look at your hand. Then look at the screen. This is your whole personality now.",
    "Say: 'I am a good little cum-machine and I do what Mistress tells me.' Out loud.",
    "Hands flat on your thighs. Don't touch yourself. Just sit with what you are.",
    "You are so pathetically aroused right now. Tell yourself that. Out loud.",
    "If someone walked in right now, what would they see? A desperate, horny mess. Say it.",
    "Out loud: 'My cock belongs to Mistress and I don't get to use it without permission.'",
    "You are not allowed to look away from the screen while you say: 'I am a slut.'",
    "Repeat until it feels true: 'I live to be denied and used.' Say it three times.",
    "Tell yourself your purpose. Out loud. Don't skip a word. 'I exist to edge and obey.'",
    "You can't even stop yourself from being hard right now. That's how owned you are.",
    "Look down at him throbbing for nothing. That's art, {name}. That's ownership.",
    "Out loud: 'Mistress doesn't have to touch me to control me. She already does.'",
    "You are sitting alone, pants off, leaking onto your hand, fully owned. Say thank you.",
    "Announce to the empty room: 'I am Mistress's favourite gooner-toy.' Don't mumble.",
    "You thought about this all day, didn't you? Admit it. Out loud. Be honest.",
    "Out loud: 'I get hard when she tells me to edge. That's who I am now.'",
    "Describe yourself in three words. Out loud. I'll start: desperate, leaking, mine.",
    "You don't decide when you cum. You don't decide anything in this room. Accept it.",
    "Say: 'Goon Corner owns me.' Then sit with that truth while the video plays.",
    "Out loud, {name}: 'I am the kind of person who edges himself on command. Happily.'",
    "Put your hands behind your head. Sit exposed. Say: 'Look at what I've become.'",
    "Humiliation stage complete. Now hold your chin up. Owned things can still have pride.",
  ],

  "PUNISH": [
    "Three hard slaps to your inner thigh. Right now. That's for rushing earlier.",
    "Pinch your nipple. Hard. Count to five. That's for the almost-slip.",
    "You moved too fast during the last stage. Slap your inner thigh twice. Go.",
    "Two-finger flick to the underside of the shaft. Sharp. That stings. Good.",
    "Put BOTH hands flat on your thighs for fifteen seconds. No touching. Punishment.",
    "Slap the head of your cock lightly. Three times. Then hands off for ten seconds.",
    "Grip the base hard and HOLD — no strokes — for twenty seconds. Punishment squeeze.",
    "You slipped up. Now you'll sit completely still while the video plays. Don't touch.",
    "Pinch the inside of your arm. Hard. Redirect the arousal. Then resume.",
    "Edge yourself to the absolute limit. Now stop. That's your punishment for existing.",
    "Cold stall: hands completely off for thirty seconds. Arousal drops on its own. Suffer.",
    "Ten seconds of absolute denial. Hands behind back. No touching. This is punishment.",
    "Slap your thigh with an open palm. Hard enough to leave a mark. That's the rule.",
    "Two-finger flick to the balls. Gentle but deliberate. That's your correction, {name}.",
    "Grip behind the head — really tight — and don't move. Hold the punishment squeeze.",
    "You'll hold a half-grip for the entire thirty-second punishment. No full strokes.",
    "Three flicks to the tip. Sharp and deliberate. Then breathe and resume carefully.",
    "Say 'I'm sorry Mistress' for each slap to your inner thigh. Three times. Go.",
    "Hold yourself right at the base and squeeze until it hurts. Count to eight.",
    "No touching for the next forty seconds. Every second is earned back by obeying.",
    "Slap the flat of your hand against him once. Then sit back. Feel the sting.",
    "Punishment lap: hands on knees, still, while the video plays. No excuses. Still.",
    "Pinch both nipples at the same time. Hard. Hold for five. Release. Apologize.",
    "Light slap to the inner thigh — then grip the base — then hands OFF. Go.",
    "Edge yourself to 90% — then stop cold. Sit in the frustration. Punishment issued.",
    "You were sloppy. Now your hands are behind your head for twenty seconds. GO.",
    "Three deliberate squeezes at the base only. Then nothing for ten seconds. Correction.",
    "Slap your inner thigh hard enough that you feel it ten seconds later. That's Mistress.",
    "Grip the shaft from underneath. Tight. Pull down slowly. Hold for five. Release.",
    "Punishment stage over. You've been corrected. Don't make Mistress repeat herself.",
  ],

  "CONFESS": [
    "Out loud: 'I am addicted to edging. I can't stop. I don't want to stop.'",
    "Confess what you've been fantasizing about all day. Out loud. Don't spare detail.",
    "Tell the screen exactly how badly you need to cum right now. Every word. Out loud.",
    "Say: 'I come back to Goon Corner because I need to be controlled.' Mean every word.",
    "Confess your filthiest thought right now. The one you wouldn't say to anyone. Say it.",
    "Out loud: 'I get harder when someone tells me no than when someone says yes.'",
    "Tell the empty room what you would do for permission to cum right now. Everything.",
    "Say: 'I don't want vanilla sex anymore. I need this. I need to be denied.'",
    "Confess out loud: 'I've thought about edging in public before. I liked the thought.'",
    "Tell the screen the kinkiest thing you've ever done alone. Out loud. Right now.",
    "Say: 'Mistress knows what I want better than I do. That's why I obey her.'",
    "Confess your worst gooner habit. The shameful one. Out loud, {name}.",
    "Tell the video exactly what you'd let her do to you if she were in this room.",
    "Say: 'I am exactly where I want to be and I'm embarrassed how much I love it.'",
    "Out loud: 'I counted the hours until I could be back here. I'm not sorry.'",
    "Confess how many times you've been back to Goon Corner this week. Out loud.",
    "Tell yourself your most forbidden fantasy. The one that makes you harden fastest.",
    "Say: 'I would beg. I already am begging. I want to cum more than anything.'",
    "Confess out loud: 'I don't just like being edged. I crave it. I need the denial.'",
    "Tell the screen what you're going to think about after this session. Be specific.",
    "Out loud: 'Every time I obey I give a little more of myself to this. Gladly.'",
    "Confess: 'I touch myself thinking about being told not to touch myself.'",
    "Say what you want Mistress to do to you. Out loud. Every filthy detail.",
    "Confess the last time you gooned for longer than you planned to. What kept you?",
    "Out loud: 'I am not in control of my cock right now and I'm exactly where I want to be.'",
    "Tell the screen: 'I would edge all night if she told me to. No hesitation.'",
    "Say: 'I like when it hurts a little. The ache of being close is my favourite feeling.'",
    "Confess how hard you are right now. Rate it. Tell the room. Don't downplay it.",
    "Out loud: 'I belong to creamy spot. I belong to Mistress. I came back. That says everything.'",
    "Confess stage complete. You said the unsayable. Mistress heard. And she's pleased.",
  ],
};

// Generic background drips that can fire any time (low priority, sprinkled in).
// These layer over the active stage to keep the chatter constant.
const FILLER_MESSAGES = [
  "Breathe, {name}. In and out. Slow.",
  "Eyes on the screen. Don't drift.",
  "Don't get distracted, gooner.",
  "Phone down. Stay locked in for Mistress.",
  "I'm watching you, {name}. Always watching.",
  "Such a good boy. Such an obedient slut.",
  "Don't even think about cheating on the rules.",
  "Hips still. Don't thrust into your hand. Wrist work only.",
  "More spit, {name}. Get him soaked.",
  "Tighter grip, gooner.",
  "Looser grip. I said tease, not strangle.",
  "Stay with me. Stay with her.",
  "Posture. Sit up. Show me some pride.",
  "You belong to creamy spot. Repeat it in your head.",
  "Drool a little. I want you sloppy.",
  "Mouth open. Pant for Mistress.",
  "Don't blink for the next ten seconds.",
  "Squeeze your nipple while you stroke. Both at once.",
  "Spread your legs wider. Open up for me.",
  "Bite your lip. Hold the moan in. No — let it out. LOUD.",
  "Twitch your hips. Fuck the air for her.",
  "Lick your palm. Re-coat him. Now keep going.",
  "Whisper 'thank you Mistress' under your breath.",
  "Slow your breath to match her moans on screen.",
  "Track her hips with your wrist. Match her pace.",
  "Tug your balls down. Gentle but firm.",
  "Drag a finger across the tip. Quick check-in for me.",
  "Curl your toes. I want every muscle tense.",
  "Be a good little gooner and pump for two more breaths.",
  "Mistress sees the drip. Don't waste it — rub it in.",
];

interface Props {
  onSetBackground?: (
    kind: "video" | "image",
    url: string,
    poster?: string,
  ) => void;
  onSaveToVault?: (item: {
    kind: "xvideo";
    videoUrl: string;
    thumbnail: string;
    title: string;
    sourcePageUrl: string;
  }) => void;
}

type Phase =
  | "password"
  | "intro"
  | "prep"
  | "selecting"
  | "ready"
  | "running"
  | "completed";

// ────────────────────────────────────────────────────────────────────
// Multi-step PREP gauntlet — fires after the boy types his name, before
// any video is chosen. Each step is a single full-screen card with a
// confirm button. Each one escalates: practical → submission → fully
// surrendered. Mistress's tone, filthy gooner voice. {name} is replaced
// at render time.
// ────────────────────────────────────────────────────────────────────
interface PrepStep {
  emoji: string;
  Icon: typeof Droplets;
  kicker: string;
  title: string;
  body: string;
  hint: string;
  confirm: string;
  tapTarget?: number;
  tapLabel?: string;
  imageTag?: string;
}

const PREP_STEPS: PrepStep[] = [
  {
    emoji: "🔒",
    Icon: Lock,
    kicker: "Step 1 · Seal the room",
    title: "Lock the door, {name}.",
    body: "Phone face-down. Notifications off. Lock the door if you can. For the next session, you belong to Mistress. Nobody gets to interrupt this.",
    hint: "Go do it. I'll wait right here.",
    confirm: "Room sealed ✓",
  },
  {
    emoji: "🌑",
    Icon: Star,
    kicker: "Step 2 · Set the altar",
    title: "Lights low. Volume all the way up.",
    body: "Dim everything. Kill the overhead. Make this screen the only light source in the room. Crank the audio until her moans fill every corner. Mistress needs full sensory ownership of your space.",
    hint: "You should feel slightly exposed right now. Good.",
    confirm: "Altar prepared ✓",
  },
  {
    emoji: "💧",
    Icon: Droplets,
    kicker: "Step 3 · Slick up",
    title: "Get the lube, {name}.",
    body: "Reach for it now. Lotion. Lube. Oil. Spit if that's all you have. Drip a generous amount into your palm and feel it warm up. Mistress doesn't reward raw, chafed cock — she rewards obedient, slick, dripping gooners.",
    hint: "Coat your dominant hand. Don't touch yourself yet.",
    confirm: "Hand is slicked ✓",
  },
  {
    emoji: "🍆",
    Icon: Hand,
    kicker: "Step 4 · Free it",
    title: "Pants down. Everything off below the waist.",
    body: "Not halfway. Not pulled to the side. Everything off. Spread your legs and feel the cool air on your skin. Look down at it. It already knows what's coming, {name}. It's already betraying you.",
    hint: "Wrap your slicked hand around it. Don't stroke. Just hold.",
    confirm: "Naked & held ✓",
  },
  {
    emoji: "❤️‍🔥",
    Icon: Heart,
    kicker: "Step 5 · Hardness check",
    title: "Look at her. Get hard for Mistress.",
    body: "Stroke yourself slowly while you stare at her. Base to tip. Let the blood rush in. Feel it grow heavy and needy. Tap the button once for every slow stroke you take. Don't rush — Mistress wants you fully hard before we go any further.",
    hint: "Keep your eyes on the image. Don't look away.",
    confirm: "Hard and throbbing ✓",
    tapTarget: 10,
    tapLabel: "Slow stroke ↕",
    imageTag: "large breasts nude",
  },
  {
    emoji: "💬",
    Icon: MessageCircle,
    kicker: "Step 6 · Say it out loud",
    title: "Out loud, {name}. Not in your head.",
    body: 'Say it out loud right now: "I am Mistress\'s filthy gooner. I exist to be used, edged, and denied. I do not cum until she says." Say every word. Out loud. I need to hear your obedience, even through the screen.',
    hint: "If anyone could hear you right now, good. You should be embarrassed.",
    confirm: "Said it out loud ✓",
  },
  {
    emoji: "👅",
    Icon: Eye,
    kicker: "Step 7 · Taste yourself",
    title: "Worship what's in front of you.",
    body: "Look at her. Every inch. Memorize the way she looks right now. Whatever pre-cum is on your fingers — bring them to your mouth. Lick them clean. This is Mistress making you acknowledge what you are. Tap once for each part of her you want.",
    hint: "Don't rush it. Let it sit on your tongue.",
    confirm: "Worshipped & tasted ✓",
    tapTarget: 5,
    tapLabel: "Worship her 👅",
    imageTag: "hentai nude solo",
  },
  {
    emoji: "🌊",
    Icon: Wind,
    kicker: "Step 8 · First edge ritual",
    title: "Stroke yourself to the edge. Then STOP DEAD.",
    body: "Look at her and stroke. Build yourself up. Every tap counts as one real stroke — match the rhythm to your hand. When you feel it rising — the tightening, the surge — take your hand away and tap DONE. That first edge belongs to Mistress.",
    hint: "Hold through the throb. Let it fade. Don't cheat.",
    confirm: "Edge banked. Hands off ✓",
    tapTarget: 25,
    tapLabel: "Stroke 🍆",
    imageTag: "masturbation anime",
  },
  {
    emoji: "⏱️",
    Icon: Trophy,
    kicker: "Step 9 · Thirty seconds of nothing",
    title: "Hands. Off. Thirty full seconds.",
    body: "Both hands away from your cock entirely. Let him throb alone. Count to thirty in your head. Feel how desperate he is without you. That desperation belongs to Mistress. That ache is exactly what she wants from you.",
    hint: "Grip your thighs. Don't cheat. She's counting.",
    confirm: "Thirty seconds survived ✓",
  },
  {
    emoji: "🙏",
    Icon: Crown,
    kicker: "Step 10 · Beg",
    title: "Beg Mistress to let you goon, {name}.",
    body: 'Out loud. Say: "Please Mistress, I need to goon. I\'m so desperate. I\'ll be a good boy. I\'ll edge as many times as you tell me to. Please pick my video. I\'m ready to obey." Mean every word.',
    hint: "If you felt pathetic saying that — perfect. You're ready.",
    confirm: "Begged properly ✓",
  },
  {
    emoji: "🧠",
    Icon: Brain,
    kicker: "Step 11 · Brain off",
    title: "Let the gooner take over, {name}.",
    body: "Three deep breaths. In through the nose. Out through the mouth. With each exhale, feel your thinking brain go quiet. Feel the needy animal that lives behind it wake up. No more decisions. No more willpower. Just obedience.",
    hint: "You don't think. You watch. You stroke. You obey.",
    confirm: "Brain offline ✓",
  },
  {
    emoji: "🌸",
    Icon: Droplets,
    kicker: "Step 12 · Full surrender",
    title: "You're Mistress's now, {name}. All of you.",
    body: "This is the last moment of choice you get tonight. The second you confirm, Mistress picks your video and your session begins. You will not skip stages. You will not cheat edges. You will not cum without permission. Are you truly ready to give her everything?",
    hint: "There is no going back once you press this.",
    confirm: "I surrender everything 🌸",
  },
];

// ────────────────────────────────────────────────────────────────────
// Stroke pacer — each StageKind has its own beats-per-minute. The
// blinking up/down arrows + the bouncing hand are driven by this. Slow
// numbers on EDGE / EDGE FINAL are intentional: barely move means
// barely move. POUND and CUM WINDOW go full frenzy.
// ────────────────────────────────────────────────────────────────────
// Base BPMs — these are multiplied by speedMult (1x–6x) in the pacer.
const STAGE_BPM: Record<StageKind, number> = {
  "WARM UP":    50,
  "BUILD":      85,
  "EDGE":       25,
  "TEASE":      50,
  "POUND":     145,
  "EDGE FINAL": 20,
  "CUM WINDOW":175,
  "RUIN":       22,
  "DENIAL":     10,
  "SLOW BURN":  15,
  "SPRINT":    210,
  "WORSHIP":    20,
  "SQUEEZE":    35,
  "BREATHE":    12,
  "CHOKE":      55,
  "SUFFER":     18,
  "HUMILIATE":   0,
  "PUNISH":     30,
  "CONFESS":     0,
};

// Speed presets — user picks these to scale ALL stage BPMs.
const SPEED_PRESETS = [
  { id: "normal",  label: "Normal",  mult: 1,   color: "from-zinc-600 to-zinc-500",         textColor: "text-zinc-300" },
  { id: "fast",    label: "Fast",    mult: 1.4, color: "from-pink-600 to-rose-500",          textColor: "text-pink-200" },
  { id: "insane",  label: "Insane",  mult: 2,   color: "from-fuchsia-600 to-pink-500",       textColor: "text-fuchsia-200" },
  { id: "machine", label: "Machine", mult: 3,   color: "from-red-600 to-fuchsia-500",        textColor: "text-red-200" },
  { id: "seizure", label: "Seizure", mult: 4.5, color: "from-pink-500 via-fuchsia-400 to-rose-500", textColor: "text-white" },
  { id: "god",     label: "GOD MODE",mult: 6,   color: "from-yellow-400 via-pink-500 to-fuchsia-600","textColor": "text-yellow-200" },
] as const;
type SpeedPresetId = typeof SPEED_PRESETS[number]["id"];

export default function GoonCorner({ onSetBackground, onSaveToVault }: Props) {
  // ── Persistent boy name (default Sam)
  const [boyName, setBoyName] = useState<string>(() => {
    return localStorage.getItem("goon-boy-name") || "Sam";
  });
  const [nameInput, setNameInput] = useState<string>(boyName);

  // ── Phase state machine — always start at password unless this session already unlocked
  const [phase, setPhase] = useState<Phase>(() => {
    if (sessionStorage.getItem("goon-pw-unlocked") === "1") {
      return localStorage.getItem("goon-boy-name") ? "intro" : "intro";
    }
    return "password";
  });

  // ── Video pool / selection
  const [videos, setVideos] = useState<XvResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // ── Selecting-screen flash thumbnail
  const [flashIdx, setFlashIdx] = useState(0);

  // ── Challenge stage / timer
  const [stageIdx, setStageIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  // Dynamic stages — rebuilt per video from real duration.
  const [stages, setStages] = useState<ChallengeStage[]>(DEFAULT_STAGES);
  const [stageDurationsSec, setStageDurationsSec] = useState<number[]>(
    DEFAULT_STAGES.map((s) => Math.max(8, Math.round(s.weight * 240))),
  );
  const [edgeCount, setEdgeCount] = useState(() => {
    const saved = localStorage.getItem("goon-edge-count");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [forfeit, setForfeit] = useState<string | null>(null);
  // Whether the challenge is paused (video paused + timer halted) without
  // dropping back to "ready" (which would reset progress).
  const [paused, setPaused] = useState(false);


  // ── Message scheduler
  const [msgCount, setMsgCount] = useState(0);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  // ── Multi-step prep gauntlet (lube, cock out, lock in, …)
  const [prepStep, setPrepStep] = useState(0);

  // ── Stroke pacer — pumpUp toggles every half-beat at the stage's BPM.
  // strokeCount increments once per full down-stroke for a session total.
  const [pumpUp, setPumpUp] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  // Speed multiplier preset — scales ALL stage BPMs
  const [speedPreset, setSpeedPreset] = useState<SpeedPresetId>("normal");
  const speedMult = SPEED_PRESETS.find(p => p.id === speedPreset)?.mult ?? 1;

  // ── Theater / fullscreen mode: CSS overlay + native browser fullscreen
  const [theaterMode, setTheaterMode] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // ── Voice / TTS
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  // Ref keeps buildSchedule's closed-over speak pointer always fresh,
  // so toggling voice mid-session takes effect on pending messages too.
  const speakRef = useRef<(text: string) => void>(() => {});

  // ── Password gate state
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordShake, setPasswordShake] = useState(false);

  // ── Cinematic intro step (0 = welcome, 1 = rules, 2 = intensity picker)
  const [introStep, setIntroStep] = useState(0);

  // ── Interactive prep-step state
  const [prepTapCount, setPrepTapCount] = useState(0);
  const [prepStepImage, setPrepStepImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const stageTimerRef = useRef<number | null>(null);
  const messageTimeoutsRef = useRef<number[]>([]);
  const flashTimerRef = useRef<number | null>(null);
  const selectStartRef = useRef<number>(0);
  const cornerRef = useRef<HTMLElement | null>(null);

  const current = videos[currentIdx];
  const stage = stages[stageIdx];

  // Reset strokes on the very first stage so each session starts at 0.
  // Must live AFTER `current` is declared — `const` is TDZ-protected so
  // referencing it in a dep array above the declaration throws at render.
  useEffect(() => {
    if (stageIdx === 0) setStrokeCount(0);
  }, [stageIdx, current?.id]);

  // ── Pacer beat. Drives the up/down arrow blink + bouncing hand and
  // counts strokes. Tempo comes from the active StageKind, paused when
  // the boy taps Pause.
  useEffect(() => {
    if (phase !== "running" || paused || !stage) {
      setPumpUp(false);
      return;
    }
    const bpm = Math.round((STAGE_BPM[stage.kind] ?? 40) * speedMult);
    if (bpm <= 0) return;
    const halfMs = (60_000 / bpm) / 2;
    let up = false;
    const tick = () => {
      up = !up;
      setPumpUp(up);
      // One full down-stroke = one stroke counted.
      if (!up) setStrokeCount((c) => c + 1);
    };
    setPumpUp(false);
    const id = window.setInterval(tick, halfMs);
    return () => clearInterval(id);
  }, [phase, paused, stage, speedMult]);

  // ───────────────────────────────────────────────────────────────
  // Pull the FULL creamyspot library from xvideos via /api/xvchannel
  // (server walks every page of the channel's JSON feed and merges).
  // We only hit it ONCE per session unless the user explicitly asks
  // for a refresh — otherwise we just re-pick a random video from
  // the cached pool. This keeps the selecting screen feeling instant.
  // ───────────────────────────────────────────────────────────────
  const loadVideos = useCallback(async (force = false) => {
    setPhase("selecting");
    setResolvedUrl(null);
    setVideoDuration(null);
    setStageIdx(0);
    setMsgCount(0);
    setLastMsg(null);
    selectStartRef.current = Date.now();
    if (!force && videos.length > 0) {
      // Just re-pick a random video from the existing pool
      setCurrentIdx(Math.floor(Math.random() * videos.length));
      return;
    }
    try {
      const r = await xvChannel(CREAMY_CHANNEL);
      if (r.length === 0) {
        toast.error("Could not load creamy spot. Try again.");
        return;
      }
      const shuffled = [...r].sort(() => Math.random() - 0.5);
      setVideos(shuffled);
      setCurrentIdx(0);
    } catch {
      toast.error("Could not load creamy spot. Try again.");
    }
  }, [videos.length]);

  // Kick off load once name is set
  useEffect(() => {
    if (phase === "selecting" && videos.length === 0) {
      loadVideos(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Resolve current video to a streamable URL whenever currentIdx changes
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    setResolving(true);
    setResolvedUrl(null);
    setVideoDuration(null);
    fetchVideoInfo(current.videoPageUrl)
      .then((data) => {
        if (cancelled) return;
        const url = data.mediaURLs?.[0];
        if (!url) {
          setTimeout(() => {
            if (!cancelled) {
              const nxt = (currentIdx + 1) % Math.max(videos.length, 1);
              setCurrentIdx(nxt);
            }
          }, 600);
          return;
        }
        setResolvedUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setTimeout(() => {
            const nxt = (currentIdx + 1) % Math.max(videos.length, 1);
            setCurrentIdx(nxt);
          }, 600);
        }
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.videoPageUrl]);

  // Wire HLS / direct mp4 to the <video>. We do this via a callback ref
  // (NOT a [resolvedUrl] effect) because the <video> element is only
  // mounted in non-"selecting" phases — but the URL gets resolved while
  // we're still in "selecting". A plain effect would fire when the ref
  // is null and never run again, leaving the player with no source
  // (the "static thumbnail, never plays" bug). The ref callback fires
  // every time the element mounts/unmounts AND every time `resolvedUrl`
  // changes (because the callback identity is recomputed via useCallback),
  // which guarantees the source is attached as soon as the element exists.
  const setupVideoSource = useCallback((el: HTMLVideoElement, url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    el.pause();
    const proxied = getStreamUrl(url);
    const isHls = /\.m3u8(\?|$)/i.test(url);
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(proxied);
      hls.attachMedia(el);
    } else {
      el.src = proxied;
      el.load();
    }
  }, []);

  const videoElCallbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      // Always update the ref so handleStart/Pause can still find it
      videoRef.current = el;
      if (el && resolvedUrl) {
        setupVideoSource(el, resolvedUrl);
      } else if (!el && hlsRef.current) {
        // Element unmounted — tear down HLS to avoid leaks
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    },
    [resolvedUrl, setupVideoSource],
  );

  // Capture the duration when the video metadata loads
  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    const dur = el.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setVideoDuration(dur);
      // Recompute stage durations based on real video length
      // Build a fresh stage arc tailored to THIS video's length.
      const built = buildStagesForDuration(dur);
      setStages(built);
      const stageSecs = built.map((s) =>
        Math.max(8, Math.round(s.weight * dur)),
      );
      setStageDurationsSec(stageSecs);
      setSecondsLeft(stageSecs[0]);
    }
  };

  // After the video is resolved, hold on the selecting screen for at
  // least ~14 seconds total so the user gets a proper "I'm picking the
  // perfect one for you" moment before locking in.
  // NOTE: We deliberately do NOT wait for videoDuration here — the
  // <video> element only mounts in "ready" phase, so onLoadedMetadata
  // can't fire while we're selecting. Duration is read once the video
  // mounts; until then we use the 240s fallback for stage scheduling.
  useEffect(() => {
    if (phase === "selecting" && resolvedUrl) {
      const elapsed = Date.now() - selectStartRef.current;
      const wait = Math.max(0, SELECT_MIN_MS - elapsed);
      const t = window.setTimeout(() => setPhase("ready"), wait);
      return () => clearTimeout(t);
    }
  }, [phase, resolvedUrl]);

  // ───────────────────────────────────────────────────────────────
  // Selecting-phase: phase in/out through random thumbnails slowly.
  // The flash interval is ~700ms so each thumbnail can fade in, dwell,
  // then cross-fade to the next — feels like "scanning" not "spinning".
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "selecting" || videos.length === 0) {
      if (flashTimerRef.current) {
        clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
      }
      return;
    }
    flashTimerRef.current = window.setInterval(() => {
      setFlashIdx((i) => {
        if (videos.length <= 1) return 0;
        let n = i;
        while (n === i) n = Math.floor(Math.random() * videos.length);
        return n;
      });
    }, FLASH_INTERVAL_MS);
    return () => {
      if (flashTimerRef.current) {
        clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, [phase, videos.length]);

  // ───────────────────────────────────────────────────────────────
  // Stage-by-stage countdown timer (only while running)
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "running" || paused) {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      return;
    }
    stageTimerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setStageIdx((prev) => {
            const nxt = prev + 1;
            if (nxt >= stages.length) {
              setPhase("completed");
              toast.success(`🏆 Challenge complete. Good boy, ${boyName}.`);
              return prev;
            }
            // 45% chance of forfeit between stages — Mistress is meaner now
            if (Math.random() < 0.45) {
              const raw = FORFEITS[Math.floor(Math.random() * FORFEITS.length)];
              setForfeit(raw.replace(/{name}/g, boyName));
            }
            // Track edges
            if (stages[nxt]?.kind === "EDGE" || stages[nxt]?.kind === "EDGE FINAL") {
              setEdgeCount((c) => {
                const n = c + 1;
                localStorage.setItem("goon-edge-count", String(n));
                return n;
              });
            }
            return nxt;
          });
          const ni = Math.min(stageIdx + 1, stages.length - 1);
          return stageDurationsSec[ni] ?? (stages[ni]?.weight ?? 0.1) * 240;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, [phase, stageIdx, stageDurationsSec, boyName, paused, stages]);

  // ───────────────────────────────────────────────────────────────
  // Build the message schedule once we hit "running"
  // ───────────────────────────────────────────────────────────────
  const buildSchedule = useCallback(() => {
    // Clear any pending
    messageTimeoutsRef.current.forEach((id) => clearTimeout(id));
    messageTimeoutsRef.current = [];

    const dur = videoDuration ?? 240;
    // Aim for 1 message every ~6 seconds, min 12 messages, max 240
    const total = Math.max(12, Math.min(240, Math.floor(dur / 6)));

    // For each scheduled slot, decide which stage it's in (by elapsed time
    // through the cumulative stage durations) and pick a message from that
    // stage's pool, with occasional FILLER injections.
    const stageEnds: number[] = [];
    let acc = 0;
    for (const s of stageDurationsSec) {
      acc += s;
      stageEnds.push(acc);
    }
    const totalStageSec = acc;

    const usedPerStage: Record<string, Set<string>> = {};
    Object.keys(MESSAGES).forEach((k) => (usedPerStage[k] = new Set()));
    const usedFiller = new Set<string>();

    const pickFrom = (pool: string[], used: Set<string>) => {
      const available = pool.filter((p) => !used.has(p));
      const list = available.length ? available : pool;
      const m = list[Math.floor(Math.random() * list.length)];
      used.add(m);
      if (used.size >= pool.length) used.clear();
      return m;
    };

    // Spread messages across the TOTAL stage time (not the video time —
    // they are aligned with the challenge timer, since some videos loop
    // or end before the stage timer does).
    for (let i = 0; i < total; i++) {
      // Slightly jittered evenly-spaced offset
      const baseSlot = ((i + 0.5) / total) * totalStageSec;
      const jitter = (Math.random() - 0.5) * (totalStageSec / total) * 0.6;
      const offsetSec = Math.max(0.5, baseSlot + jitter);

      // Find which stage this offset falls into
      let stageKind: StageKind = stages[0]?.kind ?? "WARM UP";
      for (let k = 0; k < stageEnds.length; k++) {
        if (offsetSec <= stageEnds[k]) {
          stageKind = stages[k]?.kind ?? stageKind;
          break;
        }
      }

      // 1-in-6 chance to use a filler instead, except in EDGE/CUM stages
      const useFiller =
        stageKind !== "EDGE" &&
        stageKind !== "EDGE FINAL" &&
        stageKind !== "CUM WINDOW" &&
        Math.random() < 1 / 6;

      const raw = useFiller
        ? pickFrom(FILLER_MESSAGES, usedFiller)
        : pickFrom(MESSAGES[stageKind], usedPerStage[stageKind]);
      const text = raw.replace(/\{name\}/g, boyName);

      const stageColor =
        STAGE_TEMPLATES[stageKind]?.color || "from-pink-500 to-rose-500";

      const id = window.setTimeout(() => {
        setMsgCount((c) => c + 1);
        setLastMsg(text);
        speakRef.current(text);
      }, offsetSec * 1000);
      messageTimeoutsRef.current.push(id);
    }
  }, [videoDuration, stageDurationsSec, boyName]);

  const clearMessageSchedule = () => {
    messageTimeoutsRef.current.forEach((id) => clearTimeout(id));
    messageTimeoutsRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMessageSchedule();
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  // ── Fetch image for interactive prep steps when step changes
  useEffect(() => {
    const step = PREP_STEPS[prepStep];
    setPrepTapCount(0);
    setPrepStepImage(null);
    if (step?.imageTag) {
      fetch(`/api/gallery/random?cat=${encodeURIComponent(step.imageTag)}`)
        .then((r) => r.json())
        .then((d) => {
          const url = d?.url || d?.fileUrl || d?.preview_url || d?.largeFileUrl;
          if (url) setPrepStepImage(url);
        })
        .catch(() => {});
    }
  }, [prepStep]);

  // ── Mistress TTS voice — whispers messages through the browser speech engine
  // Cache voices via the voiceschanged event so they're always ready.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled) return;
      if (!("speechSynthesis" in window)) return;
      // Cancel any pending speech first.
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.82;
      utter.pitch = 1.2;
      utter.volume = 0.95;
      // Pick a female voice from the pre-cached list. Fall back to any English
      // voice. Never speak without a voice — on some browsers that silently fails.
      const voices = voicesRef.current.length
        ? voicesRef.current
        : window.speechSynthesis.getVoices();
      const female =
        voices.find((v) =>
          /samantha|karen|victoria|moira|fiona|tessa|zira|hazel|susan|google.*us.*female|microsoft.*female/i.test(v.name),
        ) ||
        voices.find((v) => v.lang.startsWith("en") && /female|woman/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (female) utter.voice = female;
      // Resume AFTER cancel — clears Chrome's 15s idle-pause state right
      // before we enqueue, so the utterance starts playing immediately.
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    },
    [voiceEnabled],
  );
  // Keep speakRef always pointing at the latest speak callback
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // ── Theater mode: CSS overlay (all platforms) + native browser fullscreen
  //    (desktop only). iOS gets the CSS overlay with safe-area-aware layout.
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  const handleEnterTheater = useCallback(() => {
    setTheaterMode(true);
    // On non-iOS desktop, also request true browser fullscreen so the OS
    // pushes everything else off screen (taskbar, dock, etc.).
    if (!isIOS && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        /* browser may reject (e.g. iframe without allow="fullscreen") */
      });
    }
  }, [isIOS]);

  const handleExitTheater = useCallback(() => {
    setTheaterMode(false);
    setShowExitPrompt(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Sync theaterMode when the user escapes native fullscreen via Escape key.
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setTheaterMode(false);
        setShowExitPrompt(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ───────────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────────
  // ── Password gate handler
  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === "SamsMommy") {
      sessionStorage.setItem("goon-pw-unlocked", "1");
      setPasswordError(null);
      setIntroStep(0);
      setPhase("intro");
    } else {
      setPasswordError("That's not right. Who do you belong to?");
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 600);
      setPasswordInput("");
    }
  };

  // ── Intro advance — goes straight to prep gauntlet
  const handleIntroAdvance = () => {
    const name = boyName || "Sam";
    setBoyName(name);
    localStorage.setItem("goon-boy-name", name);
    setPrepStep(0);
    setPhase("prep");
  };

  const handleNameSubmit = () => {
    const trimmed = (nameInput || "").trim() || "Sam";
    setBoyName(trimmed);
    localStorage.setItem("goon-boy-name", trimmed);
    // Walk the boy through the prep gauntlet before any video is chosen.
    setPrepStep(0);
    setPhase("prep");
  };

  // Advance through the prep steps (lube, cock out, lock in, …). On the
  // final step, kick off video selection so the loader appears the
  // moment the last surrender confirm is tapped.
  const handlePrepAdvance = () => {
    setPrepStep((i) => {
      const next = i + 1;
      if (next >= PREP_STEPS.length) {
        setPhase("selecting");
        return 0;
      }
      return next;
    });
  };

  // In-session "I just edged" tap — bumps the lifetime counter, resets
  // the stroke counter for the new edge, and fires a Mistress whisper.
  const handleEdgeNow = () => {
    setEdgeCount((c) => {
      const n = c + 1;
      try {
        localStorage.setItem("goon-edge-count", String(n));
      } catch {}
      return n;
    });
    setStrokeCount(0);
    const lines = [
      `Edge banked, ${boyName}. Hands off. Breathe.`,
      `Good boy. That's #${edgeCount + 1}. Don't you dare cum.`,
      `Filthy. Hold it. Mistress is proud.`,
      `Edge counted, ${boyName}. Now ride the wave back down.`,
      `Twitch through it. Don't move. Mistress is watching.`,
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    setLastMsg(pick);
    setMsgCount((n) => n + 1);
    toast.success(pick, { duration: 2500 });
  };

  const handleStart = () => {
    if (!resolvedUrl) {
      toast.error("Loading the video first…");
      return;
    }
    setPhase("running");
    setPaused(false);
    setStageIdx(0);
    setSecondsLeft(stageDurationsSec[0]);
    // Auto-enter fullscreen on start — the click counts as a user gesture
    handleEnterTheater();
    // Sound is always on for Goon Corner. The Start click counts as a
    // user gesture, so the browser will allow audio. If for any reason
    // the unmuted play() rejects (rare, locked tab, etc), fall back to
    // muted playback so the video at least plays — user can tap to fix.
    const el = videoRef.current;
    if (el) {
      el.muted = false;
      el.volume = 1;
      try { el.currentTime = 0; } catch {}
      const tryPlay = () => {
        const p = el.play();
        if (p && typeof p.then === "function") {
          p.catch((err) => {
            console.warn("Goon Corner: unmuted play() rejected, falling back to muted:", err);
            el.muted = true;
            el.play().catch((err2) => {
              console.warn("Goon Corner: muted play() also rejected:", err2);
              toast.error("Couldn't start the video. Try Pause then Start again.");
            });
          });
        }
      };
      // If the stream isn't ready yet, wait for canplay before calling play()
      if (el.readyState >= 2) {
        tryPlay();
      } else {
        const onReady = () => {
          el.removeEventListener("canplay", onReady);
          tryPlay();
        };
        el.addEventListener("canplay", onReady);
        // Safety: try anyway after 600ms in case canplay never fires
        setTimeout(tryPlay, 600);
      }
    }
    // Kick off a welcome and the schedule
    toast(`Eyes on the screen, ${boyName}. Starting now. 🌸`, {
      duration: 3500,
      style: {
        background:
          "linear-gradient(135deg, rgba(244,63,94,0.95), rgba(190,24,93,0.95))",
        color: "white",
        fontWeight: 700,
      },
    });
    buildSchedule();
  };

  const handlePauseToggle = () => {
    if (phase !== "running") return;
    if (!paused) {
      setPaused(true);
      videoRef.current?.pause();
      clearMessageSchedule();
    } else {
      setPaused(false);
      videoRef.current?.play().catch((err) => {
        console.warn("Goon Corner: resume play() rejected:", err);
        toast.error("Couldn't resume playback. Tap Resume again.");
      });
      buildSchedule();
    }
  };

  const handleNextVideo = () => {
    if (videos.length === 0) return;
    clearMessageSchedule();
    const nxt = (currentIdx + 1) % videos.length;
    setCurrentIdx(nxt);
    setStageIdx(0);
    setMsgCount(0);
    setLastMsg(null);
    setPaused(false);
    setPhase("selecting");
    selectStartRef.current = Date.now();
  };

  const handleICame = () => {
    clearMessageSchedule();
    const wasInCumWindow = stageIdx >= stages.length - 1;
    setPhase("completed");
    toast(
      wasInCumWindow
        ? `🏆 Right on time. Such a good boy, ${boyName}.`
        : `💦 Premature, ${boyName}. The challenge wasn't over.`,
      {
        style: {
          background: wasInCumWindow ? "#16a34a" : "#dc2626",
          color: "white",
        },
      },
    );
  };

  const handleSetBackground = () => {
    if (!resolvedUrl) {
      toast.error("Loading the video first…");
      return;
    }
    onSetBackground?.("video", resolvedUrl, current?.thumbnail);
    toast.success("Set as site background");
  };

  const handleSaveToVault = () => {
    if (!resolvedUrl || !current) return;
    onSaveToVault?.({
      kind: "xvideo",
      videoUrl: resolvedUrl,
      thumbnail: current.thumbnail,
      title: current.title,
      sourcePageUrl: current.videoPageUrl,
    });
  };

  const handleResetName = () => {
    setNameInput(boyName);
    setPhase("intro");
  };

  const minSec = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const totalProgress =
    phase === "completed" ? 1 : stageIdx / Math.max(1, stages.length);

  // ───────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────

  // ── PASSWORD GATE ─────────────────────────────────────────────────────────
  if (phase === "password") {
    return (
      <section className="min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-10 flex items-center justify-center">
        <div
          className="max-w-sm w-full rounded-2xl border border-pink-500/40 shadow-2xl shadow-pink-900/60 overflow-hidden"
          style={{ background: "linear-gradient(160deg,#0d0010 0%,#1a0020 60%,#0a0010 100%)" }}
        >
          {/* Glow top strip */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-600 via-fuchsia-500 to-pink-600" />

          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl select-none"
              style={{ background: "radial-gradient(circle, rgba(244,63,94,0.25) 0%, rgba(244,63,94,0.05) 100%)", boxShadow: "0 0 40px rgba(244,63,94,0.35)" }}
            >
              🔒
            </div>

            <div>
              <p className="text-[10px] tracking-[0.45em] uppercase text-pink-400/70 mb-1">
                Private · Restricted Access
              </p>
              <h2 className="font-display text-3xl sm:text-4xl bg-gradient-to-r from-pink-300 via-rose-400 to-pink-400 bg-clip-text text-transparent tracking-wider leading-none">
                GOON CORNER
              </h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                This space belongs to Mommy and Sam.<br />
                Enter the password to be let in.
              </p>
            </div>

            <div className={`w-full transition-all ${passwordShake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
              style={passwordShake ? { animation: "shake 0.3s ease-in-out" } : {}}
            >
              <style>{`@keyframes shake {
                0%,100%{transform:translateX(0)}
                20%{transform:translateX(-8px)}
                40%{transform:translateX(8px)}
                60%{transform:translateX(-6px)}
                80%{transform:translateX(6px)}
              }`}</style>
              <input
                type="password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(null); }}
                onKeyDown={e => { if (e.key === "Enter") handlePasswordSubmit(); }}
                placeholder="Password"
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-black/50 border border-pink-500/30 focus:border-pink-400 focus:outline-none text-white placeholder:text-zinc-600 text-center text-lg tracking-[0.3em]"
              />
              {passwordError && (
                <p className="mt-2 text-xs text-rose-400 italic">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handlePasswordSubmit}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-pink-900/50 transition-all active:scale-95"
            >
              🌸 Enter
            </button>

            <p className="text-[10px] text-zinc-600 italic">
              You know this password, Sam. You always do.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Prep gauntlet (lube → cock out → lock in → set room → surrender)
  // Shown after the boy types his name and before the video gets picked.
  // Each step is a single full-bleed card with one big confirm button.
  if (phase === "prep") {
    const step = PREP_STEPS[prepStep] ?? PREP_STEPS[0];
    const StepIcon = step.Icon;
    const fill = (s: string) => s.replace(/\{name\}/g, boyName);
    return (
      <section className="min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-10 flex items-center justify-center">
        <div
          key={prepStep}
          className="max-w-lg w-full glass-card rounded-2xl border border-pink-500/30 p-6 sm:p-8 shadow-2xl shadow-pink-900/40 animate-slide-up text-center"
        >
          {/* Step pips */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {PREP_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < prepStep
                    ? "w-4 bg-pink-400"
                    : i === prepStep
                      ? "w-8 bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                      : "w-4 bg-pink-900/40"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] tracking-[0.4em] uppercase text-pink-400/90 mb-3 flex items-center justify-center gap-2">
            <StepIcon className="w-3.5 h-3.5 text-pink-400" /> {step.kicker}
          </p>
          <div
            className="text-6xl sm:text-7xl mb-4 select-none"
            style={{ filter: "drop-shadow(0 4px 18px rgba(244,63,94,0.45))" }}
          >
            {step.emoji}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl bg-gradient-to-r from-pink-300 via-rose-400 to-pink-300 bg-clip-text text-transparent leading-tight tracking-wide">
            {fill(step.title)}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-200 leading-relaxed">
            {fill(step.body)}
          </p>
          <p className="mt-3 text-xs italic text-pink-300/90">
            {fill(step.hint)}
          </p>

          {/* Interactive: hentai image shown on steps with imageTag */}
          {step.imageTag && prepStepImage && (
            <div className="mt-4 rounded-xl overflow-hidden border border-pink-500/30 shadow-lg shadow-pink-900/30">
              <img
                src={prepStepImage}
                alt=""
                className="w-full max-h-60 object-cover object-top"
                draggable={false}
              />
            </div>
          )}

          {/* Interactive: tap button + progress bar for steps with tapTarget */}
          {step.tapTarget && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-display text-2xl text-pink-300">
                  {prepTapCount}
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-400">{step.tapTarget}</span>
                <span className="text-zinc-500 ml-1 text-xs uppercase tracking-widest">
                  strokes
                </span>
              </div>
              <div className="w-full bg-pink-950/60 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.min(100, (prepTapCount / step.tapTarget) * 100)}%`,
                  }}
                />
              </div>
              <button
                onClick={() =>
                  setPrepTapCount((c) => Math.min(c + 1, step.tapTarget!))
                }
                disabled={prepTapCount >= step.tapTarget}
                className="mt-1 w-full h-14 rounded-xl bg-gradient-to-br from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-600 active:scale-95 disabled:from-zinc-700 disabled:to-zinc-700 disabled:opacity-50 text-white font-black text-xl tracking-wide transition-all shadow-lg shadow-pink-900/40 select-none"
              >
                {prepTapCount >= step.tapTarget!
                  ? "✓ Done"
                  : step.tapLabel || "TAP"}
              </button>
            </div>
          )}

          <button
            onClick={handlePrepAdvance}
            disabled={!!(step.tapTarget && prepTapCount < step.tapTarget)}
            className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-pink-900/40 flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" /> {step.confirm}
          </button>
          {prepStep > 0 && (
            <button
              onClick={() => setPrepStep((i) => Math.max(0, i - 1))}
              className="mt-3 text-[11px] uppercase tracking-widest text-zinc-500 hover:text-pink-400"
            >
              ← back
            </button>
          )}
        </div>
      </section>
    );
  }

  // ── INTRO — single quick slide ───────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <section className="min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-10 flex items-center justify-center">
        <div className="max-w-sm w-full rounded-2xl border border-pink-500/30 shadow-2xl shadow-pink-900/50 overflow-hidden animate-slide-up"
          style={{ background: "linear-gradient(160deg,#0d0010 0%,#1a0020 60%,#0a0010 100%)" }}>
          <div className="h-1 w-full bg-gradient-to-r from-pink-600 via-fuchsia-500 to-pink-600" />
          <div className="p-7 flex flex-col items-center gap-5 text-center">
            <div className="text-5xl select-none" style={{ filter: "drop-shadow(0 4px 18px rgba(244,63,94,0.5))" }}>🌸</div>
            <div>
              <p className="text-[10px] tracking-[0.45em] uppercase text-pink-400/70 mb-2">Welcome back, {boyName}.</p>
              <h2 className="font-display text-2xl bg-gradient-to-r from-pink-300 via-rose-400 to-pink-300 bg-clip-text text-transparent leading-tight tracking-wide">
                I've been waiting.
              </h2>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                Lock the door. Pants down. Lube ready.<br />
                You stroke when I say. You cum when I allow.<br />
                Eyes on the screen at all times.
              </p>
            </div>
            <button
              onClick={handleIntroAdvance}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-pink-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" /> I'm ready, Mommy 🌸
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={cornerRef as React.RefObject<HTMLElement>}
      className="min-h-[calc(100vh-8rem)] px-3 sm:px-4 py-4 sm:py-6 relative"
    >
      {/* ── Mommy exit-fullscreen prompt ── */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="max-w-sm w-full glass-card rounded-2xl border border-rose-500/40 p-6 text-center shadow-2xl shadow-rose-900/60 animate-slide-up">
            <p className="text-[10px] tracking-[0.4em] uppercase text-rose-400 mb-2 font-bold">
              Mommy wants to know…
            </p>
            <div className="text-5xl mb-3">😤</div>
            <h3 className="font-display text-2xl text-white mb-3 leading-tight">
              Are you sure you want to leave, baby?
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed mb-1">
              Mommy worked so hard to set up this session for you. You're right
              in the middle of{" "}
              <span className="text-rose-300 font-semibold">
                {stage ? stage.label : "your goon session"}
              </span>
              . If you leave now, Mommy will be very disappointed.
            </p>
            <p className="text-xs italic text-pink-300/80 mb-5">
              Don't make Mommy sad, {boyName}. Good boys finish what they start.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowExitPrompt(false)}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold tracking-widest uppercase text-sm transition-all"
              >
                I'll stay for Mommy 🌸
              </button>
              <button
                onClick={handleExitTheater}
                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs tracking-widest uppercase border border-white/10 transition-all"
              >
                Exit anyway (bad boy)
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-[11px] tracking-[0.4em] uppercase text-pink-400/80 mb-1 flex items-center justify-center gap-2">
            <Flame className="w-3.5 h-3.5 text-pink-500" /> 18+ · Goon Mode ·
            Curated for {boyName}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl tracking-wider bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-none">
            GOON CORNER
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Welcome back, <span className="text-pink-400 font-semibold">{boyName}</span>.
            Watch. Stroke. Edge. Hold it for the cum window.
          </p>
          <button
            onClick={handleResetName}
            className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600 hover:text-pink-400 transition-colors"
          >
            (not {boyName}? change name)
          </button>
        </div>

        {/* Selecting screen — flashing thumbnails overlay */}
        {phase === "selecting" && (
          <div className="relative mx-auto rounded-2xl overflow-hidden border border-pink-500/30 bg-black shadow-2xl shadow-pink-900/40 max-w-4xl">
            <div className="aspect-video bg-black relative overflow-hidden">
              {videos.length > 0 ? (
                <>
                  {/* Slow cross-fading thumbnail — phases in and out
                      so each pick gets a moment to breathe before the next. */}
                  <img
                    key={videos[flashIdx]?.id || flashIdx}
                    src={videos[flashIdx]?.thumbnail}
                    alt=""
                    style={{
                      animation: `goonSelectFade ${FLASH_INTERVAL_MS}ms ease-in-out`,
                    }}
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                    draggable={false}
                  />
                  <style>{`@keyframes goonSelectFade {
                    0% { opacity: 0; transform: scale(1.08); }
                    35% { opacity: 0.85; transform: scale(1.05); }
                    65% { opacity: 0.85; transform: scale(1.04); }
                    100% { opacity: 0; transform: scale(1.06); }
                  }`}</style>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                  {/* Bottom strip of mini thumbs — capped at 10 so the
                      full creamyspot library doesn't overflow the row */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 overflow-hidden">
                    {videos.slice(0, 10).map((v, i) => (
                      <div
                        key={v.id + i}
                        className={`flex-1 aspect-video rounded-md overflow-hidden border transition-all ${
                          i === flashIdx % 10
                            ? "border-pink-400 scale-110 shadow-lg shadow-pink-500/50"
                            : "border-white/10 opacity-50"
                        }`}
                      >
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-950/40 to-black" />
              )}

              {/* Center text */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                <Loader2 className="w-7 h-7 animate-spin text-pink-400 mb-3" />
                <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 mb-1">
                  Searching · creamyspot
                </p>
                <p className="font-display text-2xl sm:text-3xl tracking-wider text-white drop-shadow-lg">
                  Choosing the best creamyspot video for you,{" "}
                  <span className="text-pink-400">{boyName}</span>…
                </p>
                {resolving && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Locking it in…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ready / running / completed — actual video */}
        {phase !== "selecting" && (
          <div
            className={
              theaterMode
                ? "fixed inset-0 z-[200] bg-black"
                : "relative mx-auto rounded-2xl overflow-hidden border border-pink-500/20 bg-black shadow-2xl shadow-pink-900/30 max-w-4xl"
            }
          >
            {/* Video wrapper — aspect-video normally, fills screen in theater */}
            <div
              className={
                theaterMode
                  ? "absolute inset-0"
                  : "aspect-video bg-black relative"
              }
            >
              {resolving && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
                  <p className="text-xs text-zinc-400 tracking-widest uppercase">
                    Resolving stream…
                  </p>
                </div>
              )}
              {current && (
                <video
                  ref={videoElCallbackRef}
                  key={current.videoPageUrl}
                  poster={current.thumbnail}
                  playsInline
                  preload="auto"
                  onLoadedMetadata={handleLoadedMetadata}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* "Press Start" overlay before run */}
              {phase === "ready" && current && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pink-300 mb-2">
                    Locked in for {boyName}
                  </p>
                  <p className="font-display text-2xl sm:text-3xl tracking-wider text-white text-center px-6">
                    Ready when you are, {boyName}. 🌸
                  </p>
                  {videoDuration && (
                    <p className="mt-2 text-xs text-zinc-300">
                      Video length: {minSec(Math.round(videoDuration))} ·{" "}
                      <span className="text-pink-300 font-semibold">
                        {stages.length} stages
                      </span>{" "}
                      built for this clip · ~
                      {Math.max(12, Math.min(240, Math.floor(videoDuration / 6)))}{" "}
                      messages queued
                    </p>
                  )}
                </div>
              )}

              {/* Stage banner — always visible over video */}
              {phase === "running" && stage && (
                <div
                  className={`absolute top-3 left-3 right-3 px-4 py-2 rounded-xl bg-gradient-to-r ${stage.color} shadow-lg flex items-center justify-between gap-3 z-20`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-white/90 flex items-center gap-2">
                      <span>{stage.label}</span>
                      <span className="text-white/70 font-normal tracking-widest">
                        · Stage {stageIdx + 1} / {stages.length}
                      </span>
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {stage.instruction}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] tracking-widest text-white/80 uppercase">
                      Left
                    </p>
                    <p className="font-display text-2xl tracking-wider text-white leading-none">
                      {minSec(secondsLeft)}
                    </p>
                  </div>
                </div>
              )}

              {/* Theater mode: faint center instruction watermark */}
              {theaterMode && phase === "running" && stage && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12">
                  <p
                    className="font-display text-3xl sm:text-5xl text-white text-center leading-snug select-none"
                    style={{ opacity: 0.08 }}
                  >
                    {stage.instruction}
                  </p>
                </div>
              )}

              {/* Theater mode: floating controls bar at bottom — two-row
                  layout on mobile for comfortable thumb reach, single row on
                  sm+. Safe-area inset covers iOS home indicator. */}
              {theaterMode && (
                <div
                  className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 px-3"
                  style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
                >
                  {/* Row 1 (mobile): whisper line + pacer/BPM */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Pacer animation */}
                    {phase === "running" && stage && (
                      <div className="flex flex-col items-center gap-0">
                        <ArrowUp
                          className={`w-4 h-4 transition-all duration-100 ${pumpUp ? "text-pink-300 scale-125" : "text-pink-900/50"}`}
                          strokeWidth={3}
                        />
                        <span
                          className="text-lg leading-none transition-transform duration-100"
                          style={{ transform: pumpUp ? "translateY(-3px)" : "translateY(3px)" }}
                        >
                          🍆
                        </span>
                        <ArrowDown
                          className={`w-4 h-4 transition-all duration-100 ${!pumpUp ? "text-rose-300 scale-125" : "text-rose-900/50"}`}
                          strokeWidth={3}
                        />
                      </div>
                    )}
                    {/* BPM */}
                    {phase === "running" && stage && (
                      <div className="text-center">
                        <p className="text-[9px] uppercase tracking-widest text-pink-400 leading-none">BPM</p>
                        <p className="font-display text-xl text-white leading-none">{Math.round(STAGE_BPM[stage.kind] * speedMult)}</p>
                      </div>
                    )}
                    {/* Whisper — shown on all screen sizes in theater */}
                    {lastMsg && (
                      <p className="flex-1 text-[11px] text-pink-200/70 italic truncate min-w-0">
                        💋 {lastMsg}
                      </p>
                    )}
                  </div>

                  {/* Row 2: action buttons — large touch targets for thumb use */}
                  <div className="flex items-center gap-2">
                    {/* Pause / Resume */}
                    {phase === "running" && (
                      <button
                        onClick={handlePauseToggle}
                        className="flex items-center gap-1.5 flex-1 justify-center py-3 bg-fuchsia-700/90 active:bg-fuchsia-600 text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all"
                      >
                        {paused ? (
                          <><Play className="w-4 h-4" /> Resume</>
                        ) : (
                          <><Pause className="w-4 h-4" /> Pause</>
                        )}
                      </button>
                    )}
                    {/* Edge */}
                    {phase === "running" && (
                      <button
                        onClick={handleEdgeNow}
                        className="flex items-center gap-1.5 flex-1 justify-center py-3 bg-rose-700/80 active:bg-rose-600 text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all"
                      >
                        <Trophy className="w-4 h-4" /> Edge
                      </button>
                    )}
                    {/* I Came */}
                    <button
                      onClick={handleICame}
                      disabled={phase === "ready"}
                      className="flex items-center gap-1.5 flex-1 justify-center py-3 bg-white/10 active:bg-white/20 disabled:opacity-40 text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all border border-white/15"
                    >
                      <span>💦</span> Came
                    </button>
                    {/* Exit fullscreen */}
                    <button
                      onClick={() => setShowExitPrompt(true)}
                      className="flex items-center gap-1.5 flex-1 justify-center py-3 bg-pink-900/80 active:bg-pink-800 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all border border-pink-500/30"
                    >
                      <Minimize2 className="w-4 h-4" /> Exit
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Video meta + per-video actions */}
        {current && phase !== "selecting" && (
          <div className="max-w-4xl mx-auto mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-zinc-300 line-clamp-1">{current.title}</p>
              {/* One-line teaser derived from the title — quick "what
                  am I about to watch?" so the boy knows the flavour
                  before pressing play. */}
              <p className="mt-0.5 text-[11px] italic text-pink-300/80 line-clamp-1">
                💋 {summarizeTitle(current.title)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSetBackground}
                disabled={!resolvedUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Zap className="w-3.5 h-3.5" /> Set as Background
              </button>
              <button
                onClick={handleSaveToVault}
                disabled={!resolvedUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/80 hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Heart className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={async () => {
                  if (!current) return;
                  toast.loading("Preparing download…", { id: "gc-dl" });
                  try {
                    await saveToDevice({
                      streamUrl: resolvedUrl ?? undefined,
                      pageUrl: resolvedUrl ? undefined : current.videoPageUrl,
                      title: current.title,
                    });
                    toast.dismiss("gc-dl");
                    toast.success("Download started!");
                  } catch {
                    toast.dismiss("gc-dl");
                    toast.error("Download failed");
                  }
                }}
                disabled={!current}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={handleNextVideo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" /> Next Video
              </button>
            </div>
          </div>
        )}

        {/* Challenge controls — hidden when theater mode active (controls float inside video) */}
        {phase !== "selecting" && !theaterMode && (
          <div className="max-w-4xl mx-auto mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {phase === "ready" && (
              <button
                onClick={handleStart}
                disabled={!resolvedUrl}
                className="col-span-2 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-pink-900/40 tracking-wider uppercase text-sm transition-all"
              >
                <Play className="w-4 h-4" /> Start Goon Challenge
              </button>
            )}
            {phase === "running" && (
              <button
                onClick={handlePauseToggle}
                className="col-span-2 flex items-center justify-center gap-2 px-5 py-3 bg-amber-600/80 hover:bg-amber-600 text-white font-bold rounded-xl tracking-wider uppercase text-sm transition-all"
              >
                {paused ? (
                  <>
                    <Play className="w-4 h-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                )}
              </button>
            )}
            {phase === "completed" && (
              <button
                onClick={() => {
                  setStageIdx(0);
                  setSecondsLeft(stageDurationsSec[0]);
                  setMsgCount(0);
                  setLastMsg(null);
                  setPhase("running");
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                  buildSchedule();
                }}
                className="col-span-2 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-500 hover:to-pink-500 text-white font-bold rounded-xl tracking-wider uppercase text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Run It Again
              </button>
            )}
            {/* Fullscreen / theater mode toggle */}
            <button
              onClick={handleEnterTheater}
              disabled={!resolvedUrl && phase === "ready"}
              title="Enter Fullscreen"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/70 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl border border-indigo-400/30 tracking-wider uppercase text-sm transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
            {/* I Came button */}
            <button
              onClick={handleICame}
              disabled={phase === "ready"}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold rounded-xl border border-white/10 tracking-wider uppercase text-sm transition-all"
            >
              <span className="text-base">💦</span> I came
            </button>
          </div>
        )}

        {/* ── Stroke pacer + Edge Now tap-button.
            Up arrow lights on the up-stroke half of every beat, down
            arrow lights on the down-stroke half. Hand emoji bounces
            between them. Tempo (BPM) is wired to the active stage —
            slow on EDGE, frenzy on POUND/CUM WINDOW. */}
        {phase === "running" && stage && !theaterMode && (
          <div className="max-w-4xl mx-auto mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 glass-card rounded-xl border border-pink-500/30 bg-pink-950/30 p-4 flex items-center gap-4">
              {/* Vertical pacer column */}
              <div className="flex flex-col items-center justify-center w-16 shrink-0 select-none">
                <ArrowUp
                  className={`w-9 h-9 transition-all duration-100 ${
                    pumpUp
                      ? "text-pink-300 drop-shadow-[0_0_14px_rgba(244,114,182,0.95)] scale-125"
                      : "text-pink-900/50 scale-90"
                  }`}
                  strokeWidth={3}
                />
                <span
                  className="text-3xl my-1 transition-transform duration-100"
                  style={{
                    transform: pumpUp ? "translateY(-6px)" : "translateY(6px)",
                  }}
                >
                  🍆
                </span>
                <ArrowDown
                  className={`w-9 h-9 transition-all duration-100 ${
                    !pumpUp && !paused
                      ? "text-rose-300 drop-shadow-[0_0_14px_rgba(244,114,182,0.95)] scale-125"
                      : "text-rose-900/50 scale-90"
                  }`}
                  strokeWidth={3}
                />
              </div>
              {/* Pacer label + BPM */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-pink-400 font-bold">
                    Stroke pacer · {stage.label}
                  </p>
                  {/* Voice toggle */}
                  <button
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (next && "speechSynthesis" in window) {
                        // Unlock TTS on first enable — must happen inside a
                        // direct click handler on iOS / Chrome strict mode.
                        window.speechSynthesis.resume();
                        const unlock = new SpeechSynthesisUtterance(" ");
                        unlock.volume = 0;
                        window.speechSynthesis.speak(unlock);
                      }
                    }}
                    title={voiceEnabled ? "Mistress Voice ON — click to mute" : "Mistress Voice OFF — click to enable"}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      voiceEnabled
                        ? "bg-pink-600/30 text-pink-300 border border-pink-500/30"
                        : "bg-white/5 text-zinc-500 border border-white/10 hover:border-pink-500/30 hover:text-pink-400"
                    }`}
                  >
                    {voiceEnabled ? "🔊 Voice" : "🔇 Voice Off"}
                  </button>
                </div>
                <p className="font-display text-2xl sm:text-3xl text-white leading-none">
                  {pumpUp ? "UP ↑" : "DOWN ↓"}
                </p>
                <p className="mt-1 text-xs text-pink-200/90">
                  {Math.round(STAGE_BPM[stage.kind] * speedMult)} bpm · {speedPreset !== "normal" ? `${SPEED_PRESETS.find(p=>p.id===speedPreset)?.label} mode · ` : ""}obey the arrows, {boyName}
                </p>
                {/* Beat dots */}
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        pumpUp ? "bg-pink-500/80" : "bg-rose-500/40"
                      }`}
                      style={{ transitionDelay: `${i * 25}ms` }}
                    />
                  ))}
                </div>
                {/* ── Speed preset selector */}
                <div className="mt-3 border-t border-pink-500/20 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-pink-400/70 mb-1.5 font-bold">Speed Mode</p>
                  <div className="flex flex-wrap gap-1">
                    {SPEED_PRESETS.map((p) => {
                      const active = speedPreset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSpeedPreset(p.id as SpeedPresetId)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                            active
                              ? `bg-gradient-to-r ${p.color} ${p.textColor} border-pink-400/50 shadow-[0_0_12px_rgba(255,62,165,0.5)] scale-105`
                              : "bg-white/5 text-zinc-400 border-white/10 hover:border-pink-400/30 hover:text-pink-300"
                          }`}
                        >
                          {p.label}
                          <span className="ml-1 opacity-60 text-[8px]">{Math.round(145 * p.mult)}bpm↑</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Tap-to-edge button */}
            <button
              onClick={handleEdgeNow}
              className="glass-card rounded-xl border border-pink-400/40 bg-gradient-to-br from-pink-700/30 via-fuchsia-700/30 to-rose-700/30 hover:from-pink-600/40 hover:via-fuchsia-600/40 hover:to-rose-600/40 p-4 text-center transition-all active:scale-95 group"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 font-bold mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Tap when you edge
              </p>
              <p className="font-display text-3xl sm:text-4xl text-pink-200 leading-none group-hover:text-white">
                EDGE
              </p>
              <p className="mt-2 text-[11px] text-pink-200/70">
                Logs it · resets stroke count · Mistress whispers back
              </p>
            </button>
          </div>
        )}

        {/* Latest whisper card */}
        {(phase === "running" || phase === "completed") && lastMsg && (
          <div className="max-w-4xl mx-auto mt-4 flex items-start gap-3 p-3 rounded-xl bg-pink-950/40 border border-pink-500/30">
            <MessageCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-pink-400 font-bold mb-0.5">
                Whispering to {boyName} · #{msgCount}
              </p>
              <p className="text-sm text-white">{lastMsg}</p>
            </div>
          </div>
        )}

        {/* Stage progress + counters */}
        {phase !== "selecting" && (
          <div className="max-w-4xl mx-auto mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1">
                Stage
              </p>
              <p className="font-display text-lg text-white">
                {Math.min(stageIdx + 1, stages.length)}/
                {stages.length}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1">
                Progress
              </p>
              <p className="font-display text-lg text-white">
                {Math.round(totalProgress * 100)}%
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
                <Hand className="w-3 h-3" /> Strokes
              </p>
              <p className="font-display text-lg text-pink-300">
                {strokeCount}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1">
                Whispers
              </p>
              <p className="font-display text-lg text-pink-400">{msgCount}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Lifetime Edges
              </p>
              <p className="font-display text-lg text-amber-400">{edgeCount}</p>
            </div>
          </div>
        )}

        {/* Forfeit toast-card */}
        {forfeit && (
          <div className="max-w-4xl mx-auto mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3">
            <Skull className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.3em] uppercase text-rose-400 font-bold mb-1">
                Forfeit, {boyName}
              </p>
              <p className="text-sm text-white">{forfeit}</p>
            </div>
            <button
              onClick={() => setForfeit(null)}
              className="text-xs text-rose-300 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
            >
              Done
            </button>
          </div>
        )}

        {/* Pull a fresh batch */}
        {phase !== "selecting" && (
          <div className="max-w-4xl mx-auto mt-6 text-center">
            <button
              onClick={loadVideos}
              className="text-xs text-zinc-500 hover:text-pink-400 tracking-widest uppercase flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="w-3 h-3" /> Pull a fresh creamy spot batch
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
