-- LifeQuest Postgres schema (per-user game data + auth)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Auth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Game data (scoped by user_id)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profile (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('dark', 'light')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'th')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS stats (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key TEXT NOT NULL CHECK (key IN ('INT', 'FOCUS', 'STR', 'WIS', 'CHA', 'CRAFT', 'COIN')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, key)
);

CREATE TABLE IF NOT EXISTS quests (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  base_xp INTEGER NOT NULL,
  stat_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  minimum_version TEXT NOT NULL DEFAULT '',
  normal_version TEXT NOT NULL DEFAULT '',
  hero_version TEXT NOT NULL DEFAULT '',
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  trigger_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL,
  category TEXT,
  track_mode TEXT,
  target_count INTEGER,
  unit TEXT,
  updated_at BIGINT,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_quests_user_type ON quests (user_id, type);
CREATE INDEX IF NOT EXISTS idx_quests_user_category ON quests (user_id, category);

CREATE TABLE IF NOT EXISTS completions (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completion_type TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  stat_gains JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress INTEGER,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, id),
  UNIQUE (user_id, quest_id, date),
  FOREIGN KEY (user_id, quest_id) REFERENCES quests (user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions (user_id, date);

CREATE TABLE IF NOT EXISTS skill_nodes (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  path_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requirement JSONB NOT NULL,
  "order" INTEGER NOT NULL,
  status TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_skill_nodes_user_path ON skill_nodes (user_id, path_id);

CREATE TABLE IF NOT EXISTS energy_checkins (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS reviews (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  answers JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_week ON reviews (user_id, week_start);

-- Legacy cleanup
DROP TABLE IF EXISTS bosses;
