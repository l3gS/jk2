import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, Edit2, Save, X, Plus, Trash2, ExternalLink,
  Trophy, Star, Flame, Zap, Heart, Lock, MapPin, Calendar,
  Link2, ChevronDown, Check, Palette, Shield, Activity,
  Sparkles, Crown, Users, Video, Image as ImageIcon,
  Eye, Download, Search, Gamepad2, TrendingUp, Clock, Share2 as Share2Icon,
  Play, Loader2,
} from "lucide-react";
import Hls from "hls.js";
import {
  getOrCreateAccountId, patchAccount, fetchAccount,
  uploadFile, getStoredUsername, getFeed, removeFromFeed,
} from "../api";
import type { AccountProfile, AccountVaultItem, FeedItem } from "../api";
import { toast } from "sonner";
import { getStats } from "../lib/tracking";
import type { NacreStats } from "../lib/tracking";

// ─── Types ────────────────────────────────────────────────────────
export interface ExtendedProfile extends AccountProfile {
  bio?: string | null;
  pronouns?: string | null;
  location?: string | null;
  favPornstar?: string | null;
  favPornstar2?: string | null;
  favPornstar3?: string | null;
  favCategories?: string[];
  kinkTags?: string[];
  favCreators?: string[];
  socialLinks?: { x?: string; of?: string; reddit?: string; discord?: string } | null;
  accentColor?: string | null;
  bannerStyle?: string | null;
  statusEmoji?: string | null;
  statusText?: string | null;
  displayBadges?: string[];
  motto?: string | null;
  contentPref?: string | null;
  /** Goon persona type — stored locally */
  goonStyle?: string | null;
  /** Current session goal or pledge — stored locally */
  sessionGoal?: string | null;
}

const GALLERY_CATS = [
  "Waifu","Neko","Blowjob","Feet","Ass","Boobs","Ahegao",
  "Anal","Pussy","Paizuri","Yuri","Futa","Trap","Pinup",
  "Cosplay","Hentai","3D CGI","IRL",
];

const BANNER_PRESETS: { id: string; label: string; style: string }[] = [
  { id: "pink-red",     label: "Pink Fire",   style: "linear-gradient(135deg,#be123c 0%,#9d174d 40%,#1a0010 100%)" },
  { id: "purple-blue",  label: "Deep Space",  style: "linear-gradient(135deg,#4c1d95 0%,#1e3a5f 60%,#0f172a 100%)" },
  { id: "black-gold",   label: "Gold Rush",   style: "linear-gradient(135deg,#1a1500 0%,#78350f 50%,#000000 100%)" },
  { id: "teal-dark",    label: "Dark Teal",   style: "linear-gradient(135deg,#042f2e 0%,#0f766e 50%,#000000 100%)" },
  { id: "rose-pink",    label: "Rose Dream",  style: "linear-gradient(135deg,#fce7f3 0%,#ec4899 40%,#831843 100%)" },
  { id: "carbon",       label: "Carbon",      style: "linear-gradient(135deg,#18181b 0%,#3f3f46 50%,#09090b 100%)" },
];

const ACCENT_COLORS = [
  { id: "#f43f5e", label: "Rose"    },
  { id: "#a855f7", label: "Purple"  },
  { id: "#3b82f6", label: "Blue"    },
  { id: "#f59e0b", label: "Amber"   },
  { id: "#10b981", label: "Emerald" },
  { id: "#ec4899", label: "Pink"    },
];

const PRONOUNS_LIST = ["He/Him","She/Her","They/Them","He/They","She/They","Any/All","Custom"];

const ACHIEVEMENT_META: Record<string, { emoji: string; label: string }> = {
  "first-edge":     { emoji: "⚡", label: "First Edge" },
  "10-edges":       { emoji: "🔥", label: "10 Edges" },
  "50-edges":       { emoji: "💀", label: "50 Edges" },
  "streak-7":       { emoji: "📅", label: "7-Day Streak" },
  "streak-30":      { emoji: "🏆", label: "30-Day Streak" },
  "vault-10":       { emoji: "💾", label: "10 Vault Saves" },
  "vault-50":       { emoji: "🗄️", label: "50 Vault Saves" },
  "first-login":    { emoji: "👤", label: "Account Created" },
  "nacre-complete": { emoji: "👑", label: "Nacre Completed" },
  "waifu-voted":    { emoji: "⚔️", label: "Waifu Voter" },
  "filth-gen":      { emoji: "🎨", label: "Filth Creator" },
};

// ─── Glass card wrapper ────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 ${className}`}>
      {children}
    </div>
  );
}

// ─── Section header inside a card ─────────────────────────────────
function CardHeader({ icon, title, accent }: { icon: React.ReactNode; title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: accent || "#f43f5e" }}>{icon}</span>
      <h3 className="font-bold text-sm uppercase tracking-widest text-white/70">{title}</h3>
    </div>
  );
}

// ─── Session activity feed ─────────────────────────────────────────
interface SessionEntry {
  id: number;
  ts: string;
  mode: string;
  emoji: string;
  stages: number;
  edges: number;
  durationSec: number;
  cats: string[];
}

function fmtDur(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Comprehensive activity dashboard ──────────────────────────────
// ─── Feed section ─────────────────────────────────────────────────────────────
// ─── Inline video player for feed items ──────────────────────────────────────
function FeedVideoPlayer({ videoPageUrl }: { videoPageUrl: string }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [error, setError]         = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef   = useRef<Hls | null>(null)

  useEffect(() => {
    fetch(`/api/video?url=${encodeURIComponent(videoPageUrl)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { mediaURLs?: string[]; media_extended?: Array<{ url: string }> }) => {
        const url = data.mediaURLs?.[0] ?? data.media_extended?.[0]?.url
        if (!url) throw new Error('no stream')
        setStreamUrl(url)
      })
      .catch(() => setError(true))
  }, [videoPageUrl])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return
    const el = videoRef.current
    hlsRef.current?.destroy(); hlsRef.current = null
    if (Hls.isSupported() && /\.m3u8/i.test(streamUrl)) {
      const hls = new Hls({ enableWorker: false })
      hlsRef.current = hls
      hls.loadSource(`/api/stream?url=${encodeURIComponent(streamUrl)}`)
      hls.attachMedia(el)
      hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}))
    } else {
      el.src = `/api/stream?url=${encodeURIComponent(streamUrl)}`
      el.play().catch(() => {})
    }
    return () => { hlsRef.current?.destroy() }
  }, [streamUrl])

  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        {!streamUrl && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>Could not load video</p>
          </div>
        )}
        {streamUrl && (
          <video ref={videoRef} className="w-full h-full object-contain" controls playsInline />
        )}
      </div>
    </div>
  )
}

function FeedSection({ accent }: { accent: string }) {
  const [feed, setFeed]         = useState<FeedItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    const accountId = getOrCreateAccountId()
    getFeed(accountId)
      .then(setFeed)
      .finally(() => setLoading(false))
  }, [])

  function handleRemove(itemId: string) {
    const accountId = getOrCreateAccountId()
    removeFromFeed(accountId, itemId)
    setFeed(f => f.filter(x => x.id !== itemId))
    if (playingId === itemId) setPlayingId(null)
    toast.success('Removed from feed')
  }

  if (loading) return null
  if (feed.length === 0) return null

  return (
    <GlassCard className="p-4">
      <CardHeader icon={<Share2Icon size={15}/>} title="My Reposted Videos" accent={accent} />
      <div className="flex flex-col gap-2 mt-1">
        {feed.map(item => (
          <div key={item.id}>
            <div
              className="flex items-center gap-3 p-2.5 rounded-xl border group transition-colors cursor-pointer"
              style={{
                background: playingId === item.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                borderColor: playingId === item.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              }}
              onClick={() => setPlayingId(p => p === item.id ? null : item.id)}
            >
              <div className="relative w-16 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt={item.title}
                    className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <Play size={14} className="text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white line-clamp-1">{item.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {item.source} · {new Date(item.postedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <a href={item.videoPageUrl} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 hover:bg-white/10 transition"
                  title="Open on source site">
                  <ExternalLink size={11} className="text-white/40" />
                </a>
                <button onClick={() => handleRemove(item.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition"
                  title="Remove">
                  <X size={11} className="text-white/40 group-hover:text-red-400" />
                </button>
              </div>
            </div>
            {playingId === item.id && <FeedVideoPlayer videoPageUrl={item.videoPageUrl} />}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function ActivityDashboard({ accent, vaultLen }: { accent: string; vaultLen: number }) {
  const [stats, setStats] = useState<NacreStats | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])

  useEffect(() => {
    const load = () => {
      setStats(getStats())
      try {
        const raw = localStorage.getItem('goonit-sessions')
        if (raw) setSessions(JSON.parse(raw).slice(0, 5))
      } catch {}
    }
    load()
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [])

  if (!stats) return null

  const edgesTotal = parseInt(localStorage.getItem('goon-edge-count') || '0') || 0
  const sessionList = sessions
  const totalSessionEdges = sessionList.reduce((s, e) => s + (e.edges || 0), 0)
  const totalSessionTime = sessionList.reduce((s, e) => s + (e.durationSec || 0), 0)
  const sessionCount = (() => {
    try { const r = localStorage.getItem('goonit-sessions'); return r ? JSON.parse(r).length : 0 } catch { return 0 }
  })()

  const topPage = Object.entries(stats.pagesVisited || {}).sort((a, b) => b[1] - a[1])[0]

  const statRows = [
    { icon: <Flame size={13}/>,    label: 'Edges Logged',       value: String(edgesTotal),                    color: '#ef4444' },
    { icon: <Activity size={13}/>, label: 'Goon Sessions',      value: String(sessionCount),                   color: accent },
    { icon: <Zap size={13}/>,      label: 'Session Edges',      value: String(totalSessionEdges),              color: '#f59e0b' },
    { icon: <Clock size={13}/>,    label: 'Session Time',       value: fmtDur(totalSessionTime),              color: '#8b5cf6' },
    { icon: <Gamepad2 size={13}/>, label: 'Nacre Games',        value: String(stats.nacreGamesPlayed || 0),   color: '#ec4899' },
    { icon: <Video size={13}/>,    label: 'Videos Watched',     value: String(stats.videosWatched || 0),      color: '#f43f5e' },
    { icon: <Download size={13}/>, label: 'Downloads',          value: String(stats.videosDownloaded || 0),   color: '#10b981' },
    { icon: <Search size={13}/>,   label: 'Searches Done',      value: String(stats.searchesDone || 0),       color: '#3b82f6' },
    { icon: <Eye size={13}/>,      label: 'Creamy Spot Visits', value: String(stats.creamySpotVideos || 0),   color: '#f43f5e' },
    { icon: <ImageIcon size={13}/>,label: 'Gallery Views',      value: String(stats.galleryViews || 0),       color: '#a78bfa' },
    { icon: <TrendingUp size={13}/>,label: 'Leaks Searched',    value: String(stats.leaksSearched || 0),      color: '#06b6d4' },
    { icon: <Crown size={13}/>,    label: 'Vault Saves',        value: String(vaultLen),                      color: '#fbbf24' },
    { icon: <Star size={13}/>,     label: 'Day Streak',         value: `${stats.streakDays || 1} 🔥`,        color: '#f97316' },
    { icon: <Clock size={13}/>,    label: 'Time on Site',       value: `${stats.totalMinutes || 0}m`,         color: '#6366f1' },
    { icon: <Users size={13}/>,    label: 'Fav Page',           value: topPage ? topPage[0] : '—',           color: '#94a3b8' },
  ]

  return (
    <GlassCard className="p-4">
      <CardHeader icon={<TrendingUp size={15}/>} title="Activity Dashboard" accent={accent} />

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {statRows.slice(0, 10).map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center border border-white/8"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
              {icon}
            </div>
            <div className="font-black text-white text-base leading-none mb-0.5">{value}</div>
            <div className="text-[9px] text-white/30 uppercase tracking-wide leading-tight">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {statRows.slice(10).map(({ icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-white/6"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ color }}>{icon}</span>
            <div>
              <div className="text-white font-bold text-xs leading-none">{value}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {sessionList.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} style={{ color: accent }} />
            <p className="text-[9px] font-black tracking-[0.4em] uppercase text-white/30">Recent Sessions</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {sessionList.map(s => (
              <div key={s.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-lg shrink-0">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{s.mode}</p>
                  <p className="text-white/30 text-[10px]">{s.stages} stages · {s.edges} edges · {fmtDur(s.durationSec)}</p>
                </div>
                <span className="text-white/20 text-[10px] shrink-0">{fmtRelTime(s.ts)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  )
}

function RecentSessionsCard({ accent }: { accent: string }) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('goonit-sessions');
      if (raw) setSessions(JSON.parse(raw).slice(0, 10));
    } catch {}
  }, []);

  if (sessions.length === 0) return null;

  const totalEdges = sessions.reduce((sum, s) => sum + (s.edges || 0), 0);
  const totalTime  = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);

  return (
    <GlassCard className="p-4">
      <CardHeader icon={<Activity size={15}/>} title="Session Activity" accent={accent} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Sessions', value: String(sessions.length) },
          { label: 'Edges', value: String(totalEdges) },
          { label: 'Total Time', value: fmtDur(totalTime) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5 text-center border border-white/8"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="font-black text-white text-lg leading-none mb-0.5">{value}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-2">
        {sessions.map(s => (
          <div key={s.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-xl shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{s.mode}</p>
              <p className="text-white/30 text-[10px]">
                {s.stages} stages · {s.edges} edges · {fmtDur(s.durationSec)}
              </p>
            </div>
            <span className="text-white/25 text-[10px] shrink-0">{fmtRelTime(s.ts)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Editable text field ───────────────────────────────────────────
function EditField({
  label, value, onChange, placeholder, multiline, maxLength, disabled,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; maxLength?: number; disabled?: boolean;
}) {
  const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 resize-none";
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>}
      {multiline
        ? <textarea className={cls} rows={3} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength} disabled={disabled} />
        : <input className={cls} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength} disabled={disabled} />
      }
      {maxLength && <span className="text-xs text-white/25 text-right">{value.length}/{maxLength}</span>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
export default function UserProfile({ initialVault }: { initialVault?: AccountVaultItem[] }) {
  const accountId = getOrCreateAccountId();
  const username = getStoredUsername();

  const [profile, setProfile] = useState<ExtendedProfile>({
    boyName: localStorage.getItem("goon-boy-name") || "Sam",
    edgeCount: parseInt(localStorage.getItem("goon-edge-count") || "0") || 0,
    background: null,
    bio: null, pronouns: null, location: null,
    favPornstar: null, favPornstar2: null, favPornstar3: null,
    favCategories: [], kinkTags: [], favCreators: [],
    socialLinks: null, accentColor: "#f43f5e", bannerStyle: "pink-red",
    statusEmoji: "🔥", statusText: null, displayBadges: [],
    motto: null, contentPref: null,
    goonStyle: null, sessionGoal: null,
  });

  const [vault, setVault] = useState<AccountVaultItem[]>(initialVault || []);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExtendedProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [bannerUpload, setBannerUpload] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [newKinkTag, setNewKinkTag] = useState("");
  const [newCreator, setNewCreator] = useState("");
  const [customPronouns, setCustomPronouns] = useState("");
  const [showPronounsDD, setShowPronounsDD] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const accent = profile.accentColor || "#f43f5e";
  const draftAccent = draft.accentColor || "#f43f5e";

  // Load from server
  useEffect(() => {
    fetchAccount(accountId).then(resp => {
      if (!resp) return;
      const p = resp.profile as ExtendedProfile;
      setProfile(prev => ({ ...prev, ...p }));
      setDraft(prev => ({ ...prev, ...p }));
      setVault(resp.vault || []);
    });
    // Load extended fields from localStorage (for fields not yet persisted server-side)
    try {
      const ext = JSON.parse(localStorage.getItem("goonit-profile-ext") || "{}");
      setProfile(prev => ({ ...prev, ...ext }));
      setDraft(prev => ({ ...prev, ...ext }));
      const bu = localStorage.getItem("goonit-banner-upload");
      if (bu) setBannerUpload(bu);
    } catch {}
  }, [accountId]);

  const bannerCss = (() => {
    if (bannerUpload) return `url(${bannerUpload})`;
    const preset = BANNER_PRESETS.find(b => b.id === (editing ? draft.bannerStyle : profile.bannerStyle));
    return preset ? preset.style : BANNER_PRESETS[0].style;
  })();

  function editDraft<K extends keyof ExtendedProfile>(key: K, val: ExtendedProfile[K]) {
    setDraft(prev => ({ ...prev, [key]: val }));
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    const res = await uploadFile(file);
    setAvatarUploading(false);
    if ("error" in res) { toast.error(res.error); return; }
    editDraft("avatarUrl", res.url);
    if (!editing) {
      setProfile(prev => ({ ...prev, avatarUrl: res.url }));
      await patchAccount(accountId, { avatarUrl: res.url });
    }
  }

  async function uploadBanner(file: File) {
    setBannerUploading(true);
    const res = await uploadFile(file);
    setBannerUploading(false);
    if ("error" in res) { toast.error(res.error); return; }
    setBannerUpload(res.url);
    localStorage.setItem("goonit-banner-upload", res.url);
    editDraft("bannerStyle", "custom");
  }

  async function handleSave() {
    setSaving(true);
    const ext: Partial<ExtendedProfile> = {
      bio: draft.bio, pronouns: draft.pronouns, location: draft.location,
      favPornstar: draft.favPornstar, favPornstar2: draft.favPornstar2,
      favPornstar3: draft.favPornstar3, favCategories: draft.favCategories,
      kinkTags: draft.kinkTags, favCreators: draft.favCreators,
      socialLinks: draft.socialLinks, accentColor: draft.accentColor,
      bannerStyle: draft.bannerStyle, statusEmoji: draft.statusEmoji,
      statusText: draft.statusText, displayBadges: draft.displayBadges,
      motto: draft.motto, contentPref: draft.contentPref,
      goonStyle: draft.goonStyle, sessionGoal: draft.sessionGoal,
    };
    // Save extended fields locally
    localStorage.setItem("goonit-profile-ext", JSON.stringify(ext));
    if (draft.bannerStyle !== "custom") {
      setBannerUpload(null);
      localStorage.removeItem("goonit-banner-upload");
    }
    // Save core fields to server
    await patchAccount(accountId, {
      boyName: draft.boyName || undefined,
      avatarUrl: draft.avatarUrl || undefined,
      bio: draft.bio || undefined,
      pronouns: draft.pronouns || undefined,
      location: draft.location || undefined,
      favPornstar: draft.favPornstar || undefined,
      favPornstar2: draft.favPornstar2 || undefined,
      favPornstar3: draft.favPornstar3 || undefined,
      favCategories: draft.favCategories,
      kinkTags: draft.kinkTags,
      favCreators: draft.favCreators,
      socialLinks: draft.socialLinks || undefined,
      accentColor: draft.accentColor || undefined,
      bannerStyle: draft.bannerStyle || undefined,
      statusEmoji: draft.statusEmoji || undefined,
      statusText: draft.statusText || undefined,
      displayBadges: draft.displayBadges,
      motto: draft.motto || undefined,
      contentPref: draft.contentPref || undefined,
    } as Parameters<typeof patchAccount>[1]);
    setProfile({ ...draft });
    setSaving(false);
    setEditing(false);
    toast.success("Profile saved ✓");
  }

  function handleCancel() {
    setDraft({ ...profile });
    setEditing(false);
  }

  function addKinkTag() {
    const t = newKinkTag.trim().toLowerCase().slice(0, 24);
    if (!t || (draft.kinkTags || []).includes(t)) return;
    editDraft("kinkTags", [...(draft.kinkTags || []), t]);
    setNewKinkTag("");
  }

  function addCreator() {
    const c = newCreator.trim().replace(/^@/, "").slice(0, 64);
    if (!c || (draft.favCreators || []).includes(c)) return;
    editDraft("favCreators", [...(draft.favCreators || []), c]);
    setNewCreator("");
  }

  const activeProfile = editing ? draft : profile;
  const streakDays = profile.streakCount || 0;
  const joinedDate = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  const vaultCount = vault.length;
  const achieveCount = (profile.achievements || []).length;

  return (
    <div className="min-h-screen pb-24 pt-0">
      {/* ─── Banner ──────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 200, background: bannerCss, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        {editing && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white backdrop-blur-md bg-black/40 border border-white/20 hover:bg-black/60 transition"
          >
            <ImageIcon size={13} />
            {bannerUploading ? "Uploading…" : "Change Banner"}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
      </div>

      {/* ─── Avatar + Name row ───────────────────────────────────── */}
      <div className="px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="relative flex items-end gap-4 -mt-16 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-28 h-28 rounded-2xl border-4 overflow-hidden"
              style={{ borderColor: accent, background: "#18181b" }}
            >
              {activeProfile.avatarUrl
                ? <img src={activeProfile.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                : <div className="w-full h-full flex items-center justify-center text-4xl font-black"
                    style={{ color: accent }}>
                    {(activeProfile.boyName || "S")[0].toUpperCase()}
                  </div>
              }
            </div>
            {(editing || !activeProfile.avatarUrl) && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              >
                {avatarUploading ? <span className="text-xs text-white">…</span>
                  : <Camera size={22} className="text-white" />}
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>

          {/* Name + username + status */}
          <div className="flex-1 pb-1 min-w-0">
            {editing
              ? <input
                  className="bg-transparent text-2xl font-black text-white border-b border-white/20 focus:outline-none focus:border-white/40 w-full max-w-xs"
                  value={draft.boyName || ""}
                  onChange={e => editDraft("boyName", e.target.value)}
                  maxLength={32}
                  placeholder="Display name"
                />
              : <h1 className="text-2xl font-black text-white truncate" style={{ textShadow: `0 0 24px ${accent}55` }}>
                  {profile.boyName || "Anonymous"}
                </h1>
            }
            {username && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-white/40">@{username}</p>
                {username.toLowerCase() === 'nacre' && (
                  <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-[0.2em] uppercase"
                    style={{ background: 'rgba(234,179,8,0.2)', color: 'rgba(253,224,71,0.95)', border: '1px solid rgba(234,179,8,0.45)', boxShadow: '0 0 12px rgba(234,179,8,0.2)' }}>
                    👑 OWNER
                  </span>
                )}
              </div>
            )}
            {!editing && (profile.pronouns || profile.statusEmoji || profile.statusText) && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {profile.pronouns && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
                    {profile.pronouns}
                  </span>
                )}
                {(profile.statusEmoji || profile.statusText) && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60">
                    {profile.statusEmoji} {profile.statusText}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Edit/Save buttons */}
          <div className="flex gap-2 pb-1 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/60 border border-white/10 hover:bg-white/5 transition">
                  <X size={13} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black text-white border transition"
                  style={{ background: accent + "22", borderColor: accent + "55", color: accent }}>
                  <Save size={13} /> {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white/60 border border-white/10 hover:bg-white/8 hover:text-white transition">
                <Edit2 size={13} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ─── Layout: 2-col on desktop ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Bio Card */}
            <GlassCard className="p-4">
              <CardHeader icon={<Sparkles size={15}/>} title="About" accent={accent} />
              {editing ? (
                <div className="flex flex-col gap-3">
                  <EditField label="Bio" value={draft.bio || ""} onChange={v => editDraft("bio", v)}
                    placeholder="Tell the world about yourself…" multiline maxLength={160} />
                  <EditField label="Motto" value={draft.motto || ""} onChange={v => editDraft("motto", v)}
                    placeholder="A personal motto or tagline…" maxLength={80} />

                  {/* Pronouns */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Pronouns</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowPronounsDD(!showPronounsDD)}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 transition"
                      >
                        <span>{draft.pronouns || "Select pronouns…"}</span>
                        <ChevronDown size={14} />
                      </button>
                      {showPronounsDD && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden shadow-2xl">
                          {PRONOUNS_LIST.map(p => (
                            <button key={p} onClick={() => {
                              if (p !== "Custom") { editDraft("pronouns", p); setShowPronounsDD(false); }
                              else setShowPronounsDD(false);
                            }}
                              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5 transition flex items-center justify-between"
                            >
                              {p}
                              {draft.pronouns === p && <Check size={12} className="text-green-400" />}
                            </button>
                          ))}
                          <div className="px-3 pb-3 pt-1">
                            <input
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none"
                              placeholder="Custom (e.g. xe/xem)"
                              value={customPronouns}
                              onChange={e => setCustomPronouns(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && customPronouns.trim()) {
                                  editDraft("pronouns", customPronouns.trim());
                                  setShowPronounsDD(false);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <EditField label="Location" value={draft.location || ""} onChange={v => editDraft("location", v)}
                    placeholder="City, Country" maxLength={40} />

                  {/* Status */}
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-16">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Emoji</span>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center"
                        value={draft.statusEmoji || ""}
                        onChange={e => editDraft("statusEmoji", e.target.value.slice(0, 2))}
                        placeholder="🔥" />
                    </div>
                    <div className="flex-1">
                      <EditField label="Status" value={draft.statusText || ""} onChange={v => editDraft("statusText", v)}
                        placeholder="Currently edging…" maxLength={40} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {profile.bio
                    ? <p className="text-sm text-white/70 leading-relaxed">{profile.bio}</p>
                    : <p className="text-sm text-white/25 italic">No bio yet. Click Edit Profile to add one.</p>
                  }
                  {profile.motto && (
                    <p className="text-xs text-white/40 italic border-l-2 pl-2" style={{ borderColor: accent + "88" }}>
                      "{profile.motto}"
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-1">
                    {profile.location && (
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <MapPin size={11} /> {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Calendar size={11} /> Joined {joinedDate}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Lock size={11} /> 18+ · Verified
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Social Links */}
            <GlassCard className="p-4">
              <CardHeader icon={<Link2 size={15}/>} title="Links" accent={accent} />
              {editing ? (
                <div className="flex flex-col gap-2">
                  {(["x","of","reddit","discord"] as const).map(key => {
                    const labels = { x: "X / Twitter", of: "OnlyFans", reddit: "Reddit", discord: "Discord" };
                    const placeholders = { x: "@handle", of: "onlyfans.com/you", reddit: "u/username", discord: "user#1234" };
                    return (
                      <EditField key={key} label={labels[key]}
                        value={(draft.socialLinks as Record<string,string> || {})[key] || ""}
                        onChange={v => editDraft("socialLinks", { ...(draft.socialLinks || {}), [key]: v })}
                        placeholder={placeholders[key]} maxLength={100} />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.entries(profile.socialLinks || {}).filter(([,v]) => v).map(([k, v]) => {
                    const icons: Record<string, string> = { x: "𝕏", of: "OF", reddit: "r/", discord: "💬" };
                    return (
                      <div key={k} className="flex items-center gap-2">
                        <span className="w-7 text-center text-xs font-bold text-white/40">{icons[k]}</span>
                        <span className="text-sm text-white/60 truncate">{v as string}</span>
                      </div>
                    );
                  })}
                  {!Object.values(profile.socialLinks || {}).some(Boolean) && (
                    <p className="text-xs text-white/25 italic">No links added yet.</p>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Appearance */}
            <GlassCard className="p-4">
              <CardHeader icon={<Palette size={15}/>} title="Appearance" accent={accent} />
              {editing ? (
                <div className="flex flex-col gap-4">
                  {/* Accent color */}
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Accent Colour</span>
                    <div className="flex gap-2 flex-wrap">
                      {ACCENT_COLORS.map(c => (
                        <button key={c.id} title={c.label}
                          onClick={() => editDraft("accentColor", c.id)}
                          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            background: c.id,
                            borderColor: draft.accentColor === c.id ? "white" : "transparent",
                          }} />
                      ))}
                      <input type="color" value={draft.accentColor || "#f43f5e"}
                        onChange={e => editDraft("accentColor", e.target.value)}
                        title="Custom colour"
                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-white/20 bg-transparent" />
                    </div>
                  </div>
                  {/* Banner preset */}
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Banner Style</span>
                    <div className="grid grid-cols-3 gap-2">
                      {BANNER_PRESETS.map(b => (
                        <button key={b.id} onClick={() => { editDraft("bannerStyle", b.id); setBannerUpload(null); }}
                          className="relative h-10 rounded-lg border-2 overflow-hidden transition"
                          style={{
                            background: b.style,
                            borderColor: draft.bannerStyle === b.id ? "white" : "transparent",
                          }}>
                          <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-[8px] font-bold text-white/70">{b.label}</span>
                        </button>
                      ))}
                      <button onClick={() => bannerInputRef.current?.click()}
                        className="h-10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-xs text-white/40 hover:border-white/40 transition">
                        {bannerUploading ? "…" : "Upload"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Accent:</span>
                    <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: accent }} />
                    <span className="text-xs text-white/50">{accent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Banner:</span>
                    <span className="text-xs text-white/50">
                      {BANNER_PRESETS.find(b => b.id === profile.bannerStyle)?.label || "Pink Fire"}
                    </span>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { icon: <Zap size={16}/>,      label: "Edges",       value: profile.edgeCount || 0,  c: "#f59e0b" },
                { icon: <Flame size={16}/>,     label: "Streak",      value: `${streakDays}d`,         c: "#ef4444" },
                { icon: <Activity size={16}/>,  label: "Vault",       value: vaultCount,               c: "#a855f7" },
                { icon: <Trophy size={16}/>,    label: "Trophies",    value: achieveCount,             c: "#f59e0b" },
                { icon: <Heart size={16}/>,     label: "Sessions",    value: Math.floor((profile.edgeCount || 0) / 3) || 0, c: "#ec4899" },
                { icon: <Star size={16}/>,      label: "Since",       value: joinedDate,               c: "#10b981" },
              ].map(s => (
                <div key={s.label}
                  className="rounded-xl border border-white/8 backdrop-blur-xl bg-white/4 flex flex-col items-center justify-center py-3 px-1 gap-0.5">
                  <span style={{ color: s.c }}>{s.icon}</span>
                  <span className="text-base font-black text-white leading-none">{s.value}</span>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Favourite Pornstar */}
            <GlassCard className="p-4">
              <CardHeader icon={<Crown size={15}/>} title="Favourite Stars" accent={accent} />
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["favPornstar","favPornstar2","favPornstar3"] as const).map((k, i) => (
                    <EditField key={k} label={`#${i+1} Favourite`}
                      value={(draft[k] as string) || ""}
                      onChange={v => editDraft(k, v)}
                      placeholder={["e.g. Alina Lopez","e.g. Valentina Nappi","e.g. Abella Danger"][i]}
                      maxLength={60} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[profile.favPornstar, profile.favPornstar2, profile.favPornstar3]
                    .filter(Boolean).map((star, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/4 border border-white/8">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ background: accent + "22", color: accent }}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-white/80">{star as string}</span>
                      {i === 0 && <Crown size={14} className="ml-auto" style={{ color: "#f59e0b" }} />}
                    </div>
                  ))}
                  {!profile.favPornstar && (
                    <p className="text-sm text-white/25 italic">No favourites added yet.</p>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Kink Profile */}
            <GlassCard className="p-4">
              <CardHeader icon={<Flame size={15}/>} title="Kink Profile" accent={accent} />
              {/* Fave categories */}
              <div className="mb-3">
                <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Favourite Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {GALLERY_CATS.map(cat => {
                    const active = (activeProfile.favCategories || []).includes(cat);
                    return (
                      <button key={cat}
                        onClick={() => {
                          if (!editing) return;
                          const cur = draft.favCategories || [];
                          editDraft("favCategories",
                            active ? cur.filter(c => c !== cat) : [...cur, cat].slice(0, 12)
                          );
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                        style={{
                          background: active ? accent + "22" : "rgba(255,255,255,0.04)",
                          borderColor: active ? accent + "66" : "rgba(255,255,255,0.08)",
                          color: active ? accent : "rgba(255,255,255,0.45)",
                          cursor: editing ? "pointer" : "default",
                        }}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Custom kink tags */}
              <div>
                <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Custom Kink Tags</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(activeProfile.kinkTags || []).map(tag => (
                    <span key={tag}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border"
                      style={{ background: accent + "15", borderColor: accent + "40", color: accent }}>
                      #{tag}
                      {editing && (
                        <button onClick={() => editDraft("kinkTags", (draft.kinkTags||[]).filter(t=>t!==tag))}
                          className="ml-0.5 text-white/40 hover:text-white/80 transition">
                          <X size={10}/>
                        </button>
                      )}
                    </span>
                  ))}
                  {(activeProfile.kinkTags||[]).length === 0 && (
                    <span className="text-xs text-white/25 italic">No tags yet.</span>
                  )}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
                      placeholder="Add a kink tag… (max 15)"
                      value={newKinkTag}
                      onChange={e => setNewKinkTag(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addKinkTag()}
                      maxLength={24}
                    />
                    <button onClick={addKinkTag}
                      className="px-3 py-1.5 rounded-xl text-sm font-bold text-white border border-white/10 hover:bg-white/8 transition">
                      <Plus size={14}/>
                    </button>
                  </div>
                )}
              </div>
              {/* Content pref */}
              {editing && (
                <div className="mt-3">
                  <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Content Preference</span>
                  <div className="flex gap-2">
                    {["Anime/Hentai","3D CGI","IRL/Real"].map(p => {
                      const active = draft.contentPref === p;
                      return (
                        <button key={p} onClick={() => editDraft("contentPref", p)}
                          className="flex-1 py-1.5 rounded-xl text-xs font-bold border transition"
                          style={{
                            background: active ? accent + "22" : "rgba(255,255,255,0.03)",
                            borderColor: active ? accent + "55" : "rgba(255,255,255,0.08)",
                            color: active ? accent : "rgba(255,255,255,0.4)",
                          }}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!editing && profile.contentPref && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-white/40">Prefers:</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border" style={{ background: accent + "15", borderColor: accent + "40", color: accent }}>{profile.contentPref}</span>
                </div>
              )}
            </GlassCard>

            {/* ── Goon Identity ── */}
            <GlassCard className="p-4">
              <CardHeader icon={<Gamepad2 size={15}/>} title="Goon Identity" accent={accent} />
              {editing ? (
                <div className="flex flex-col gap-4">
                  {/* Goon style */}
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Goon Style</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Edger","Gooner","Cumper","Ruiner","Devotee","Lurker"].map(s => {
                        const active = draft.goonStyle === s;
                        return (
                          <button key={s} onClick={() => editDraft("goonStyle", active ? null : s)}
                            className="py-1.5 rounded-xl text-xs font-bold border transition"
                            style={{
                              background: active ? (draftAccent + "22") : "rgba(255,255,255,0.03)",
                              borderColor: active ? (draftAccent + "55") : "rgba(255,255,255,0.08)",
                              color: active ? draftAccent : "rgba(255,255,255,0.40)",
                            }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Session goal */}
                  <EditField
                    label="Session Goal / Pledge"
                    value={draft.sessionGoal || ""}
                    onChange={v => editDraft("sessionGoal", v)}
                    placeholder="e.g. Edge for 60 minutes without finishing…"
                    multiline
                    maxLength={120}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.goonStyle ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Style:</span>
                      <span className="text-xs px-3 py-0.5 rounded-full font-bold border"
                        style={{ background: accent + "18", borderColor: accent + "40", color: accent }}>
                        {profile.goonStyle}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-white/25 italic">No goon style set.</p>
                  )}
                  {profile.sessionGoal && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider block mb-1">Current Pledge</span>
                      <p className="text-sm text-white/60 leading-relaxed border-l-2 pl-3"
                        style={{ borderColor: accent + "60" }}>
                        {profile.sessionGoal}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Favourite Creators */}
            <GlassCard className="p-4">
              <CardHeader icon={<Users size={15}/>} title="Favourite Creators" accent={accent} />
              <div className="flex flex-wrap gap-2 mb-2">
                {(activeProfile.favCreators || []).map(c => (
                  <div key={c} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold"
                    style={{ background: accent + "10", borderColor: accent + "30", color: accent }}>
                    @{c}
                    {editing && (
                      <button onClick={() => editDraft("favCreators", (draft.favCreators||[]).filter(x=>x!==c))}
                        className="text-white/30 hover:text-white/70 transition"><X size={10}/></button>
                    )}
                  </div>
                ))}
                {!(activeProfile.favCreators||[]).length && (
                  <p className="text-xs text-white/25 italic">No creators added yet.</p>
                )}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
                    placeholder="@creatorhandle (up to 10)"
                    value={newCreator}
                    onChange={e => setNewCreator(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCreator()}
                    maxLength={64}
                  />
                  <button onClick={addCreator}
                    className="px-3 py-1.5 rounded-xl text-sm font-bold border border-white/10 hover:bg-white/8 transition">
                    <Plus size={14} className="text-white/60"/>
                  </button>
                </div>
              )}
            </GlassCard>

            {/* Trophy Case */}
            {(profile.achievements || []).length > 0 && (
              <GlassCard className="p-4">
                <CardHeader icon={<Trophy size={15}/>} title="Trophy Case" accent={accent} />
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {(profile.achievements || []).map(a => {
                    const meta = ACHIEVEMENT_META[a];
                    return (
                      <div key={a}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/6 transition"
                        title={meta?.label || a}>
                        <span className="text-2xl">{meta?.emoji || "🏅"}</span>
                        <span className="text-[9px] text-white/45 text-center leading-tight">{meta?.label || a}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Recent Vault Activity */}
            {vault.length > 0 && (
              <GlassCard className="p-4">
                <CardHeader icon={<Video size={15}/>} title="Recent Saves" accent={accent} />
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {vault.slice(0, 6).map(item => (
                    <div key={item.id}
                      className="relative aspect-video rounded-lg overflow-hidden border border-white/8 bg-white/4 group">
                      {item.thumbnail
                        ? <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title || ""} />
                        : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                            {item.kind?.toUpperCase() || "?"}
                          </div>
                      }
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[9px] text-white text-center px-1 leading-tight line-clamp-2">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Reposted Feed */}
            <FeedSection accent={accent} />

            {/* Comprehensive Activity Dashboard */}
            <ActivityDashboard accent={accent} vaultLen={vault.length} />

          </div>
        </div>
      </div>
    </div>
  );
}
