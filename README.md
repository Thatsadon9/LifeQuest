# LifeQuest

### Turn your real life into an RPG.

LifeQuest is a **local-first PWA** that reframes everyday habits as an adventure:
complete quests, earn XP, level up seven character stats, keep momentum alive,
chat with **Mira** (your AI guide), and look back with a thoughtful weekly review.
Gameplay data lives on your device in IndexedDB; optional cloud sync and Mira
chat go through a small API you self-host.

---

## Philosophy

Most habit trackers punish you for slipping. LifeQuest is built on the opposite
idea: **progress beats perfection, and showing up at all is a win.**

- **Three tiers, never zero.** Every quest has a _Minimum_ (50% XP), _Normal_
  (100% XP), and _Hero_ (150% XP) version. On a hard day you can still do the
  two-minute version and keep the chain alive.
- **Momentum, not streaks.** A single missed day _decays_ your momentum instead
  of resetting it to zero, and coming back earns a comeback bonus. When things
  dip, the app quietly surfaces tiny "recovery" wins instead of guilt.
- **Calm, non-shaming copy.** Quiet week? "One small quest is all it takes to
  restart."
- **Your data is yours.** Local-first by design — export or import a full JSON
  backup any time. Optional Neon sync merges devices when you run the API.

---

## Features

- **Today board** — your day at a glance, grouped into _Main_, _Support_, and
  _Recovery_ quests, with one-tap tiered completion, counter habits, sort
  options, and an energy check-in.
- **Mira** — full-page AI chat (Gemini) that can read your progress and help
  create or complete quests via local tool execution.
- **Quests** — create and manage habits (reachable from **Settings** when not
  in the main nav) with difficulty, stat targets, three effort tiers, triggers,
  and optional weekly schedules.
- **XP & levels** — overall level curve with twelve rank titles from **Novice**
  to **Legend**.
- **Seven life stats** — Intellect, Focus, Strength, Wisdom, Charisma, Craft,
  and Coin, each leveling independently.
- **Momentum + recovery mode** — 0–100 score over a rolling 7-day window.
- **Skill tree** — six themed paths whose milestone nodes unlock as you hit
  quest, stat, and total-completion thresholds.
- **Weekly review** — automatic metrics snapshot with Recharts visuals plus
  three reflection prompts. Saving again updates the same week.
- **Focus / Pomodoro mode** — distraction-free 25/5 timer for a single quest.
- **Settings** — profile, theme, language, quest library link, export/import,
  and reset.
- **Installable, offline PWA** — works without a connection; sync and Mira need
  the API when configured.

### Screens

| Route             | Screen      | Notes                                            |
| ----------------- | ----------- | ------------------------------------------------ |
| `/login`          | Login       | Register / sign in (session cookie)              |
| `/`               | Today       | Daily quest board + energy check-in              |
| `/mira`           | Mira        | AI chat with session history                     |
| `/character`      | Character   | Stats and progression                            |
| `/skills`         | Skill Tree  | Six skill paths                                  |
| `/review`         | Review      | Weekly metrics + reflection                      |
| `/settings`       | Settings    | Theme, profile, backup, quest library            |
| `/quests`         | Quests      | Quest CRUD (linked from Settings)                |
| `/focus/:questId` | Focus Mode  | **Standalone** full-screen Pomodoro              |

---

## Tech stack

| Layer    | Choice                                                              |
| -------- | ------------------------------------------------------------------ |
| UI       | React 19, React Router 7, Framer Motion, lucide-react, Recharts    |
| Styling  | Tailwind CSS 4 (`@tailwindcss/vite`, CSS-first `@theme` tokens)    |
| Data     | Dexie 4 + `dexie-react-hooks` over IndexedDB                       |
| API      | Hono + Neon Postgres (sync), Gemini proxy (Mira)                   |
| Build    | Vite 8, TypeScript 6, `vite-plugin-pwa` (Workbox)                  |

---

## Getting started

Requires Node 18+ (developed on Node 22).

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in secrets
cp .env.example .env

# 3. Apply database schema (required for accounts + sync)
npm run db:migrate

# 4. Frontend + API (required for login — ports 5173 + 3001)
npm run dev:all

# Frontend only (no login — app redirects to /login and API calls fail)
# npm run dev

# 5. Type-check + production build
npm run build

# 6. Preview the production build
npm run preview
```

Create an account at `/login`, then use the app. Each account has its own cloud save.

### Deploy to Vercel (frontend + API)

The repo includes `vercel.json`, `api/health.ts`, and `api/catchall.ts` so `/api/*` runs as serverless
functions on the **same domain** as the PWA (session cookies work without CORS hacks).

1. Import the GitHub repo on [Vercel](https://vercel.com) (production URL example: `https://lifequest0.vercel.app`).
2. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Required |
   | -------- | -------- |
   | `DATABASE_URL` | Yes — Neon connection string |
   | `GEMINI_API_KEY` | Yes — for Mira chat |
   | `CORS_ORIGINS` | Optional — add custom domains (e.g. `https://lifequest.example`) |

3. Deploy. Vercel runs `node scripts/copy-server-for-vercel.mjs` before `npm run build`.
4. Run `npm run db:migrate` locally once against your Neon DB (or use Neon SQL editor).
5. Open your Vercel URL → `/login` → register.

**Separate API host** (Railway, Fly, etc.): deploy `npm run dev:server` / `server/index.ts`,
set `VITE_SYNC_API_URL=https://your-api.example/api` at build time, and add your frontend
origin to `CORS_ORIGINS`. Cross-origin cookies need `SameSite=None; Secure` (not the default).

### Environment variables

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `DATABASE_URL` | server | **Required.** Neon Postgres connection string |
| `GEMINI_API_KEY` | server | Mira chat (Google AI Studio) |
| `GEMINI_MODEL` | server | Optional model override |
| `SESSION_DAYS` | server | Session cookie lifetime in days (default `30`) |
| `CORS_ORIGINS` | server | Comma-separated allowed origins (optional on Vercel — auto-includes deployment URL) |
| `SYNC_PORT` | server | API port for local dev (default `3001`) |
| `VITE_SYNC_API_URL` | client | API base URL (default `/api` — same origin on Vercel) |

### Database setup (Neon)

1. Create a project at [Neon](https://console.neon.tech).
2. Copy the **connection string** into `.env` as `DATABASE_URL`.
3. Run migrations:

```bash
npm run db:migrate
```

This applies `server/db/schema.sql` (users, sessions, per-user game tables) and any files in `server/db/migrations/`.

**Upgrading an older database** without `user_id` columns: `migrations/002_user_auth.sql` drops legacy global tables before the new schema is applied. Back up first if you have data to keep.

Verify connectivity:

```bash
npm run db:test
```

### Regenerating app icons

```bash
npm run gen-icons
```

---

## Accounts, sync & security

- **Register / Login** at `/login`. Passwords are hashed with **scrypt** on the server.
- **Session cookie** (`lq_session`, httpOnly, SameSite=Lax) keeps you signed in for 30 days (configurable via `SESSION_DAYS`).
- **Per-account data** — every game table in Postgres is scoped by `user_id`. Sync and Mira only work for the signed-in user.
- **Local isolation** — switching accounts clears IndexedDB on this device, then pulls that account's cloud bundle.
- **Rate limits** — login, register, sync, and Mira are limited per IP.
- **CORS** — set `CORS_ORIGINS` in production; credentials (cookies) require an explicit origin list.

| Endpoint | Auth |
| -------- | ---- |
| `POST /api/auth/register` | Public |
| `POST /api/auth/login` | Public |
| `POST /api/auth/logout` | Cookie |
| `GET /api/auth/me` | Cookie |
| `POST /api/sync` | Cookie (session) |
| `POST /api/mira/chat` | Cookie (session) |
| `GET /api/health` | Public |

---

## Data & privacy

- All gameplay data stays in **IndexedDB** unless you enable sync.
- **Export / Import** — full JSON backup from Settings.
- **Reset** — wipes local data and re-seeds.
- Mira sends conversation turns and a **context snapshot** to your Gemini proxy;
  configure the API only on infrastructure you trust.

> Clearing site data or uninstalling the PWA removes local progress — keep a JSON
> export if you want a backup.

---

## Project structure

```
lifequest/
├─ server/              # Hono sync + Mira API
│  ├─ index.ts
│  ├─ middleware/       # auth, rate limiting
│  ├─ mira/             # Gemini chat + tool declarations
│  └─ db/               # Postgres schema + bundle mapping
├─ src/
│  ├─ lib/
│  │  ├─ db.ts          # Dexie singleton
│  │  ├─ actions.ts     # All writes
│  │  ├─ sync.ts        # Cloud sync client
│  │  ├─ mira/          # Mira client, tools, history
│  │  └─ gamification.ts
│  ├─ hooks/data.ts     # useLiveQuery reads
│  ├─ pages/            # Route screens
│  └─ types/index.ts    # Shared types (client + server)
└─ vite.config.ts       # `/api` → localhost:3001 in dev
```

**Architecture:** pages read through hooks, write through `actions.ts`; sync/Mira use session cookies via the self-hosted API.

---

## License

Released under the MIT License — use it, learn from it, make it yours.
