<div align="center">

# ⚽ Delayed Watch

**Know exactly when the action happened — so you can watch a match on delay without the boredom or the spoilers.**

Pick a team, get the minute-by-minute list of key moments from their most recent match, then map those minutes to the timecode of your own recording.

[Features](#features) · [How it works](#how-it-works) · [Quick start](#quick-start) · [API](#api) · [Deployment](#deployment)

</div>

---

## Why

Watching a game hours late is great until you either fast-forward blindly through 90 minutes of nothing, or someone spoils the score first. Delayed Watch gives you the *minutes* the interesting stuff happened at — goals, big chances, red cards, VAR calls — without telling you the result. Then its **TV time sync** turns a game minute into the exact spot in your recording, so you can skip straight to the action.

## Features

- **Team search** — pick from a curated dropdown or type any club name. Powered by ESPN's public soccer data (no API key needed).
- **Key moments timeline** — the distinct minutes where highlights occurred, in order, spoiler-free (minutes only, no scores).
- **Essential-only toggle** — trim the list down to the decisive moments: goals, shots on target or off the woodwork, red cards, and VAR decisions.
- **Watched tracking** — mark minutes you've already seen so the app always knows the next thing worth watching.
- **TV time sync** — map one game minute to its `hh:mm:ss` position in your recording, and the app computes the timecode of the next unwatched minute.
- **Extra-time aware** — stoppage-time minutes like `90+3` are handled correctly in the sync math.
- **Player mode** — search a specific player and get every commentary minute that mentions them in the last match.
- **Live-match handling** — prefers a live game over a stale completed one, using the league scoreboard as a fallback when the team schedule feed lags.
- **Installable PWA** — single-origin React client with offline-friendly assets.

## How it works

The backend talks to ESPN's public (unofficial) soccer endpoints and runs a small pipeline:

```
team name ──▶ resolve team ──▶ find last started match ──▶ fetch summary
                                                              │
                        commentary lines ◀────────────────────┘
                                │
                classify highlights (goal, shot, card, VAR, ...)
                                │
                    de-duplicate to distinct minutes
                                │
                         spoiler-free timeline
```

Highlights are classified from ESPN's free-text commentary using pattern rules (see [`highlightsExtractor.js`](server/src/services/highlightsExtractor.js)). Two curation levels are supported: **full** (all categories) and **essential** (goals, saves on goal, woodwork, red cards, VAR).

The Express server also serves the built React client, so the API and the UI share a single origin — no CORS setup and no hardcoded hosts.

## Tech stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | React 18, Vite, Material UI (MUI), vite-plugin-pwa           |
| Backend    | Node.js (≥18), Express 4                                     |
| Data       | ESPN public soccer APIs (no key required)                   |
| Deployment | Render (single web service) via `render.yaml`               |

## Project structure

```
football-delayed-watch/
├── client/                 # React + Vite front end
│   └── src/
│       ├── components/      # Header, Controls, Scoreboard, KeyMoments, TvSync, ...
│       ├── hooks/           # useMatchSearch, useServerStatus
│       ├── lib/             # api client, local storage helpers
│       └── constants.js     # team & player dropdown presets
├── server/                 # Express API + static host for the built client
│   └── src/
│       ├── routes/          # /api/matches routes
│       └── services/        # espnClient, matchService, event/highlight extractors
├── render.yaml             # Render deployment blueprint
└── package.json            # workspace scripts (install / build / start)
```

## Quick start

**Prerequisites:** Node.js 18 or newer.

Install both workspaces:

```bash
npm run install:all
```

### Run in development

Start the API (defaults to port `3000`):

```bash
npm --prefix server run dev
```

In a second terminal, start the Vite dev server:

```bash
npm --prefix client run dev
```

The client proxies API calls to the server. Open the URL Vite prints (usually http://localhost:5173).

### Run like production

Build the client and serve everything from the Express server on one origin:

```bash
npm run build      # installs deps + builds client into client/dist
npm start          # serves API + client on http://localhost:3000
```

## API

Base path: `/api`

| Method | Endpoint                                              | Description                                                                 |
| ------ | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET`  | `/api/ping`                                            | Liveness/readiness check.                                                    |
| `GET`  | `/api/matches/last?team=`                              | Full events from the team's most recent match.                               |
| `GET`  | `/api/matches/last/minutes?team=`                      | Distinct minutes where highlights occurred (chronological, de-duplicated).   |
| `GET`  | `/api/matches/last/minutes/essential?team=`            | As above, curated to decisive moments only.                                  |
| `GET`  | `/api/matches/last/player-events?team=&player=`        | Commentary minutes mentioning a specific player.                             |

Example:

```bash
curl "http://localhost:3000/api/matches/last/minutes?team=Arsenal"
```

> The health check lives at `/api/ping` (not `/health`) on purpose — many ad blockers and privacy extensions block common paths like `/health` before the request even leaves the browser.

## Deployment

The app deploys to [Render](https://render.com) as a **single web service** using the included [`render.yaml`](render.yaml) blueprint. Render runs `npm run build` (install both workspaces + build the client) and `npm start` (Express serves the API and `client/dist`). No API keys or environment secrets are required.

The server reads `process.env.PORT`, which Render sets automatically.

## Notes & limitations

- ESPN's endpoints are public but unofficial and can change or rate-limit without notice. The client retries transient blocks (403/429) with backoff.
- Highlight classification is heuristic (pattern-matched from commentary text), so it can occasionally miss or misclassify an event.
- This project is for personal, educational use.

---

<div align="center">
<sub>Made for fans who watch on delay. Know when the action happened — not the score.</sub>
</div>
