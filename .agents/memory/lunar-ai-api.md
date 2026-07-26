---
name: LunarAI API
description: How LUNAR's chat AI works — model, fallback, and mode toggle
---

Primary endpoint: `POST https://text.pollinations.ai/openai`

Models:
- `evil` — uncensored, NSFW-capable; used in "Unleashed" mode (default)
- `mistral` — semi-filtered fallback; used in "Tame" mode
- `openai` — fallback-of-fallback

Logic: tries primary model first, falls back automatically on error. Mode state (`unleashed`|`tame`) lives in LunarAI component and picks the primary/fallback pair.

**Why:** Previous `openai-large` model was heavily filtered and rejected NSFW content. `evil` model on pollinations bypasses this. Mode toggle gives daddy visible control over LUNAR's behavior.

**How to apply:** Any future AI call in LunarAI should follow this try/fallback pattern. Never hardcode `openai-large` — it is filtered.
