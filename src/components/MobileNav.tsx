import { useState, useEffect, useRef } from 'react'
import { Download, Images, Skull, Crown, X, Grid2x2 } from 'lucide-react'

interface Props {
  activeTab: string
  goToTab: (tab: string) => void
  vaultCount: number
  ageVerified: boolean
  boyName: string
  mood: 'soft' | 'wild' | 'dominant'
  setMood: (m: 'soft' | 'wild' | 'dominant') => void
  onKinkVault: () => void
  onBattle: () => void
  onTargetPractice: () => void
  onDice: () => void
  onSpicy: () => void
}

const PRIMARY_TABS: Array<{
  tab: string
  icon: React.ReactNode
  label: string
}> = [
  { tab: 'download', icon: <Download className="w-5 h-5" />, label: 'Home'    },
  { tab: 'gallery',  icon: <Images   className="w-5 h-5" />, label: 'Gallery' },
  { tab: 'corner',   icon: <Skull    className="w-5 h-5" />, label: 'Goon'    },
  { tab: 'profile',  icon: <Crown    className="w-5 h-5" />, label: 'Profile' },
]

type SheetItem =
  | { kind: 'tab';    tab: string; emoji: string; label: string; desc: string }
  | { kind: 'action'; action: string; emoji: string; label: string; desc: string }

const SHEET_TABS: SheetItem[] = [
  // ── Nacre world ──────────────────────────────────────────────────
  { kind:'tab', tab:'nacreultimate', emoji:'👑', label:'Nacre Ultimate', desc:'7 chapters · full game' },
  { kind:'tab', tab:'nacre',         emoji:'🌹', label:'Nacre',          desc:'French goddess'         },
  { kind:'tab', tab:'nacrefucktoy',  emoji:'🔗', label:'Nacre Training', desc:'Fucktoy session'        },
  { kind:'tab', tab:'nacreowned',    emoji:'🔒', label:'Owned by Nacre', desc:'Ownership contract'     },
  { kind:'tab', tab:'nacreroulette', emoji:'🎲', label:'Nacre Roulette', desc:'Goon roulette'          },
  { kind:'tab', tab:'nacrejoi',      emoji:'🎯', label:'Nacre JOI',      desc:'She controls the pace'  },
  { kind:'tab', tab:'nacreedge',     emoji:'☠️', label:'Edge Endurance', desc:'Hold the edge'          },
  { kind:'tab', tab:'nacretalk',     emoji:'🗣️', label:'Nacre Speaks',   desc:'She talks to you'       },
  // ── Stars ────────────────────────────────────────────────────────
  { kind:'tab', tab:'sweetiefox',    emoji:'🦊', label:'Sweetie Fox',    desc:'Worship zone'           },
  { kind:'tab', tab:'katianakay',    emoji:'🍑', label:'Katiana Kay',    desc:'Leaks & content'        },
  { kind:'tab', tab:'skybri',        emoji:'☁️', label:'Sky Bri',        desc:'Blonde goddess'         },
  { kind:'tab', tab:'hannah',        emoji:'💜', label:'Hannah owo',     desc:'E-girl cosplay'         },
  { kind:'tab', tab:'lunapearl',     emoji:'🌙', label:'Luna Pearl',     desc:'Goddess content'        },
  { kind:'tab', tab:'belle',         emoji:'🐱', label:'Belle Delphine', desc:'Iconic e-girl'          },
  { kind:'tab', tab:'mollyflowers',  emoji:'🌸', label:'Molly Flowers',  desc:'Leak vault'             },
  { kind:'tab', tab:'stellareve',    emoji:'⚔️', label:'Stellar Eve',    desc:'Stellar Blade babe'     },
  // ── Content ──────────────────────────────────────────────────────
  { kind:'tab', tab:'creamyspot',    emoji:'💦', label:'Creamy Spot',    desc:'Video player'           },
  { kind:'tab', tab:'feet',          emoji:'👠', label:'Feet',           desc:'Foot gallery'           },
  { kind:'tab', tab:'girlteens',     emoji:'🎀', label:'Girl Gallery',   desc:'Selfies & feet'         },
  { kind:'tab', tab:'panties',       emoji:'🩲', label:'Panties',        desc:'Panty page'             },
  { kind:'tab', tab:'filth',         emoji:'🔥', label:'Filth Generator',desc:'Daily assignments'      },
  { kind:'tab', tab:'leaks',         emoji:'🔓', label:'Leaks Search',   desc:'Find leaked content'    },
  { kind:'tab', tab:'waystogoon',    emoji:'📖', label:'Ways to Goon',   desc:'Guide & tips'           },
  { kind:'tab', tab:'xsearch',       emoji:'𝕏',  label:'X Search',       desc:'Search Twitter/X'       },
  // ── Tools & social ───────────────────────────────────────────────
  { kind:'tab', tab:'chamber',       emoji:'🔥', label:'Chamber',        desc:'Immersive mode'         },
  { kind:'tab', tab:'games',         emoji:'🎮', label:'Games',          desc:'Arcade of Sin'          },
  { kind:'tab', tab:'vault',         emoji:'💾', label:'Vault',          desc:'Your collection'        },
  { kind:'tab', tab:'chat',          emoji:'💋', label:'Luna AI',        desc:'AI companion'           },
  { kind:'tab', tab:'confess',       emoji:'🕯️', label:'Confessions',    desc:'Confession wall'        },
  { kind:'tab', tab:'sam',           emoji:'✨', label:'SamHub',         desc:'Sam\'s personal hub'    },
  { kind:'tab', tab:'credits',       emoji:'ℹ️', label:'Credits',        desc:'About this app'         },
  // ── Interactive ──────────────────────────────────────────────────
  { kind:'action', action:'battle',  emoji:'⚔️', label:'Waifu Battle',   desc:'Tournament mode'        },
  { kind:'action', action:'target',  emoji:'🎯', label:'Target Practice',desc:'Aim & score'            },
  { kind:'action', action:'dice',    emoji:'🎲', label:'Dirty Dice',     desc:'Roll the dice'          },
  { kind:'action', action:'kinks',   emoji:'👑', label:'Kink Vault',     desc:'Your kinks'             },
  { kind:'action', action:'spicy',   emoji:'🌶️', label:'Spicy Game',     desc:'Truth or Dare'          },
]

export default function MobileNav({
  activeTab, goToTab, vaultCount,
  mood, setMood, onKinkVault, onBattle, onTargetPractice, onDice, onSpicy,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when sheet is open (iOS fix)
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  function handleSheetItem(item: SheetItem) {
    setSheetOpen(false)
    if (item.kind === 'tab') {
      goToTab(item.tab)
    } else {
      if (item.action === 'battle')  onBattle()
      if (item.action === 'target')  onTargetPractice()
      if (item.action === 'dice')    onDice()
      if (item.action === 'kinks')   onKinkVault()
      if (item.action === 'spicy')   onSpicy()
    }
  }

  const isMoreActive = !PRIMARY_TABS.some(t => t.tab === activeTab)

  return (
    <>
      {/* ── Sheet backdrop — stops touch events bleeding through on iOS ── */}
      <div
        aria-hidden="true"
        onPointerDown={(e) => { e.stopPropagation(); setSheetOpen(false) }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 54,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: sheetOpen ? 1 : 0,
          pointerEvents: sheetOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
          touchAction: 'none',
        } as React.CSSProperties}
      />

      {/* ── Slide-up sheet ── */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 60,
          zIndex: 55,
          maxHeight: '78svh',
          transform: sheetOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          touchAction: 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        } as React.CSSProperties}
      >
        <div
          className="flex flex-col rounded-t-3xl overflow-hidden shadow-2xl shadow-black"
          style={{
            background: '#0a0a0c',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            maxHeight: '78svh',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <div>
              <p className="text-[9px] font-bold tracking-[0.45em] uppercase text-white/25">All Sections</p>
              <p className="text-white font-black text-base tracking-tight">Cum&nbsp;'n'&nbsp;Go</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mood toggle — monochrome */}
              <button
                onPointerDown={(e) => {
                  e.stopPropagation()
                  const moods: Array<'soft'|'wild'|'dominant'> = ['soft','wild','dominant']
                  setMood(moods[(moods.indexOf(mood) + 1) % moods.length])
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <span>{mood === 'soft' ? '🌸' : mood === 'wild' ? '🔥' : '👑'}</span>
                <span>{mood === 'soft' ? 'Soft' : mood === 'wild' ? 'Wild' : 'Dominant'}</span>
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); setSheetOpen(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-white/6 mb-3" />

          {/* Scrollable grid */}
          <div
            ref={scrollRef}
            className="overflow-y-auto px-4 pb-6"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}
          >
            <div className="grid grid-cols-3 gap-2">
              {SHEET_TABS.map((item, i) => {
                const isActive = item.kind === 'tab' && activeTab === item.tab
                return (
                  <button
                    key={i}
                    onPointerDown={(e) => { e.stopPropagation(); handleSheetItem(item) }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 text-left select-none"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {item.emoji}
                    </div>
                    <div className="text-center w-full">
                      <p
                        className="text-[11px] font-bold leading-tight truncate"
                        style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)' }}
                      >
                        {item.label}
                        {item.kind === 'tab' && item.tab === 'vault' && vaultCount > 0 && (
                          <span className="ml-1 text-[8px] bg-white/20 text-white rounded-full px-1">{vaultCount}</span>
                        )}
                      </p>
                      <p className="text-[9px] text-white/25 mt-0.5 leading-none truncate">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary bottom bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'rgba(10,10,12,0.97)',
          backdropFilter: 'blur(32px) saturate(140%)',
          WebkitBackdropFilter: 'blur(32px) saturate(140%)',
          borderColor: 'rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {PRIMARY_TABS.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onPointerDown={() => goToTab(tab)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all active:scale-90 select-none"
                style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/50 rounded-b-full" />
                )}
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                    color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {icon}
                </span>
                <span
                  className="text-[9px] font-semibold tracking-wide transition-colors"
                  style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)' }}
                >
                  {label}
                </span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onPointerDown={() => setSheetOpen(s => !s)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all active:scale-90 select-none"
            style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          >
            {isMoreActive && !sheetOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/50 rounded-b-full" />
            )}
            <span
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all relative"
              style={{
                background: (sheetOpen || isMoreActive) ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: (sheetOpen || isMoreActive) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
              }}
            >
              {sheetOpen
                ? <X className="w-5 h-5" />
                : <Grid2x2 className="w-5 h-5" />
              }
              {vaultCount > 0 && !sheetOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-white/60 rounded-full" />
              )}
            </span>
            <span
              className="text-[9px] font-semibold tracking-wide transition-colors"
              style={{ color: (sheetOpen || isMoreActive) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
