---
name: LunarAI commands
description: Full command system for LunarAI chat — all tags, page context, media embeds, events
---

## Command tags (LunarAI.tsx handleCommands)

| Tag | Effect |
|-----|--------|
| `[NAVIGATE:tab]` | goToTab(tab), onClose() |
| `[PLAY_VIDEO:query]` | fetch `/api/pornhub/search`, embed iframe in chat |
| `[SHOW_IMAGE:feet\|hentai\|random]` | fetch `/api/gallery-feet` or `/api/gallery/random`, embed image in chat |
| `[SHOW_FEET_PIC]` | uses feetPics[] array or fetches gallery-feet, embeds image in chat |
| `[PAUSE_VIDEO]` | dispatches `lunar:pause-video` CustomEvent |
| `[DOWNLOAD_VIDEO]` | dispatches `lunar:download-video` CustomEvent |
| `[PLAY_CREAMYSPOT]` | onCommand('PLAY_CREAMYSPOT'), goToTab('creamyspot'), dispatches `lunar:play-creamyspot` |
| `[OPEN_FEET_GALLERY]` | goToTab('feet'), onCommand('SHOW_FEET_PIC') |
| `[LUNAR_FULLSCREEN]` | setAvatarFullscreen(true) — show Luna pic fullscreen |
| `[TAKEOVER]` | show TakeoverOverlay → on dismiss: stroke instruction message + fetch JOI video |

## Event listeners (CreamySpotPlayer VideoControls)
- `lunar:pause-video` → `vidRef.current?.pause()`
- `lunar:download-video` → creates `<a>` tag with streamUrl, clicks it
- `lunar:play-creamyspot` → loadSource('pornhub') + scroll to top + setLunarAutoFull(true) → fullscreen after stream loads

## Page context
- `activeTab` prop passed from App.tsx to LunarAI
- `buildSystemPrompt(activeTab)` constructs dynamic system prompt with current page description
- LUNAR's greeting mentions current page
- Quick pills change based on activeTab (creamyspot → pause/download/play PH; feet → next random/JOI; mainframe → play video/show pic)

**Why:** LUNAR needs to know what page daddy is on to give relevant suggestions and execute page-specific actions.

**How to apply:** Any new page added to the app should get an entry in `TAB_CONTEXT` map in LunarAI.tsx. Any new action that LunarAI should control needs a CustomEvent pattern (dispatch in LunarAI, listen in the target component).
