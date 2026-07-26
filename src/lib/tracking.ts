// ── NacreHub activity tracker ───────────────────────────────────────────────
// All tracking is local-only (localStorage). No data leaves the device.

const KEY = 'goonit-stats'

export interface NacreStats {
  videosWatched: number
  videosDownloaded: number
  searchesDone: number
  vaultSaves: number
  nacreGamesPlayed: number
  sloppySessionsPlayed: number
  pagesVisited: Record<string, number>
  creamySpotVideos: number
  edgesLogged: number
  chatMessages: number
  galleryViews: number
  leaksSearched: number
  filthGenerated: number
  totalMinutes: number
  firstSeen: string
  lastSeen: string
  streakDays: number
  lastStreakDate: string
}

function defaults(): NacreStats {
  const now = new Date().toISOString()
  return {
    videosWatched: 0,
    videosDownloaded: 0,
    searchesDone: 0,
    vaultSaves: 0,
    nacreGamesPlayed: 0,
    sloppySessionsPlayed: 0,
    pagesVisited: {},
    creamySpotVideos: 0,
    edgesLogged: 0,
    chatMessages: 0,
    galleryViews: 0,
    leaksSearched: 0,
    filthGenerated: 0,
    totalMinutes: 0,
    firstSeen: now,
    lastSeen: now,
    streakDays: 0,
    lastStreakDate: '',
  }
}

export function getStats(): NacreStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    return { ...defaults(), ...JSON.parse(raw) }
  } catch {
    return defaults()
  }
}

function save(s: NacreStats) {
  try {
    s.lastSeen = new Date().toISOString()
    // Streak logic — if last streak was yesterday, bump; if today, keep; else reset
    const today = new Date().toDateString()
    if (s.lastStreakDate !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toDateString()
      s.streakDays = s.lastStreakDate === yesterday ? s.streakDays + 1 : 1
      s.lastStreakDate = today
    }
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

export function trackStat(field: keyof Omit<NacreStats, 'pagesVisited' | 'firstSeen' | 'lastSeen' | 'streakDays' | 'lastStreakDate'>, amount = 1) {
  const s = getStats()
  ;(s as Record<string, number>)[field] = ((s as Record<string, number>)[field] || 0) + amount
  save(s)
}

export function trackPage(tab: string) {
  const s = getStats()
  s.pagesVisited = s.pagesVisited || {}
  s.pagesVisited[tab] = (s.pagesVisited[tab] || 0) + 1
  save(s)
}

export function addMinutes(mins: number) {
  const s = getStats()
  s.totalMinutes = (s.totalMinutes || 0) + mins
  save(s)
}
