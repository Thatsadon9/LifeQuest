-- LifeQuest Postgres schema (mirrors Dexie tables in src/lib/db.ts)

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'th')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS stats (
  key TEXT PRIMARY KEY CHECK (key IN ('INT', 'FOCUS', 'STR', 'WIS', 'CHA', 'CRAFT', 'COIN')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
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
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_quests_type ON quests (type);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests (category);
CREATE INDEX IF NOT EXISTS idx_quests_created_at ON quests (created_at);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completion_type TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  stat_gains JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress INTEGER,
  created_at BIGINT NOT NULL,
  UNIQUE (quest_id, date)
);

CREATE INDEX IF NOT EXISTS idx_completions_date ON completions (date);
CREATE INDEX IF NOT EXISTS idx_completions_quest_id ON completions (quest_id);

CREATE TABLE IF NOT EXISTS skill_nodes (
  id TEXT PRIMARY KEY,
  path_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requirement JSONB NOT NULL,
  "order" INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_nodes_path_id ON skill_nodes (path_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_status ON skill_nodes (status);

CREATE TABLE IF NOT EXISTS energy_checkins (
  date TEXT PRIMARY KEY,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  answers JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_week_start ON reviews (week_start);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at);

-- Legacy cleanup (boss fights were removed from the app):
DROP TABLE IF EXISTS bosses;
