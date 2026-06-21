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

# 3. Frontend only (http://localhost:5173)
npm run dev

# 4. Frontend + sync/Mira API (ports 5173 + 3001)
npm run dev:all

# 5. Type-check + production build
npm run build

# 6. Preview the production build
npm run preview
```

On first run the database is seeded with starter quests, stats, and skill nodes.

### Environment variables

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `DATABASE_URL` | server | Neon Postgres for cloud sync |
| `GEMINI_API_KEY` | server | Mira chat (Google AI Studio) |
| `GEMINI_MODEL` | server | Optional model override |
| `LIFEQUEST_API_SECRET` | server | Bearer token for `/api/sync` and `/api/mira/chat` |
| `VITE_LIFEQUEST_API_SECRET` | client | Same secret sent from the browser |
| `CORS_ORIGINS` | server | Comma-separated allowed origins (production) |
| `SYNC_PORT` | server | API port (default `3001`) |
| `VITE_SYNC_API_URL` | client | API base URL (default `/api`, proxied in dev) |

In **production**, set `LIFEQUEST_API_SECRET` and matching `VITE_LIFEQUEST_API_SECRET`.
In **development**, the API allows unauthenticated requests when the secret is unset.

### Database migration (Neon)

```bash
npm run db:migrate
```

Applies `server/db/schema.sql` (drops legacy tables no longer used by the app).

### Regenerating app icons

```bash
npm run gen-icons
```

---

## Cloud sync & security

- **Local-first.** IndexedDB is the source of truth; the app works offline.
- **Sync.** When the API is reachable, writes debounce to `POST /api/sync`, which
  merges bundles with Postgres using last-write-wins rules per record.
- **Auth.** Sync and Mira chat require `Authorization: Bearer <LIFEQUEST_API_SECRET>`
  when the secret is configured on the server.
- **Rate limits.** Mira chat and sync are limited per IP (in-memory) to reduce abuse.
- **CORS.** Only origins listed in `CORS_ORIGINS` (or localhost defaults) are allowed.

`/api/health` and `/api/mira/status` stay public for connectivity checks.

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

**Architecture:** pages read through hooks, write through `actions.ts`; optional
sync/Mira call the self-hosted API with a shared secret.

---

## License

Released under the MIT License — use it, learn from it, make it yours.
