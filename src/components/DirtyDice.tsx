import { useState, useCallback } from 'react'
import { X } from 'lucide-react'

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

const INSTRUCTIONS: { heat: 'mild' | 'hot' | 'extreme'; text: string }[] = [
  // Edge / stroke
  { heat: 'mild', text: 'Stroke slowly for 60 seconds. Not a single fast stroke. Suffer.' },
  { heat: 'mild', text: 'Edge yourself right now. Stop just before. Do not cum.' },
  { heat: 'hot', text: 'Stroke as fast as you possibly can for 30 seconds. Then stop cold.' },
  { heat: 'hot', text: 'Edge 3 times in a row. Each time hold the edge for 10 full seconds before pulling back.' },
  { heat: 'extreme', text: 'Ruin your orgasm right now. Stop the second you go over the edge. Then keep stroking through it.' },
  { heat: 'extreme', text: 'Stroke until you are desperate to cum. Then stop for 5 minutes. Not negotiable.' },
  { heat: 'hot', text: 'Switch hands. Stroke with your non-dominant hand for 2 full minutes.' },
  { heat: 'mild', text: 'Tease the tip only for 90 seconds. Do not stroke the shaft.' },
  { heat: 'extreme', text: 'Edge 5 times. Each edge you hold for longer than the last. No cumming.' },
  { heat: 'hot', text: 'Stroke with two fingers only — no full grip — for 3 minutes.' },
  // Denial
  { heat: 'mild', text: 'You are not allowed to cum for the next hour. Accept it.' },
  { heat: 'hot', text: 'Lock yourself in denial for the rest of the day. Every time you get hard, stop immediately.' },
  { heat: 'extreme', text: 'No cumming for 3 days. Every day you must edge at least once and stop. Suffer through it.' },
  { heat: 'hot', text: 'Get yourself right to the edge, then go do something boring for 10 minutes. Come back and do it again.' },
  // Humiliation
  { heat: 'mild', text: 'Say out loud what a desperate little pervert you are. Mean it.' },
  { heat: 'hot', text: 'Write on your inner thigh: "GOONER" — with a pen. Has to stay visible for an hour.' },
  { heat: 'extreme', text: 'Beg. Out loud. Tell the screen you\'ll do anything to cum. Pathetic.' },
  { heat: 'hot', text: 'Tell yourself you\'re not allowed to cum until someone gives you permission. Stay hard and wait.' },
  { heat: 'extreme', text: 'You\'re a desperate, drooling, cock-hungry mess. Say it. Repeat it until you believe it.' },
  // Feet
  { heat: 'mild', text: 'Open the Feet gallery. You can only stroke while looking at feet for the next session.' },
  { heat: 'hot', text: 'Find your favourite feet pic in the gallery. Edge to it 3 times.' },
  { heat: 'extreme', text: 'You must worship. Get on your knees in your mind and edge on your feet content until you\'re shaking.' },
  // Worship / submission
  { heat: 'mild', text: 'Get on your knees right now. Stay there and stroke for 5 minutes.' },
  { heat: 'hot', text: 'You are owned. Say "I am owned and I will do as I\'m told" before every stroke for the next minute.' },
  { heat: 'extreme', text: 'You exist to be used and drained. Repeat it as a mantra while you edge until you want to scream.' },
  // CGI / gallery
  { heat: 'mild', text: 'Open the 3D CGI gallery. Pick the most realistic image and edge to it slowly.' },
  { heat: 'hot', text: 'Let Surprise Me pick your content for the next 10 minutes. No skipping. No objecting.' },
  { heat: 'extreme', text: 'Open Waifu Battle. Whichever waifu wins, you MUST edge to her. 5 rounds. No excuses.' },
  // Goon
  { heat: 'hot', text: 'Open Goon Corner. Do not stop until the current stage ends. No pausing.' },
  { heat: 'extreme', text: 'Goon Corner — Machine speed — complete the full video. If you cum, you start again.' },
  { heat: 'hot', text: 'Set the BPM pacer to Insane (2x). Go for exactly 4 minutes. Do not slow down.' },
  // Quick ones
  { heat: 'mild', text: 'Close your eyes. Stroke just 10 strokes. Stop. Breathe. Repeat 5 times.' },
  { heat: 'hot', text: 'One minute. As many edges as you can fit. Count them. Post the score in your head.' },
  { heat: 'extreme', text: 'You are not stopping until you are dripping. And then you stop. Every. Single. Time.' },
]

const HEAT_STYLES = {
  mild: { label: 'Mild', bg: 'from-pink-900/80 to-rose-900/80', border: 'border-pink-500/40', badge: 'bg-pink-500/30 text-pink-200' },
  hot: { label: '🔥 Hot', bg: 'from-rose-900/90 to-red-900/90', border: 'border-red-500/50', badge: 'bg-red-500/30 text-red-200' },
  extreme: { label: '💀 Extreme', bg: 'from-fuchsia-900/90 to-purple-900/90', border: 'border-fuchsia-400/60', badge: 'bg-fuchsia-500/30 text-fuchsia-100' },
}

export default function DirtyDice({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [face, setFace] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [current, setCurrent] = useState<(typeof INSTRUCTIONS)[0] | null>(null)
  const [rolled, setRolled] = useState(false)

  const roll = useCallback(() => {
    if (rolling) return
    setRolling(true)
    setRolled(false)
    let ticks = 0
    const max = 14 + Math.floor(Math.random() * 8)
    const interval = setInterval(() => {
      setFace(Math.floor(Math.random() * 6))
      ticks++
      if (ticks >= max) {
        clearInterval(interval)
        const pick = INSTRUCTIONS[Math.floor(Math.random() * INSTRUCTIONS.length)]
        setCurrent(pick)
        setRolling(false)
        setRolled(true)
      }
    }, 80)
  }, [rolling])

  if (!open) return null

  const style = current ? HEAT_STYLES[current.heat] : null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden
          ${style ? `bg-gradient-to-br ${style.bg} ${style.border}` : 'bg-gradient-to-br from-zinc-900 to-black border-pink-500/30'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{DICE_FACES[face]}</span>
            <h2 className="text-lg font-black tracking-wider text-white uppercase">Dirty Dice</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-pink-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 flex flex-col items-center gap-5 min-h-[220px] justify-center">
          {!rolled && !rolling && (
            <p className="text-pink-300/70 text-sm text-center">
              Roll for your next filthy instruction. No safe words.
            </p>
          )}

          {rolling && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-7xl animate-spin-slow select-none">{DICE_FACES[face]}</span>
              <p className="text-pink-300/60 text-sm tracking-widest uppercase animate-pulse">Rolling…</p>
            </div>
          )}

          {rolled && current && style && (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-6xl select-none">{DICE_FACES[face]}</span>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${style.badge}`}>
                {style.label}
              </span>
              <p className="text-white text-xl font-bold leading-snug">
                {current.text}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={roll}
            disabled={rolling}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-black text-base uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-pink-900/50"
          >
            {rolling ? 'Rolling…' : rolled ? 'Roll Again 🎲' : 'Roll 🎲'}
          </button>
          {rolled && (
            <button
              onClick={onClose}
              className="h-12 px-4 rounded-xl bg-white/10 text-white/70 text-sm font-bold hover:bg-white/20 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
