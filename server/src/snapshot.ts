import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { all, get, run } from './db.js';
import { FORMAT_VERSION, SNAPSHOT_DIR, GAME_RATIO, TICK_MINUTES } from './config.js';
import { canonicalJson } from './canonical.js';
import { loadOrCreateKeys, sha256, signPayload } from './signature.js';

export interface SnapshotSummary {
  id: string;
  file: string;
  sha256: string;
  signature: string;
  gameTime: string;
  createdAt: number;
}

interface GameRow {
  id: number;
  name: string;
  game_time: string;
  real_started_at: number;
  tick_minutes: number;
}

function gameRow(): GameRow {
  const row = get<GameRow>('SELECT * FROM game WHERE id = 1');
  if (!row) throw new Error('game row missing');
  return row;
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Build the full SAR payload (without meta.signature). */
export function buildSnapshotBody() {
  const game = gameRow();
  const regions = all('SELECT * FROM regions ORDER BY id');
  const provinces = all('SELECT * FROM provinces ORDER BY id').map((p) => {
    const row = p as Record<string, unknown>;
    return {
      ...row,
      neighbors: parseJson(row.neighbors, []),
      resources: parseJson(row.resources, []),
      infrastructure: parseJson(row.infrastructure, {}),
      geometry: parseJson(row.geometry, null),
      is_sea: row.is_sea === 1,
      contested: row.contested === 1,
    };
  });
  const states = all('SELECT * FROM states ORDER BY id').map((s) => {
    const row = s as Record<string, unknown>;
    return { ...row, is_npc: row.is_npc === 1 };
  });
  const units = all('SELECT * FROM units ORDER BY id').map((u) => {
    const row = u as Record<string, unknown>;
    return {
      ...row,
      equipment: parseJson(row.equipment, []),
      demographics: parseJson(row.demographics, {}),
    };
  });
  const settlements = all('SELECT * FROM settlements ORDER BY id').map((s) => {
    const row = s as Record<string, unknown>;
    return { ...row, problems: parseJson(row.problems, []) };
  });
  const players = all('SELECT id, handle, state_id, role, created_at FROM players ORDER BY id');
  const leaders = all('SELECT * FROM leaders ORDER BY id').map((l) => {
    const row = l as Record<string, unknown>;
    return { ...row, traits: parseJson(row.traits, {}) };
  });
  const events = all('SELECT * FROM events ORDER BY created_at DESC LIMIT 200').map((e) => {
    const row = e as Record<string, unknown>;
    return { ...row, payload: parseJson(row.payload, {}) };
  });
  const memory = all('SELECT * FROM memory ORDER BY game_time DESC LIMIT 500');
  const economy = states.map((s) => {
    const row = s as Record<string, unknown>;
    return {
      state_id: row.id,
      treasury: row.treasury,
      industry: row.industry,
      agriculture: row.agriculture,
      stability: row.stability,
      legitimacy: row.legitimacy,
    };
  });

  return {
    meta: {
      format: 'malines.sar',
      version: FORMAT_VERSION,
      snapshotId: 'pending',
      createdAt: new Date().toISOString(),
      gameTime: game.game_time,
      keyId: loadOrCreateKeys().keyId,
    },
    time: {
      gameTime: game.game_time,
      realStartedAt: game.real_started_at,
      tickMinutes: game.tick_minutes || TICK_MINUTES,
      ratio: GAME_RATIO,
    },
    world: {
      regionCount: regions.length,
      provinceCount: provinces.length,
      seaProvinceCount: provinces.filter((p) => p.is_sea).length,
      regions,
      provinces,
      settlements,
    },
    states,
    units,
    economy,
    players,
    leaders,
    events,
    memory,
  };
}

/** Build, sign and persist a snapshot. Returns its summary. */
export function createSnapshot(): SnapshotSummary {
  const body = buildSnapshotBody();
  const id = `sar_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
  body.meta.snapshotId = id;

  const signed = signPayload(body);
  const withSignature = { ...body, meta: { ...body.meta, signature: signed } };
  const json = JSON.stringify(withSignature, null, 2);
  const hash = sha256(canonicalJson(body));

  const file = path.join(SNAPSHOT_DIR, `SAR-${id}.json`);
  fs.writeFileSync(file, json, 'utf8');

  run(
    'INSERT INTO snapshots (id, file, sha256, game_time, created_at, signature) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    file,
    hash,
    body.time.gameTime,
    Date.now(),
    signed,
  );
  run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', 'latest_snapshot', id);

  return {
    id,
    file,
    sha256: hash,
    signature: signed,
    gameTime: body.time.gameTime,
    createdAt: Date.now(),
  };
}

export function latestSnapshot(): { summary: SnapshotSummary; body: unknown } | null {
  const row = get<{ value: string }>("SELECT value FROM meta WHERE key = 'latest_snapshot'");
  if (!row) return null;
  const snap = get<Record<string, unknown>>('SELECT * FROM snapshots WHERE id = ?', row.value);
  if (!snap) return null;
  const file = String(snap.file);
  if (!fs.existsSync(file)) return null;
  return {
    summary: {
      id: String(snap.id),
      file,
      sha256: String(snap.sha256),
      signature: String(snap.signature),
      gameTime: String(snap.game_time),
      createdAt: Number(snap.created_at),
    },
    body: JSON.parse(fs.readFileSync(file, 'utf8')),
  };
}
