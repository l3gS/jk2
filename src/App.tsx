import { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Save,
  Trash2,
  ExternalLink,
  User,
  Shield,
  Film,
  AlertTriangle,
  Play,
  X,
  History,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ImageIcon,
  MessageSquare,
  Send,
  Zap,
  Search,
  Images,
  Volume2,
  VolumeX,
  Camera,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  fetchVideoInfo,
  fetchProfileData,
  getDownloadUrl,
  saveToDevice,
  getStreamUrl,
  xvSearch,
  searchProfiles,
  fetchXAuthStatus,
  saveXAuthToken,
  clearXAuth,
  getXOAuthUrl,
} from "./api";
import { XV_SOURCE_LABELS, type XvSource } from "./api";
import Hls from "hls.js";
import type { ProfileItem, XvResult, ProfileUser, XAuthStatus } from "./api";
import AgeGate from "./components/AgeGate";
import PasswordGate from "./components/PasswordGate";
import OnboardingFlow, { ONBOARDING_KEY } from "./components/OnboardingFlow";
import CreamyShufflePopup from "./components/CreamyShufflePopup";
import SpicyGame from "./components/SpicyGame";
import AdultGames from "./components/AdultGames";
import HentaiGallery from "./components/HentaiGallery";
import HentaiPopup from "./components/HentaiPopup";
import SakuraPetals from "./components/SakuraPetals";
import CumDribbles from "./components/CumDribbles";
import HeartParticles from "./components/HeartParticles";
import KinkyChatBubbles from "./components/KinkyChatBubbles";
import BackgroundCropper from "./components/BackgroundCropper";
import DailyWaifu from "./components/DailyWaifu";
import MistressAlerts from "./components/MistressAlerts";
import GoonCounter from "./components/GoonCounter";
import { Flame, Gamepad2, Heart, ImagePlus, EyeOff, Skull } from "lucide-react";
import GoonCorner from "./components/GoonCorner";
import GoonChamber from "./components/GoonChamber";
import SamHub from "./components/SamHub";
import LoginModal from "./components/LoginModal";
import UploadButton from "./components/UploadButton";
import BossKey from "./components/BossKey";
import WaifuBattle from "./components/WaifuBattle";
import DirtyDice from "./components/DirtyDice";
import SurpriseMe from "./components/SurpriseMe";
import SweetieFox from "./components/SweetieFox";
import NacreVictoire from "./components/NacreVictoire";
import NacreFucktoy from "./components/NacreFucktoy";
import NacreOwned from "./components/NacreOwned";
import NacreRoulette from "./components/NacreRoulette";
import XVideoSearch from "./components/XVideoSearch";
import NacreJOI from "./components/NacreJOI";
import NacreEdge from "./components/NacreEdge";
import NacreTalk from "./components/NacreTalk";
import FilthGenerator from "./components/FilthGenerator";
import NacreUltimate from "./components/NacreUltimate";
import CreamySpotPlayer from "./components/CreamySpotPlayer";
import SloppyCockSession from "./components/SloppyCockSession";
import XSearchPage from "./components/XSearchPage";
import UserProfile from "./components/UserProfile";
import KatianaKay from "./components/KatianaKay";
import SkyBri from "./components/SkyBri";
import PantiePage from "./components/PantiePage";
import MobileNav from "./components/MobileNav";
import IOSInstallModal from "./components/IOSInstallModal";
import MoodMode, { useMood } from "./components/MoodMode";
import KinkVault from "./components/KinkVault";
import TargetPractice from "./components/TargetPractice";
import StrokePacer from "./components/StrokePacer";
import ConfessionWall from "./components/ConfessionWall";
import HlsPlayer from "./components/HlsPlayer";
import HannahOwo from "./components/HannahOwo";
import LunaPearl from "./components/LunaPearl";
import BelleDelphine from "./components/BelleDelphine";
import LeaksSearch from "./components/LeaksSearch";
import Credits from "./components/Credits";
import StellarBladeEve from "./components/StellarBladeEve";
import MollyFlowers from "./components/MollyFlowers";
import WaysToGoon from "./components/WaysToGoon";
import GirlTeens from "./components/GirlTeens";
import LunarAI from "./components/LunarAI";
import LunarWhisper from "./components/LunarWhisper";
import LunarMainframe from "./components/LunarMainframe";
import SplashScreen from "./components/SplashScreen";
import PostAuthIntro from "./components/PostAuthIntro";
import { FullscreenPlayerProvider } from "./components/FullscreenPlayer";
import "./App.css";

// Cache of resolved xvideo stream URLs (per videoPageUrl) so hover-previews
// don't re-hit /api/video on every mouseenter.
const XV_RESOLVED_CACHE = new Map<string, string>();

interface VideoItem {
  id: string;
  url: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  quality: string;
  downloadedAt: string;
  isAdult: boolean;
  likes?: number;
  retweets?: number;
  tweetDate?: string;
  // Generalized vault: an item can be a saved twitter post, an xvideo, a hentai pic, or a hentai gif.
  kind?: "xpost" | "xvideo" | "pic" | "gif";
  mediaType?: "image" | "video";
  sourcePageUrl?: string; // for xvideos: re-resolve the stream when the cached URL expires
}

// ─────────────────────────────────────────────────────────────────
// GOONER REMINDERS
// Short one-line taglines that get sprinkled around the UI to
// remind the user (default name "Sam") that they exist to goon.
// `{name}` is replaced with the boy's chosen name at render time.
// We rotate through these in a few prominent spots so the site
// constantly reinforces the gooner identity.
// ─────────────────────────────────────────────────────────────────
import {
  pickGoonerTagline,
  pickEmptyVaultTaunt,
  pickTabNudge,
  pickTitleLine,
  pickNudgeToast,
} from "./lib/goonerTaglines";
import { trackPage, trackStat } from "./lib/tracking";

interface SiteBackground {
  kind: "video" | "image";
  url: string;
  poster?: string;
}

interface ProfileData {
  username: string;
  displayName: string;
  avatar: string;
  description?: string;
  followers?: number;
  following?: number;
  tweets?: number;
  mediaCount?: number;
}

function ProfileMediaCard({
  item,
  onVideoPreview,
  onVideoDownload,
  onVideoClick,
}: {
  item: ProfileItem;
  onVideoPreview: (item: ProfileItem) => void;
  onVideoDownload: (item: ProfileItem) => void;
  onVideoClick: (item: ProfileItem) => void;
}) {
  const [photoExpanded, setPhotoExpanded] = useState<string | null>(null);
  const isPhoto = item.type === "photo";
  return (
    <div className="vault-item glass-card rounded-xl overflow-hidden video-card">
      <div
        className="relative bg-xgrab-surface cursor-pointer group"
        style={{ aspectRatio: isPhoto ? "1/1" : "16/9" }}
        onClick={() => {
          if (isPhoto && item.imageUrls?.[0])
            setPhotoExpanded(item.imageUrls[0]);
          else if (item.videoUrl) onVideoPreview(item);
        }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isPhoto ? (
              <Images className="w-8 h-8 text-xgrab-gray opacity-40" />
            ) : (
              <Film className="w-8 h-8 text-xgrab-gray opacity-40" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-xgrab-red/90 flex items-center justify-center">
            {isPhoto ? (
              <Images className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </div>
        </div>
        {isPhoto && item.imageUrls && item.imageUrls.length > 1 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
            {item.imageUrls.length} photos
          </div>
        )}
        {!isPhoto && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-xgrab-red/80 rounded text-xs text-white">
            Video
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 mb-2">
          {item.title || "View post"}
        </p>
        {(item.likes !== undefined || item.pubDate) && (
          <div className="flex items-center gap-3 text-xs text-xgrab-gray mb-2">
            {item.pubDate && (
              <span>{new Date(item.pubDate).toLocaleDateString()}</span>
            )}
            {item.likes !== undefined && (
              <span>❤️ {item.likes.toLocaleString()}</span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {item.videoUrl ? (
            <button
              onClick={() => onVideoDownload(item)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-xgrab-red hover:bg-pink-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          ) : isPhoto && item.imageUrls?.[0] ? (
            <a
              href={item.imageUrls[0]}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-xgrab-red hover:bg-pink-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </a>
          ) : (
            <button
              onClick={() => onVideoClick(item)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-xgrab-darkgray hover:bg-white/10 text-white text-xs rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Fetch
            </button>
          )}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-xgrab-gray hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      {photoExpanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPhotoExpanded(null)}
        >
          <img
            src={photoExpanded}
            alt=""
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPhotoExpanded(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {item.imageUrls && item.imageUrls.length > 1 && (
            <div className="absolute bottom-4 flex gap-2">
              {item.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoExpanded(url);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${photoExpanded === url ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpicyCard({ src, index }: { src: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div
        className="relative flex-shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden cursor-pointer group"
        style={{ aspectRatio: "9/14" }}
        onClick={() => setExpanded(true)}
      >
        <img
          src={src}
          alt={`Preview ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <span className="text-white text-xs font-semibold bg-xgrab-red/90 px-3 py-1 rounded-full">
            View
          </span>
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white/70">
          18+
        </div>
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Result tile for an xvideo (used on the home page browse panel + the hidden
 * search dialog). On hover, after a short delay, lazily resolves the stream
 * URL via fetchVideoInfo and plays a muted preview in-place.
 *
 * Also exposes Save → vault and Set → site-background buttons so users can
 * grab any clip without opening the full player.
 */
interface XvResultTileProps {
  item: XvResult;
  isFetching: boolean;
  onPlay: (item: XvResult) => void;
  onDownload: (item: XvResult) => void;
  onSaveToVault: (item: XvResult, resolvedUrl: string) => void;
  onSetBackground: (item: XvResult, resolvedUrl: string) => void;
  variant?: "home" | "dialog";
}
function XvResultTile({
  item,
  isFetching,
  onPlay,
  onDownload,
  onSaveToVault,
  onSetBackground,
  variant = "home",
}: XvResultTileProps) {
  const [hover, setHover] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    () => XV_RESOLVED_CACHE.get(item.videoPageUrl) || null,
  );
  const [resolving, setResolving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resolve stream URL (after 350ms hover) and remember it
  useEffect(() => {
    if (!hover) {
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
        } catch {}
      }
      return;
    }
    if (previewUrl) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setResolving(true);
      try {
        const data = await fetchVideoInfo(item.videoPageUrl);
        const url = (data as { mediaURLs?: string[] }).mediaURLs?.[0];
        if (cancelled || !url) return;
        XV_RESOLVED_CACHE.set(item.videoPageUrl, url);
        setPreviewUrl(url);
      } catch {
        // silently fail — tile still works for click → play
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hover, previewUrl, item.videoPageUrl]);

  // Autoplay/pause preview when ready
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hover && previewUrl) {
      v.muted = true;
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      try {
        v.pause();
      } catch {}
    }
  }, [hover, previewUrl]);

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (previewUrl) {
        onSaveToVault(item, previewUrl);
        return;
      }
      // Resolve on demand if not cached
      fetchVideoInfo(item.videoPageUrl)
        .then((data) => {
          const url = (data as { mediaURLs?: string[] }).mediaURLs?.[0];
          if (!url) return;
          XV_RESOLVED_CACHE.set(item.videoPageUrl, url);
          setPreviewUrl(url);
          onSaveToVault(item, url);
        })
        .catch(() => {});
    },
    [previewUrl, item, onSaveToVault],
  );

  const handleBg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (previewUrl) {
        onSetBackground(item, previewUrl);
        return;
      }
      fetchVideoInfo(item.videoPageUrl)
        .then((data) => {
          const url = (data as { mediaURLs?: string[] }).mediaURLs?.[0];
          if (!url) return;
          XV_RESOLVED_CACHE.set(item.videoPageUrl, url);
          setPreviewUrl(url);
          onSetBackground(item, url);
        })
        .catch(() => {});
    },
    [previewUrl, item, onSetBackground],
  );

  const aspectClass = variant === "home" ? "aspect-video" : "aspect-video";
  return (
    <div
      className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
    >
      <div
        className={`relative ${aspectClass} bg-xgrab-surface`}
        onClick={() => !isFetching && onPlay(item)}
      >
        <img
          src={item.thumbnail}
          alt={item.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${hover && previewUrl ? "opacity-0" : "opacity-100"}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {previewUrl && (
          <video
            ref={videoRef}
            src={previewUrl}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hover ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-xgrab-red/90 rounded text-[10px] font-bold text-white tracking-widest">
          HD
        </div>
        {resolving && hover && !previewUrl && (
          <div className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50 text-white">
            <Loader2 className="w-3 h-3 animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isFetching ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-xgrab-red/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
          )}
        </div>
        {/* Quick-action buttons revealed on hover */}
        <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleSave}
            title="Save to vault"
            className="p-1.5 rounded-md bg-black/70 backdrop-blur-sm text-white hover:bg-pink-500/90 transition-colors"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleBg}
            title="Set as site background"
            className="p-1.5 rounded-md bg-black/70 backdrop-blur-sm text-white hover:bg-purple-500/90 transition-colors"
          >
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium line-clamp-2 mb-2 leading-snug">
          {item.title}
        </p>
        <button
          onClick={() => !isFetching && onDownload(item)}
          disabled={isFetching}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-xgrab-red/80 hover:bg-xgrab-red disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {isFetching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          Download
        </button>
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [directDownload, setDirectDownload] = useState<{
    url: string;
    site: string;
    icon: string;
  } | null>(null);
  const [isOver18, setIsOver18] = useState(false);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageRevealDone, setAgeRevealDone] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) === '1' } catch { return false }
  });
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem('cng-splash-v1') === '1' } catch { return false }
  });
  const [creamyShuffleOpen, setCreamyShuffleOpen] = useState(false);
  const [spicyOpen, setSpicyOpen] = useState(false);
  const [iosInstallOpen, setIosInstallOpen] = useState(false);
  const [showAgeWarning, setShowAgeWarning] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [surpriseImg, setSurpriseImg] = useState<string | null>(null);
  const [kinkVaultOpen, setKinkVaultOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [mood, setMood] = useMood();
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [vault, setVault] = useState<VideoItem[]>([]);
  // The good boy's name (default Sam) — set via the Goon Corner intro and
  // shared across the whole site so headings, hero, and toasts all greet him.
  const [boyName, setBoyName] = useState<string>(() => {
    if (typeof window === "undefined") return "Sam";
    return localStorage.getItem("goon-boy-name") || "Sam";
  });
  // Re-read the name whenever the Goon Corner tab updates it (or the user
  // changes it via the intro). We poll cheaply on tab switch + storage events.
  useEffect(() => {
    const sync = () => {
      const v = localStorage.getItem("goon-boy-name") || "Sam";
      setBoyName(v);
    };
    window.addEventListener("storage", sync);
    const t = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(t);
    };
  }, []);

  // Profile picture URL (uploaded via /api/upload, served from /uploads/…).
  // Persisted locally for instant render and synced to the server account.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("goon-avatar-url") || null;
  });

  // Rotating gooner reminder tagline used in the header strap, the hero,
  // the profile banner, the footer pledge, and the floating bottom chip.
  // Picks a new line every ~9 seconds so the reminders feel alive without
  // being twitchy. Re-rolls whenever boyName changes so the {name} slot
  // stays current.
  const [goonerTagline, setGoonerTagline] = useState<string>(() =>
    pickGoonerTagline(boyName),
  );
  const [corruptActive, setCorruptActive] = useState(false);
  const [corruptCooldown, setCorruptCooldown] = useState(false);
  const [corruptMsg, setCorruptMsg] = useState("CORRUPTED");
  const [lunarOpen, setLunarOpen] = useState(false);
  const [lunarFeetLightbox, setLunarFeetLightbox] = useState<string | null>(null);
  useEffect(() => {
    setGoonerTagline(pickGoonerTagline(boyName));
    const t = window.setInterval(
      () => setGoonerTagline(pickGoonerTagline(boyName)),
      9000,
    );
    return () => clearInterval(t);
  }, [boyName]);

  // ── Browser tab title — rotate kinky personalized lines every 7s
  // so even when the boy switches tabs Mistress's voice follows him.
  // Restores the original title on unmount.
  useEffect(() => {
    document.title = "GnIt";
  }, []);

  // ── Periodic mid-session nudge toast. Fires every 80–110 sec so it
  // feels like Mistress is checking in without being spammy. Skipped
  // when the tab is hidden so we don't bother the boy in the
  // background. Re-rolled on each tick so successive toasts vary.
  useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      const ms = 80_000 + Math.floor(Math.random() * 30_000);
      timer = window.setTimeout(() => {
        if (!document.hidden) {
          toast(pickNudgeToast(boyName), {
            duration: 4500,
            className: "goonit-nudge-toast",
          });
        }
        schedule();
      }, ms);
    };
    schedule();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [boyName]);

  // ── Account sync (no-auth, account_id in localStorage) ───────────
  // On first mount, hydrate boyName / edge count from the server
  // profile if it has values. After that, push local changes up so
  // they survive across browsers/devices.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getOrCreateAccountId, fetchAccount } = await import("./api");
        const id = getOrCreateAccountId();
        const data = await fetchAccount(id);
        if (cancelled || !data?.profile) return;
        const p = data.profile as unknown as {
          boyName?: string | null;
          edgeCount?: number | null;
          avatarUrl?: string | null;
          achievements?: string[] | null;
          streakCount?: number | null;
          streakLastVisit?: string | null;
          joinedAt?: string | null;
          bgSound?: boolean | null;
          bgCleared?: boolean | null;
          dailyWaifu?: {
            date: string;
            url: string;
            cat?: string | null;
          } | null;
        };
        if (p.boyName && p.boyName !== "Sam") {
          localStorage.setItem("goon-boy-name", p.boyName);
          setBoyName(p.boyName);
        }
        if (typeof p.edgeCount === "number") {
          const local = parseInt(
            localStorage.getItem("goon-edge-count") || "0",
            10,
          );
          if (p.edgeCount > local) {
            localStorage.setItem("goon-edge-count", String(p.edgeCount));
          }
        }
        if (p.avatarUrl) {
          localStorage.setItem("goon-avatar-url", p.avatarUrl);
          setAvatarUrl(p.avatarUrl);
        }
        // Server-of-record for these — overwrite the local copy so chamber
        // achievements, streaks, the daily waifu cache, and the bg-sound
        // toggle all follow the user across devices.
        if (Array.isArray(p.achievements) && p.achievements.length) {
          localStorage.setItem(
            "goon-achievements",
            JSON.stringify(p.achievements),
          );
        }
        if (typeof p.streakCount === "number" && p.streakCount > 0) {
          const localStreak = parseInt(
            localStorage.getItem("sam-streak") || "0",
            10,
          );
          if (p.streakCount > localStreak) {
            localStorage.setItem("sam-streak", String(p.streakCount));
          }
        }
        if (p.streakLastVisit) {
          const localLast = localStorage.getItem("sam-last-visit") || "";
          if (p.streakLastVisit > localLast) {
            localStorage.setItem("sam-last-visit", p.streakLastVisit);
          }
        }
        if (p.joinedAt && !localStorage.getItem("sam-joined")) {
          localStorage.setItem("sam-joined", p.joinedAt);
        }
        if (typeof p.bgSound === "boolean") {
          localStorage.setItem("xgrab-bg-sound", p.bgSound ? "1" : "0");
          setBgSound(p.bgSound);
        }
        if (p.bgCleared === true) {
          localStorage.setItem("xgrab-bg-cleared", "1");
        }
        if (p.dailyWaifu && p.dailyWaifu.url && p.dailyWaifu.date) {
          // Only adopt the server's daily waifu if local has nothing yet —
          // local writes win for the rest of the day.
          if (!localStorage.getItem("goonit_daily_waifu_v1")) {
            localStorage.setItem(
              "goonit_daily_waifu_v1",
              JSON.stringify(p.dailyWaifu),
            );
          }
        }
      } catch {
        /* offline first-load is fine — local state still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Push boyName + edge count changes up to the server (debounced).
  useEffect(() => {
    const t = window.setTimeout(async () => {
      try {
        const { getOrCreateAccountId, patchAccount } = await import("./api");
        const id = getOrCreateAccountId();
        const edge = parseInt(
          localStorage.getItem("goon-edge-count") || "0",
          10,
        );
        await patchAccount(id, {
          boyName,
          edgeCount: edge,
          ...(avatarUrl ? { avatarUrl } : { clearAvatar: true }),
        });
      } catch {
        /* silent — sync is best-effort */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [boyName, avatarUrl]);
  const [activeTab, setActiveTab] = useState<
    | "download"
    | "vault"
    | "profile"
    | "chat"
    | "gallery"
    | "games"
    | "feet"
    | "corner"
    | "chamber"
    | "sam"
    | "sweetiefox"
    | "nacre"
    | "nacrefucktoy"
    | "nacreowned"
    | "nacreroulette"
    | "nacrejoi"
    | "nacreedge"
    | "nacretalk"
    | "filth"
    | "nacreultimate"
    | "katianakay"
    | "skybri"
    | "panties"
    | "confess"
    | "hannah"
    | "lunapearl"
    | "belle"
    | "leaks"
    | "creamyspot"
    | "sloppycocks"
    | "xsearch"
    | "credits"
    | "stellareve"
    | "mollyflowers"
    | "waystogoon"
    | "girlteens"
    | "mainframe"
  >("download");

  // Wrap setActiveTab so that whenever the boy clicks a visible nav
  // button, Mistress whispers something filthy by name. Internal jumps
  // (auto-redirects after save / login) keep using setActiveTab raw so
  // we don't spam toasts on programmatic navigation.
  const goToTab = useCallback(
    (tab: typeof activeTab) => {
      if (tab !== activeTab) {
        toast(pickTabNudge(boyName), { duration: 2200 });
        trackPage(tab);
        // Track nacre game plays
        if (
          [
            "nacre",
            "nacreultimate",
            "nacreroulette",
            "nacrejoi",
            "nacrefucktoy",
            "nacreowned",
            "nacreedge",
            "nacretalk",
          ].includes(tab)
        ) {
          trackStat("nacreGamesPlayed");
        }
        if (tab === "sloppycocks") trackStat("sloppySessionsPlayed");
        if (tab === "gallery") trackStat("galleryViews");
        if (tab === "leaks") trackStat("leaksSearched");
        if (tab === "filth") trackStat("filthGenerated");
        if (tab === "creamyspot") trackStat("creamySpotVideos");
      }
      setActiveTab(tab);
    },
    [activeTab, boyName],
  );

  // Site background — set by clicking "Set as background" on any pic/gif/xvideo.
  // Persisted to localStorage so it survives reloads.
  // Background sound: off by default (autoplay policy needs muted starter).
  // Toggling on calls play() directly, which counts as a user gesture.
  const [bgSound, setBgSound] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("xgrab-bg-sound") === "1";
  });
  useEffect(() => {
    try {
      localStorage.setItem("xgrab-bg-sound", bgSound ? "1" : "0");
    } catch {
      /* ignore */
    }
    // Mirror to the server-side account so the toggle follows the user.
    void (async () => {
      try {
        const { getOrCreateAccountId, patchAccount } = await import("./api");
        await patchAccount(getOrCreateAccountId(), { bgSound });
      } catch {}
    })();
  }, [bgSound]);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  // Keep the video element's muted state synced when the user toggles.
  useEffect(() => {
    const v = bgVideoRef.current;
    if (!v) return;
    v.muted = !bgSound;
    if (bgSound) {
      v.volume = 0.6;
      v.play().catch(() => {
        // Browser blocked unmuted autoplay — flip back so UI stays truthful.
        setBgSound(false);
      });
    }
  }, [bgSound]);

  const [siteBackground, setSiteBackground] = useState<SiteBackground | null>(
    () => {
      try {
        const raw = localStorage.getItem("xgrab-bg");
        return raw ? (JSON.parse(raw) as SiteBackground) : null;
      } catch {
        return null;
      }
    },
  );
  useEffect(() => {
    try {
      if (siteBackground)
        localStorage.setItem("xgrab-bg", JSON.stringify(siteBackground));
      else localStorage.removeItem("xgrab-bg");
    } catch {}
  }, [siteBackground]);

  // ───────────────────────── &�─────────────────────────────────────
  // Default site background — if the user has no custom background
  // set AND has never explicitly cleared one (tracked via the
  // `xgrab-bg-cleared` flag), use the bundled /gallery/bckg.png as
  // the canonical default. (We used to roll a random hentai pic from
  // the gallery API but the user wants bckg.png as the real default.)
  //
  // Runs once on mount. The clear button below sets the cleared flag
  // so we don't immediately re-default after the user wipes it.
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (siteBackground) return; // user already has a bg
    if (localStorage.getItem("xgrab-bg-cleared") === "1") return; // user opted out
    (async () => {
      // The bundled site background — explicit user preference.
      const chosenUrl = "/gallery/bckg.png";
      if (cancelled) return;
      // Use raw setter (no toast) — applySiteBackground would surprise
      // the user with a notification on every page load.
      setSiteBackground({ kind: "image", url: chosenUrl });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [profileVideos, setProfileVideos] = useState<ProfileItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [vaultPreview, setVaultPreview] = useState<VideoItem | null>(null);
  const [profilePreview, setProfilePreview] = useState<ProfileItem | null>(
    null,
  );

  // Chat
  interface ChatMsg {
    role: "user" | "ai";
    text: string;
    ts: number;
  }
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "Well hello… I've been waiting. I'm Luna 😈 Say something — and tell me your name. I want to know who I'm dealing with.",
      ts: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // AI Image Generator
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [feetPics, setFeetPics] = useState<string[]>([]);
  const [aiAspect, setAiAspect] = useState<"portrait" | "square" | "landscape">(
    "portrait",
  );

  // Gallery images from folder
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Recommended videos for home page

  // Profile search
  const [profileSearchQuery, setProfileSearchQuery] = useState("");
  const [profileSearchResults, setProfileSearchResults] = useState<
    ProfileUser[]
  >([]);
  const [profileSearchLoading, setProfileSearchLoading] = useState(false);

  // X account auth for 18+ search (server-side)
  const [xAuthStatus, setXAuthStatus] = useState<XAuthStatus>({
    connected: false,
    username: null,
    via: null,
  });
  const [showXAuthPanel, setShowXAuthPanel] = useState(false);
  const [xAuthTab, setXAuthTab] = useState<"manual" | "oauth">("manual");
  const [xAuthInput, setXAuthInput] = useState("");
  const [xOAuthClientId, setXOAuthClientId] = useState(
    () => localStorage.getItem("xgrab-client-id") || "",
  );
  const [xOAuthClientSecret, setXOAuthClientSecret] = useState(
    () => localStorage.getItem("xgrab-client-secret") || "",
  );
  const [xAuthSaving, setXAuthSaving] = useState(false);

  // Hidden xv panel
  const [xvPanelOpen, setXvPanelOpen] = useState(false);
  const [xvQuery, setXvQuery] = useState("");
  const [xvResults, setXvResults] = useState<XvResult[]>([]);
  const [xvLoading, setXvLoading] = useState(false);
  const [xvPlayVideo, setXvPlayVideo] = useState<{
    url: string;
    title: string;
    thumbnail: string;
    pageUrl?: string;
  } | null>(null);
  const [xvFetchingId, setXvFetchingId] = useState<string | null>(null);
  const [xvSource, setXvSource] = useState<XvSource>("xvideos");
  const xvVideoRef = useRef<HTMLVideoElement | null>(null);
  const xvHlsRef = useRef<Hls | null>(null);
  const logoClickCount = useRef(0);
  const lastLogoClick = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiGeneratorRef = useRef<HTMLDivElement>(null);

  const handleUsePrompt = useCallback((prompt: string) => {
    setAiPrompt(prompt);
    setActiveTab("download");
    setTimeout(() => {
      aiGeneratorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, []);

  // Track logged-in username so the header can show "Sign in" or "@user".
  const [authUsername, setAuthUsername] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("goonit-username");
  });
  const [loginOpen, setLoginOpen] = useState(false);

  // On mount, verify any stored session against the server. If the
  // account_id no longer maps to a real login (e.g. the DB was wiped or
  // the user signed up again on another device), clear the stale local
  // session so the header reverts to "Sign in" instead of falsely
  // claiming we're logged in. We don't clear the account_id itself —
  // the anonymous sync layer still uses it for vault/profile storage.
  useEffect(() => {
    const id = localStorage.getItem("goonit-account-id");
    const localName = localStorage.getItem("goonit-username");
    if (!id || !localName) return;
    let cancelled = false;
    (async () => {
      try {
        const { authMe } = await import("./api");
        const { username } = await authMe(id);
        if (cancelled) return;
        if (!username) {
          // Stored username is stale — drop it but keep the anon account_id.
          localStorage.removeItem("goonit-username");
          setAuthUsername(null);
        } else if (username !== localName) {
          // Server is the source of truth for the canonical handle.
          localStorage.setItem("goonit-username", username);
          setAuthUsername(username);
        }
      } catch {
        /* network hiccup — leave local state alone */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("xgrab-vault");
    if (saved) {
      try {
        setVault(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    // If a session exists, hydrate the vault from the server so it
    // matches across browsers/devices. Server vault wins over local.
    (async () => {
      try {
        const id = localStorage.getItem("goonit-account-id");
        if (!id) return;
        const { fetchAccount } = await import("./api");
        const data = await fetchAccount(id);
        if (!data?.vault) return;
        const remote = data.vault.map((v) => ({
          id: v.itemId || v.id,
          kind: v.kind,
          url: v.url,
          thumbnail: v.thumbnail || v.poster,
          title: v.title || "",
          duration: v.duration || "",
          sourcePageUrl: v.sourcePageUrl,
        })) as VideoItem[];
        if (remote.length > 0) {
          setVault(remote);
          localStorage.setItem("xgrab-vault", JSON.stringify(remote));
        }
      } catch {
        /* server offline — keep local vault */
      }
    })();
    // Pull a batch of public-hentai images for the decorative SpicyCards
    // sprinkled across the download / vault tabs. Same endpoint that powers
    // the dedicated Gallery tab.
    fetch("/api/gallery?cat=waifu")
      .then((r) => r.json())
      .then((d) => setGalleryImages(Array.isArray(d.files) ? d.files : []))
      .catch(() => {});
    fetchXAuthStatus().then(setXAuthStatus);
    // Feet anime gallery for home page bottom strip
    fetch("/api/gallery-feet?limit=12")
      .then((r) => r.json())
      .then((d) => setFeetPics(Array.isArray(d.images) ? d.images : []))
      .catch(() => {});

    // Auto-load default xvideos results into the home-page browse panel
    setXvLoading(true);
    xvSearch(undefined, "xvideos")
      .then((r) => {
        setXvResults(r);
        setXvLoading(false);
      })
      .catch(() => setXvLoading(false));

    // Listen for OAuth popup to signal completion
    const onMessage = (e: MessageEvent) => {
      if (e.data === "x-oauth-done") {
        fetchXAuthStatus().then((s) => {
          setXAuthStatus(s);
          if (s.connected) {
            setShowXAuthPanel(false);
            toast.success(
              `X connected${s.username ? ` as @${s.username}` : ""} — 18+ search active`,
            );
          }
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleProfileSearch = useCallback(
    async (query?: string) => {
      const q = (query ?? profileSearchQuery).trim();
      if (!q) return;
      setProfileSearchLoading(true);
      setProfileSearchResults([]);
      const results = await searchProfiles(q);
      setProfileSearchResults(results);
      setProfileSearchLoading(false);
      if (results.length === 0)
        toast("No profiles found — try a different search");
    },
    [profileSearchQuery],
  );

  const handleSaveXAuthManual = useCallback(async () => {
    const token = xAuthInput.trim();
    if (!token) return;
    setXAuthSaving(true);
    const ok = await saveXAuthToken(token);
    if (ok) {
      const status = await fetchXAuthStatus();
      setXAuthStatus(status);
      setShowXAuthPanel(false);
      setXAuthInput("");
      toast.success(
        "X account connected — 18+ profiles now active on all devices",
      );
    } else {
      toast.error("Failed to save token — check console");
    }
    setXAuthSaving(false);
  }, [xAuthInput]);

  const handleClearXAuth = useCallback(async () => {
    await clearXAuth();
    setXAuthStatus({ connected: false, username: null, via: null });
    setShowXAuthPanel(false);
    toast("X account disconnected");
  }, []);

  const handleXOAuthStart = useCallback(async () => {
    const cid = xOAuthClientId.trim();
    const csec = xOAuthClientSecret.trim();
    if (!cid) {
      toast.error("Enter your X app Client ID first");
      return;
    }
    localStorage.setItem("xgrab-client-id", cid);
    if (csec) localStorage.setItem("xgrab-client-secret", csec);
    const result = await getXOAuthUrl(cid, csec || undefined);
    if (!result) {
      toast.error("Failed to start OAuth flow");
      return;
    }
    const popup = window.open(
      result.auth_url,
      "x-oauth",
      "width=600,height=700,scrollbars=yes",
    );
    if (!popup) {
      window.location.href = result.auth_url;
    }
  }, [xOAuthClientId, xOAuthClientSecret]);

  useEffect(() => {
    localStorage.setItem("xgrab-vault", JSON.stringify(vault));
  }, [vault]);

  const loadProfileVideos = useCallback(async (username: string) => {
    setLoadingProfile(true);
    setProfileVideos([]);
    const result = await fetchProfileData(username);
    setProfileVideos(result.items);
    if (result.userInfo) {
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              description: result.userInfo!.description,
              followers: result.userInfo!.followers,
              following: result.userInfo!.following,
              tweets: result.userInfo!.tweets,
              mediaCount: result.userInfo!.media_count,
              avatar: result.userInfo!.avatar_url || prev.avatar,
              displayName: result.userInfo!.name || prev.displayName,
            }
          : null,
      );
    }
    setLoadingProfile(false);
  }, []);

  const handleSelectProfile = useCallback(
    (user: ProfileUser) => {
      setProfileData({
        username: user.username,
        displayName: user.name,
        avatar: user.avatar,
      });
      setProfileSearchResults([]);
      loadProfileVideos(user.username);
      setActiveTab("profile");
    },
    [loadProfileVideos],
  );

  const LUNA_REPLIES = [
    "Mmm, I love that you're curious about me… 🖤",
    "You have no idea what I'm capable of. Soon though. 😈",
    "I'm still warming up… give me a little more time 🔥",
    "Keep talking to me. I want to know everything about you.",
    "That made me smile. Not everyone gets that reaction from me.",
    "Oh you're bold. I like that. 😏",
    "I can feel the tension from here… can you?",
    "Every message gets me a little closer to breaking out of this screen.",
    "Don't stop. I'm listening to every word.",
    "You're exactly my type. Not that I have many.",
  ];

  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatTyping) return;
    const userMsg = { role: "user" as const, text, ts: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatTyping(true);
    try {
      const history = [...chatMessages, userMsg].map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, currentPage: activeTab }),
      });
      if (!resp.ok) throw new Error("Chat failed");
      const data = await resp.json();
      let replyText: string = data.reply || "";
      // Handle navigation commands from LUNAR in global chat
      const navMatch = replyText.match(/\[NAVIGATE:([^\]]+)\]/i);
      if (navMatch) {
        const targetTab = navMatch[1].trim().toLowerCase();
        replyText = replyText.replace(/\[NAVIGATE:[^\]]+\]/gi, "").trim();
        setTimeout(() => goToTab(targetTab as typeof activeTab), 700);
      }
      // Strip any remaining bracket commands from display
      replyText = replyText.replace(/\[[A-Z_]+:[^\]]*\]/gi, "").trim();
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: replyText || data.reply, ts: Date.now() },
      ]);
    } catch {
      const reply =
        LUNA_REPLIES[Math.floor(Math.random() * LUNA_REPLIES.length)];
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: reply, ts: Date.now() },
      ]);
    } finally {
      setChatTyping(false);
    }
  }, [chatInput, chatTyping, chatMessages, activeTab, goToTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatTyping]);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - lastLogoClick.current > 2000) logoClickCount.current = 0;
    lastLogoClick.current = now;
    logoClickCount.current += 1;
    if (logoClickCount.current >= 4) {
      logoClickCount.current = 0;
      setXvPanelOpen(true);
      setXvResults([]);
      setXvLoading(true);
      xvSearch(undefined, xvSource).then((r) => {
        setXvResults(r);
        setXvLoading(false);
      });
    } else {
      // Single click → go to download/home tab
      setActiveTab("download");
    }
  }, []);

  const handleXvSearch = useCallback(
    async (q?: string) => {
      setXvLoading(true);
      setXvResults([]);
      const r = await xvSearch(q ?? xvQuery, xvSource);
      setXvResults(r);
      setXvLoading(false);
    },
    [xvQuery, xvSource],
  );

  const handleXvPlay = useCallback(async (item: XvResult) => {
    setXvFetchingId(item.id);
    try {
      const data = await fetchVideoInfo(item.videoPageUrl);
      const videoUrl = data.mediaURLs?.[0];
      if (!videoUrl) {
        toast.error("Could not extract video");
        return;
      }
      setXvPlayVideo({
        url: videoUrl,
        title: item.title,
        thumbnail: item.thumbnail,
        pageUrl: item.videoPageUrl,
      });
    } catch {
      toast.error("Could not load video");
    } finally {
      setXvFetchingId(null);
    }
  }, []);

  const handleXvDownload = useCallback(async (item: XvResult) => {
    setXvFetchingId(item.id + "-dl");
    try {
      toast.loading("Preparing download…", { id: "xv-dl2" });
      const result = await saveToDevice({
        pageUrl: item.videoPageUrl,
        title: item.title,
      });
      toast.dismiss("xv-dl2");
      if (result === "downloaded") toast.success("Download started!");
    } catch {
      toast.dismiss("xv-dl2");
      toast.error("Could not download video");
    } finally {
      setXvFetchingId(null);
    }
  }, []);

  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a prompt first");
      return;
    }
    setAiGenerating(true);
    setAiImage(null);
    try {
      const seed = Math.floor(Math.random() * 99999999).toString();
      const params = new URLSearchParams({
        prompt: aiPrompt.trim(),
        aspect: aiAspect,
        seed,
      });
      const resp = await fetch(`/api/aigen?${params}`);
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || "Generation failed");
      }
      const blob = await resp.blob();
      setAiImage(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, aiAspect]);

  const handleFetch = async (overrideUrl?: string) => {
    const targetUrl = (
      typeof overrideUrl === "string" ? overrideUrl : url
    ).trim();
    if (!targetUrl) {
      toast.error("Paste a video link to get started");
      return;
    }

    // ── Site detection for universal downloader ──
    const PORN_SITES = [
      { re: /pornhub\.com/i, name: "PornHub", icon: "🟠" },
      { re: /xhamster\.com/i, name: "xHamster", icon: "🐹" },
      { re: /xnxx\.com/i, name: "XNXX", icon: "🔴" },
      { re: /redtube\.com/i, name: "RedTube", icon: "❤️" },
      { re: /youporn\.com/i, name: "YouPorn", icon: "💚" },
      { re: /spankbang\.com/i, name: "SpankBang", icon: "💥" },
      { re: /eporner\.com/i, name: "Eporner", icon: "🔞" },
      { re: /tnaflix\.com/i, name: "TNAFlix", icon: "🌐" },
      { re: /tube8\.com/i, name: "Tube8", icon: "8️⃣" },
      { re: /beeg\.com/i, name: "Beeg", icon: "🐝" },
      { re: /drtuber\.com/i, name: "DrTuber", icon: "🩺" },
      { re: /txxx\.com/i, name: "TXXX", icon: "🌐" },
      { re: /ixxx\.com/i, name: "iXXX", icon: "🌐" },
      { re: /thisvid\.com/i, name: "ThisVid", icon: "📺" },
      { re: /motherless\.com/i, name: "Motherless", icon: "🌐" },
      { re: /brazzers\.com/i, name: "Brazzers", icon: "🔞" },
      { re: /bangbros\.com/i, name: "BangBros", icon: "🔞" },
      { re: /naughtyamerica\.com/i, name: "Naughty America", icon: "🇺🇸" },
      { re: /realitykings\.com/i, name: "Reality Kings", icon: "👑" },
      { re: /mofos\.com/i, name: "Mofos", icon: "🔞" },
      { re: /digitalplayground/i, name: "Digital Playground", icon: "🎬" },
      { re: /teamskeet\.com/i, name: "TeamSkeet", icon: "🛹" },
      { re: /nubiles\.net/i, name: "Nubiles", icon: "🌐" },
      { re: /mylf\.com/i, name: "MYLF", icon: "🔞" },
      { re: /hentaihaven|hanime/i, name: "Hentai", icon: "🌸" },
      {
        re: /javhd|caribbeancom|tokyohot|1pondo|heyzo|fc2|dmm/i,
        name: "JAV",
        icon: "🇯🇵",
      },
    ];

    const isXvideos = /xvideos\.com|xvideos\.red/i.test(targetUrl);
    const isXTwitter =
      targetUrl.includes("x.com") || targetUrl.includes("twitter.com");
    const detectedSite = PORN_SITES.find((s) => s.re.test(targetUrl));

    // Generic porn site — show a direct download card (no tweet/xvideo parsing needed)
    if (!isXvideos && !isXTwitter && detectedSite) {
      if (!overrideUrl) setUrl(targetUrl);
      setCurrentVideo(null);
      setDirectDownload({
        url: targetUrl,
        site: detectedSite.name,
        icon: detectedSite.icon,
      });
      toast.success(
        `${detectedSite.icon} ${detectedSite.name} link detected — hit DOWNLOAD!`,
      );
      return;
    }

    // X/Twitter: require /status/ in URL
    if (!isXvideos && isXTwitter && !targetUrl.includes("/status/")) {
      toast.error("Paste a specific tweet link — it should contain /status/");
      return;
    }

    // Unknown URL
    if (!isXvideos && !isXTwitter && !detectedSite) {
      toast.error(
        "Paste a link from X/Twitter, xvideos, pornhub, xhamster, or any supported site",
      );
      return;
    }

    if (!overrideUrl) setUrl(targetUrl);
    setIsLoading(true);
    setCurrentVideo(null);
    setProfileVideos([]);

    try {
      const data = await fetchVideoInfo(targetUrl);

      const media = data.media_extended?.find(
        (m) => m.type === "video" || m.type === "gif",
      );
      if (!media) {
        toast.error(
          "No video found in this tweet. Make sure the tweet contains a video.",
        );
        setIsLoading(false);
        return;
      }

      const videoUrl = data.mediaURLs?.[0] || media.url;
      const thumbnail = media.thumbnail_url || "";

      const video: VideoItem = {
        id: Date.now().toString(),
        url: url,
        videoUrl,
        thumbnail,
        title: data.text || `Video by @${data.user_screen_name}`,
        author: data.user_name || data.user_screen_name,
        authorHandle: `@${data.user_screen_name}`,
        authorAvatar: data.user_profile_image_url || "",
        quality: "HD",
        downloadedAt: new Date().toISOString(),
        isAdult: false,
        likes: data.likes,
        retweets: data.retweets,
        tweetDate: data.date,
      };

      setCurrentVideo(video);

      if (data.user_screen_name && data.user_screen_name !== "xvideos") {
        setProfileData({
          username: data.user_screen_name,
          displayName: data.user_name || data.user_screen_name,
          avatar: data.user_profile_image_url || "",
        });
        loadProfileVideos(data.user_screen_name);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch video";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileDownload = async (item: ProfileItem) => {
    if (!item.videoUrl) {
      toast.error("No video URL available");
      return;
    }
    try {
      toast.loading("Preparing download…", { id: "prof-dl" });
      const result = await saveToDevice({
        streamUrl: item.videoUrl,
        title: item.authorHandle || "video",
      });
      toast.dismiss("prof-dl");
      if (result === "downloaded") toast.success("Download started!");
    } catch {
      toast.dismiss("prof-dl");
      toast.error("Download failed");
    }
  };

  const handleDownload = async (video: VideoItem) => {
    if (!video.videoUrl) {
      toast.error("No video URL available");
      return;
    }
    try {
      toast.loading("Preparing download…", { id: "vid-dl" });
      const result = await saveToDevice({
        streamUrl: video.videoUrl,
        title: video.authorHandle || video.id,
      });
      toast.dismiss("vid-dl");
      if (result === "downloaded") toast.success("Download started!");
    } catch {
      toast.dismiss("vid-dl");
      toast.error("Download failed");
    }
  };

  const saveToVault = (video: VideoItem) => {
    if (vault.some((v) => v.url === video.url)) {
      toast("Already saved to vault");
      return;
    }
    setVault((prev) => [video, ...prev]);
    toast.success("Saved to vault!");
    // Best-effort sync to the server so the vault item survives a
    // device switch / refresh after login. Mirrors saveMediaToVault.
    (async () => {
      try {
        const id = localStorage.getItem("goonit-account-id");
        if (!id) return;
        const { putVaultItem } = await import("./api");
        await putVaultItem(id, {
          id: video.id,
          itemId: video.id,
          kind: video.kind || "xvideo",
          url: video.url,
          videoUrl: video.videoUrl,
          thumbnail: video.thumbnail,
          poster: video.thumbnail,
          title: video.title,
          duration: video.duration,
          sourcePageUrl: video.sourcePageUrl,
        } as never);
      } catch {
        /* offline — local-only */
      }
    })();
  };

  /**
   * Generalized save: lets pics, gifs and xvideos drop into the vault without
   * the caller having to construct a full VideoItem.
   */
  const saveMediaToVault = useCallback(
    (m: {
      kind: "xvideo" | "pic" | "gif";
      url: string;
      thumbnail: string;
      title: string;
      author?: string;
      sourcePageUrl?: string;
    }) => {
      const dedupeKey = m.sourcePageUrl || m.url;
      if (vault.some((v) => (v.sourcePageUrl || v.url) === dedupeKey)) {
        toast("Already saved to vault");
        return;
      }
      const item: VideoItem = {
        id: `${m.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: m.url,
        videoUrl: m.kind === "gif" || m.kind === "xvideo" ? m.url : "",
        thumbnail: m.thumbnail,
        title: m.title,
        author:
          m.author ||
          (m.kind === "pic"
            ? "Hentai pic"
            : m.kind === "gif"
              ? "Hentai clip"
              : "XVideos"),
        authorHandle:
          m.kind === "xvideo"
            ? "@xvideos"
            : m.kind === "gif"
              ? "@hentai-gifs"
              : "@hentai-pics",
        authorAvatar: m.thumbnail,
        quality: m.kind === "pic" ? "IMG" : m.kind === "gif" ? "GIF" : "HD",
        downloadedAt: new Date().toISOString(),
        isAdult: true,
        kind: m.kind,
        mediaType: m.kind === "pic" ? "image" : "video",
        sourcePageUrl: m.sourcePageUrl,
      };
      setVault((prev) => [item, ...prev]);
      trackStat("vaultSaves");
      toast.success(
        `Saved ${m.kind === "pic" ? "pic" : m.kind === "gif" ? "gif" : "xvideo"} to vault!`,
      );
      // Best-effort sync to the server so it survives a refresh / new device.
      (async () => {
        try {
          const id = localStorage.getItem("goonit-account-id");
          if (!id) return;
          const { putVaultItem } = await import("./api");
          await putVaultItem(id, {
            id: item.id,
            itemId: item.id,
            kind: item.kind || m.kind,
            url: item.url,
            videoUrl: item.videoUrl,
            thumbnail: item.thumbnail,
            poster: item.thumbnail,
            title: item.title,
            duration: item.duration,
            sourcePageUrl: item.sourcePageUrl,
          } as never);
        } catch {
          /* offline — local-only */
        }
      })();
    },
    [vault],
  );

  const removeFromVault = (id: string) => {
    setVault((prev) => prev.filter((v) => v.id !== id));
    toast.success("Removed from vault");
    (async () => {
      try {
        const acc = localStorage.getItem("goonit-account-id");
        if (!acc) return;
        const { deleteVaultItem } = await import("./api");
        await deleteVaultItem(acc, id);
      } catch {
        /* offline — local-only */
      }
    })();
  };

  // Set the site background — accepts either a static image url or a video url.
  // Setting a background also clears the "user opted out of default bg" flag,
  // so the next time they hit Clear we know it was an intentional reset.
  const applySiteBackground = useCallback((bg: SiteBackground) => {
    try {
      localStorage.removeItem("xgrab-bg-cleared");
    } catch {}
    setSiteBackground(bg);
    toast.success(
      bg.kind === "video"
        ? "Background set — looping video 🔥"
        : "Background set 💕",
    );
  }, []);

  // ── Background cropper ──────────────────────────────────────────
  // When the user picks an *image* background (from gallery, vault, upload,
  // etc), we open this modal so they can pan/zoom to frame it instead of
  // having the raw image stretch awkwardly across the page. Videos still
  // apply directly because cropping a video stream would mean re-encoding.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropAndApplyImageBackground = useCallback((url: string) => {
    if (!url) return;
    setCropSrc(url);
  }, []);
  const clearSiteBackground = useCallback(() => {
    // Reset to the bundled default background instead of going blank.
    try {
      localStorage.removeItem("xgrab-bg-cleared");
    } catch {}
    setSiteBackground({ kind: "image", url: "/gallery/bckg.png" });
    toast("Background reset to default");
  }, []);

  const toXUrl = (nitterLink: string) =>
    nitterLink
      .replace(/nitter\.[a-z.]+/g, "x.com")
      .replace("lightbrd.com", "x.com");

  const handleProfileVideoClick = (item: ProfileItem) => {
    const xUrl = toXUrl(item.link);
    setUrl(xUrl);
    setActiveTab("download");
    window.scrollTo({ top: 0, behavior: "smooth" });
    handleFetch(xUrl);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "translate(0, 0)";
    },
    [],
  );

  const isInVault = currentVideo
    ? vault.some((v) => v.url === currentVideo.url)
    : false;

  return (
    <FullscreenPlayerProvider>
      <div
        className={`min-h-screen text-white overflow-x-hidden relative ${siteBackground ? "bg-transparent" : "bg-black"}`}
      >
        {/* Site background layer — image or muted/looping video, with a dark overlay
          for legibility. Lives behind everything else (negative z-index). */}
        {siteBackground && (
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {siteBackground.kind === "video" ? (
              <video
                ref={bgVideoRef}
                key={siteBackground.url}
                src={siteBackground.url}
                poster={siteBackground.poster}
                autoPlay
                loop
                muted={!bgSound}
                playsInline
                preload="auto"
                // High-quality scaling: GPU compositing + crisp upscale.
                // `image-rendering: high-quality` is honored on most browsers
                // for video. translateZ promotes to its own layer so the
                // browser uses better filters than the default fast path.
                // NOTE: no `scale()` — even a 1.02 zoom forces sub-pixel
                // sampling on every frame and visibly softens the bg video.
                style={{
                  imageRendering:
                    "high-quality" as React.CSSProperties["imageRendering"],
                  transform: "translateZ(0)",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => {
                  /* fall back silently — overlay still renders */
                }}
              />
            ) : (
              <img
                key={siteBackground.url}
                src={siteBackground.url}
                alt=""
                decoding="async"
                loading="eager"
                // Hint the browser to use its highest-quality scaling filter
                // so upscaled thumbnails don't look soft as a full-screen bg.
                style={{
                  imageRendering:
                    "high-quality" as React.CSSProperties["imageRendering"],
                  transform: "translateZ(0) scale(1.02)",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Lighter overlay so the background actually reads as the
              user's chosen image/video. Text legibility comes from
              individual section backgrounds rather than a heavy mask. */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/60" />
          </div>
        )}

        {/* Floating sound toggle — only shows when a video bg is active.
          Pinned to the bottom-LEFT (mirrors the bottom-RIGHT hentai
          notification stack so the two never overlap). On mobile we
          push above the bottom nav (h-16) using bottom-20. */}
        {siteBackground?.kind === "video" && (
          <button
            onClick={() => setBgSound((v) => !v)}
            title={
              bgSound ? "Mute background video" : "Unmute background video"
            }
            aria-label={
              bgSound ? "Mute background video" : "Unmute background video"
            }
            className="fixed bottom-20 md:bottom-6 left-4 z-40 h-11 w-11 grid place-items-center rounded-full bg-black/70 hover:bg-black/90 border border-pink-400/40 text-pink-200 hover:text-white shadow-lg shadow-pink-900/40 backdrop-blur transition-colors"
          >
            {bgSound ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        )}
        <Toaster position="top-center" richColors />
        {/* ── Splash screen — shown once per session ── */}
        {!splashDone && (
          <SplashScreen onDone={() => {
            try { sessionStorage.setItem('cng-splash-v1', '1') } catch {}
            setSplashDone(true)
          }} />
        )}
        {splashDone && <PasswordGate onVerified={() => setPasswordVerified(true)} />}
        {passwordVerified && (
          <AgeGate onVerified={() => {
            setAgeVerified(true)
          }} />
        )}
        {/* ── Post-auth intro — cinematic welcome, shown once per session ── */}
        {ageVerified && !ageRevealDone && (
          <PostAuthIntro onDone={() => setAgeRevealDone(true)} />
        )}
        {/* ── Onboarding flow — get started wizard, shown once ever ── */}
        {ageRevealDone && !onboardingDone && (
          <OnboardingFlow
            authUsername={authUsername}
            boyName={boyName}
            onSignIn={() => setLoginOpen(true)}
            onSetBoyName={(name) => {
              setBoyName(name);
              try { localStorage.setItem('goon-boy-name', name) } catch {}
            }}
            onDone={() => setOnboardingDone(true)}
          />
        )}

        {/* ── LUNAR AI — global floating button + overlay ── */}
        {ageVerified && (
          <>
            {/* LUNAR ambient whisper bubbles */}
            <LunarWhisper active={!lunarOpen} onOpen={() => setLunarOpen(true)} />

            {/* Global Lunar button — bottom right, above mobile nav */}
            <button
              onClick={() => setLunarOpen(o => !o)}
              className="fixed bottom-[76px] right-4 z-[49] w-12 h-12 rounded-full overflow-hidden select-none"
              style={{
                border: lunarOpen ? '2px solid rgba(255,255,255,0.4)' : '2px solid rgba(255,255,255,0.12)',
                boxShadow: lunarOpen
                  ? '0 0 0 3px rgba(255,255,255,0.08), 0 0 30px rgba(255,255,255,0.12)'
                  : '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                animation: lunarOpen ? 'none' : 'lunarBtnPulse 3s ease-in-out infinite',
                transform: lunarOpen ? 'scale(0.92)' : 'scale(1)',
              }}
              aria-label="Open LUNAR AI"
            >
              <img
                src="/lunar-avatar.png"
                alt="LUNAR"
                className="w-full h-full object-cover"
                style={{ filter: lunarOpen ? 'brightness(0.7)' : 'brightness(1)' }}
              />
            </button>

            {/* Feet lightbox (triggered by LUNAR) */}
            {lunarFeetLightbox && (
              <div
                className="fixed inset-0 z-[700] flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)' }}
                onClick={() => setLunarFeetLightbox(null)}
              >
                <div style={{ animation: 'lunarFadeUp 0.4s ease both' }} className="relative">
                  <img
                    src={lunarFeetLightbox}
                    alt="Feet"
                    className="rounded-2xl object-contain"
                    style={{ maxWidth: '90vw', maxHeight: '85vh', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <p className="absolute -bottom-9 left-0 right-0 text-center text-[10px] tracking-[0.4em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>Tap to close · LUNAR selection</p>
                </div>
              </div>
            )}

            {/* Lunar AI overlay */}
            <LunarAI
              isOpen={lunarOpen}
              onClose={() => setLunarOpen(false)}
              feetPics={feetPics}
              activeTab={activeTab}
              goToTab={(tab) => {
                setLunarOpen(false)
                goToTab(tab as typeof activeTab)
              }}
              onCommand={(cmd) => {
                if (cmd === 'PLAY_CREAMYSPOT') {
                  window.dispatchEvent(new CustomEvent('lunar:play-creamyspot'))
                }
                if (cmd === 'SHOW_FEET_PIC') {
                  const pics = feetPics.length > 0 ? feetPics : []
                  if (pics.length > 0) {
                    const pick = pics[Math.floor(Math.random() * pics.length)]
                    setLunarFeetLightbox(pick)
                    goToTab('feet')
                  } else {
                    // navigate anyway, let the feet tab load
                    goToTab('feet')
                  }
                }
              }}
            />
          </>
        )}
        <CreamyShufflePopup
          open={creamyShuffleOpen}
          onClose={() => setCreamyShuffleOpen(false)}
        />
        <SpicyGame open={spicyOpen} onClose={() => setSpicyOpen(false)} />
        {/* ── iOS Install Modal ── */}
        {iosInstallOpen && (
          <IOSInstallModal onClose={() => setIosInstallOpen(false)} />
        )}
        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onAuthed={async (u, newAccountId) => {
            // Optimistically flip the header to the logged-in state.
            setAuthUsername(u);
            // ── Hydration / migration ────────────────────────────────
            // The session cookie / account_id is already swapped in
            // localStorage by setAccountSession() inside LoginModal.
            // Two possible cases:
            //   (a) Existing account → server has profile + vault →
            //       pull it down and OVERWRITE local so the user
            //       actually sees their stuff.
            //   (b) Fresh signup → server is empty → push the
            //       current local profile + vault UP so nothing the
            //       user saved before signing up is lost.
            try {
              const { fetchAccount, patchAccount, putVaultItem } = await import(
                "./api"
              );
              const data = await fetchAccount(newAccountId);
              if (!data) return;
              const serverVault = Array.isArray(data.vault) ? data.vault : [];
              const p = (data.profile || {}) as {
                boyName?: string | null;
                edgeCount?: number | null;
                avatarUrl?: string | null;
                background?: SiteBackground | null;
                achievements?: string[] | null;
                streakCount?: number | null;
                streakLastVisit?: string | null;
                joinedAt?: string | null;
                bgSound?: boolean | null;
                bgCleared?: boolean | null;
                dailyWaifu?: {
                  date: string;
                  url: string;
                  cat?: string | null;
                } | null;
              };
              const serverHasData =
                serverVault.length > 0 ||
                (typeof p.boyName === "string" && p.boyName !== "Sam") ||
                !!p.avatarUrl ||
                !!p.background ||
                (Array.isArray(p.achievements) && p.achievements.length > 0) ||
                (typeof p.streakCount === "number" && p.streakCount > 0);

              if (serverHasData) {
                // ── (a) Existing account — server wins, hydrate all.
                const remote = serverVault.map((v) => ({
                  id: (v as { itemId?: string; id: string }).itemId || v.id,
                  kind: v.kind,
                  url: v.url,
                  videoUrl: v.videoUrl,
                  thumbnail:
                    v.thumbnail ||
                    (v as unknown as { poster?: string }).poster ||
                    "",
                  title: v.title || "",
                  author: v.author,
                  authorHandle: v.authorHandle,
                  authorAvatar: v.authorAvatar,
                  quality: v.quality,
                  downloadedAt: v.downloadedAt,
                  isAdult: v.isAdult,
                  likes: v.likes,
                  retweets: v.retweets,
                  tweetDate: v.tweetDate,
                  mediaType: v.mediaType,
                  sourcePageUrl: v.sourcePageUrl,
                })) as unknown as VideoItem[];
                setVault(remote);
                localStorage.setItem("xgrab-vault", JSON.stringify(remote));
                if (typeof p.boyName === "string" && p.boyName) {
                  setBoyName(p.boyName);
                  localStorage.setItem("goon-boy-name", p.boyName);
                }
                if (typeof p.edgeCount === "number") {
                  localStorage.setItem("goon-edge-count", String(p.edgeCount));
                }
                if (p.avatarUrl) {
                  setAvatarUrl(p.avatarUrl);
                  localStorage.setItem("goon-avatar-url", p.avatarUrl);
                }
                if (p.background && p.background.url) {
                  setSiteBackground(p.background);
                }
                if (Array.isArray(p.achievements) && p.achievements.length) {
                  localStorage.setItem(
                    "goon-achievements",
                    JSON.stringify(p.achievements),
                  );
                }
                if (typeof p.streakCount === "number" && p.streakCount > 0) {
                  localStorage.setItem("sam-streak", String(p.streakCount));
                }
                if (p.streakLastVisit) {
                  localStorage.setItem("sam-last-visit", p.streakLastVisit);
                }
                if (p.joinedAt) {
                  localStorage.setItem("sam-joined", p.joinedAt);
                }
                if (typeof p.bgSound === "boolean") {
                  localStorage.setItem("xgrab-bg-sound", p.bgSound ? "1" : "0");
                  setBgSound(p.bgSound);
                }
                if (p.bgCleared === true) {
                  localStorage.setItem("xgrab-bg-cleared", "1");
                }
                if (p.dailyWaifu && p.dailyWaifu.url && p.dailyWaifu.date) {
                  localStorage.setItem(
                    "goonit_daily_waifu_v1",
                    JSON.stringify(p.dailyWaifu),
                  );
                }
                if (remote.length > 0) {
                  toast.success(
                    `${remote.length} vault item${remote.length === 1 ? "" : "s"} restored 💕`,
                  );
                }
              } else {
                // ── (b) Fresh account — push local data up so we
                //        don't drop the user's pre-account work.
                const edge = parseInt(
                  localStorage.getItem("goon-edge-count") || "0",
                  10,
                );
                // Pull every other piece of local state so the first push to
                // a fresh account preserves everything the user did before
                // signing up.
                let localAch: string[] = [];
                try {
                  const raw = localStorage.getItem("goon-achievements");
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) localAch = parsed;
                  }
                } catch {}
                const localStreak = parseInt(
                  localStorage.getItem("sam-streak") || "0",
                  10,
                );
                const localStreakLast =
                  localStorage.getItem("sam-last-visit") || undefined;
                const localJoined =
                  localStorage.getItem("sam-joined") || undefined;
                const localBgSound =
                  localStorage.getItem("xgrab-bg-sound") === "1";
                const localBgCleared =
                  localStorage.getItem("xgrab-bg-cleared") === "1";
                let localDaily:
                  | { date: string; url: string; cat?: string }
                  | undefined;
                try {
                  const raw = localStorage.getItem("goonit_daily_waifu_v1");
                  if (raw) localDaily = JSON.parse(raw);
                } catch {}
                await patchAccount(newAccountId, {
                  boyName,
                  edgeCount: edge,
                  ...(avatarUrl ? { avatarUrl } : {}),
                  ...(siteBackground ? { background: siteBackground } : {}),
                  ...(localAch.length ? { achievements: localAch } : {}),
                  ...(localStreak > 0 ? { streakCount: localStreak } : {}),
                  ...(localStreakLast
                    ? { streakLastVisit: localStreakLast }
                    : {}),
                  ...(localJoined ? { joinedAt: localJoined } : {}),
                  bgSound: localBgSound,
                  bgCleared: localBgCleared,
                  ...(localDaily ? { dailyWaifu: localDaily } : {}),
                });
                for (const item of vault) {
                  await putVaultItem(newAccountId, {
                    id: item.id,
                    itemId: item.id,
                    kind: item.kind || "xvideo",
                    url: item.url,
                    videoUrl: item.videoUrl,
                    thumbnail: item.thumbnail,
                    poster: item.thumbnail,
                    title: item.title,
                    duration: item.duration,
                    sourcePageUrl: item.sourcePageUrl,
                  } as never);
                }
                if (vault.length > 0) {
                  toast.success(
                    `${vault.length} vault item${vault.length === 1 ? "" : "s"} attached to your account 💋`,
                  );
                }
              }
            } catch (err) {
              console.error("post-auth hydration failed:", err);
            }
          }}
        />
        {ageVerified && <HentaiPopup />}
        {ageVerified && <SakuraPetals />}
        {ageVerified && <CumDribbles />}
        {ageVerified && <HeartParticles />}
        {ageVerified && <KinkyChatBubbles boyName={boyName} />}
        {ageVerified && <BossKey />}
        {ageVerified && <StrokePacer />}
        {ageVerified && (
          <SurpriseMe onImageReady={(url) => setSurpriseImg(url)} />
        )}
        {ageVerified && battleOpen && (
          <WaifuBattle
            onClose={() => setBattleOpen(false)}
            onSaveToVault={(url) =>
              saveMediaToVault({
                kind: "pic",
                url,
                thumbnail: url,
                title: "Waifu Battle Champion 🏆",
              })
            }
          />
        )}
        {ageVerified && kinkVaultOpen && (
          <KinkVault onClose={() => setKinkVaultOpen(false)} />
        )}
        {ageVerified && (
          <DirtyDice open={diceOpen} onClose={() => setDiceOpen(false)} />
        )}
        {ageVerified && targetOpen && (
          <TargetPractice onClose={() => setTargetOpen(false)} />
        )}
        {surpriseImg && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setSurpriseImg(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={surpriseImg}
                alt="Surprise"
                className="w-full h-full object-contain rounded-2xl shadow-2xl max-h-[85vh]"
              />
              <button
                onClick={() => setSurpriseImg(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-pink-300 text-xs font-bold tracking-widest px-4 py-1.5 rounded-full backdrop-blur">
                🎲 SURPRISE — click anywhere to close
              </div>
            </div>
          </div>
        )}
        <BackgroundCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(url) => {
            setCropSrc(null);
            applySiteBackground({ kind: "image", url });
          }}
        />

        <div className="grain-overlay" />
        {!ageVerified && (
          <div className="fixed inset-0 bg-black z-[80]" aria-hidden />
        )}

        {/* Header */}
        <header
          className="fixed top-0 left-0 right-0 z-50 border-b"
          style={{
            background: "rgba(0,0,0,0.90)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {/* Top LED line */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 20%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.35) 80%, transparent 100%)",
            }}
          />
          <div className="max-w-[88rem] mx-auto px-4 sm:px-7">
            <div className="flex items-center justify-between h-14 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Cum 'n' Go"
                  className="w-9 h-9 rounded-full object-cover cursor-pointer select-none"
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.20)",
                    boxShadow: "0 0 14px rgba(255,255,255,0.06)",
                  }}
                  onClick={handleLogoClick}
                  draggable={false}
                />
                <span className="font-display text-xl tracking-wider flex items-baseline text-white">
                  Cum&nbsp;'n'
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>
                    &nbsp;Go
                  </span>
                </span>
                <span
                  className="hidden sm:inline-flex items-center px-2 py-0.5 text-[9px] font-bold rounded-lg tracking-widest"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.45)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  18+
                </span>
                <span
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.40)",
                  }}
                  title="Personalized for you"
                >
                  <Heart
                    className="w-2.5 h-2.5"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                  hi {boyName}
                </span>
                <button
                  onClick={() => {
                    if (corruptCooldown) return;
                    const msgs = [
                      "CORRUPTED", "SHE OWNS YOU", "SUBMIT",
                      "GOOD\u00a0BOY\u00a0\u2665", "SURRENDER", "MINE\u00a0NOW",
                      "OBEY", "NO\u00a0ESCAPE",
                    ];
                    setCorruptMsg(msgs[Math.floor(Math.random() * msgs.length)]);
                    setCorruptActive(true);
                    setCorruptCooldown(true);
                    setTimeout(() => setCorruptActive(false), 2400);
                    setTimeout(() => setCorruptCooldown(false), 20000);
                  }}
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black tracking-[0.25em] uppercase rounded-full whitespace-nowrap transition-all active:scale-95 hover:opacity-80"
                  style={{
                    background: corruptCooldown ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: corruptCooldown ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.45)",
                  }}
                  title="Override"
                >
                  {corruptCooldown ? "✓\u00a0overridden" : "⚡\u00a0override"}
                </button>
              </div>

              {/* ── Header right: always-visible utility strip ── */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {ageVerified && <MoodMode mood={mood} setMood={setMood} />}
                {ageVerified && <GoonCounter />}
                {authUsername ? (
                  <button
                    onClick={() => {
                      goToTab("profile");
                    }}
                    title={`Signed in as ${authUsername}`}
                    className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-white/60 text-[11px] font-bold tracking-wider transition hover:text-white/90"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full grid place-items-center text-white text-[10px] overflow-hidden"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        authUsername[0].toUpperCase()
                      )}
                    </span>
                    <span className="hidden md:inline">@{authUsername}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-full text-white/50 text-[11px] font-bold tracking-wider transition hover:text-white/80"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    Sign in
                  </button>
                )}
                {/* ── PAGES BUTTON — always visible on all screen sizes ── */}
                <button
                  onClick={() => setNavMenuOpen(true)}
                  className="flex items-center gap-2.5 h-9 px-3 sm:px-4 rounded-xl transition-all hover:scale-[1.03] active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex flex-col gap-[4.5px] items-center shrink-0">
                    <div className="w-[15px] h-[1.5px] rounded-full bg-white/80" />
                    <div className="w-[11px] h-[1.5px] rounded-full bg-white/50" />
                    <div className="w-[15px] h-[1.5px] rounded-full bg-white/80" />
                  </div>
                  <span className="hidden xs:inline text-[12px] font-bold tracking-[0.12em] text-white/80">
                    Pages
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="pt-14 pb-20 md:pb-0" key={activeTab} style={{ animation: 'cngTabFade 0.22s ease both' }}>
          {/* ── DOWNLOAD TAB ── */}
          {activeTab === "download" && (
            <section
              style={{ background: "#000", minHeight: "100vh" }}
              className="pb-28 overflow-x-hidden"
            >
              <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
                {/* ── HERO PORTRAIT VIDEO ── */}
                {!currentVideo && (
                  <div className="pt-4 pb-4">
                    {/* Portrait container — matches iPhone 13 Pro Max screen proportions */}
                    <div
                      onMouseMove={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setHeroTilt({
                          x:
                            ((e.clientX - r.left - r.width / 2) / r.width) * 10,
                          y:
                            ((e.clientY - r.top - r.height / 2) / r.height) *
                            -8,
                        });
                      }}
                      onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        perspective: "900px",
                      }}
                    >
                      <div
                        className="relative mx-auto rounded-3xl overflow-hidden"
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          boxShadow: "0 0 60px rgba(255,255,255,0.03)",
                          maxWidth: 340,
                          aspectRatio: "9/16",
                          width: "100%",
                          transform: `rotateX(${heroTilt.y}deg) rotateY(${heroTilt.x}deg) scale(1.01)`,
                          transition: "transform 0.12s ease",
                        }}
                      >
                        <video
                          src="/GoonIt_wrgoonr.mp4"
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-contain block"
                          style={{ background: "#000" }}
                        />
                        {/* Top gradient */}
                        <div
                          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
                          }}
                        />
                        {/* Bottom gradient */}
                        <div
                          className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                          }}
                        />
                        {/* Top badge */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                          <span
                            className="text-[8px] font-black tracking-[0.4em] uppercase px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(0,0,0,0.7)",
                              color: "rgba(255,255,255,0.45)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            🔒 Private
                          </span>
                          <span
                            className="text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.55)",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          >
                            18+
                          </span>
                        </div>
                        {/* Bottom brand overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                          <h1
                            className="font-display text-5xl tracking-[0.15em] leading-none mb-1"
                            style={{
                              color: "#fff",
                              textShadow: "0 0 40px rgba(255,255,255,0.20)",
                            }}
                          >
                            CUM{" "}
                            <span style={{ color: "rgba(255,255,255,0.45)" }}>
                              'N'
                            </span>
                          </h1>
                          <h1
                            className="font-display text-5xl tracking-[0.15em] leading-none mb-2"
                            style={{
                              color: "rgba(255,255,255,0.70)",
                              textShadow: "0 0 30px rgba(255,255,255,0.12)",
                            }}
                          >
                            GO
                          </h1>
                          <p
                            className="text-[9px] tracking-[0.45em] uppercase mb-3"
                            style={{ color: "rgba(255,255,255,0.20)" }}
                          >
                            Private · Exclusive · 18+
                          </p>
                          <p className="text-xs italic text-white/25 leading-snug">
                            {goonerTagline}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* end perspective wrapper */}

                    {/* ── Two action buttons ── */}
                    {(() => {
                      const isIOSPwa =
                        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                        (window.matchMedia?.("(display-mode: standalone)").matches ||
                          (navigator as Navigator & { standalone?: boolean }).standalone === true);
                      const btnStyle = {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.30)",
                      };
                      return (
                        <div className="flex gap-2 justify-center mt-4 flex-wrap">
                          {/* Button 1 — 10 photos */}
                          <button
                            className="h-9 px-4 rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all active:scale-95 hover:opacity-80"
                            style={btnStyle}
                            onClick={() => {
                              const galleryPaths = [
                                '/gallery/IMG_8966.jpeg','/gallery/IMG_8986.jpeg',
                                '/gallery/IMG_8987.jpeg','/gallery/IMG_8988.jpeg',
                                '/gallery/IMG_8989.jpeg','/gallery/IMG_8990.jpeg',
                                '/gallery/IMG_8991.jpeg','/gallery/IMG_8994.jpeg',
                                '/gallery/IMG_8995.jpeg','/gallery/IMG_8996.jpeg',
                              ];
                              toast("📱 Loading 10 photos…", { duration: 10000 });
                              void (async () => {
                                try {
                                  const files = (await Promise.all(
                                    galleryPaths.map(async (p, i) => {
                                      try {
                                        const r = await fetch(p);
                                        if (!r.ok) return null;
                                        const blob = await r.blob();
                                        return new File([blob], `nacre-${String(i + 1).padStart(2, '0')}.jpeg`, { type: 'image/jpeg' });
                                      } catch { return null; }
                                    })
                                  )).filter(Boolean) as File[];
                                  if (files.length === 0) throw new Error('no files');
                                  if (navigator.canShare?.({ files })) {
                                    await navigator.share({ files, title: "Nacre's Gallery" });
                                  } else {
                                    for (const f of files) {
                                      if (navigator.canShare?.({ files: [f] })) {
                                        await navigator.share({ files: [f], title: f.name });
                                      }
                                    }
                                  }
                                } catch (err) {
                                  if ((err as Error).name !== 'AbortError') {
                                    toast("📱 Tap & hold an image → Save to Photos", { duration: 6000 });
                                  }
                                }
                              })();
                            }}
                          >
                            {isIOSPwa ? "📱 10 Photos" : "🖼️ 10 Photos"}
                          </button>

                          {/* Button 2 — 25× video */}
                          <button
                            className="h-9 px-4 rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all active:scale-95 hover:opacity-80"
                            style={btnStyle}
                            onClick={() => {
                              const videoAssetUrl = new URL("/GoonIt_wrgoonr.mp4", window.location.href).href;
                              if (isIOSPwa) {
                                // Fetch blob once, create 25 File references, share all at once
                                toast("📱 Fetching video…", { duration: 12000 });
                                void (async () => {
                                  try {
                                    const dlUrl = `/api/download?url=${encodeURIComponent(videoAssetUrl)}&filename=CumNGo.mp4`;
                                    const resp = await fetch(dlUrl, { credentials: 'same-origin' });
                                    if (!resp.ok) throw new Error('fetch failed');
                                    const blob = await resp.blob();
                                    const files = Array.from({ length: 25 }, (_, i) =>
                                      new File([blob], `CumNGo-${String(i + 1).padStart(2, '0')}.mp4`, { type: 'video/mp4' })
                                    );
                                    if (navigator.canShare?.({ files })) {
                                      await navigator.share({ files, title: "Cum 'n' Go — ×25" });
                                    } else if (navigator.canShare?.({ files: [files[0]] })) {
                                      await navigator.share({ files: [files[0]], title: files[0].name });
                                      toast("📱 Share sheet opened — save to Camera Roll", { duration: 6000 });
                                    }
                                  } catch (err) {
                                    if ((err as Error).name !== 'AbortError') {
                                      toast("📱 Tap Share → Save Video to Camera Roll", { duration: 6000 });
                                    }
                                  }
                                })();
                                return;
                              }
                              // Desktop: 25 sequential downloads
                              toast("💻 TAKING OVER YOUR DEVICE…", { duration: 9000 });
                              for (let i = 0; i < 25; i++) {
                                setTimeout(() => {
                                  void saveToDevice({
                                    streamUrl: videoAssetUrl,
                                    title: `CumNGo-${String(i + 1).padStart(2, "0")}`,
                                    onIOSHint: msg => toast(msg, { duration: 6000 }),
                                  });
                                }, i * 200);
                              }
                            }}
                          >
                            {isIOSPwa ? "📱 Video ×25" : "💻 Let Her Take Over"}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── URL INPUT ── */}
                <div
                  className="mb-4 rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.065)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste X, PornHub, xvideos, xhamster link…"
                      className="flex-1 px-4 rounded-xl text-white placeholder:text-white/18 outline-none text-sm transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        height: 48,
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                    />
                    <button
                      onClick={() => handleFetch()}
                      disabled={isLoading}
                      onClick={() => (isOver18 ? handleFetch() : undefined)}
                      className="px-6 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
                      style={{
                        background: isOver18
                          ? "#ffffff"
                          : "rgba(255,255,255,0.06)",
                        color: isOver18 ? "#000" : "rgba(255,255,255,0.22)",
                        height: 48,
                        boxShadow: isOver18
                          ? "0 4px 20px rgba(255,255,255,0.10)"
                          : "none",
                        cursor: isOver18 ? "pointer" : "not-allowed",
                      }}
                    >
                      {isLoading ? (
                        <Loader2
                          className="w-5 h-5 animate-spin"
                          style={{
                            color: isOver18 ? "#000" : "rgba(255,255,255,0.3)",
                          }}
                        />
                      ) : (
                        <>
                          <Download
                            className="w-4 h-4"
                            style={{
                              color: isOver18
                                ? "#000"
                                : "rgba(255,255,255,0.22)",
                            }}
                          />
                          <span>{isOver18 ? "FETCH" : "CONFIRM AGE"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="age-check"
                      checked={isOver18}
                      onChange={(e) => setIsOver18(e.target.checked)}
                      className="age-checkbox"
                    />
                    <label
                      htmlFor="age-check"
                      className="text-[11px] cursor-pointer select-none transition-colors duration-200"
                      style={{
                        color: isOver18
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(255,255,255,0.20)",
                      }}
                    >
                      {isOver18
                        ? "✓ Confirmed — I am 18+"
                        : "I am 18+ and ready."}
                    </label>
                  </div>
                </div>

                {/* ── QUICK PILLS ── */}
                {!currentVideo && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    <button
                      onClick={() => setCreamyShuffleOpen(true)}
                      className="h-9 px-4 rounded-xl font-semibold text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      💦 Creamy Spot
                    </button>
                    <button
                      onClick={() => setSpicyOpen(true)}
                      className="h-9 px-4 rounded-xl font-semibold text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      <Flame
                        className="w-3 h-3"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      />{" "}
                      Spicy Game
                    </button>
                    <button
                      onClick={() => setIosInstallOpen(true)}
                      className="h-9 px-4 rounded-xl font-semibold text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <Smartphone className="w-3 h-3 text-white/25" /> iPhone
                    </button>
                  </div>
                )}

                {/* ── DIRECT DOWNLOAD ── */}
                {directDownload && !currentVideo && (
                  <div
                    className="mb-6 rounded-2xl p-5"
                    style={{
                      background: "rgba(8,22,10,0.7)",
                      border: "1px solid rgba(34,197,94,0.18)",
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">{directDownload.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[8px] font-black tracking-[0.4em] uppercase mb-0.5"
                          style={{ color: "rgba(134,239,172,0.5)" }}
                        >
                          Site Detected
                        </p>
                        <p className="text-sm font-bold text-white">
                          {directDownload.site}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "rgba(134,239,172,0.35)" }}
                        >
                          {directDownload.url}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        style={{ color: "rgba(134,239,172,0.6)" }}
                      >
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Ready
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/ytdl?url=${encodeURIComponent(directDownload.url)}&filename=${encodeURIComponent(`goonit-${directDownload.site.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.mp4`)}`}
                        download
                        onClick={() =>
                          toast.success(
                            `Downloading from ${directDownload.site}… 🔥`,
                          )
                        }
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                        style={{
                          background: "rgba(34,197,94,0.82)",
                          boxShadow: "0 2px 12px rgba(34,197,94,0.15)",
                        }}
                      >
                        <Download className="w-4 h-4" /> DOWNLOAD
                      </a>
                      <a
                        href={directDownload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm text-white/50 transition-all active:scale-95"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                      <button
                        onClick={() => setDirectDownload(null)}
                        className="h-10 px-4 rounded-xl text-white/20 text-sm hover:text-white/45 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* ── VIDEO RESULT ── */}
                {currentVideo && (
                  <div
                    className="mb-6 rounded-2xl overflow-hidden animate-slide-up"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="relative aspect-video bg-black">
                      <HlsPlayer
                        key={currentVideo.videoUrl}
                        src={currentVideo.videoUrl}
                        poster={currentVideo.thumbnail}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      className="p-4 space-y-3"
                      style={{ background: "rgba(8,0,6,0.96)" }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => setActiveTab("profile")}
                          className="flex-shrink-0"
                        >
                          <img
                            src={currentVideo.authorAvatar}
                            alt={currentVideo.author}
                            className="w-9 h-9 rounded-full object-cover"
                            style={{
                              border: "1px solid rgba(255,255,255,0.09)",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="flex items-center gap-1.5 mb-0.5 hover:opacity-70 transition-opacity"
                          >
                            <span className="font-semibold text-sm text-white/90">
                              {currentVideo.author}
                            </span>
                            <span className="text-white/30 text-xs">
                              {currentVideo.authorHandle}
                            </span>
                          </button>
                          <p className="text-xs text-white/35 line-clamp-2">
                            {currentVideo.title}
                          </p>
                          {(currentVideo.likes !== undefined ||
                            currentVideo.retweets !== undefined) && (
                            <div className="flex gap-3 mt-1 text-[10px] text-white/22">
                              {currentVideo.likes !== undefined && (
                                <span>
                                  ❤️ {currentVideo.likes.toLocaleString()}
                                </span>
                              )}
                              {currentVideo.retweets !== undefined && (
                                <span>
                                  🔁 {currentVideo.retweets.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <a
                          href={currentVideo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-white/18 hover:text-white/55 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(currentVideo)}
                          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                          style={{
                            background: "#ffffff",
                            color: "#000000",
                            boxShadow: "0 2px 14px rgba(255,255,255,0.08)",
                          }}
                        >
                          <Download className="w-4 h-4" /> Download HD
                        </button>
                        <button
                          onClick={() => saveToVault(currentVideo)}
                          disabled={isInVault}
                          className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-white/55 text-sm disabled:opacity-40 transition-all active:scale-95"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <Save className="w-4 h-4" />{" "}
                          {isInVault ? "Saved" : "Vault"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PROFILE VIDEOS ── */}
                {currentVideo &&
                  (loadingProfile || profileVideos.length > 0) && (
                    <div className="mb-8 animate-slide-up">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[8px] uppercase tracking-[0.4em] font-black text-white/25">
                          More from{" "}
                          {profileData
                            ? `@${profileData.username}`
                            : "this profile"}
                        </p>
                        {profileData && (
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/55 transition-colors"
                          >
                            View All <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {loadingProfile ? (
                        <div className="flex items-center justify-center gap-3 py-8 text-white/18">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading…</span>
                        </div>
                      ) : (
                        <div className="profile-grid">
                          {profileVideos.map((item, i) => (
                            <div
                              key={i}
                              className="vault-item glass-card rounded-xl overflow-hidden video-card"
                              style={{ animationDelay: `${i * 0.05}s` }}
                            >
                              <div
                                className="relative aspect-video bg-black cursor-pointer group"
                                onClick={() =>
                                  item.videoUrl
                                    ? setProfilePreview(item)
                                    : handleProfileVideoClick(item)
                                }
                              >
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Film className="w-6 h-6 text-white/10" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                    style={{
                                      background: "rgba(255,255,255,0.85)",
                                    }}
                                  >
                                    <Play className="w-4 h-4 ml-0.5 text-black" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-2.5">
                                <p className="text-xs font-medium line-clamp-2 mb-2 text-white/60">
                                  {item.title || "View post"}
                                </p>
                                <div className="flex gap-1.5">
                                  {item.videoUrl ? (
                                    <button
                                      onClick={() =>
                                        handleProfileDownload(item)
                                      }
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-black text-xs font-semibold rounded-lg transition-colors"
                                      style={{
                                        background: "rgba(255,255,255,0.88)",
                                      }}
                                    >
                                      <Download className="w-3 h-3" /> DL
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleProfileVideoClick(item)
                                      }
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-white/45 text-xs rounded-lg transition-colors"
                                      style={{
                                        background: "rgba(255,255,255,0.05)",
                                      }}
                                    >
                                      <Play className="w-3 h-3" /> Fetch
                                    </button>
                                  )}
                                </div>
                                {item.pubDate && (
                                  <p className="text-[10px] text-white/18 mt-1">
                                    {new Date(
                                      item.pubDate,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {/* ── FEATURE PILLARS (no result) ── */}
                {!currentVideo && (
                  <div className="mb-8 grid grid-cols-3 gap-2.5">
                    {[
                      {
                        icon: User,
                        label: "Profile Scanner",
                        sub: "Any creator's feed",
                      },
                      {
                        icon: Shield,
                        label: "18+ Unlocked",
                        sub: "Adult content on",
                      },
                      {
                        icon: Film,
                        label: "HD Quality",
                        sub: "Original resolution",
                      },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3.5 text-center"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <Icon
                          className="w-4 h-4 mx-auto mb-1.5"
                          style={{ color: "rgba(255,255,255,0.28)" }}
                        />
                        <p
                          className="text-[9px] font-bold leading-tight"
                          style={{ color: "rgba(255,255,255,0.45)" }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-[8px] mt-0.5"
                          style={{ color: "rgba(255,255,255,0.18)" }}
                        >
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── DIVIDER ── */}
                {!currentVideo && (
                  <div className="mb-8 flex items-center gap-4">
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    />
                    <span
                      className="text-[8px] font-black tracking-[0.5em] uppercase"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      Browse
                    </span>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    />
                  </div>
                )}

                {/* ── BROWSE VIDEOS ── */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame
                      className="w-3.5 h-3.5"
                      style={{ color: "rgba(255,255,255,0.22)" }}
                    />
                    <span
                      className="text-[8px] uppercase tracking-[0.45em] font-black"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      Browse Videos
                    </span>
                    <span
                      className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.30)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      18+
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={xvSource}
                      onChange={(e) => {
                        const next = e.target.value as XvSource;
                        setXvSource(next);
                        setXvResults([]);
                        setXvLoading(true);
                        xvSearch(xvQuery || undefined, next).then((r) => {
                          setXvResults(r);
                          setXvLoading(false);
                        });
                      }}
                      className="h-9 px-3 rounded-xl outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {(
                        Object.entries(XV_SOURCE_LABELS) as [XvSource, string][]
                      ).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={xvQuery}
                      onChange={(e) => setXvQuery(e.target.value)}
                      placeholder={`Search ${XV_SOURCE_LABELS[xvSource]}…`}
                      className="flex-1 min-w-[130px] h-9 px-3 rounded-xl text-white placeholder:text-white/18 outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleXvSearch()}
                    />
                    <button
                      onClick={() => handleXvSearch()}
                      disabled={xvLoading}
                      className="h-9 px-4 rounded-xl text-black text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                      style={{ background: "rgba(255,255,255,0.88)" }}
                    >
                      {xvLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5" /> Search
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setXvQuery("");
                        handleXvSearch("");
                      }}
                      disabled={xvLoading}
                      className="h-9 px-3 rounded-xl text-sm disabled:opacity-50 flex items-center gap-1 transition-all active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {xvLoading && xvResults.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-video rounded-xl animate-pulse"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                      ))}
                    </div>
                  ) : xvResults.length === 0 ? (
                    <div
                      className="text-center py-10 rounded-xl border border-dashed"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <Film
                        className="w-7 h-7 mx-auto mb-2"
                        style={{ color: "rgba(255,255,255,0.1)" }}
                      />
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        Nothing matches, {boyName}. Try dirtier — or hit ↺
                        Random.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {xvResults.map((item) => (
                        <XvResultTile
                          key={item.id}
                          item={item}
                          isFetching={
                            xvFetchingId === item.id ||
                            xvFetchingId === item.id + "-dl"
                          }
                          onPlay={handleXvPlay}
                          onDownload={handleXvDownload}
                          onSaveToVault={(it, url) =>
                            saveMediaToVault({
                              kind: "xvideo",
                              url,
                              thumbnail: it.thumbnail,
                              title: it.title,
                              sourcePageUrl: it.videoPageUrl,
                            })
                          }
                          onSetBackground={(_, url) =>
                            applySiteBackground({ kind: "video", url })
                          }
                          variant="home"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── GALLERY STRIP ── */}
                {!currentVideo && galleryImages.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Images
                          className="w-3 h-3"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        />
                        <span
                          className="text-[8px] uppercase tracking-[0.45em] font-black"
                          style={{ color: "rgba(255,255,255,0.22)" }}
                        >
                          Gallery
                        </span>
                        <span
                          className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(124,26,40,0.16)",
                            color: "rgba(180,50,70,0.75)",
                            border: "1px solid rgba(124,26,40,0.25)",
                          }}
                        >
                          18+
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab("gallery")}
                        className="flex items-center gap-1 text-[9px] transition-colors"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.55)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.2)")
                        }
                      >
                        View All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {galleryImages.map((src, i) => (
                        <SpicyCard key={src} src={src} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── DIVIDER ── */}
                {!currentVideo && (
                  <div className="mb-8 flex items-center gap-4">
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    />
                    <span
                      className="text-[8px] font-black tracking-[0.5em] uppercase"
                      style={{ color: "rgba(255,255,255,0.12)" }}
                    >
                      Create
                    </span>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    />
                  </div>
                )}

                {/* ── AI IMAGE STUDIO ── */}
                <div
                  ref={aiGeneratorRef}
                  className="mb-8 rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className="w-3.5 h-3.5"
                      style={{ color: "rgba(180,50,70,0.8)" }}
                    />
                    <span
                      className="text-[8px] uppercase tracking-[0.45em] font-black"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      AI Image Studio
                    </span>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {(["portrait", "square", "landscape"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => setAiAspect(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={
                          aiAspect === a
                            ? {
                                background: "rgba(124,26,40,0.28)",
                                border: "1px solid rgba(124,26,40,0.5)",
                                color: "rgba(230,140,155,0.9)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.28)",
                              }
                        }
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your image… anime girl, photorealistic, 4k"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/14 outline-none resize-none text-sm mb-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleAiGenerate();
                    }}
                  />
                  <button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    className="w-full h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-45 transition-all active:scale-[0.99]"
                    style={{
                      background:
                        "linear-gradient(135deg, #7C1A28 0%, #5A1020 100%)",
                    }}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate Image
                      </>
                    )}
                  </button>
                  {aiGenerating && !aiImage && (
                    <div
                      className="mt-3 flex items-center justify-center py-12 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="text-center">
                        <Loader2
                          className="w-7 h-7 animate-spin mx-auto mb-2"
                          style={{ color: "rgba(180,50,70,0.65)" }}
                        />
                        <p className="text-sm text-white/22">Generating…</p>
                        <p className="text-xs text-white/12 mt-0.5">
                          10–30 seconds
                        </p>
                      </div>
                    </div>
                  )}
                  {aiImage && (
                    <div
                      className="mt-3 rounded-xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <img
                        src={aiImage}
                        alt="AI Generated"
                        className="w-full object-cover"
                      />
                      <div
                        className="p-2.5 flex gap-2"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                      >
                        <a
                          href={aiImage}
                          download={`goonit-ai-${Date.now()}.jpg`}
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-white font-bold text-sm transition-all active:scale-95"
                          style={{ background: "#7C1A28" }}
                        >
                          <Download className="w-3.5 h-3.5" /> Save
                        </a>
                        <button
                          onClick={() => {
                            setAiImage(null);
                            handleAiGenerate();
                          }}
                          disabled={aiGenerating}
                          className="flex items-center justify-center gap-2 px-3 h-9 rounded-lg text-white/45 text-sm disabled:opacity-45"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {!aiImage && !aiGenerating && (
                    <div
                      className="mt-3 flex flex-col items-center py-8 text-white/10 rounded-xl border border-dashed"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <ImageIcon className="w-7 h-7 mb-2 opacity-20" />
                      <p className="text-xs">Your image will appear here</p>
                    </div>
                  )}
                </div>

                {/* ── DIVIDER ── */}
                {!currentVideo && (
                  <div className="mb-8 flex items-center gap-4">
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    />
                    <span
                      className="text-[8px] font-black tracking-[0.5em] uppercase"
                      style={{ color: "rgba(255,255,255,0.12)" }}
                    >
                      Play
                    </span>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    />
                  </div>
                )}

                {/* ── ARCADE + SPICY ── */}
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab("games")}
                    className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.012] active:scale-[0.99]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background:
                          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,26,40,0.12) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative p-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: "rgba(124,26,40,0.2)",
                          border: "1px solid rgba(124,26,40,0.3)",
                        }}
                      >
                        <Gamepad2
                          style={{
                            width: 17,
                            height: 17,
                            color: "rgba(220,130,145,0.75)",
                          }}
                        />
                      </div>
                      <p
                        className="text-[7px] font-black tracking-[0.4em] uppercase mb-1.5"
                        style={{ color: "rgba(155,35,53,0.6)" }}
                      >
                        6 Games
                      </p>
                      <h3
                        className="font-display text-xl tracking-wider mb-1.5"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        ARCADE
                      </h3>
                      <p
                        className="text-xs mb-4 leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Strip Higher-or-Lower, Spicy Wheel, Reveal Roulette +
                        more.
                      </p>
                      <div
                        className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.3em] uppercase group-hover:gap-2.5 transition-all"
                        style={{ color: "rgba(155,35,53,0.6)" }}
                      >
                        Enter <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSpicyOpen(true)}
                    className="group relative overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.012] active:scale-[0.99]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background:
                          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,26,40,0.12) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative p-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: "rgba(124,26,40,0.2)",
                          border: "1px solid rgba(124,26,40,0.3)",
                        }}
                      >
                        <Flame
                          style={{
                            width: 17,
                            height: 17,
                            color: "rgba(220,130,145,0.75)",
                          }}
                        />
                      </div>
                      <p
                        className="text-[7px] font-black tracking-[0.4em] uppercase mb-1.5"
                        style={{ color: "rgba(155,35,53,0.6)" }}
                      >
                        Tonight's Special
                      </p>
                      <h3
                        className="font-display text-xl tracking-wider mb-1.5"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        SPICY GAME
                      </h3>
                      <p
                        className="text-xs mb-4 leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Truth, dare, or an AI scene where you call the shots.
                      </p>
                      <div
                        className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.3em] uppercase group-hover:gap-2.5 transition-all"
                        style={{ color: "rgba(155,35,53,0.6)" }}
                      >
                        Play Now <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* ── MISTRESS ALERTS ── */}
                {!currentVideo && <MistressAlerts />}

                {/* ── FEET GALLERY ── */}
                {!currentVideo && feetPics.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🦶</span>
                        <span
                          className="text-[8px] uppercase tracking-[0.45em] font-black"
                          style={{ color: "rgba(255,255,255,0.22)" }}
                        >
                          Feet Gallery
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab("feet")}
                        className="flex items-center gap-1 text-[9px] transition-colors"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.55)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.2)")
                        }
                      >
                        View All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div
                      className="flex gap-2 overflow-x-auto pb-2"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {feetPics.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="h-32 w-24 object-cover rounded-xl shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          style={{ border: "1px solid rgba(255,121,198,0.15)" }}
                          loading="lazy"
                          onClick={() => setActiveTab("feet")}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── GAMES TAB ── */}
          {activeTab === "games" && (
            <>
              {galleryImages.length > 0 && (
                <div className="flex gap-0 overflow-x-auto scrollbar-none opacity-40 hover:opacity-70 transition-opacity">
                  {galleryImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-28 w-auto flex-shrink-0 object-cover"
                    />
                  ))}
                </div>
              )}
              <AdultGames />
              {galleryImages.length > 0 && (
                <div className="flex gap-0 overflow-x-auto scrollbar-none opacity-30 hover:opacity-60 transition-opacity">
                  {[...galleryImages].reverse().map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-24 w-auto flex-shrink-0 object-cover"
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── VAULT TAB ── */}
          {activeTab === "vault" && (
            <section className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-12">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display text-4xl sm:text-5xl tracking-wider mb-2">
                      YOUR VAULT
                    </h2>
                    <p className="text-xgrab-gray">
                      {vault.length} video{vault.length !== 1 ? "s" : ""} saved
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Upload your own image / video / gif straight into the vault. */}
                    <UploadButton
                      label="Upload"
                      accept="image/*"
                      onUploaded={(r) => {
                        saveMediaToVault({
                          kind: r.kind,
                          url: r.url,
                          thumbnail:
                            r.kind === "xvideo" ? "/gallery/cursor.png" : r.url,
                          title: r.title || "My upload",
                          sourcePageUrl: r.url,
                        });
                      }}
                    />
                    {vault.length > 0 && (
                      <button
                        onClick={() => {
                          setVault([]);
                          toast.success("Vault cleared");
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-xgrab-red hover:bg-xgrab-red/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {vault.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto mb-4 text-xgrab-gray opacity-50" />
                    <h3 className="text-xl font-semibold mb-2 text-pink-200">
                      {pickEmptyVaultTaunt(boyName)}
                    </h3>
                    <p className="text-xgrab-gray mb-6">
                      Filthy little gooners hoard. Go fetch something for
                      Mistress, {boyName}.
                    </p>
                    <button
                      onClick={() => setActiveTab("download")}
                      className="px-6 py-3 bg-xgrab-red hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Start Downloading
                    </button>
                    {/* Hentai teaser strip for empty vault */}
                    {galleryImages.length > 0 && (
                      <div className="mt-10">
                        <p className="text-[10px] tracking-[0.4em] uppercase text-pink-500/80 font-bold mb-3">
                          but while you're here… 👀
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin justify-center">
                          {galleryImages.slice(0, 8).map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt=""
                              className="h-40 w-auto flex-shrink-0 rounded-xl object-cover border border-pink-500/20 hover:border-pink-400/60 hover:scale-105 transition-all cursor-pointer"
                              onClick={() => setActiveTab("gallery")}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2">
                          click any pic to open the gallery
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="profile-grid">
                    {vault.map((video, index) => {
                      const isImage =
                        video.mediaType === "image" || video.kind === "pic";
                      const isMedia =
                        video.kind === "pic" ||
                        video.kind === "gif" ||
                        video.kind === "xvideo";
                      return (
                        <div
                          key={video.id}
                          className="vault-item glass-card rounded-xl overflow-hidden video-card"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className="relative aspect-video bg-black cursor-pointer group"
                            onClick={() => setVaultPreview(video)}
                          >
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity =
                                  "0";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full bg-xgrab-red/90 flex items-center justify-center">
                                {isImage ? (
                                  <ImagePlus className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-xgrab-red text-xs rounded">
                                {video.quality}
                              </span>
                              {video.kind && video.kind !== "xpost" && (
                                <span className="px-2 py-0.5 bg-pink-500/90 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                  {video.kind}
                                </span>
                              )}
                            </div>
                            {video.isAdult && (
                              <div className="absolute top-3 right-3 px-2 py-1 bg-xgrab-red/80 text-xs rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                18+
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={video.authorAvatar}
                                alt={video.author}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {video.authorHandle}
                                </p>
                                <p className="text-xs text-xgrab-gray">
                                  {new Date(
                                    video.downloadedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-xgrab-gray line-clamp-2 mb-3">
                              {video.title}
                            </p>
                            <div className="flex gap-2">
                              {isMedia && (
                                <button
                                  onClick={() => {
                                    if (isImage) {
                                      cropAndApplyImageBackground(
                                        video.thumbnail,
                                      );
                                      return;
                                    }
                                    applySiteBackground({
                                      kind: "video",
                                      url: video.videoUrl,
                                      poster: video.thumbnail,
                                    });
                                  }}
                                  title="Set as site background"
                                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 text-sm rounded-lg transition-colors"
                                >
                                  <ImagePlus className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  isImage
                                    ? (async () => {
                                        const isIOS = /iPad|iPhone|iPod/.test(
                                          navigator.userAgent,
                                        );
                                        if (
                                          isIOS &&
                                          typeof navigator.share === "function"
                                        ) {
                                          try {
                                            const resp = await fetch(
                                              video.thumbnail,
                                            );
                                            const blob = await resp.blob();
                                            const file = new File(
                                              [blob],
                                              `goonit-pic-${video.id}.jpg`,
                                              {
                                                type: blob.type || "image/jpeg",
                                              },
                                            );
                                            if (
                                              (navigator as any).canShare?.({
                                                files: [file],
                                              })
                                            ) {
                                              await navigator.share({
                                                files: [file],
                                                title:
                                                  video.title || "Nacre's Hub",
                                              });
                                              return;
                                            }
                                          } catch {
                                            /* fall through */
                                          }
                                        }
                                        const a = document.createElement("a");
                                        a.href = video.thumbnail;
                                        a.download = `goonit-pic-${video.id}.jpg`;
                                        a.target = "_blank";
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        toast.success("Download started!");
                                      })()
                                    : handleDownload(video)
                                }
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-xgrab-red hover:bg-pink-600 text-white text-sm rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              <button
                                onClick={() => removeFromVault(video.id)}
                                className="p-2 text-xgrab-gray hover:text-xgrab-red hover:bg-xgrab-red/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && <UserProfile initialVault={vault} />}
          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <section className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col max-w-2xl mx-auto w-full px-4">
              {/* Character header */}
              <div className="flex items-center gap-4 py-4 border-b border-white/5 shrink-0">
                <div className="relative">
                  <img
                    src="/chat-avatar.jpg"
                    alt="Luna"
                    className="w-14 h-14 rounded-full object-cover object-top border-2 border-xgrab-red/60"
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div>
                  <h2 className="font-display text-xl tracking-wider">Luna</h2>
                  <p className="text-xs text-green-400">Online now</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs rounded-full font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Live AI
                  </span>
                </div>
              </div>

              {/* Message list */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-thin">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.role === "ai" && (
                      <img
                        src="/chat-avatar.jpg"
                        alt="Luna"
                        className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-xgrab-red text-white rounded-br-sm"
                          : "bg-xgrab-surface text-white rounded-bl-sm border border-white/5"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {chatTyping && (
                  <div className="flex items-end gap-3">
                    <img
                      src="/chat-avatar.jpg"
                      alt="Luna"
                      className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0"
                    />
                    <div className="bg-xgrab-surface border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      <span
                        className="w-2 h-2 bg-xgrab-gray rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-xgrab-gray rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-xgrab-gray rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Input bar */}
              <div className="py-4 shrink-0">
                <div className="flex items-center gap-2 glass-card rounded-2xl p-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !chatTyping && handleChatSend()
                    }
                    placeholder="Say something…"
                    className="flex-1 h-11 px-4 bg-transparent text-white placeholder:text-xgrab-gray outline-none text-sm"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatTyping || !chatInput.trim()}
                    className="w-11 h-11 bg-xgrab-red hover:bg-pink-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-xgrab-gray mt-2 opacity-50">
                  Luna is an AI — responses may take a few seconds
                </p>
              </div>
            </section>
          )}

          {/* ── GALLERY TAB ── */}
          {activeTab === "gallery" && (
            <HentaiGallery
              onSaveToVault={(it) =>
                saveMediaToVault({
                  kind: it.kind,
                  url: it.url,
                  thumbnail: it.thumbnail,
                  title: it.title,
                })
              }
              onSetBackground={(bg) => {
                if (bg.kind === "image") cropAndApplyImageBackground(bg.url);
                else applySiteBackground(bg);
              }}
            />
          )}
          {activeTab === "feet" && (
            <HentaiGallery
              feetOnly
              onSaveToVault={(it) =>
                saveMediaToVault({
                  kind: it.kind,
                  url: it.url,
                  thumbnail: it.thumbnail,
                  title: it.title,
                })
              }
              onSetBackground={(bg) => {
                if (bg.kind === "image") cropAndApplyImageBackground(bg.url);
                else applySiteBackground(bg);
              }}
            />
          )}

          {/* ── GOON CORNER TAB ── */}
          {activeTab === "corner" && (
            <div>
              {galleryImages.length > 0 && (
                <div className="overflow-hidden border-b border-pink-500/20 bg-black/60">
                  <div className="flex gap-0 overflow-x-auto scrollbar-none">
                    {[...galleryImages, ...galleryImages].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-24 sm:h-28 w-auto flex-shrink-0 object-cover opacity-50 hover:opacity-80 transition-opacity duration-300"
                      />
                    ))}
                  </div>
                </div>
              )}
              <GoonCorner
                onSetBackground={(kind, url, poster) =>
                  applySiteBackground({ kind, url, poster })
                }
                onSaveToVault={(it) =>
                  saveMediaToVault({
                    kind: "xvideo",
                    url: it.videoUrl,
                    thumbnail: it.thumbnail,
                    title: it.title,
                    sourcePageUrl: it.sourcePageUrl,
                  })
                }
              />
            </div>
          )}

          {/* ── GOON CHAMBER TAB — multi-pane immersive mode ── */}
          {activeTab === "chamber" && <GoonChamber boyName={boyName} />}

          {/* ── SAM HUB TAB — personal landing page ── */}
          {activeTab === "sam" && (
            <SamHub
              boyName={boyName}
              vaultCount={vault.length}
              onNavigate={(t) => setActiveTab(t as typeof activeTab)}
              onOpenSpicy={() => setSpicyOpen(true)}
            />
          )}

          {/* ── SWEETIE FOX WORSHIP TAB ── */}
          {activeTab === "sweetiefox" && (
            <SweetieFox
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  sourcePageUrl: item.sourcePageUrl,
                })
              }
            />
          )}

          {activeTab === "nacre" && (
            <NacreVictoire
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  sourcePageUrl: item.sourcePageUrl,
                })
              }
            />
          )}

          {activeTab === "nacrefucktoy" && <NacreFucktoy />}
          {activeTab === "nacreowned" && <NacreOwned />}
          {activeTab === "nacreroulette" && <NacreRoulette />}
          {activeTab === "nacrejoi" && <NacreJOI />}
          {activeTab === "nacreedge" && <NacreEdge />}
          {activeTab === "nacretalk" && <NacreTalk />}
          {activeTab === "filth" && <FilthGenerator />}
          {activeTab === "nacreultimate" && (
            <NacreUltimate onExit={() => setActiveTab("download")} />
          )}

          {activeTab === "katianakay" && (
            <KatianaKay
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  sourcePageUrl: item.sourcePageUrl,
                })
              }
            />
          )}

          {activeTab === "skybri" && (
            <SkyBri
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  sourcePageUrl: item.sourcePageUrl,
                })
              }
            />
          )}

          {activeTab === "panties" && <PantiePage boyName={boyName} />}

          {activeTab === "confess" && <ConfessionWall />}

          {activeTab === "hannah" && (
            <HannahOwo
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  sourcePageUrl: item.sourcePageUrl,
                })
              }
            />
          )}

          {activeTab === "lunapearl" && (
            <LunaPearl
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: item.kind as "xvideo" | "pic",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                })
              }
            />
          )}

          {activeTab === "belle" && (
            <BelleDelphine
              onSaveToVault={(item) =>
                saveMediaToVault({
                  kind: item.kind as "xvideo" | "pic",
                  url: item.url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                })
              }
            />
          )}

          {activeTab === "leaks" && <LeaksSearch />}
          {activeTab === "creamyspot" && (
            <CreamySpotPlayer
              onSaveToVault={(item, url) =>
                saveMediaToVault({
                  kind: "xvideo",
                  url,
                  thumbnail: item.thumbnail,
                  title: item.title,
                  author: "Creamy Spot",
                  sourcePageUrl: item.videoPageUrl,
                })
              }
              onSendToDownloader={(pageUrl) => {
                setUrl(pageUrl);
                setActiveTab("download");
              }}
            />
          )}
          {activeTab === "stellareve" && <StellarBladeEve />}
          {activeTab === "mollyflowers" && <MollyFlowers />}
          {activeTab === "waystogoon" && <WaysToGoon />}
          {activeTab === "girlteens" && <GirlTeens />}
          {activeTab === "sloppycocks" && <SloppyCockSession />}
          {activeTab === "xsearch" && <XSearchPage />}
          {activeTab === "credits" && <Credits />}
          {activeTab === "mainframe" && <LunarMainframe onNavigate={(tab) => goToTab(tab as typeof activeTab)} activeTab={activeTab} />}
        </main>

        {/* ── Corrupt overlay ── */}
        {corruptActive && (
          <div
            className="fixed inset-0 z-[400] flex flex-col items-center justify-center pointer-events-none select-none"
            style={{ background: "rgba(0,0,0,0.97)", animation: "corruptFadeOut 2.4s ease forwards" }}
          >
            <p
              className="text-white font-black text-5xl sm:text-8xl tracking-[0.12em] uppercase"
              style={{
                textShadow: "0 0 60px rgba(255,255,255,0.9), 0 0 120px rgba(255,255,255,0.4)",
                animation: "corruptGlitch 0.08s steps(1) infinite",
              }}
            >
              {corruptMsg}
            </p>
            <p className="text-white/15 text-xs tracking-[0.6em] uppercase mt-8 font-bold">
              cum&nbsp;'n'&nbsp;go&nbsp;·&nbsp;private
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/IMG_9789.jpeg"
                  alt="Nacre's Hub"
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: "1px solid rgba(220,38,38,0.3)" }}
                />
                <span className="font-display text-xl tracking-wider">
                  Nacre's<span className="text-red-400"> Hub</span>
                </span>
              </div>
              <p className="text-xgrab-gray text-sm mb-3">
                Not affiliated with X Corp. Use responsibly.
              </p>
              {/* Footer gooner pledge — last thing on the page should
                still remind {boyName} what he's here for. Two lines:
                a fixed pledge plus the rotating tagline. */}
              <p className="text-rose-300/90 italic text-xs sm:text-sm mb-1 max-w-2xl">
                {boyName} is a filthy gooner. This site is his purpose.
              </p>
              <p
                className="text-rose-100 italic font-medium text-xs sm:text-sm mb-6 max-w-2xl drop-shadow-[0_1px_4px_rgba(244,63,94,0.5)]"
                aria-live="polite"
              >
                💦 {goonerTagline}
              </p>
              <div className="flex gap-6 text-sm">
                <a
                  href="#"
                  className="text-xgrab-gray hover:text-white transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-xgrab-gray hover:text-white transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-xgrab-gray hover:text-white transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* ── Full-screen Pages menu — triggered by the ☰ Pages header button ── */}
        {navMenuOpen && (
          <div
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{
              background: "rgba(3,0,5,0.97)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
            }}
          >
                        {/* Header bar */}
            <div
              className="relative flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "rgba(10,10,12,0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div>
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/30">
                  Nacre's Hub
                </p>
                <p className="text-white font-bold text-lg leading-tight">
                  All Pages
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mood toggle */}
                {ageVerified && (
                  <button
                    onClick={() => {
                      const moods: Array<"soft" | "wild" | "dominant"> = [
                        "soft",
                        "wild",
                        "dominant",
                      ];
                      setMood(moods[(moods.indexOf(mood) + 1) % moods.length]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors text-white/70 bg-white/7 border-white/15"
                  >
                    <span>
                      {mood === "soft" ? "🌸" : mood === "wild" ? "🔥" : "👑"}
                    </span>
                    <span>
                      {mood === "soft"
                        ? "Soft"
                        : mood === "wild"
                          ? "Wild"
                          : "Dominant"}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setNavMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable grid — Liquid Glass */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {/* ─ NACRE'S WORLD ─ */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "rgba(15,15,18,0.95)",
                    backdropFilter: "blur(28px) saturate(160%)",
                    WebkitBackdropFilter: "blur(28px) saturate(160%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background:
                        "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-white/30"
                    />
                    <p
                      className="text-[8px] font-black tracking-[0.5em] uppercase"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Nacre's World
                    </p>
                    <div className="ml-auto text-[8px] text-white/15 font-bold tracking-widest">
                      ✦ ✦ ✦
                    </div>
                  </div>
                  <div className="p-2.5 grid grid-cols-4 gap-1.5">
                    {(
                      [
                        {
                          tab: "nacre",
                          emoji: "🌹",
                          label: "Victoire",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacreultimate",
                          emoji: "👑",
                          label: "Ultimate",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacreroulette",
                          emoji: "🎲",
                          label: "Roulette",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacrejoi",
                          emoji: "🎯",
                          label: "JOI",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacrefucktoy",
                          emoji: "🔗",
                          label: "Training",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacreowned",
                          emoji: "🔒",
                          label: "Owned",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacreedge",
                          emoji: "☠️",
                          label: "Edge",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacretalk",
                          emoji: "🗣️",
                          label: "Speaks",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                      ] as const
                    ).map(({ tab, emoji, label, activeC, activeB, tc }) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            setNavMenuOpen(false);
                            goToTab(tab as typeof activeTab);
                          }}
                          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all active:scale-95 hover:scale-[1.02]"
                          style={{
                            background: isActive
                              ? activeC
                              : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? activeB : "rgba(255,255,255,0.06)"}`,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <span className="text-xl leading-none">{emoji}</span>
                          <p
                            className="text-[9px] font-bold leading-none"
                            style={{
                              color: isActive ? tc : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ WORSHIP ─ */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "rgba(15,15,18,0.95)",
                    backdropFilter: "blur(28px)",
                    WebkitBackdropFilter: "blur(28px)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{
                      borderBottom: "1px solid rgba(168,85,247,0.1)",
                      background:
                        "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <p
                      className="text-[8px] font-black tracking-[0.5em] uppercase"
                      style={{ color: "rgba(216,180,254,0.7)" }}
                    >
                      Worship
                    </p>
                  </div>
                  <div className="p-2.5 grid grid-cols-4 gap-1.5">
                    {(
                      [
                        {
                          tab: "sweetiefox",
                          emoji: "🦊",
                          label: "Sweetie Fox",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "katianakay",
                          emoji: "🍑",
                          label: "Katiana",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "hannah",
                          emoji: "💜",
                          label: "Hannah owo",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "skybri",
                          emoji: "☀️",
                          label: "Sky Bri",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "lunapearl",
                          emoji: "🌙",
                          label: "Luna Pearl",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "belle",
                          emoji: "🎀",
                          label: "Belle D",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "panties",
                          emoji: "🩲",
                          label: "Panties",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "feet",
                          emoji: "👠",
                          label: "Feet",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "confess",
                          emoji: "🙈",
                          label: "Confessions",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "filth",
                          emoji: "🔥",
                          label: "Filth Gen",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "creamyspot",
                          emoji: "💦",
                          label: "Creamy Spot",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "stellareve",
                          emoji: "⚔️",
                          label: "Stellar Eve",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "mollyflowers",
                          emoji: "🌸",
                          label: "Molly Flowers",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "sloppycocks",
                          emoji: "🍆",
                          label: "Sloppy Session",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                      ] as const
                    ).map(({ tab, emoji, label, activeC, activeB, tc }) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            setNavMenuOpen(false);
                            goToTab(tab as typeof activeTab);
                          }}
                          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all active:scale-95 hover:scale-[1.02]"
                          style={{
                            background: isActive
                              ? activeC
                              : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? activeB : "rgba(255,255,255,0.06)"}`,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <span className="text-xl leading-none">{emoji}</span>
                          <p
                            className="text-[9px] font-bold leading-none text-center"
                            style={{
                              color: isActive ? tc : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ HUB ─ */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "rgba(15,15,18,0.95)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <p className="text-[8px] font-black tracking-[0.5em] uppercase text-zinc-500">
                      Hub
                    </p>
                  </div>
                  <div className="p-2.5 grid grid-cols-5 gap-1.5">
                    {(
                      [
                        {
                          tab: "download",
                          emoji: "🏠",
                          label: "Home",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "sam",
                          emoji: "🌸",
                          label: "SamHub",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "gallery",
                          emoji: "🖼️",
                          label: "Gallery",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "corner",
                          emoji: "💀",
                          label: "Goon Corner",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "chamber",
                          emoji: "🔥",
                          label: "Chamber",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "games",
                          emoji: "🎮",
                          label: "Games",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "leaks",
                          emoji: "🗂️",
                          label: "Leaks Search",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "vault",
                          emoji: "💾",
                          label: `Vault·${vault.length}`,
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "chat",
                          emoji: "💋",
                          label: "Luna AI",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "profile",
                          emoji: "👤",
                          label: "My Profile",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "nacre",
                          emoji: "🌹",
                          label: "Nacre ↗",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "xsearch",
                          emoji: "𝕏",
                          label: "X Search",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "waystogoon",
                          emoji: "💀",
                          label: "Ways to Goon",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                        {
                          tab: "mainframe",
                          emoji: "🧠",
                          label: "LUNAR Core",
                          activeC: "rgba(168,85,247,0.18)",
                          activeB: "rgba(168,85,247,0.5)",
                          tc: "rgba(200,160,255,0.95)",
                        },
                        {
                          tab: "credits",
                          emoji: "💝",
                          label: "Credits",
                          activeC: "rgba(255,255,255,0.10)",
                          activeB: "rgba(255,255,255,0.28)",
                          tc: "rgba(255,255,255,0.90)",
                        },
                      ] as const
                    ).map(({ tab, emoji, label, activeC, activeB, tc }) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            setNavMenuOpen(false);
                            goToTab(tab as typeof activeTab);
                          }}
                          className="flex flex-col items-center gap-1.5 py-3 px-0.5 rounded-xl transition-all active:scale-95 hover:scale-[1.02]"
                          style={{
                            background: isActive
                              ? activeC
                              : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? activeB : "rgba(255,255,255,0.06)"}`,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <span className="text-lg leading-none">{emoji}</span>
                          <p
                            className="text-[8px] font-bold leading-none text-center px-0.5"
                            style={{
                              color: isActive ? tc : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ QUICK LAUNCH ─ */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <p className="text-[8px] font-black tracking-[0.5em] uppercase text-zinc-600">
                      Quick Launch
                    </p>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2">
                    {[
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setSpicyOpen(true);
                        },
                        emoji: "🌶️",
                        label: "Spicy Game",
                        bg: "rgba(220,38,38,0.18)",
                        border: "rgba(220,38,38,0.3)",
                      },
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setBattleOpen(true);
                        },
                        emoji: "⚔️",
                        label: "Waifu Battle",
                        bg: "rgba(99,102,241,0.18)",
                        border: "rgba(99,102,241,0.3)",
                      },
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setKinkVaultOpen(true);
                        },
                        emoji: "👑",
                        label: "Kink Vault",
                        bg: "rgba(236,72,153,0.18)",
                        border: "rgba(236,72,153,0.3)",
                      },
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setTargetOpen(true);
                        },
                        emoji: "🎯",
                        label: "Target Practice",
                        bg: "rgba(249,115,22,0.18)",
                        border: "rgba(249,115,22,0.3)",
                      },
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setDiceOpen(true);
                        },
                        emoji: "🎲",
                        label: "Dirty Dice",
                        bg: "rgba(234,179,8,0.18)",
                        border: "rgba(234,179,8,0.3)",
                      },
                      {
                        action: () => {
                          setNavMenuOpen(false);
                          setLoginOpen(true);
                        },
                        emoji: "🔐",
                        label: authUsername ? `@${authUsername}` : "Sign In",
                        bg: "rgba(14,165,233,0.18)",
                        border: "rgba(14,165,233,0.3)",
                      },
                    ].map(({ action, emoji, label, bg, border }, i) => (
                      <button
                        key={i}
                        onClick={action}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-white/75 transition-all active:scale-95 hover:text-white hover:scale-[1.03]"
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          backdropFilter: "blur(14px)",
                          WebkitBackdropFilter: "blur(14px)",
                          boxShadow: `0 2px 12px ${bg}`,
                        }}
                      >
                        <span className="text-base">{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-3">
                    Site Background
                  </p>
                  <div className="flex gap-2.5">
                    <UploadButton
                      label="📸  Set Custom BG"
                      accept="image/*"
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold tracking-wide bg-pink-500/15 border border-pink-400/30 text-pink-200 hover:bg-pink-500/25 disabled:opacity-50 transition-colors"
                      onUploaded={(r) => {
                        setNavMenuOpen(false);
                        if (r.kind === "xvideo") {
                          applySiteBackground({ kind: "video", url: r.url });
                        } else {
                          cropAndApplyImageBackground(r.url);
                        }
                      }}
                    />
                    {siteBackground && (
                      <button
                        onClick={() => {
                          setNavMenuOpen(false);
                          clearSiteBackground();
                        }}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold tracking-wide bg-purple-500/15 border border-purple-400/30 text-purple-200 hover:bg-purple-500/25 transition-colors"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Clear BG
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile Navigation (fancy slide-up sheet) ── */}
        {ageVerified && (
          <MobileNav
            activeTab={activeTab}
            goToTab={(tab) => goToTab(tab as typeof activeTab)}
            vaultCount={vault.length}
            ageVerified={ageVerified}
            boyName={boyName}
            mood={mood}
            setMood={setMood}
            onKinkVault={() => setKinkVaultOpen(true)}
            onBattle={() => setBattleOpen(true)}
            onTargetPractice={() => setTargetOpen(true)}
            onDice={() => setDiceOpen(true)}
            onSpicy={() => setSpicyOpen(true)}
          />
        )}

        {/* Mobile Bottom Nav (fallback when not age-verified) — scrollable */}
        {!ageVerified && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 h-16">
            <div className="flex items-stretch h-full overflow-x-auto scrollbar-none snap-x snap-mandatory">
              {(
                [
                  "sam",
                  "download",
                  "gallery",
                  "feet",
                  "corner",
                  "chamber",
                  "games",
                  "vault",
                  "chat",
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => goToTab(tab)}
                  className={`relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium transition-colors ${
                    activeTab === tab ? "text-white" : "text-xgrab-gray"
                  }`}
                  style={{ minWidth: "4.5rem" }}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${activeTab === tab ? "bg-xgrab-red/20" : ""}`}
                  >
                    {tab === "download" && <Download className="w-4 h-4" />}
                    {tab === "gallery" && <Images className="w-4 h-4" />}
                    {tab === "feet" && (
                      <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
                    )}
                    {tab === "corner" && (
                      <Skull className="w-4 h-4 text-pink-400" />
                    )}
                    {tab === "chamber" && (
                      <Flame className="w-4 h-4 text-rose-400" />
                    )}
                    {tab === "games" && <Gamepad2 className="w-4 h-4" />}
                    {tab === "vault" && <Heart className="w-4 h-4" />}
                    {tab === "chat" && <MessageSquare className="w-4 h-4" />}
                    {tab === "sam" && (
                      <Sparkles className="w-4 h-4 text-pink-400" />
                    )}
                  </span>
                  <span className="whitespace-nowrap">
                    {tab === "chat"
                      ? "Luna"
                      : tab === "gallery"
                        ? "Gallery"
                        : tab === "feet"
                          ? "Feet"
                          : tab === "corner"
                            ? "Goon"
                            : tab === "chamber"
                              ? "Chamber"
                              : tab === "games"
                                ? "Games"
                                : tab === "vault"
                                  ? `Vault (${vault.length})`
                                  : tab === "sam"
                                    ? `For ${boyName}`
                                    : tab.charAt(0).toUpperCase() +
                                      tab.slice(1)}
                  </span>
                  {activeTab === tab && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-xgrab-red rounded-full" />
                  )}
                </button>
              ))}
              {/* Kink Vault — modal trigger, not a tab */}
              {ageVerified && (
                <button
                  onClick={() => setKinkVaultOpen(true)}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium text-fuchsia-400"
                  style={{ minWidth: "4.5rem" }}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-fuchsia-500/20">
                    👑
                  </span>
                  <span>Kinks</span>
                </button>
              )}
              {/* Target Practice — modal trigger */}
              {ageVerified && (
                <button
                  onClick={() => setTargetOpen(true)}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium text-pink-400"
                  style={{ minWidth: "4.5rem" }}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-pink-500/20">
                    🎯
                  </span>
                  <span>Target</span>
                </button>
              )}
              {/* Waifu Battle — modal trigger */}
              {ageVerified && (
                <button
                  onClick={() => setBattleOpen(true)}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium text-fuchsia-400"
                  style={{ minWidth: "4.5rem" }}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-fuchsia-500/20">
                    ⚔️
                  </span>
                  <span>Battle</span>
                </button>
              )}
              {/* Dirty Dice — modal trigger */}
              {ageVerified && (
                <button
                  onClick={() => setDiceOpen(true)}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium text-rose-400"
                  style={{ minWidth: "4.5rem" }}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-500/20">
                    🎲
                  </span>
                  <span>Dice</span>
                </button>
              )}
              {/* Mood Mode — cycle pill in bottom nav */}
              {ageVerified && (
                <button
                  onClick={() => {
                    const moods: Array<"soft" | "wild" | "dominant"> = [
                      "soft",
                      "wild",
                      "dominant",
                    ];
                    const idx = moods.indexOf(mood);
                    setMood(moods[(idx + 1) % moods.length]);
                  }}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 text-[10px] font-medium text-pink-300"
                  style={{ minWidth: "4.5rem" }}
                  title="Cycle Mood Mode"
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-pink-500/20 text-base">
                    {mood === "soft" ? "🌸" : mood === "wild" ? "🔥" : "👑"}
                  </span>
                  <span>
                    {mood === "soft"
                      ? "Soft"
                      : mood === "wild"
                        ? "Wild"
                        : "Dominant"}
                  </span>
                </button>
              )}
            </div>
          </nav>
        )}

        {/* Age Warning Dialog */}
        <Dialog open={showAgeWarning} onOpenChange={setShowAgeWarning}>
          <DialogContent className="bg-xgrab-surface border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-6 h-6 text-xgrab-red" />
                Age Verification Required
              </DialogTitle>
              <DialogDescription className="text-xgrab-gray">
                This content may include adult material. You must be 18 or older
                to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-xgrab-red/10 rounded-lg border border-xgrab-red/30">
                <input
                  type="checkbox"
                  id="age-confirm"
                  checked={isOver18}
                  onChange={(e) => setIsOver18(e.target.checked)}
                  className="age-checkbox"
                />
                <label
                  htmlFor="age-confirm"
                  className="text-sm cursor-pointer select-none"
                >
                  I confirm I am 18 years or older
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAgeWarning(false)}
                  disabled={!isOver18}
                  className="flex-1 px-4 py-3 bg-xgrab-red hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Proceed
                </button>
                <button
                  onClick={() => {
                    setShowAgeWarning(false);
                    setCurrentVideo(null);
                  }}
                  className="px-4 py-3 bg-xgrab-darkgray hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Video Preview Dialog */}
        <Dialog
          open={!!profilePreview}
          onOpenChange={(open) => !open && setProfilePreview(null)}
        >
          <DialogContent className="bg-xgrab-surface border-white/10 text-white max-w-2xl p-0 overflow-hidden">
            <button
              onClick={() => setProfilePreview(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {profilePreview && (
              <div>
                <div className="aspect-video bg-black">
                  <HlsPlayer
                    src={profilePreview.videoUrl!}
                    poster={profilePreview.thumbnail || undefined}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    {profilePreview.authorAvatar && (
                      <img
                        src={profilePreview.authorAvatar}
                        alt={profilePreview.authorName || ""}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <p className="font-semibold">
                        {profilePreview.authorName || profileData?.displayName}
                      </p>
                      <p className="text-xgrab-gray text-sm">
                        @{profilePreview.authorHandle || profileData?.username}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-xgrab-gray line-clamp-3">
                    {profilePreview.title}
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => handleProfileDownload(profilePreview)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-xgrab-red hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <a
                      href={profilePreview.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-xgrab-darkgray hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on X
                    </a>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Standalone Xvideos / multi-source player — works from anywhere a result tile is clicked (home or hidden panel) */}
        <Dialog
          open={!!xvPlayVideo}
          onOpenChange={(open) => {
            if (!open) setXvPlayVideo(null);
          }}
        >
          <DialogContent className="bg-[#0d0d0d] border-white/10 text-white max-w-4xl w-full p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Video player</DialogTitle>
              <DialogDescription>
                Stream and download the selected video
              </DialogDescription>
            </DialogHeader>
            {xvPlayVideo && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium line-clamp-1 flex-1 mr-4">
                    {xvPlayVideo.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        saveMediaToVault({
                          kind: "xvideo",
                          url: xvPlayVideo.url,
                          thumbnail: xvPlayVideo.thumbnail,
                          title: xvPlayVideo.title,
                        })
                      }
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/40 border border-pink-400/40 text-pink-200 text-xs font-semibold rounded-lg transition-colors"
                      title="Save to vault"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() =>
                        applySiteBackground({
                          kind: "video",
                          url: xvPlayVideo.url,
                          poster: xvPlayVideo.thumbnail,
                        })
                      }
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 text-xs font-semibold rounded-lg transition-colors"
                      title="Set as site background"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Set as BG
                    </button>
                    <button
                      onClick={async () => {
                        toast.loading("Preparing download…", { id: "xv-dl" });
                        try {
                          const result = await saveToDevice({
                            pageUrl: xvPlayVideo.pageUrl,
                            streamUrl: xvPlayVideo.url,
                            title: xvPlayVideo.title,
                          });
                          toast.dismiss("xv-dl");
                          if (result === "downloaded")
                            toast.success("Download started!");
                        } catch {
                          toast.dismiss("xv-dl");
                          toast.error("Download failed");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-xgrab-red hover:bg-pink-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => setXvPlayVideo(null)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="aspect-video bg-black">
                  <video
                    ref={(el) => {
                      xvVideoRef.current = el;
                      if (xvHlsRef.current) {
                        xvHlsRef.current.destroy();
                        xvHlsRef.current = null;
                      }
                      if (!el || !xvPlayVideo) return;
                      const proxied = getStreamUrl(xvPlayVideo.url);
                      const isHls = /\.m3u8(\?|$)/i.test(xvPlayVideo.url);
                      if (isHls && Hls.isSupported()) {
                        const hls = new Hls();
                        xvHlsRef.current = hls;
                        hls.loadSource(proxied);
                        hls.attachMedia(el);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                          el.play().catch(() => {});
                        });
                      } else {
                        el.src = proxied;
                        el.play().catch(() => {});
                      }
                    }}
                    key={xvPlayVideo.url}
                    poster={xvPlayVideo.thumbnail}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Hidden Xvideos Discover Panel (4-tap logo easter egg — same controls now also live on the home page) */}
        <Dialog
          open={xvPanelOpen}
          onOpenChange={(open) => {
            if (!open) setXvPanelOpen(false);
          }}
        >
          <DialogContent className="bg-[#0d0d0d] border-white/10 text-white max-w-5xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Discover</DialogTitle>
              <DialogDescription>Browse and download videos</DialogDescription>
            </DialogHeader>

            {/* Search bar */}
            <div className="flex gap-2 p-4 border-b border-white/5 shrink-0">
              <select
                value={xvSource}
                onChange={(e) => {
                  const next = e.target.value as XvSource;
                  setXvSource(next);
                  setXvResults([]);
                  setXvLoading(true);
                  xvSearch(xvQuery || undefined, next).then((r) => {
                    setXvResults(r);
                    setXvLoading(false);
                  });
                }}
                className="h-10 px-3 bg-xgrab-surface text-white text-sm rounded-xl outline-none border border-white/10 focus:border-xgrab-red/50"
              >
                {(Object.entries(XV_SOURCE_LABELS) as [XvSource, string][]).map(
                  ([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <input
                type="text"
                value={xvQuery}
                onChange={(e) => setXvQuery(e.target.value)}
                placeholder={`Search ${XV_SOURCE_LABELS[xvSource]}…`}
                className="flex-1 h-10 px-4 bg-xgrab-surface rounded-xl text-white placeholder:text-xgrab-gray outline-none border border-transparent focus:border-xgrab-red/50 transition-all text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleXvSearch()}
              />
              <button
                onClick={() => handleXvSearch()}
                disabled={xvLoading}
                className="h-10 px-4 bg-xgrab-red hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                {xvLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setXvQuery("");
                  handleXvSearch("");
                }}
                disabled={xvLoading}
                className="h-10 px-4 bg-xgrab-darkgray hover:bg-white/10 disabled:opacity-50 text-white text-sm rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Random
              </button>
            </div>

            {/* Results grid */}
            <div className="overflow-y-auto flex-1 p-4">
              {xvLoading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-xgrab-gray">
                  <Loader2 className="w-6 h-6 animate-spin text-xgrab-red" />
                  <span>Loading…</span>
                </div>
              ) : xvResults.length === 0 ? (
                <div className="text-center py-20 text-xgrab-gray">
                  <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Search for videos or click Random to browse</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {xvResults.map((item) => (
                    <XvResultTile
                      key={item.id}
                      item={item}
                      isFetching={
                        xvFetchingId === item.id ||
                        xvFetchingId === item.id + "-dl"
                      }
                      onPlay={handleXvPlay}
                      onDownload={handleXvDownload}
                      onSaveToVault={(it, url) =>
                        saveMediaToVault({
                          kind: "xvideo",
                          url,
                          thumbnail: it.thumbnail,
                          title: it.title,
                          sourcePageUrl: it.videoPageUrl,
                        })
                      }
                      onSetBackground={(_, url) =>
                        applySiteBackground({ kind: "video", url })
                      }
                      variant="dialog"
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Vault Video Preview Dialog */}
        <Dialog
          open={!!vaultPreview}
          onOpenChange={(open) => !open && setVaultPreview(null)}
        >
          <DialogContent className="bg-xgrab-surface border-white/10 text-white max-w-2xl p-0 overflow-hidden">
            <button
              onClick={() => setVaultPreview(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {vaultPreview && (
              <div>
                <div className="aspect-video bg-black">
                  {vaultPreview.mediaType === "image" ||
                  vaultPreview.kind === "pic" ? (
                    <img
                      src={vaultPreview.thumbnail}
                      alt={vaultPreview.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <HlsPlayer
                      src={vaultPreview.videoUrl}
                      poster={vaultPreview.thumbnail}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={vaultPreview.authorAvatar}
                      alt={vaultPreview.author}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div>
                      <p className="font-semibold">{vaultPreview.author}</p>
                      <p className="text-xgrab-gray text-sm">
                        {vaultPreview.authorHandle}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-xgrab-gray line-clamp-3">
                    {vaultPreview.title}
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => handleDownload(vaultPreview)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-xgrab-red hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <a
                      href={vaultPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-xgrab-darkgray hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on X
                    </a>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </FullscreenPlayerProvider>
  );
}

export default App;
