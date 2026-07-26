import { useState, useEffect, useCallback } from 'react'
import { X, ChevronDown, ExternalLink, Image as ImageIcon, Play, Download } from 'lucide-react'

export interface CoomerMedia {
  name: string
  url: string
  thumb: string
  isVideo?: boolean
}

export interface CoomerPost {
  id: string
  user: string
  service: string
  title: string
  content: string
  published: string
  media: CoomerMedia[]
}

interface Props {
  fetchUrl: string
  pageSize?: number
  className?: string
}

function isVideoFile(name: string): boolean {
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(name)
}

export default function CoomerGrid({ fetchUrl, pageSize = 50, className = '' }: Props) {
  const [posts, setPosts] = useState<CoomerPost[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; isVideo: boolean } | null>(null)

  const loadMore = useCallback(async (off: number, reset: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const sep = fetchUrl.includes('?') ? '&' : '?'
      const r = await fetch(`${fetchUrl}${sep}o=${off}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      const newPosts: CoomerPost[] = (data.items || []).map((p: CoomerPost) => ({
        ...p,
        media: p.media.map(m => ({ ...m, isVideo: isVideoFile(m.name) }))
      }))
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts])
      setHasMore(newPosts.length >= pageSize)
      setOffset(off + newPosts.length)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [fetchUrl, pageSize])

  useEffect(() => {
    setPosts([])
    setOffset(0)
    setHasMore(true)
    loadMore(0, true)
  }, [fetchUrl]) // eslint-disable-line

  const allMedia = posts.flatMap(p => p.media).filter(m => !m.isVideo || m.thumb)

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">
          {error.includes('404') ? 'Creator not found on coomer.su — try a different username or use the search page.' : error}
        </div>
      )}

      {/* Masonry grid */}
      {allMedia.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
          {allMedia.map((m, i) => (
            <div key={`${m.url}-${i}`}
              className="break-inside-avoid mb-2 cursor-pointer group relative rounded-xl overflow-hidden bg-zinc-900"
              onClick={() => setLightbox({ url: m.url, isVideo: m.isVideo ?? false })}>
              <img
                src={m.thumb || m.url}
                alt=""
                loading="lazy"
                className="w-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                style={{ maxHeight: '380px', minHeight: '80px' }}
                onError={e => {
                  const img = e.target as HTMLImageElement
                  if (img.src !== m.url) img.src = m.url
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded-xl" />
              {m.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-rose-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-zinc-800" />
          <p className="text-zinc-600 text-sm">No content found</p>
        </div>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <button
          onClick={() => loadMore(offset, false)}
          className="w-full py-3 rounded-2xl border border-white/8 bg-white/4 text-zinc-400 text-sm font-bold hover:bg-white/8 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" /> Load more
        </button>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[350] bg-black/97 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <a
              href={lightbox.url} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={e => e.stopPropagation()}>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={lightbox.url} download
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={e => e.stopPropagation()}>
              <Download className="w-4 h-4" />
            </a>
          </div>
          {lightbox.isVideo ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.url}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  )
}
