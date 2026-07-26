import { useState } from 'react'
import { Smartphone, Download, X, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function IOSInstallModal({ onClose }: Props) {
  const [profileDownloaded, setProfileDownloaded] = useState(false)

  const appUrl = window.location.origin + '/'

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/92 backdrop-blur-md" />
      <div
        className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-pink-950/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Install Nacre's Hub on iPhone</h2>
              <p className="text-zinc-500 text-[10px]">Full-screen · saves to Camera Roll · no browser bar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-5 space-y-3">

          {/* Step 1 */}
          <div className={`rounded-xl border p-4 transition-all ${profileDownloaded ? 'border-green-500/30 bg-green-950/15 opacity-60' : 'border-pink-500/40 bg-pink-950/20'}`}>
            <div className="flex items-center gap-2.5 mb-2.5">
              {profileDownloaded
                ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                : <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              }
              <p className="text-sm font-bold text-white">Download the Nacre's Hub Profile</p>
            </div>
            <p className="text-zinc-400 text-xs mb-3 leading-relaxed">
              This installs a Web Clip — Nacre's Hub appears on your home screen exactly like a native app.
              Open this page in <strong className="text-white">Safari</strong> first (not Chrome).
            </p>
            <a
              href="/api/ios-profile"
              className={`flex items-center justify-center gap-2 w-full py-3 font-bold rounded-xl transition-all text-sm ${
                profileDownloaded
                  ? 'bg-green-700/40 text-green-300 cursor-default'
                  : 'bg-pink-600 hover:bg-pink-500 text-white'
              }`}
              onClick={() => {
                setProfileDownloaded(true)
              }}
            >
              <Download className="w-4 h-4" />
              {profileDownloaded ? 'Profile Downloaded ✓' : "Download Nacre's Hub Profile"}
            </a>
          </div>

          {/* Step 2 */}
          <div className={`rounded-xl border p-4 transition-all ${profileDownloaded ? 'border-amber-500/40 bg-amber-950/15' : 'border-white/8 bg-white/3 opacity-50'}`}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${profileDownloaded ? 'bg-amber-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</span>
              <p className="text-sm font-bold text-white">Install the Profile</p>
            </div>
            <div className="space-y-2 mb-3">
              {[
                'A prompt may appear — tap "Allow"',
                'Open the Settings app on your iPhone',
                'At the top tap "Profile Downloaded"',
                'Tap Install → enter your passcode → Install again',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ArrowRight className="w-3 h-3 text-amber-500/60 shrink-0 mt-0.5" />
                  <p className="text-zinc-300 text-xs leading-snug">{step}</p>
                </div>
              ))}
            </div>
            <a
              href="app-settings:"
              className={`flex items-center justify-center gap-2 w-full py-2.5 border rounded-xl text-xs font-bold transition-colors ${
                profileDownloaded
                  ? 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30'
                  : 'border-white/10 bg-transparent text-zinc-600 pointer-events-none'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Settings
            </a>
          </div>

          {/* Step 3 */}
          <div className={`rounded-xl border p-4 transition-all ${profileDownloaded ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-white/8 bg-white/3 opacity-40'}`}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${profileDownloaded ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>3</span>
              <p className="text-sm font-bold text-white">Open the Installed App</p>
            </div>
            <p className="text-zinc-400 text-xs mb-3 leading-relaxed">
              After installing the profile, go to your <strong className="text-white">home screen</strong> and tap the <strong className="text-pink-300">Nacre's Hub</strong> icon.
              It opens full-screen — no browser bar — and all download buttons save directly to your Camera Roll.
            </p>
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-3 font-bold rounded-xl text-sm transition-all ${
                profileDownloaded
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  : 'bg-zinc-800 text-zinc-600 pointer-events-none'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Open Nacre's Hub App
            </a>
            {profileDownloaded && (
              <p className="text-[10px] text-zinc-600 text-center mt-2">
                If this opens in Safari, find the Nacre's Hub icon on your home screen instead.
              </p>
            )}
          </div>

        </div>

        {/* OR divider — Manual method */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-zinc-600 text-[10px] font-bold tracking-widest">OR MANUAL</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <details className="group">
            <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 select-none">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Add to Home Screen manually (Safari Share button)
            </summary>
            <div className="mt-3 space-y-2 pl-2">
              {[
                'Open this page in Safari (not Chrome)',
                'Tap the Share button ⎋ at the bottom',
                'Scroll down → "Add to Home Screen"',
                'Tap Add — done!',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-zinc-500 text-xs leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
