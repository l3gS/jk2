import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Circle, RefreshCw, ChevronRight, ChevronLeft, Shuffle, Lock, Unlock, X as XIcon, Crown, Heart, Sparkles, AlertTriangle, Flame } from 'lucide-react'

// ─── TASK DATABASE ───────────────────────────────────────────────────────────
// heat: 1 = spicy, 2 = hot, 3 = filthy, 4 = extreme
interface Task {
  id: string
  category: 'feet' | 'panties' | 'obedience' | 'confession' | 'challenge' | 'worship' | 'humiliation' | 'denial'
  heat: 1 | 2 | 3 | 4
  text: string
  mommy: string  // what mommy says when she gives you the task
}

const TASKS: Task[] = [
  // ── FEET ────────────────────────────────────────────────────────
  {
    id: 'f1', category: 'feet', heat: 1,
    text: 'Go to the Feet tab. Find the hottest image. Stare at it for 60 full seconds without clicking away.',
    mommy: "Go worship some feet, you little pervert. Don't you dare look away.",
  },
  {
    id: 'f2', category: 'feet', heat: 2,
    text: 'Take off your socks right now. Spend 2 minutes rubbing your own feet and thinking about how good someone else\'s would smell.',
    mommy: "Socks off. Now. Feel them. Touch them. You know exactly what you're thinking about.",
  },
  {
    id: 'f3', category: 'feet', heat: 2,
    text: 'Find a feet video in the gallery. Watch every single second of it. No skipping. Report back when it\'s done.',
    mommy: "You think I don't know what you do on that Feet page? Watch every second. Eyes on screen.",
  },
  {
    id: 'f4', category: 'feet', heat: 3,
    text: 'Write "I have a foot fetish and I\'m proud of it" out loud 5 times. Alone or not — Mommy doesn\'t care.',
    mommy: "Say it out loud. Own it. Say it 5 times. There's no shame in what you love, baby boy.",
  },
  {
    id: 'f5', category: 'feet', heat: 3,
    text: 'Save 3 feet images to your vault right now. They must be your personal favorites — no rushing.',
    mommy: "Build Mommy a proper collection. 3 feet images. Your favorites. Take your time choosing.",
  },
  {
    id: 'f6', category: 'feet', heat: 2,
    text: 'Press your feet flat on the floor. Hold this position for the next 3 tasks. Mommy\'s orders.',
    mommy: "Feet. Flat. On the floor. Right now. Hold that for me. Good boy.",
  },
  {
    id: 'f7', category: 'feet', heat: 4,
    text: 'Find the most explicit feet image in the gallery. Set it as your site background for the next 10 minutes. Don\'t change it.',
    mommy: "You\'re going to worship it properly. Set it as your background. Look at it every time you browse. 10 minutes minimum.",
  },
  {
    id: 'f8', category: 'feet', heat: 1,
    text: 'Search "feet" in the gallery. Scroll through everything slowly without saving anything. Just look. Just want.',
    mommy: "Look. Don't touch. Don't save. Just scroll and suffer. That's your task.",
  },
  {
    id: 'f9', category: 'feet', heat: 3,
    text: 'Sniff your own feet for 30 seconds while staring at a feet image on screen. Don\'t stop early.',
    mommy: "You know you love that smell. Own it. 30 seconds. Eyes on screen the whole time.",
  },
  {
    id: 'f10', category: 'feet', heat: 4,
    text: 'Strip from the waist down right now. Browse only the Feet gallery for the next 15 minutes. Nothing else is allowed.',
    mommy: "Naked from the waist down. Feet gallery only. 15 minutes. Don't you dare switch tabs.",
  },
  {
    id: 'f11', category: 'feet', heat: 3,
    text: 'Try to lick your own toes. If you can\'t reach, lick your fingers slowly instead — same energy. Describe out loud exactly what you\'re thinking.',
    mommy: "Try it. You know you want to. Lick them or your fingers. Tell Mommy what you\'re imagining right now.",
  },
  {
    id: 'f12', category: 'feet', heat: 4,
    text: 'Your next full edging session is feet content ONLY. No faces, no bodies — only feet on screen. Edge at least once. Don\'t finish.',
    mommy: "Feet only. No exceptions. Edge to them properly — really let yourself go there. Then stop.",
  },
  {
    id: 'f13', category: 'feet', heat: 2,
    text: 'Find 3 feet images that make you hard from the thumbnail alone. Save all three to vault.',
    mommy: "Three thumbnails. Three that hit instantly. No cheating. Save them. Mommy wants the best.",
  },
  {
    id: 'f14', category: 'feet', heat: 3,
    text: 'Open Luna chat. Write a detailed explicit sexual fantasy about feet — minimum 5 sentences. Nothing censored.',
    mommy: "Luna is ready for your confession. Five sentences minimum. Be graphic. Leave nothing out.",
  },
  {
    id: 'f15', category: 'feet', heat: 4,
    text: 'Pick ONE single feet image. Edge to that image and nothing else. No scrolling. Just that image. Get as close as you can then stop.',
    mommy: "One image. Just her feet. Edge to them. No scrolling, no switching. Prove you can cum from just this.",
  },
  {
    id: 'f16', category: 'feet', heat: 3,
    text: 'Walk barefoot around the room for 10 minutes. With every step, think about feet. By the end you should be aching.',
    mommy: "Walk. Think about feet with every single step. Come back aroused and confess your level from 1-10.",
  },

  // ── PANTIES ─────────────────────────────────────────────────────
  {
    id: 'p1', category: 'panties', heat: 2,
    text: 'Go get a pair of (your own or someone else\'s worn) panties. Hold them in your hand for the next 5 minutes while you browse.',
    mommy: "Go get them. You know which ones. Hold them. Don't put them down until I say so.",
  },
  {
    id: 'p2', category: 'panties', heat: 3,
    text: 'If you\'re home alone: put on a pair of panties right now. Wear them for the rest of this session.',
    mommy: "Put them on. Don't argue with me. You know you want to. Do it, then come back.",
  },
  {
    id: 'p3', category: 'panties', heat: 3,
    text: 'Find a worn pair of panties and smell them. Really smell them. Think about exactly whose they are and why.',
    mommy: "You know the smell. You love the smell. Go do it properly. Don't be shy with Mommy.",
  },
  {
    id: 'p4', category: 'panties', heat: 2,
    text: 'Type a confession in the Luna chat: tell her your honest feelings about wearing panties. No censoring.',
    mommy: "Go tell Luna. Tell her everything. I\'ll read it later. Be completely honest, baby.",
  },
  {
    id: 'p5', category: 'panties', heat: 4,
    text: 'Wear panties on your head like a crown for exactly 2 minutes. Sit there. Own it.',
    mommy: "Crown yourself. King of the kinks. Two full minutes. Do it and come back to me.",
  },
  {
    id: 'p6', category: 'panties', heat: 2,
    text: 'Think about the hottest person you know. Imagine their used panties. Sit with that thought for 60 seconds.',
    mommy: "Close your eyes. Think about them. Really think. 60 seconds. That\'s all. You\'re welcome.",
  },
  {
    id: 'p7', category: 'panties', heat: 3,
    text: 'If you own any panties: lay them all out on the bed, rank them from most to least worn, and report back which is #1.',
    mommy: "Inventory time. Lay them all out. Rank them. Tell Mommy which ones win.",
  },
  {
    id: 'p8', category: 'panties', heat: 4,
    text: 'Put on panties. Edge wearing them. Don\'t take them off until you\'ve edged at least once. Stay in them for the rest of the session.',
    mommy: "On. Edge. Stay in them. You don\'t get to take them off until I say. That\'s how this works.",
  },
  {
    id: 'p9', category: 'panties', heat: 3,
    text: 'Hold a pair of panties against your face for the entire next 5 minutes of browsing. Hands stay up. Don\'t move them.',
    mommy: "Face covered. Hands up. Five minutes. Breathe through them. Good boy.",
  },
  {
    id: 'p10', category: 'panties', heat: 4,
    text: 'Tie a pair of panties around your wrist right now. Wear it like a bracelet for the rest of today. Don\'t explain it to anyone.',
    mommy: "Wrist. Now. Tied. You wear my mark today. Don't take it off.",
  },
  {
    id: 'p11', category: 'panties', heat: 3,
    text: 'Tell Luna in explicit detail exactly how you smell panties — position, breathing technique, how long. Confess everything.',
    mommy: "Tell her your technique. The real one. Every embarrassing detail. Luna won\'t judge you. I will — lovingly.",
  },
  {
    id: 'p12', category: 'panties', heat: 4,
    text: 'Edge while pressing panties hard against your face. Inhale deeply with every stroke. Stop right at the edge.',
    mommy: "Face covered. Stroke. Breathe. Get to the edge. Stop. That\'s the whole task. Don\'t finish.",
  },
  {
    id: 'p13', category: 'panties', heat: 3,
    text: 'Fold a pair of panties neatly and place them on your desk in front of you. Don\'t move them or touch them for 30 minutes. Just look.',
    mommy: "Right in front of you. Folded. You look but don\'t touch for 30 minutes. That\'s discipline.",
  },

  // ── OBEDIENCE ───────────────────────────────────────────────────
  {
    id: 'o1', category: 'obedience', heat: 1,
    text: 'Kneel on the floor right now. Stay kneeling until you finish reading this task and the next one.',
    mommy: "On your knees. Right now. Good. Stay there until I tell you otherwise.",
  },
  {
    id: 'o2', category: 'obedience', heat: 1,
    text: 'Say out loud: "I am Mommy\'s good boy and I do whatever she says." Say it 5 times, clearly.',
    mommy: "Say it. Five times. Out loud. I want to hear you mean it.",
  },
  {
    id: 'o3', category: 'obedience', heat: 2,
    text: 'Sit on the floor (not your chair) for the next 10 minutes while you browse. No cheating.',
    mommy: "Floor. Sit. Now. Ten minutes. Good boys earn their chairs back.",
  },
  {
    id: 'o4', category: 'obedience', heat: 2,
    text: 'Before every click for the next 3 minutes, whisper "yes Mommy" under your breath.',
    mommy: "Every. Single. Click. Whisper it. This is non-negotiable.",
  },
  {
    id: 'o5', category: 'obedience', heat: 3,
    text: 'Edge for exactly 3 minutes — set a timer. Stop the moment it goes off. No finishing.',
    mommy: "Three minutes. Not a second more. When that timer goes off, you STOP. Understand?",
  },
  {
    id: 'o6', category: 'obedience', heat: 1,
    text: 'Close every other tab. This is the only thing you\'re allowed to have open right now.',
    mommy: "Everything else. Gone. I have your full attention. Just you and me.",
  },
  {
    id: 'o7', category: 'obedience', heat: 2,
    text: 'Put something cold on your lap and hold it there for 60 seconds. Refocus.',
    mommy: "Cooling you down a little, baby. Hold it there. You can handle it. Good boy.",
  },
  {
    id: 'o8', category: 'obedience', heat: 3,
    text: 'Write "Property of Mommy" on a piece of paper. Keep it in your pocket for the rest of today.',
    mommy: "Write it. Fold it. Pocket. Don't lose it. That\'s a reminder of who you belong to.",
  },
  {
    id: 'o9', category: 'obedience', heat: 4,
    text: 'Strip to just underwear right now. Stay that way for the rest of this session. No getting dressed.',
    mommy: "Clothes off. Underwear only. The whole session. You don\'t get dressed until I\'m done with you.",
  },
  {
    id: 'o10', category: 'obedience', heat: 3,
    text: 'Set a 5-minute timer. For those 5 minutes you may not move from your current position. Not even to adjust.',
    mommy: "Timer. Set. You don\'t move. Not your arms, not your legs, not your hips. STILL.",
  },
  {
    id: 'o11', category: 'obedience', heat: 4,
    text: 'Open Goon Corner. Set speed to Seizure mode. Edge in that mode for 2 full minutes. Stop before you cum. Don\'t touch yourself for 5 minutes after.',
    mommy: "Seizure mode. Two minutes. Get to the edge. STOP. Then five minutes hands-off. That\'s the punishment for wanting to cum.",
  },
  {
    id: 'o12', category: 'obedience', heat: 3,
    text: 'Write "I belong to Mommy" on your inner thigh in ink. Keep it there until it fades.',
    mommy: "Write it where only you — and I — know it\'s there. Inner thigh. Now. My mark on your body.",
  },
  {
    id: 'o13', category: 'obedience', heat: 4,
    text: 'Go 10 full minutes without touching yourself at all — not even adjusting — while browsing explicit content. Timer starts now.',
    mommy: "Hands away from yourself. Ten minutes. Full content allowed. Touching is forbidden. I\'m watching.",
  },
  {
    id: 'o14', category: 'obedience', heat: 3,
    text: 'Count every breath you take for 3 minutes while browsing. Out loud. Every. Single. Breath. Don\'t miss one.',
    mommy: "Every breath counted. Out loud. Three minutes. This is about control. Mommy owns your breath right now.",
  },

  // ── CONFESSION ──────────────────────────────────────────────────
  {
    id: 'c1', category: 'confession', heat: 2,
    text: 'Open Luna chat and confess your #1 weirdest fetish you\'ve never told anyone. Be brutally honest.',
    mommy: "Tell Luna your deepest secret. The one you\'re most ashamed of. I want the truth.",
  },
  {
    id: 'c2', category: 'confession', heat: 2,
    text: 'Think of the most embarrassing thing in your browser history. Type it here in your head and say "I own this."',
    mommy: "You know what it is. You\'re thinking of it right now. Own it. Say it. I\'m not judging you.",
  },
  {
    id: 'c3', category: 'confession', heat: 1,
    text: 'Rate your current level of horniness out loud from 1-10. Then tell me what specifically got you there.',
    mommy: "Say the number out loud. Then explain yourself. Mommy wants a full report.",
  },
  {
    id: 'c4', category: 'confession', heat: 3,
    text: 'Confess your foot fetish out loud, in full detail, as if explaining it to someone for the first time.',
    mommy: "Explain it. Out loud. All of it. Why feet? What do you love? Don\'t skip anything.",
  },
  {
    id: 'c5', category: 'confession', heat: 3,
    text: 'Tell Luna exactly what kind of panties you find most exciting and why. Be specific. Use adjectives.',
    mommy: "Luna can keep a secret. Tell her everything. The color, the texture, worn or new. All of it.",
  },
  {
    id: 'c6', category: 'confession', heat: 3,
    text: 'Tell Luna your most shameful masturbation habit in explicit detail. Don\'t soften it, don\'t skip anything.',
    mommy: "The habit. The real one. Every shameful detail. Luna\'s heard worse. Probably. Tell her.",
  },
  {
    id: 'c7', category: 'confession', heat: 4,
    text: 'Confess the most depraved thing you\'ve ever searched for. Say it out loud to yourself first. Then type it to Luna.',
    mommy: "Say it out loud before you type it. Own it with your voice first. Then confess to Luna.",
  },
  {
    id: 'c8', category: 'confession', heat: 3,
    text: 'In Luna chat, rate every kink you have on a 1-10 arousal scale. Don\'t skip any. Don\'t lie.',
    mommy: "Every kink. Rated. Honestly. I want to see what makes you tick and what makes you twitch.",
  },
  {
    id: 'c9', category: 'confession', heat: 4,
    text: 'Describe your ideal humiliation scenario in Luna chat. Be specific — what you\'re wearing, what she says, what happens.',
    mommy: "Your fantasy. The humiliation one. Write it out fully. Every specific, embarrassing detail.",
  },
  {
    id: 'c10', category: 'confession', heat: 3,
    text: 'List 5 things that turn you on that you\'ve never admitted to anyone. Say each one out loud before writing it to Luna.',
    mommy: "Say each one out loud first. Voice it before you type it. Five admissions. Go.",
  },
  {
    id: 'c11', category: 'confession', heat: 4,
    text: 'Write your most explicit, detailed sexual fantasy to Luna. Every sensation, every image, every act. Nothing omitted.',
    mommy: "The full fantasy. Not the edited version. The real one you replay when you\'re alone. All of it.",
  },

  // ── CHALLENGE ───────────────────────────────────────────────────
  {
    id: 'ch1', category: 'challenge', heat: 2,
    text: 'Find the best 3D CGI image in the gallery. Save it to vault. Set it as your background. Don\'t change it for 20 minutes.',
    mommy: "Find the best one. Not just any — the BEST. Twenty minutes. That\'s your view.",
  },
  {
    id: 'ch2', category: 'challenge', heat: 2,
    text: 'Play a full round of Waifu Battle in Feet mode. Report your total rounds played when done.',
    mommy: "Waifu Battle. Feet mode. Full round. Come back and tell Mommy your score.",
  },
  {
    id: 'ch3', category: 'challenge', heat: 3,
    text: 'Open Luna chat. Tell her you\'re Mommy\'s good boy. Ask her to give you a kinky task. Do whatever she says.',
    mommy: "Go talk to Luna. Tell her Mommy sent you. Do what she says. This is a chain of command.",
  },
  {
    id: 'ch4', category: 'challenge', heat: 1,
    text: 'Spend 10 full minutes in the Goon Corner without pausing. No escape. Stay present.',
    mommy: "Ten minutes. Goon Corner. Stay. No excuses. Mommy\'s timing you.",
  },
  {
    id: 'ch5', category: 'challenge', heat: 3,
    text: 'Edge twice from gallery content. First from a feet image. Second from a panty image. Report back.',
    mommy: "Feet first. Then panties. Two edges. Come back to me when you\'re done. Don\'t finish.",
  },
  {
    id: 'ch6', category: 'challenge', heat: 4,
    text: 'Find the most taboo image in the gallery you can. Stare at it for 5 minutes. Don\'t look away. Think about why you like it.',
    mommy: "I know you have a type. Go find it. Stare. Five minutes. Own your desires.",
  },
  {
    id: 'ch7', category: 'challenge', heat: 3,
    text: 'Play 3 rounds of Target Practice. Every time you miss a target, do 10 strokes. Keep count. Report your total.',
    mommy: "Target Practice. Three rounds. Miss = 10 strokes. Come back with your total. Don\'t lie.",
  },
  {
    id: 'ch8', category: 'challenge', heat: 4,
    text: 'Edge 3 separate times in Goon Corner. After each edge: 2-minute hands-off break. After the 3rd edge: stop completely. No finishing.',
    mommy: "Three edges. Break after each. Then stop. You don\'t get to cum after three edges. That\'s the game.",
  },
  {
    id: 'ch9', category: 'challenge', heat: 3,
    text: 'Open the AI image generator. Generate 3 images using your exact fetish as the prompt. Save all three to vault.',
    mommy: "Your real fetish. Not a watered-down version. Type what you actually want and generate it. Save all three.",
  },
  {
    id: 'ch10', category: 'challenge', heat: 4,
    text: 'Give yourself a strict 20-minute no-touch window. Content fully allowed — touching forbidden. Timer starts the moment you close this.',
    mommy: "Twenty minutes. Full content. Hands off your body. Every second. I\'m counting.",
  },
  {
    id: 'ch11', category: 'challenge', heat: 3,
    text: 'Complete 20 rounds of Waifu Battle in Feet mode without stopping. Report your hall of fame rankings after.',
    mommy: "Twenty rounds. Feet mode. No breaks. Come back with your leaderboard. Show me who won.",
  },
  {
    id: 'ch12', category: 'challenge', heat: 4,
    text: 'Start a Luna roleplay where she humiliates you for your specific fetishes. Stay in character for at least 10 back-and-forth messages. Don\'t break.',
    mommy: "Tell Luna to humiliate you. Be specific about your kinks. Ten messages minimum. Stay in it. Don\'t chicken out.",
  },
  {
    id: 'ch13', category: 'challenge', heat: 4,
    text: 'Open Goon Corner. Set speed to Machine. Stay in Machine mode for 5 full minutes. Eyes on screen. Don\'t slow it down.',
    mommy: "Machine speed. Five minutes. You don\'t get to lower it. Eyes on the screen the entire time. Prove you can take it.",
  },

  // ── WORSHIP ─────────────────────────────────────────────────────
  {
    id: 'w1', category: 'worship', heat: 2,
    text: 'Open the gallery, Feet section. Pick your absolute favorite image. Write (mentally or physically) 5 things you love about it.',
    mommy: "Pick ONE. Your favorite. Really look at it. Give me five specific things you love. Go.",
  },
  {
    id: 'w2', category: 'worship', heat: 1,
    text: 'Save the Daily Waifu to your vault. She\'s today\'s queen. Respect her.',
    mommy: "The Daily Waifu is your queen for today. Save her. Respect her. That\'s an order.",
  },
  {
    id: 'w3', category: 'worship', heat: 3,
    text: 'Find a feet image that you\'d genuinely worship in real life. Set it as your background. Stare at it while you do your next task.',
    mommy: "Not just any image — one you\'d actually worship. Set it. Stare at it. Feel it.",
  },
  {
    id: 'w4', category: 'worship', heat: 2,
    text: 'Bow your head toward the screen for 10 seconds. You\'re worshipping. This is real.',
    mommy: "Head down. Ten seconds. Real worship. You don\'t get to feel embarrassed about this.",
  },
  {
    id: 'w5', category: 'worship', heat: 3,
    text: 'Spend 5 minutes just browsing feet content. No saving, no racing. Just pure appreciation. Be present.',
    mommy: "Slow down. Just look. Five minutes of pure feet appreciation. No rushing. Just feel.",
  },
  {
    id: 'w6', category: 'worship', heat: 3,
    text: 'Write a prayer to your favorite waifu\'s feet. Out loud. Full sentences. Mean every word.',
    mommy: "A real prayer. Out loud. To her feet. Every word spoken with meaning. Don\'t rush it.",
  },
  {
    id: 'w7', category: 'worship', heat: 4,
    text: 'Set a feet image as your site background right now. It stays there for the next 24 hours. She is your goddess today.',
    mommy: "Set her as your background. 24 hours. She watches over everything you do. Don\'t you dare clear it.",
  },
  {
    id: 'w8', category: 'worship', heat: 3,
    text: 'Find the highest-rated feet image in your Waifu Battle hall of fame. Spend 10 uninterrupted minutes with only that one image.',
    mommy: "Your hall of fame leader. The one who earned her rank. Ten minutes. Just her. Nothing else.",
  },
  {
    id: 'w9', category: 'worship', heat: 4,
    text: 'Edge while maintaining unbroken eye contact with a feet image. If you look away even once — start the edge over.',
    mommy: "Eyes on her feet. The whole time. Look away and you restart. I know when you cheat.",
  },
  {
    id: 'w10', category: 'worship', heat: 3,
    text: 'Find a feet GIF in the gallery. Watch it loop exactly 50 times. Count every single loop out loud.',
    mommy: "Count. Every. Loop. Out loud. Fifty times. If you lose count, you start from zero.",
  },
  {
    id: 'w11', category: 'worship', heat: 4,
    text: 'Get on your knees facing the screen. Put your favorite feet image up. Worship it out loud for 3 full minutes. Speak every thought.',
    mommy: "Knees. Facing her. Three minutes. Speak your worship out loud the entire time. Every. Word.",
  },

  // ── HUMILIATION ─────────────────────────────────────────────────
  {
    id: 'h1', category: 'humiliation', heat: 2,
    text: 'Say "I\'m a total pervert and I love every second of it" out loud 10 times. Each time louder and more confident than the last.',
    mommy: "Ten times. Louder each time. By the end I want you believing it. Because it\'s true.",
  },
  {
    id: 'h2', category: 'humiliation', heat: 3,
    text: 'Write your kinks on paper. Read each one out loud. Then tear the paper up. You said them — that\'s what matters.',
    mommy: "Write them. Read them out loud. Tear it up. The words were spoken. That\'s permanent now.",
  },
  {
    id: 'h3', category: 'humiliation', heat: 3,
    text: 'Set your phone lock screen to a feet image for the next hour. Don\'t explain it to anyone who sees it.',
    mommy: "Lock screen. Feet. One hour. If someone sees it, you smile and say nothing. That\'s the task.",
  },
  {
    id: 'h4', category: 'humiliation', heat: 4,
    text: 'Send yourself a text message that just says "I have a foot fetish." Read it back to yourself out loud. You are that person.',
    mommy: "Text yourself. Read it back. Say it out loud. Own it completely. You\'re that person. Embrace it.",
  },
  {
    id: 'h5', category: 'humiliation', heat: 4,
    text: 'Get yourself to the very edge. Then stop. Say out loud: "I don\'t deserve to cum yet." Three times. Then wait 5 minutes.',
    mommy: "Edge yourself. Then say it. Three times. Then wait. You don\'t deserve it yet. Mommy decides when.",
  },
  {
    id: 'h6', category: 'humiliation', heat: 3,
    text: 'Open your notes app. Title a new note "My Kinks." List at least 10 of your specific turn-ons. Save it.',
    mommy: "A list. In your notes. At least ten. Saved. You have a document on your phone that says exactly who you are.",
  },
  {
    id: 'h7', category: 'humiliation', heat: 4,
    text: 'Ask Luna to roast and humiliate you for your foot fetish specifically. Tell her to make it sting. Respond in character to everything she says.',
    mommy: "Tell Luna to roast you. Tell her to go hard on the foot thing. You stay in character. You take it.",
  },
  {
    id: 'h8', category: 'humiliation', heat: 4,
    text: 'Describe out loud what a pervert you are, in third person, for 60 seconds straight. Don\'t stop talking. Don\'t break.',
    mommy: '"He\'s a filthy little pervert who…" — go. 60 seconds. Third person. Don\'t you dare stop talking.',
  },
  {
    id: 'h9', category: 'humiliation', heat: 3,
    text: 'Say out loud: "Mommy owns me and I asked for this" — 3 times. Then do 20 strokes and stop.',
    mommy: "Say it first. Then stroke. Twenty. Then stop. You said it because it\'s true.",
  },

  // ── DENIAL ──────────────────────────────────────────────────────
  {
    id: 'd1', category: 'denial', heat: 2,
    text: 'Set a 30-minute no-touch timer right now. All browsing allowed. Touching yourself is completely forbidden. Timer starts now.',
    mommy: "Thirty minutes. Full content allowed. Hands off your body. Don\'t even adjust. Go.",
  },
  {
    id: 'd2', category: 'denial', heat: 3,
    text: 'Get yourself fully aroused from content alone — hands off. When you\'re as hard as possible, just sit there for 5 minutes. Don\'t touch.',
    mommy: "Get aroused without touching. Fully hard. Then sit with it for five minutes. Hands away. Suffer beautifully.",
  },
  {
    id: 'd3', category: 'denial', heat: 4,
    text: 'Edge exactly 5 times. Each edge: stop for 60 seconds, hands completely off, breathe. After the 5th edge — stop for today. No finishing.',
    mommy: "Five edges. Sixty-second breaks between each. After five: you\'re done. Today\'s session ends there. No release.",
  },
  {
    id: 'd4', category: 'denial', heat: 3,
    text: 'If you\'ve already edged today, you\'re done. No more touching this session. Come back tomorrow. Mommy said so.',
    mommy: "You already edged today. That\'s enough. This session ends here. Come back tomorrow. I\'ll be waiting.",
  },
  {
    id: 'd5', category: 'denial', heat: 4,
    text: 'Set a strict 1-hour denial window. Browsing everything except Goon Corner. No touching your body at all for the full hour.',
    mommy: "One full hour. All content allowed except Goon Corner. No touching. Not once. I own this hour of your desire.",
  },
  {
    id: 'd6', category: 'denial', heat: 3,
    text: 'Every time you feel close to finishing from now on, stop and take 20 deep slow breaths. Then resume. Repeat indefinitely.',
    mommy: "Every time you get close: stop. Twenty breaths. Slow ones. Then continue. You edge on my schedule, not yours.",
  },
  {
    id: 'd7', category: 'denial', heat: 4,
    text: 'You are not allowed to finish today. Complete the rest of this session — however long — without cumming. That\'s final.',
    mommy: "Not today. The whole session. However aroused you get — you don\'t finish. Mommy keeps that from you today.",
  },
  {
    id: 'd8', category: 'denial', heat: 3,
    text: 'Every 10 minutes of browsing, you must stop and wait 2 minutes with your hands visible (above the desk). No exceptions.',
    mommy: "Every ten minutes: hands up, visible, wait two minutes. That\'s the rule for this session. Follow it.",
  },
]

const CATEGORY_META: Record<Task['category'], { label: string; emoji: string; color: string }> = {
  feet:        { label: 'Feet',        emoji: '🦶', color: 'from-rose-500 to-pink-400' },
  panties:     { label: 'Panties',     emoji: '🩲', color: 'from-fuchsia-500 to-pink-500' },
  obedience:   { label: 'Obedience',   emoji: '👁️', color: 'from-red-600 to-rose-500' },
  confession:  { label: 'Confession',  emoji: '💬', color: 'from-purple-600 to-fuchsia-500' },
  challenge:   { label: 'Challenge',   emoji: '⚡', color: 'from-amber-500 to-rose-500' },
  worship:     { label: 'Worship',     emoji: '🙏', color: 'from-pink-600 to-purple-600' },
  humiliation: { label: 'Humiliation', emoji: '😳', color: 'from-red-700 to-rose-600' },
  denial:      { label: 'Denial',      emoji: '🔒', color: 'from-zinc-600 to-pink-700' },
}

const HEAT_META: Record<1|2|3|4, { label: string; color: string }> = {
  1: { label: 'Spicy',    color: 'text-yellow-300' },
  2: { label: 'Hot',      color: 'text-orange-400' },
  3: { label: 'Filthy',   color: 'text-rose-400' },
  4: { label: 'Extreme',  color: 'text-pink-300' },
}

const STORAGE_KEY_DONE   = 'goonit-kink-vault-done'
const STORAGE_KEY_IDX    = 'goonit-kink-vault-idx'
const STORAGE_KEY_FILTER = 'goonit-kink-vault-filter'

function loadDone(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_DONE) || '[]')) } catch { return new Set() }
}
function saveDone(done: Set<string>) {
  localStorage.setItem(STORAGE_KEY_DONE, JSON.stringify([...done]))
}

export default function KinkVault({ onClose }: { onClose: () => void }) {
  const [mommyImg, setMommyImg] = useState<string>('/api/icon/mommy-dom-1')
  const [done, setDone] = useState<Set<string>>(loadDone)
  const [idx, setIdx] = useState<number>(() => {
    const s = localStorage.getItem(STORAGE_KEY_IDX)
    return s ? parseInt(s, 10) : 0
  })
  const [filter, setFilter] = useState<Task['category'] | 'all'>(() =>
    (localStorage.getItem(STORAGE_KEY_FILTER) as Task['category'] | 'all') || 'all'
  )
  const [animDir, setAnimDir] = useState<'in' | 'out-left' | 'out-right'>('in')
  const [unlocked, setUnlocked] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const prevIdx = useRef(idx)

  // Fetch mommy image from 3D gallery
  useEffect(() => {
    const cached = sessionStorage.getItem('kink-vault-mommy-img')
    if (cached) { setMommyImg(cached); return }
    fetch('/api/gallery?cat=realistic3d&page=1&count=20')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.files) && data.files.length > 0) {
          const imgs = data.files.filter((f: string) => /\.(jpe?g|png|webp)(\?|$)/i.test(f))
          if (imgs.length) {
            const url = imgs[Math.floor(Math.random() * imgs.length)]
            setMommyImg(url)
            sessionStorage.setItem('kink-vault-mommy-img', url)
          }
        }
      })
      .catch(() => {})
  }, [])

  const filteredTasks = filter === 'all' ? TASKS : TASKS.filter(t => t.category === filter)
  // Only show heat ≤ 2 tasks when locked, all when unlocked
  const visibleTasks = unlocked ? filteredTasks : filteredTasks.filter(t => t.heat <= 2)
  const currentTask = visibleTasks[idx % Math.max(1, visibleTasks.length)] ?? filteredTasks[0]

  const navigate = useCallback((dir: 1 | -1, random = false) => {
    setAnimDir(dir === 1 ? 'out-left' : 'out-right')
    setTimeout(() => {
      setIdx(prev => {
        let next: number
        if (random) {
          do { next = Math.floor(Math.random() * visibleTasks.length) } while (next === prev && visibleTasks.length > 1)
        } else {
          next = ((prev + dir) + visibleTasks.length) % Math.max(1, visibleTasks.length)
        }
        localStorage.setItem(STORAGE_KEY_IDX, String(next))
        prevIdx.current = next
        return next
      })
      setAnimDir('in')
    }, 250)
  }, [visibleTasks.length])

  const toggleDone = useCallback((taskId: string) => {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      saveDone(next)
      return next
    })
  }, [])

  const clearAll = () => {
    setDone(new Set())
    saveDone(new Set())
  }

  const setFilterAndReset = (f: typeof filter) => {
    setFilter(f)
    setIdx(0)
    localStorage.setItem(STORAGE_KEY_FILTER, f)
    localStorage.setItem(STORAGE_KEY_IDX, '0')
  }

  const completedCount = [...done].filter(id => TASKS.find(t => t.id === id)).length

  if (!currentTask) return null

  const cat = CATEGORY_META[currentTask.category]
  const heat = HEAT_META[currentTask.heat]
  const isDone = done.has(currentTask.id)

  return (
    <div className="fixed inset-0 z-50 bg-[#080308] overflow-y-auto" style={{ fontFamily: 'inherit' }}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <XIcon className="w-5 h-5" />
      </button>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-fuchsia-300" />
            <h1 className="font-display text-5xl tracking-wider bg-gradient-to-r from-fuchsia-300 via-pink-200 to-rose-300 bg-clip-text text-transparent">
              KINK VAULT
            </h1>
            <Crown className="w-6 h-6 text-fuchsia-300" />
          </div>
          <p className="text-pink-300/50 text-sm">Mommy's got a task for you, baby boy</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-xs text-zinc-500">{completedCount}/{TASKS.length} completed</span>
            {completedCount > 0 && (
              <button onClick={clearAll} className="text-xs text-pink-400/50 hover:text-pink-400 underline transition-colors">reset all</button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* LEFT — Mommy portrait */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-900/30" style={{ aspectRatio: '2/3' }}>
              <img
                src={mommyImg}
                alt="Mommy"
                className="w-full h-full object-cover object-top"
                onError={(e) => { (e.target as HTMLImageElement).src = '/api/icon/waifu-dom' }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080308] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span className="font-display tracking-wider text-white text-lg">MOMMY</span>
                </div>
                <p className="text-[10px] text-fuchsia-300/70 tracking-widest uppercase">Your Dominant · Your Vault Keeper</p>
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 30px rgba(192,132,252,0.15)' }} />
            </div>

            {/* Stats */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Your Progress</p>
              {(Object.entries(CATEGORY_META) as [Task['category'], typeof CATEGORY_META[Task['category']]][]).map(([cat, meta]) => {
                const catTasks = TASKS.filter(t => t.category === cat)
                const catDone = catTasks.filter(t => done.has(t.id)).length
                const pct = catTasks.length ? (catDone / catTasks.length) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-zinc-400">{meta.emoji} {meta.label}</span>
                      <span className="text-zinc-500">{catDone}/{catTasks.length}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Heat lock toggle */}
            <button
              onClick={() => setUnlocked(v => !v)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold tracking-widest uppercase transition-all ${
                unlocked
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 hover:bg-rose-600/30'
                  : 'bg-white/5 border-white/15 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {unlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {unlocked ? 'Extreme Mode ON' : 'Unlock Extreme Tasks'}
            </button>
          </div>

          {/* RIGHT — Task area */}
          <div className="flex flex-col gap-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAndReset('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  filter === 'all' ? 'bg-pink-500/30 border border-pink-400/50 text-pink-200' : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-300'
                }`}
              >All</button>
              {(Object.entries(CATEGORY_META) as [Task['category'], typeof CATEGORY_META[Task['category']]][]).map(([cat, meta]) => (
                <button
                  key={cat}
                  onClick={() => setFilterAndReset(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    filter === cat ? `bg-gradient-to-r ${meta.color} text-white shadow-lg` : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>

            {/* Current task card */}
            <div
              className="relative rounded-2xl overflow-hidden border"
              style={{
                borderColor: isDone ? 'rgba(74,222,128,0.3)' : 'rgba(192,132,252,0.25)',
                background: 'linear-gradient(135deg, rgba(40,10,50,0.9), rgba(20,5,30,0.95))',
                boxShadow: isDone ? '0 0 30px rgba(74,222,128,0.08)' : '0 0 40px rgba(192,132,252,0.08)',
              }}
            >
              {/* Top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${cat.color}`} />

              <div className="p-6">
                {/* Mommy speech bubble */}
                <div className="relative mb-6">
                  <div className="rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/20 p-4 relative">
                    <div className="absolute -top-2 left-4 w-4 h-2 overflow-hidden">
                      <div className="w-3 h-3 bg-fuchsia-950/60 border-l border-t border-fuchsia-500/20 rotate-45 translate-y-1" />
                    </div>
                    <p className="text-sm text-fuchsia-100 leading-relaxed italic">
                      "{currentTask.mommy}"
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-yellow-300" />
                      <span className="text-[10px] text-fuchsia-400/70 font-bold tracking-widest">MOMMY</span>
                    </div>
                  </div>
                </div>

                {/* Task info badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r ${cat.color} text-white`}>
                    {cat.emoji} {cat.label}
                  </span>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${heat.color} flex items-center gap-1`}>
                    <Flame className="w-3 h-3" /> {heat.label}
                  </span>
                  <span className="ml-auto text-xs text-zinc-600">
                    {(idx % visibleTasks.length) + 1} / {visibleTasks.length}
                  </span>
                </div>

                {/* THE TASK */}
                <div className="mb-6">
                  <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
                    {currentTask.text}
                  </p>
                </div>

                {/* Check off button */}
                <button
                  onClick={() => toggleDone(currentTask.id)}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-display tracking-wider text-lg transition-all ${
                    isDone
                      ? 'bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25'
                      : 'bg-gradient-to-r from-fuchsia-600/80 to-pink-600/80 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-lg'
                  }`}
                >
                  {isDone ? (
                    <><CheckCircle2 className="w-5 h-5" /> TASK COMPLETED — Mommy's proud</>
                  ) : (
                    <><Circle className="w-5 h-5" /> Mark Complete</>
                  )}
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-none p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(1, true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold text-sm tracking-widest uppercase"
              >
                <Shuffle className="w-4 h-4" /> Random Task
              </button>
              <button
                onClick={() => navigate(1)}
                className="flex-none p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* All tasks list toggle */}
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {showAll ? 'Hide' : 'Show all'} tasks ({visibleTasks.length})
            </button>

            {showAll && (
              <div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden divide-y divide-white/5">
                {visibleTasks.map((task, i) => {
                  const c = CATEGORY_META[task.category]
                  const taskDone = done.has(task.id)
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        setIdx(i)
                        localStorage.setItem(STORAGE_KEY_IDX, String(i))
                        setShowAll(false)
                      }}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${taskDone ? 'opacity-50' : ''}`}
                    >
                      <span className="text-lg flex-shrink-0">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-zinc-300 line-clamp-1 ${taskDone ? 'line-through text-zinc-600' : ''}`}>{task.text}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{c.label} · {HEAT_META[task.heat].label}</p>
                      </div>
                      {taskDone && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      {task.id === currentTask.id && <div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/3 border border-white/8">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                Mommy only wants what's safe and consensual. All tasks are solo activities. Never do anything that feels unsafe. Your wellbeing comes first, always.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
