import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, Play, Heart, X, ChevronDown, Shuffle, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { fetchVideoInfo, getStreamUrl, saveToDevice } from '../api'
import { toast } from 'sonner'

interface XvItem {
  id: string
  eid: string
  title: string
  thumbnail: string
  videoPageUrl: string
}

interface PhItem {
  id: string
  eid: string
  title: string
  thumbnail: string
  videoPageUrl: string
}

type VideoItem = (XvItem | PhItem) & { source: 'xvideos' | 'pornhub' }

interface Props {
  onSaveToVault?: (item: { kind: string; url: string; thumbnail: string; title: string; sourcePageUrl?: string }) => void
}

const WORSHIP_KEY = 'goonit_sweetiefox_worship_v1'
const FAVE_KEY = 'goonit_sweetiefox_faves_v1'

const BIO = {
  name: 'Sweetie Fox',
  country: '🇨🇿 Czech Republic',
  born: '2001',
  tags: ['Czech', 'Blonde', 'Teen', 'Amateur', 'POV', 'Blowjob'],
  description:
    'Czech-born beauty and one of the fastest-rising stars in the industry. Known for her absolutely stunning looks, natural charm, and willingness to go all the way — every single time.',
}

function VideoCard({
  video,
  onPlay,
  isFaved,
  onFave,
}: {
  video: VideoItem
  onPlay: (v: VideoItem) => void
  isFaved: boolean
  onFave: (v: VideoItem) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={video.thumbnail}
          alt={video.title}
          className={`w-full h-full object-cover transition-all duration-300 ${hovered ? 'scale-105 brightness-75' : ''}`}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center shadow-2xl shadow-amber-500/50">
              <Play className="w-6 h-6 text-black fill-black ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span className="text-[9px] font-bold bg-black/70 text-amber-300 px-1.5 py-0.5 rounded">
            {video.source === 'xvideos' ? 'XV' : 'PH'}
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs text-white/80 line-clamp-2 leading-snug">{video.title}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-zinc-500">{video.source}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFave(video) }}
            className={`p-1 rounded-full transition-colors ${isFaved ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PlayDialog({
  video,
  onClose,
  onSaveToVault,
  onNext,
}: {
  video: VideoItem
  onClose: () => void
  onSaveToVault?: Props['onSaveToVault']
  onNext?: () => void
}) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setLoading(true)
    setStreamUrl(null)
    if (video.source === 'xvideos') {
      fetchVideoInfo(video.videoPageUrl)
        .then((d) => {
          const url = d.mediaURLs?.[0] || d.media_extended?.[0]?.url || null
          setStreamUrl(url)
        })
        .catch(() => setStreamUrl(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [video])

  const handleDownload = async () => {
    toast.loading('Preparing download…', { id: 'sf-dl' })
    try {
      const result = await saveToDevice({ pageUrl: video.videoPageUrl, title: video.title })
      toast.dismiss('sf-dl')
      toast.success(result === 'shared' ? 'Sent to share sheet 📲 🦊' : 'Download started! 🦊')
    } catch {
      toast.dismiss('sf-dl')
      toast.error('Download failed')
    }
  }

  const handleSave = () => {
    onSaveToVault?.({
      kind: 'xvideo',
      url: video.videoPageUrl,
      thumbnail: video.thumbnail,
      title: video.title,
      sourcePageUrl: video.videoPageUrl,
    })
    toast.success('Saved to Vault 💾')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-zinc-950 rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-900/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <span className="text-amber-400 text-lg">🦊</span>
          <p className="flex-1 text-sm font-medium text-white/90 line-clamp-1">{video.title}</p>
          <div className="flex items-center gap-2">
            {streamUrl && (
              <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            {onNext && (
              <button onClick={onNext} className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
                NEXT ▶
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Thumbnail */}
        <div className="relative aspect-video bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : streamUrl ? (
            <video
              ref={videoRef}
              key={streamUrl}
              src={getStreamUrl(streamUrl)}
              poster={video.thumbnail}
              controls
              autoPlay
              muted={muted}
              className="w-full h-full object-contain"
              onError={() => setStreamUrl(null)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <img src={video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🦊</span>
                </div>
                <p className="text-white/70 text-sm mb-1">Preview not available</p>
                <p className="text-zinc-500 text-xs">Click Download to save the full video</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 h-10 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl flex items-center gap-2 border border-white/10 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Vault
          </button>
          <a
            href={video.videoPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 bg-white/5 hover:bg-white/10 text-zinc-400 text-sm font-medium rounded-xl flex items-center gap-2 border border-white/10 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Open
          </a>
        </div>
      </div>
    </div>
  )
}

export default function SweetieFox({ onSaveToVault }: Props) {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const [worshipCount, setWorshipCount] = useState(0)
  const [faves, setFaves] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'saved'>('all')
  const [worshipMode, setWorshipMode] = useState(false)
  const worshipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const n = parseInt(localStorage.getItem(WORSHIP_KEY) || '0', 10) + 1
    localStorage.setItem(WORSHIP_KEY, String(n))
    setWorshipCount(n)
    try {
      const saved = JSON.parse(localStorage.getItem(FAVE_KEY) || '[]')
      setFaves(new Set(saved))
    } catch {}
  }, [])

  const loadVideos = useCallback(async (pg: number) => {
    if (loading) return
    setLoading(true)
    try {
      const [xvRes] = await Promise.allSettled([
        fetch(`/api/xvsearch?q=sweetie%20fox&page=${pg}`).then(r => r.json()),
      ])
      const xvItems: VideoItem[] = (xvRes.status === 'fulfilled' ? xvRes.value.results || [] : [])
        .filter((v: XvItem) => v.title && v.thumbnail)
        .map((v: XvItem) => ({ ...v, source: 'xvideos' as const }))

      const combined = [...xvItems]
      if (combined.length === 0) {
        setHasMore(false)
      } else {
        setVideos(prev => pg === 1 ? combined : [...prev, ...combined])
      }
    } catch {
      toast.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    loadVideos(1)
  }, [])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadVideos(next)
  }

  const toggleFave = (v: VideoItem) => {
    setFaves(prev => {
      const next = new Set(prev)
      if (next.has(v.id)) next.delete(v.id)
      else next.add(v.id)
      localStorage.setItem(FAVE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const shuffle = () => {
    const idx = Math.floor(Math.random() * videos.length)
    setActiveVideo(videos[idx])
  }

  const nextVideo = () => {
    if (!activeVideo) return
    const idx = videos.findIndex(v => v.id === activeVideo.id)
    setActiveVideo(videos[(idx + 1) % videos.length])
  }

  const displayVideos = filter === 'saved' ? videos.filter(v => faves.has(v.id)) : videos

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.15),transparent_60%)]" />
        <div className="relative px-4 sm:px-6 pt-10 pb-8 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-[0.5em] text-amber-500/60 uppercase mb-2">✦ Nacre's Hub Worship Zone ✦</p>
              <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-white mb-1">
                SWEETIE
                <span className="block bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  FOX
                </span>
              </h1>
              <p className="text-amber-200/60 text-sm mb-4">{BIO.country} · Born {BIO.born} · Czech Princess</p>
              <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">{BIO.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {BIO.tags.map(t => (
                  <span key={t} className="text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                <span className="text-2xl">🦊</span>
                <div>
                  <p className="text-[10px] text-amber-400/60 uppercase tracking-widest">Times Worshipped</p>
                  <p className="text-2xl font-bold text-amber-300">{worshipCount.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={shuffle}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle Play
              </button>
              <button
                onClick={() => setWorshipMode(!worshipMode)}
                className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors border ${
                  worshipMode
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${worshipMode ? 'fill-red-400 text-red-400 animate-pulse' : ''}`} />
                {worshipMode ? 'Worship Mode ON' : 'Worship Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-black/90 backdrop-blur-xl border-b border-white/5 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {(['all', 'saved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {f === 'all' ? `All Videos (${videos.length})` : `Saved (${faves.size})`}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[10px] text-zinc-600 tracking-wider hidden sm:block">
            Sources: XVideos + PornHub
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {displayVideos.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🦊</p>
            <p className="text-zinc-500 text-lg">
              {filter === 'saved' ? 'No saved videos yet — heart some to save them!' : 'Loading her collection…'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayVideos.map(v => (
            <VideoCard
              key={`${v.source}-${v.id}`}
              video={v}
              onPlay={setActiveVideo}
              isFaved={faves.has(v.id)}
              onFave={toggleFave}
            />
          ))}

          {/* Skeleton loaders */}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 border border-white/5 animate-pulse">
              <div className="aspect-video bg-zinc-800" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && !loading && displayVideos.length > 0 && filter === 'all' && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold rounded-xl hover:bg-amber-500/20 transition-colors flex items-center gap-2 mx-auto"
            >
              <ChevronDown className="w-4 h-4" />
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Play Dialog */}
      {activeVideo && (
        <PlayDialog
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onSaveToVault={onSaveToVault}
          onNext={videos.length > 1 ? nextVideo : undefined}
        />
      )}
    </div>
  )
}
