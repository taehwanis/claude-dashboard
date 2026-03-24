# Claude Session Dashboard

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A lightweight mobile dashboard to browse Claude Code session history from your phone — 24/7.

## Overview

```
PC (Claude Code) → session end → sync hook → Vercel Blob → Vercel API → Phone browser
```

When a Claude Code session ends, a Stop hook automatically parses the local `history.jsonl`, produces a compact JSON snapshot, and uploads it to Vercel Blob only if content has changed (SHA-256 diff). You can then open the dashboard on any device to review past sessions.

## Features

- **PIN authentication** — 6-digit PIN, JWT cookie valid for 7 days, per-IP rate limiting
- **Session list** — card grid with project filter, date range filter, search, and sort
- **14-day trend chart** — daily session count bar chart
- **Project activity chart** — horizontal bar chart ranked by session volume
- **Session detail** — preview of up to 8 messages, chain badge (continued from / continued by)
- **Mobile-first UI** — single-column grid, touch-optimized, dark mode (GitHub Dark theme)
- **Auto-sync** — triggered automatically on Claude Code session end; no manual action needed

## Architecture

```
claude-dashboard/
├── public/index.html           # SPA — PIN screen + dashboard
├── api/auth.js                 # PIN verification + JWT issuance
├── api/data.js                 # Blob data retrieval
├── middleware.js               # JWT cookie validation
├── vercel.json                 # SPA routing config
└── package.json

Local (sync side):
├── ~/.claude/lib/parse-history.mjs     # history.jsonl parser
├── ~/.claude/hooks/sync-dashboard.mjs  # sync hook (Stop trigger)
└── ~/.claude/.env.dashboard            # Blob token for local use
```

**Tech stack:** Vercel Serverless Functions, Vercel Blob Storage, `jose` (JWT), vanilla HTML/CSS/JS

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel + local `.env.dashboard` | Vercel Blob access token |
| `DASH_PIN` | Vercel | 6-digit numeric PIN |
| `DASH_SECRET` | Vercel | JWT signing secret |

## Setup

> The project is already deployed. These steps are for reference if you need to set it up from scratch.

1. Create a Vercel project and connect it to this GitHub repository.
2. Create a Vercel Blob Store (Private) and attach it to the project.
3. Set the three environment variables above in the Vercel dashboard.
4. Install the Blob client locally:
   ```bash
   npm i --prefix ~/.claude @vercel/blob
   ```
5. Save the Blob token locally:
   ```
   # ~/.claude/.env.dashboard
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```
6. Register the sync hook in Claude Code `settings.json`:
   ```json
   {
     "hooks": {
       "Stop": [{ "command": "node ~/.claude/hooks/sync-dashboard.mjs" }]
     }
   }
   ```

## Usage Limits

Runs comfortably within Vercel's free tier:

| Operation | Estimated | Free Limit |
|---|---|---|
| Blob PUT (sync on session end) | ~300 / month | 1,000 / month |
| Blob GET (dashboard load) | ~500 / month | 10,000 / month |

## License

MIT
