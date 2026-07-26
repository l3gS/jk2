export const GOONER_TAGLINES: string[] = [
  "Filthy gooner. Mistress's favorite slut.",
  "{name} exists to goon. That's the whole purpose.",
  "Built to obey. Designed to drip.",
  "Eyes glazed. Cock leaking. Right where {name} belongs.",
  "Goon, edge, repeat. Forever {name}.",
  "{name} is a certified filthy gooner.",
  "Hands on cock. Brain off. Good boy.",
  "Born to stroke. Trained to wait.",
  "{name}'s only job tonight: goon for Mistress.",
  "Drool, twitch, beg. That's the {name} loop.",
  "Pathetic little gooner. Mistress loves you anyway.",
  "Stroke slow. Obey faster. Cum when told.",
  "{name} gets hard for permission, not pleasure.",
  "A devoted gooner. A leaking pet. A good {name}.",
  "Site of worship. Cock of obedience. Mind of mush.",
  "{name} doesn't watch porn. {name} is gooned by it.",
  "Edge counter is your résumé, {name}.",
  "Brain melted. Soul dripping. Mistress smiling.",
  "Reminder: {name} is property of creamy spot.",
  "Stay drippy, stay devoted, stay gooning.",
];

export function pickGoonerTagline(name: string): string {
  const t = GOONER_TAGLINES[Math.floor(Math.random() * GOONER_TAGLINES.length)];
  return t.replace(/{name}/g, name);
}

// ───────────────────────────────────────────────────────────────────
// EMPTY_VAULT_TAUNTS — shown in the vault tab when the boy hasn't
// saved anything yet. Should sting a little bit so he goes fetches.
// ───────────────────────────────────────────────────────────────────
export const EMPTY_VAULT_TAUNTS: string[] = [
  "Empty, {name}. Mistress is disappointed.",
  "Nothing saved, {name}? Pathetic. Go hunt.",
  "Your vault is dry. Just like you should be.",
  "Zero items, {name}. Earn one.",
  "A gooner with no collection? Fix this, {name}.",
  "Filthy boys hoard. Yours is empty, {name}.",
];

export function pickEmptyVaultTaunt(name: string): string {
  const t =
    EMPTY_VAULT_TAUNTS[Math.floor(Math.random() * EMPTY_VAULT_TAUNTS.length)];
  return t.replace(/{name}/g, name);
}

// ───────────────────────────────────────────────────────────────────
// TAB_NUDGES — fired as a toast every time the boy switches tabs.
// Short, kinky, addressed to him by name. Keep them under ~50 chars
// so they don't clip the toast.
// ───────────────────────────────────────────────────────────────────
export const TAB_NUDGES: string[] = [
  "Right this way, {name} 💋",
  "Good boy, {name}. Eyes here.",
  "Keep moving, {name}. Mistress is watching.",
  "{name}'s fingers are busy, hm? 🌸",
  "Stay leaking, {name}.",
  "Don't get distracted, {name}.",
  "Obedient little click, {name}.",
  "Mmm, exploring? Good boy, {name}.",
  "Hands stay on cock, {name}.",
  "Found another reason to stroke, {name}?",
];

export function pickTabNudge(name: string): string {
  const t = TAB_NUDGES[Math.floor(Math.random() * TAB_NUDGES.length)];
  return t.replace(/{name}/g, name);
}

// ───────────────────────────────────────────────────────────────────
// TITLE_LINES — rotate the browser tab title every few seconds so
// even when the boy switches tabs Mistress's voice follows him.
// ───────────────────────────────────────────────────────────────────
export const TITLE_LINES: string[] = [
  "💋 {name}, come back…",
  "🩷 stroke for me, {name}",
  "👀 Mistress is watching, {name}",
  "💦 leaking yet, {name}?",
  "🌸 GoonIt — for {name}",
  "🔥 obey, {name}",
  "💋 don't stop, {name}",
  "🩷 good boy, {name}",
  "👅 edge again, {name}",
  "✨ {name} belongs to creamyspot",
];

export function pickTitleLine(name: string): string {
  const t = TITLE_LINES[Math.floor(Math.random() * TITLE_LINES.length)];
  return t.replace(/{name}/g, name);
}

// ───────────────────────────────────────────────────────────────────
// NUDGE_TOASTS — periodic mid-session reminders that pop once every
// minute or two. Slightly longer than tab nudges; treat them like a
// finger under the chin: "eyes back on me".
// ───────────────────────────────────────────────────────────────────
export const NUDGE_TOASTS: string[] = [
  "Eyes back on me, {name}. 🌸",
  "{name}. Hands on cock. Now.",
  "Mistress noticed you stopped, {name}.",
  "Drip a little for me, {name}.",
  "Don't you dare cum yet, {name}.",
  "Edge one for Mistress, {name}.",
  "Breathe, {name}. Then stroke.",
  "Filthy little gooner. Keep going, {name}.",
  "Slow down, {name}. Savor it.",
  "Tongue out, eyes glazed. Good {name}.",
  "Reminder: {name}'s only purpose is to obey.",
  "Mistress is proud of you, {name}. Keep dripping.",
];

export function pickNudgeToast(name: string): string {
  const t = NUDGE_TOASTS[Math.floor(Math.random() * NUDGE_TOASTS.length)];
  return t.replace(/{name}/g, name);
}
