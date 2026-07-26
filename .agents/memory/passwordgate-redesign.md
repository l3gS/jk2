---
name: PasswordGate is the real first screen
description: Auth flow order and which screen users actually see first
---

App auth flow:
1. `AgeGate` — checks `localStorage['goonit-age-verified-v1']`. Once set (persists), never shown again.
2. `PasswordGate` — checks `sessionStorage['cng-session-auth']`. Required every new session.

**Why this matters:** Users who have previously verified age skip AgeGate entirely and land directly on PasswordGate. PasswordGate is the actual "face" of the app for returning users.

**How to apply:** When redesigning the entry experience, prioritize PasswordGate over AgeGate for returning users. Both have been redesigned with matching sci-fi aesthetic (corner brackets, grid lines, particles, LED strips, green status dot).
