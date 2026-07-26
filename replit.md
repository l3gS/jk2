# Cum 'N' Go — Private Adult Hub

## Project overview

A private adult content hub built with React + TypeScript + Vite (frontend) and Node.js + Express (backend). Features include xVideos download/search, hentai gallery, adult games, LUNAR AI assistant (powered by xAI Grok), real-time voice calls via xAI Realtime API, a personal section system (Nacre, SweetieFox, etc.), and a cinematic onboarding flow.

## Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS v3, shadcn/ui
- **Backend**: Node.js 20, Express 5, WebSocket (ws)
- **AI**: xAI Grok (chat + vision + realtime voice via `grok-4` / `grok-3`)
- **Scraping**: ScraperAPI (for Cloudflare-protected sites)

## Running

```
npm run dev:all   # runs Express (port 3001) + Vite dev server (port 5000) together
```

Vite proxies all `/api` and WebSocket requests (`/voice`, `/voice-luna`) to the Express backend on port 3001.

## Required secrets

| Secret | Purpose |
|--------|---------|
| `XAI_API_KEY` | xAI Grok chat, vision, and realtime voice |
| `SCRAPERAPI_KEY` | Bypass Cloudflare on adult content sites |
| `SESSION_SECRET` | Express session signing |

## Architecture notes

- **Gate flow**: SplashScreen → PasswordGate → AgeGate → PostAuthIntro → app
- **SplashScreen**: sessionStorage `cng-splash-v1` — shows once per browser session
- **PasswordGate**: sessionStorage `cng-session-auth` — password is `NAS`; supports WebAuthn/FaceID on iOS
- **AgeGate**: localStorage `goonit-age-verified-v1` — persists across sessions after first confirmation
- **PostAuthIntro**: cinematic welcome sequence plays after every age-gate pass (15s, skippable by tap)
- **LUNAR AI**: floating assistant panel; xAI Grok with adult system prompt; realtime voice via `/voice-luna` WebSocket proxy to xAI

## Key files

- `server.js` — all backend routes, WebSocket proxies, ScraperAPI integration
- `src/App.tsx` — root component, gate orchestration, tab routing
- `src/components/LunarAI.tsx` — LUNAR chat + voice call overlay
- `src/components/PostAuthIntro.tsx` — post-verification cinematic intro
- `src/components/SplashScreen.tsx` — session splash
- `src/components/PasswordGate.tsx` — password + WebAuthn gate
- `src/api.ts` — frontend API helpers

## User preferences

- Keep the existing aesthetic: dark/black, monospace accents, corner brackets, scanline overlays
- Do not restructure the codebase or migrate to another framework
- Secrets are managed via Replit Secrets, never hardcoded
