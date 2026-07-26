---
name: Splash screen
description: "CUM 'N' GO" intro splash that shows once per session before PasswordGate
---

`src/components/SplashScreen.tsx` — standalone component, no props except `onDone`.

Phases: `in` (0ms) → `hold` (700ms) → `out` (2400ms, fade) → `gone` (3300ms, call onDone).

**App.tsx integration:**
- `splashDone` state initialised from `sessionStorage.getItem('cng-splash-v1') === '1'`.
- On `onDone`: write `sessionStorage.setItem('cng-splash-v1','1')`, set `splashDone(true)`.
- `PasswordGate` is only rendered when `splashDone === true`.
- After age verified: `ageRevealDone` state fades out a `#040404` overlay (CSS `cngFadeOut` animation).

**Why:** User wanted a cinematic site-load experience before the password gate.

**How to apply:** If resetting the splash (e.g. after a major redesign), bump the sessionStorage key (e.g. `cng-splash-v2`) so returning users see it again.
