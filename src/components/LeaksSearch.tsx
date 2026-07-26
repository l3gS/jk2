import { useState, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import CoomerGrid from './CoomerGrid'

const SUGGESTED = [
  'belle delphine', 'amouranth', 'corinna kopf', 'pokimane', 'indiefoxx',
  'emily black', 'meg turney', 'lana rhoades', 'riley reid', 'mia malkova',
]

const SERVICES = [
  { value: '', label: 'All Platforms' },
  { value: 'onlyfans', label: 'OnlyFans' },
  { value: 'fansly', label: 'Fansly' },
  { value: 'patreon', label: 'Patreon' },
  { value: 'fanbox', label: 'Fanbox' },
]

export default function LeaksSearch() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [service, setService] = useState('')
  const [fetchUrl, setFetchUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = (q = query, svc = service) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setActiveQuery(trimmed)
    const params = new URLSearchParams({ q: trimmed })
    if (svc) params.set('service', svc)
    setFetchUrl(`/api/coomer/search?${params}`)
  }

  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
    setFetchUrl('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0.95) 60%, black 100%)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.12) 0%, transparent 65%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 py-8">
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-indigo-400/60 mb-1">Nacre's Hub · coomer.su</p>
          <h1 className="font-display text-4xl tracking-wider text-white mb-1">LEAKS<span className="text-indigo-400"> SEARCH</span></h1>
          <p className="text-zinc-600 text-sm mb-6">Search the coomer.su archive · OnlyFans · Fansly · Patreon</p>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search creator name..."
                className="w-full pl-10 pr-10 py-3.5 rounded-2xl text-sm font-medium text-white placeholder-zinc-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
              />
              {query && (
                <button onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors">
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            {/* Service filter */}
            <div className="relative">
              <select
                value={service}
                onChange={e => setService(e.target.value)}
                className="h-full pl-3 pr-8 rounded-2xl text-xs font-bold text-zinc-300 outline-none appearance-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
                {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            </div>
            {/* Search button */}
            <button
              onClick={() => doSearch()}
              disabled={!query.trim()}
              className="px-5 py-3 rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: 'rgba(199,210,254,0.9)' }}>
              Search
            </button>
          </div>

          {/* Suggested searches */}
          {!activeQuery && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider self-center mr-1">Try:</span>
              {SUGGESTED.map(s => (
                <button key={s}
                  onClick={() => { setQuery(s); doSearch(s) }}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Active query label */}
        {activeQuery && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black tracking-[0.4em] uppercase text-zinc-600">Results for</p>
              <span className="text-xs font-bold text-indigo-300 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                "{activeQuery}"
              </span>
              {service && (
                <span className="text-xs font-bold text-zinc-400 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {SERVICES.find(s => s.value === service)?.label}
                </span>
              )}
            </div>
            <button onClick={clearSearch}
              className="text-[9px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors">
              Clear ×
            </button>
          </div>
        )}

        {/* Empty state */}
        {!activeQuery && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-zinc-600 text-sm font-bold">Search the coomer.su archive</p>
            <p className="text-zinc-700 text-xs mt-1">Enter a creator name to find their leaked content</p>
          </div>
        )}

        {/* Results grid */}
        {fetchUrl && <CoomerGrid key={fetchUrl} fetchUrl={fetchUrl} />}
      </div>
    </div>
  )
}
