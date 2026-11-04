PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT NOT NULL,
  game_time       TEXT NOT NULL,
  real_started_at INTEGER NOT NULL,
  tick_minutes    INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS states (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  name_ar          TEXT NOT NULL,
  political_system TEXT NOT NULL DEFAULT 'unknown',
  color            TEXT NOT NULL DEFAULT '#c0392b',
  treasury         REAL NOT NULL DEFAULT 0,
  industry         REAL NOT NULL DEFAULT 0,
  agriculture      REAL NOT NULL DEFAULT 0,
  stability        REAL NOT NULL DEFAULT 50,
  legitimacy       REAL NOT NULL DEFAULT 50,
  is_npc           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  name_ar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provinces (
  id            TEXT PRIMARY KEY,
  region_id     INTEGER NOT NULL REFERENCES regions(id),
  owner_id      TEXT REFERENCES states(id),
  controller_id TEXT REFERENCES states(id),
  name          TEXT NOT NULL,
  name_ar       TEXT NOT NULL,
  is_sea        INTEGER NOT NULL DEFAULT 0,
  terrain       TEXT NOT NULL DEFAULT 'plain',
  climate       TEXT NOT NULL DEFAULT 'temperate',
  population    INTEGER NOT NULL DEFAULT 0,
  loyalty       REAL NOT NULL DEFAULT 50,
  unrest        REAL NOT NULL DEFAULT 0,
  area_km2      REAL NOT NULL DEFAULT 0,
  geometry      TEXT,
  neighbors     TEXT NOT NULL DEFAULT '[]',
  resources     TEXT NOT NULL DEFAULT '[]',
  infrastructure TEXT NOT NULL DEFAULT '{}',
  garrison      INTEGER NOT NULL DEFAULT 0,
  contested     INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provinces_region ON provinces(region_id);
CREATE INDEX IF NOT EXISTS idx_provinces_owner  ON provinces(owner_id);

CREATE TABLE IF NOT EXISTS settlements (
  id          TEXT PRIMARY KEY,
  province_id TEXT NOT NULL REFERENCES provinces(id),
  name        TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'city',
  population  INTEGER NOT NULL DEFAULT 0,
  loyalty     REAL NOT NULL DEFAULT 50,
  garrison    INTEGER NOT NULL DEFAULT 0,
  problems    TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_settlements_province ON settlements(province_id);

CREATE TABLE IF NOT EXISTS units (
  id           TEXT PRIMARY KEY,
  state_id     TEXT NOT NULL REFERENCES states(id),
  province_id  TEXT NOT NULL REFERENCES provinces(id),
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'infantry',
  strength     INTEGER NOT NULL DEFAULT 0,
  morale       REAL NOT NULL DEFAULT 50,
  supply       REAL NOT NULL DEFAULT 0.5,
  training     REAL NOT NULL DEFAULT 50,
  experience   REAL NOT NULL DEFAULT 0,
  equipment    TEXT NOT NULL DEFAULT '[]',
  demographics TEXT NOT NULL DEFAULT '{}',
  commander    TEXT
);

CREATE INDEX IF NOT EXISTS idx_units_state ON units(state_id);

CREATE TABLE IF NOT EXISTS players (
  id         TEXT PRIMARY KEY,
  handle     TEXT NOT NULL UNIQUE,
  state_id   TEXT REFERENCES states(id),
  role       TEXT NOT NULL DEFAULT 'leader',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id          TEXT PRIMARY KEY,
  player_id   TEXT,
  state_id    TEXT,
  kind        TEXT NOT NULL,
  action      TEXT NOT NULL,
  payload     TEXT NOT NULL DEFAULT '{}',
  game_time   TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  source      TEXT NOT NULL DEFAULT 'live',
  reviewed_by TEXT,
  reviewed_at INTEGER,
  note        TEXT
);

CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_time   ON decisions(game_time);

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  game_time  TEXT NOT NULL,
  kind       TEXT NOT NULL,
  payload    TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memory (
  id         TEXT PRIMARY KEY,
  state_id   TEXT NOT NULL,
  target_id  TEXT NOT NULL,
  kind       TEXT NOT NULL,
  weight     REAL NOT NULL DEFAULT 0,
  note       TEXT,
  game_time  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaders (
  id        TEXT PRIMARY KEY,
  state_id  TEXT,
  name      TEXT NOT NULL,
  title     TEXT,
  born      TEXT,
  traits    TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS snapshots (
  id          TEXT PRIMARY KEY,
  file        TEXT NOT NULL,
  sha256      TEXT NOT NULL,
  game_time   TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  signature   TEXT NOT NULL
);
