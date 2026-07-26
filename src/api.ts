export interface VxTwitterMedia {
  url: string;
  type: "video" | "photo" | "gif";
  thumbnail_url: string;
  width?: number;
  height?: number;
}

export interface VxTwitterResponse {
  text: string;
  user_name: string;
  user_screen_name: string;
  user_profile_image_url: string;
  mediaURLs: string[];
  media_extended: VxTwitterMedia[];
  date: string;
  date_epoch: number;
  likes: number;
  retweets: number;
  replies: number;
  views?: string;
  error?: string;
}

export interface ProfileItem {
  title: string;
  link: string;
  thumbnail: string | null;
  pubDate: string;
  videoUrl?: string | null;
  imageUrls?: string[];
  type?: "video" | "photo";
  likes?: number;
  retweets?: number;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
}

export interface ProfileUser {
  username: string;
  name: string;
  bio: string;
  avatar: string;
}

export async function searchProfiles(query: string): Promise<ProfileUser[]> {
  try {
    const resp = await fetch(
      `/api/searchprofiles?q=${encodeURIComponent(query)}`,
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.users || [];
  } catch {
    return [];
  }
}

export interface XAuthStatus {
  connected: boolean;
  username: string | null;
  via: "manual" | "oauth2" | null;
}

export async function fetchXAuthStatus(): Promise<XAuthStatus> {
  try {
    const resp = await fetch("/api/x-auth-status");
    if (!resp.ok) return { connected: false, username: null, via: null };
    return resp.json();
  } catch {
    return { connected: false, username: null, via: null };
  }
}

export async function saveXAuthToken(
  auth_token: string,
  username?: string,
): Promise<boolean> {
  try {
    const resp = await fetch("/api/x-auth-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_token, username }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function clearXAuth(): Promise<void> {
  try {
    await fetch("/api/x-auth-clear", { method: "POST" });
  } catch {}
}

export async function getXOAuthUrl(
  clientId: string,
  clientSecret?: string,
): Promise<{ auth_url: string; redirect_uri: string } | null> {
  try {
    const params = new URLSearchParams({ client_id: clientId });
    if (clientSecret) params.set("client_secret", clientSecret);
    const resp = await fetch(`/api/x-oauth-start?${params}`);
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

export interface UserInfo {
  name: string;
  screen_name: string;
  avatar_url: string;
  description?: string;
  followers?: number;
  following?: number;
  tweets?: number;
  media_count?: number;
}

export interface ProfileResponse {
  items: ProfileItem[];
  userInfo: UserInfo | null;
  error?: string;
}

export async function fetchVideoInfo(url: string): Promise<VxTwitterResponse> {
  const resp = await fetch(`/api/video?url=${encodeURIComponent(url)}`);
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || "Failed to fetch video info");
  }
  return data;
}

export async function fetchProfileData(
  username: string,
): Promise<ProfileResponse> {
  try {
    const resp = await fetch(
      `/api/profile?username=${encodeURIComponent(username)}`,
    );
    if (!resp.ok) return { items: [], userInfo: null };
    const data = await resp.json();
    return {
      items: data.items || [],
      userInfo: data.userInfo || null,
      error: data.error,
    };
  } catch {
    return { items: [], userInfo: null };
  }
}

export function getDownloadUrl(videoUrl: string, filename?: string): string {
  const params = new URLSearchParams({ url: videoUrl });
  if (filename) params.set("filename", filename);
  return `/api/download?${params.toString()}`;
}

export function getStreamUrl(videoUrl: string): string {
  return `/api/stream?url=${encodeURIComponent(videoUrl)}`;
}

export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isIOSStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = nav.standalone === true;
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches;
  return isIOSDevice() && (standalone || Boolean(displayMode));
}

// Save a video to the device.
//
// iOS strategy — use the native share sheet when the site is installed as a Web Clip.
// That gives the user the system UI to save the video to Camera Roll / Files instead of
// the browser's broken download prompt.
//
// Desktop / Android: standard anchor download.
export async function saveToDevice(opts: {
  pageUrl?: string;
  streamUrl?: string;
  title: string;
  onIOSHint?: (msg: string) => void;
  preOpenedTab?: Window | null;
}): Promise<"shared" | "downloaded" | "ios-tab"> {
  const { pageUrl, streamUrl, title, onIOSHint, preOpenedTab } = opts;
  const safeTitle =
    (title || "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 60) || "video";
  const filename = `GoonIt_${safeTitle}.mp4`;

  const relativeUrl = pageUrl
    ? `/api/ytdl?url=${encodeURIComponent(pageUrl)}&filename=${encodeURIComponent(filename)}`
    : `/api/download?url=${encodeURIComponent(streamUrl ?? "")}&filename=${encodeURIComponent(filename)}`;
  const absoluteUrl = new URL(relativeUrl, window.location.href).href;

  try {
    preOpenedTab?.close();
  } catch {}

  if (isIOSDevice()) {
    const shareSupported =
      typeof navigator.share === "function" &&
      typeof window.isSecureContext === "boolean" &&
      window.isSecureContext;

    if (shareSupported) {
      try {
        const response = await fetch(absoluteUrl, {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("download failed");

        const blob = await response.blob();
        const file = new File([blob], filename, {
          type: blob.type || "video/mp4",
        });

        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          onIOSHint?.(
            "Use the share sheet to save the video to Files or Camera Roll.",
          );
          await navigator.share({
            files: [file],
            title: safeTitle,
            text: "Saved from Nacre's Hub",
          });
          return "shared";
        }
      } catch {
        // fall through to the browser fallback below
      }
    }

    if (typeof window.location.assign === "function") {
      onIOSHint?.(
        "Opening the video directly so you can save it from the iPhone player.",
      );
      window.location.assign(absoluteUrl);
      return "ios-tab";
    }
  }

  const a = document.createElement("a");
  a.href = absoluteUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return "downloaded";
}

export interface XvResult {
  id: string;
  eid: string;
  title: string;
  thumbnail: string;
  videoPageUrl: string;
}

export type XvSource =
  | "xvideos"
  | "pornhub"
  | "xnxx"
  | "redtube"
  | "youporn"
  | "xhamster";

export const XV_SOURCE_LABELS: Record<XvSource, string> = {
  xvideos: "Xvideos",
  pornhub: "Pornhub",
  xnxx: "XNXX",
  redtube: "Redtube",
  youporn: "YouPorn",
  xhamster: "XHamster",
};

export interface SceneMessage {
  role: "user" | "ai";
  content: string;
}

export async function sceneChat(opts: {
  scene: string;
  character: string;
  userPersona?: string;
  messages: SceneMessage[];
}): Promise<{ reply: string }> {
  const resp = await fetch("/api/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Scene chat failed");
  return data;
}

export function getSceneImageUrl(prompt: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `/api/aigen?prompt=${encodeURIComponent(prompt)}&aspect=landscape&seed=${s}`;
}

// ─── Account sync (PostgreSQL via /api/account) ──────────────────────────────
export interface DailyWaifuCache {
  date: string;
  url: string;
  cat?: string | null;
}

export interface AccountProfile {
  boyName: string;
  edgeCount: number;
  avatarUrl?: string | null;
  background: { kind: "video" | "image"; url: string; poster?: string } | null;
  achievements?: string[];
  streakCount?: number;
  streakLastVisit?: string | null;
  joinedAt?: string | null;
  bgSound?: boolean;
  bgCleared?: boolean;
  dailyWaifu?: DailyWaifuCache | null;
  bio?: string | null;
  pronouns?: string | null;
  location?: string | null;
  favPornstar?: string | null;
  favPornstar2?: string | null;
  favPornstar3?: string | null;
  favCategories?: string[];
  kinkTags?: string[];
  favCreators?: string[];
  socialLinks?: {
    x?: string;
    of?: string;
    reddit?: string;
    discord?: string;
  } | null;
  accentColor?: string | null;
  bannerStyle?: string | null;
  statusEmoji?: string | null;
  statusText?: string | null;
  displayBadges?: string[];
  motto?: string | null;
  contentPref?: string | null;
}

export interface AccountVaultItem {
  id: string;
  url?: string;
  videoUrl?: string;
  thumbnail?: string;
  title?: string;
  author?: string;
  authorHandle?: string;
  authorAvatar?: string;
  quality?: string;
  downloadedAt?: string;
  isAdult?: boolean;
  likes?: number;
  retweets?: number;
  tweetDate?: string;
  kind?: string;
  mediaType?: string;
  sourcePageUrl?: string;
}

export interface AccountResponse {
  profile: AccountProfile;
  vault: AccountVaultItem[];
}

export function getOrCreateAccountId(): string {
  const KEY = "goonit-account-id";
  let id = localStorage.getItem(KEY);
  if (!id || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    // Generate a 24-char random URL-safe id
    const arr = new Uint8Array(18);
    crypto.getRandomValues(arr);
    id = btoa(String.fromCharCode(...arr))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function fetchAccount(
  accountId: string,
): Promise<AccountResponse | null> {
  try {
    const r = await fetch(`/api/account/${encodeURIComponent(accountId)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function patchAccount(
  accountId: string,
  patch: Partial<{
    boyName: string;
    edgeCount: number;
    background: AccountProfile["background"];
    clearBackground: boolean;
    avatarUrl: string;
    clearAvatar: boolean;
    achievements: string[];
    streakCount: number;
    streakLastVisit: string;
    joinedAt: string;
    bgSound: boolean;
    bgCleared: boolean;
    dailyWaifu: DailyWaifuCache | null;
    bio: string;
    pronouns: string;
    location: string;
    favPornstar: string;
    favPornstar2: string;
    favPornstar3: string;
    favCategories: string[];
    kinkTags: string[];
    favCreators: string[];
    socialLinks: AccountProfile["socialLinks"];
    accentColor: string;
    bannerStyle: string;
    statusEmoji: string;
    statusText: string;
    displayBadges: string[];
    motto: string;
    contentPref: string;
  }>,
): Promise<boolean> {
  try {
    const r = await fetch(`/api/account/${encodeURIComponent(accountId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function putVaultItem(
  accountId: string,
  item: AccountVaultItem,
): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/vault/${encodeURIComponent(item.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        keepalive: true,
      },
    );
    return r.ok;
  } catch {
    return false;
  }
}

export async function deleteVaultItem(
  accountId: string,
  itemId: string,
): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/vault/${encodeURIComponent(itemId)}`,
      { method: "DELETE", keepalive: true },
    );
    return r.ok;
  } catch {
    return false;
  }
}

export async function clearVaultRemote(accountId: string): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/vault`,
      { method: "DELETE", keepalive: true },
    );
    return r.ok;
  } catch {
    return false;
  }
}

// ─── User uploads (custom backgrounds + custom vault items) ─────
export type UploadResult = {
  url: string;
  kind: "pic" | "gif" | "xvideo";
  mime: string;
  size: number;
  title: string;
};

export async function uploadFile(
  file: File,
): Promise<UploadResult | { error: string }> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await r.json();
    if (!r.ok) return { error: data.error || "Upload failed" };
    return data;
  } catch {
    return { error: "Network error" };
  }
}

// ─── Auth (username + passphrase) ────────────────────────────────
const ACCOUNT_KEY = "goonit-account-id";
const USERNAME_KEY = "goonit-username";

export function getStoredUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setAccountSession(accountId: string, username: string) {
  localStorage.setItem(ACCOUNT_KEY, accountId);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearAccountSession() {
  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function getStoredAccountId(): string | null {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

export async function authSignup(
  username: string,
  password: string,
): Promise<{ accountId: string; username: string } | { error: string }> {
  try {
    // Forward the user's anonymous account_id (if any) so the server can
    // attach the new login to their existing local data instead of orphaning it.
    const migrateFromAccountId = getStoredAccountId() || undefined;
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, migrateFromAccountId }),
    });
    const data = await r.json();
    if (!r.ok) return { error: data.error || "Signup failed" };
    return data;
  } catch {
    return { error: "Network error — try again" };
  }
}

export async function authLogin(
  username: string,
  password: string,
): Promise<{ accountId: string; username: string } | { error: string }> {
  try {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) return { error: data.error || "Login failed" };
    return data;
  } catch {
    return { error: "Network error — try again" };
  }
}

// Live username availability lookup used by the signup form.
export async function checkUsername(
  username: string,
): Promise<{ valid: boolean; available: boolean }> {
  try {
    const r = await fetch(
      `/api/auth/check-username?u=${encodeURIComponent(username)}`,
    );
    if (!r.ok) return { valid: false, available: false };
    return await r.json();
  } catch {
    return { valid: false, available: false };
  }
}

// Verify a stored account_id still maps to a real login. When called with a
// fresh-mint anon id it just returns { username: null } — that's fine.
export async function authMe(
  accountId: string,
): Promise<{ username: string | null }> {
  try {
    const r = await fetch(
      `/api/auth/me?accountId=${encodeURIComponent(accountId)}`,
    );
    if (!r.ok) return { username: null };
    return await r.json();
  } catch {
    return { username: null };
  }
}

/**
 * Pull the entire video library of a single xvideos channel
 * (e.g. "creamyspot"). Backed by `/api/xvchannel` which paginates
 * the channel's JSON endpoint and merges the result. Server-side
 * cached for 10 minutes.
 */
export async function xvChannel(name: string): Promise<XvResult[]> {
  try {
    const resp = await fetch(`/api/xvchannel?name=${encodeURIComponent(name)}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data.results) ? (data.results as XvResult[]) : [];
  } catch {
    return [];
  }
}

export interface PhProfile {
  name: string;
  avatar: string | null;
  bio: string;
  subscribers: string;
  videoCount: string;
  country: string;
  profileViews: string;
}

/**
 * Fetch full profile metadata (name, avatar, bio, stats) for a PH model.
 * Scraped from the model's main profile page via ScraperAPI.
 */
export async function phProfile(slug: string): Promise<PhProfile> {
  try {
    const resp = await fetch(`/api/phprofile?slug=${encodeURIComponent(slug)}`);
    if (!resp.ok) throw new Error("Failed");
    return await resp.json();
  } catch {
    return {
      name: "Creamy Spot",
      avatar: null,
      bio: "",
      subscribers: "",
      videoCount: "",
      country: "Spain",
      profileViews: "",
    };
  }
}

/**
 * Fetch videos from a Pornhub model page via ScraperAPI.
 * Returns { results, avatar } — avatar may be null.
 */
export async function phChannel(
  slug: string,
  fullScrape = false,
  page = 0,
): Promise<{ results: XvResult[]; avatar: string | null }> {
  try {
    const url = fullScrape
      ? `/api/phmodel?slug=${encodeURIComponent(slug)}&fullScrape=true`
      : `/api/phmodel?slug=${encodeURIComponent(slug)}&page=${page}`;
    const resp = await fetch(url);
    if (!resp.ok) return { results: [], avatar: null };
    const data = await resp.json();
    return {
      results: Array.isArray(data.results) ? (data.results as XvResult[]) : [],
      avatar: (data.avatar as string | null) ?? null,
    };
  } catch {
    return { results: [], avatar: null };
  }
}

// ─── User feed (reposted videos) ─────────────────────────────────────────────
export interface FeedItem {
  id: string;
  title: string;
  thumbnail: string;
  videoPageUrl: string;
  source: string;
  postedAt: number;
}

// ── Face ID global enrollment ─────────────────────────────────────────────────
export async function getFaceIdEnrolled(accountId: string): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/faceid`,
    );
    if (!r.ok) return false;
    const data = await r.json();
    return !!data.enrolled;
  } catch {
    return false;
  }
}

export async function setFaceIdEnrolled(
  accountId: string,
  enrolled: boolean,
): Promise<void> {
  try {
    await fetch(`/api/account/${encodeURIComponent(accountId)}/faceid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrolled }),
    });
  } catch {}
}

export async function getFeed(accountId: string): Promise<FeedItem[]> {
  try {
    const r = await fetch(`/api/account/${encodeURIComponent(accountId)}/feed`);
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.feed) ? data.feed : [];
  } catch {
    return [];
  }
}

export async function postToFeed(
  accountId: string,
  item: {
    title: string;
    thumbnail: string;
    videoPageUrl: string;
    source: string;
  },
): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      },
    );
    return r.ok;
  } catch {
    return false;
  }
}

export async function removeFromFeed(
  accountId: string,
  itemId: string,
): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/account/${encodeURIComponent(accountId)}/feed/${encodeURIComponent(itemId)}`,
      { method: "DELETE" },
    );
    return r.ok;
  } catch {
    return false;
  }
}

// ─── Pornhub keyword search ───────────────────────────────────────────────────
export async function phKeywordSearch(query: string): Promise<XvResult[]> {
  try {
    const r = await fetch(
      `/api/ph-keyword-search?q=${encodeURIComponent(query)}`,
    );
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

export async function xvSearch(
  query?: string,
  source: XvSource = "xvideos",
): Promise<XvResult[]> {
  try {
    let endpoint: string;
    if (source === "xvideos") endpoint = "/api/xvsearch";
    else endpoint = `/api/sitesearch?source=${source}`;
    const sep = endpoint.includes("?") ? "&" : "?";
    const url = query
      ? `${endpoint}${sep}q=${encodeURIComponent(query)}`
      : endpoint;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Search failed");
    return data.results || [];
  } catch {
    return [];
  }
}
