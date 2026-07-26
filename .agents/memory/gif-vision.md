---
name: GIF vision API limit
description: xAI vision API does not support animated GIFs — handle with fallback
---

xAI Grok vision API returns 400 "Unsupported content-type" for `.gif` files.

**Rule:** In `LunarMainframe.tsx` `analyseNode()`, check `node.src.endsWith('.gif')`:
- GIF → skip `/api/grok-vision`; call `/api/grok` text endpoint instead, passing the node label as context, asking for imaginative description.
- PNG/JPG/WEBP → call `/api/grok-vision` normally.

**Why:** xAI only supports static image formats (PNG, JPEG, WEBP). GIFs are animated and blocked.

**How to apply:** Any future vision features that operate on the orbital GIF nodes must use the same branch. Static art nodes (lunar-mainframe-art*.png) work fine with vision.
