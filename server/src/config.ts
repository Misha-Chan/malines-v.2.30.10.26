import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..');

export const DATA_DIR = process.env.MALINES_DATA_DIR ?? path.join(SERVER_ROOT, '.data');
export const DB_PATH = process.env.MALINES_DB ?? path.join(DATA_DIR, 'malines.db');
export const SNAPSHOT_DIR = path.join(DATA_DIR, 'snapshots');
export const KEY_DIR = path.join(DATA_DIR, 'keys');

export const PORT = Number(process.env.PORT ?? 4000);
export const HOST = process.env.HOST ?? '127.0.0.1';

/** Real minutes between two snapshots. */
export const TICK_MINUTES = Number(process.env.MALINES_TICK_MINUTES ?? 30);
/** Dev override: run a tick every N seconds (0 = use TICK_MINUTES). */
export const TICK_SECONDS = Number(process.env.MALINES_TICK_SECONDS ?? 0);

/** 1 real day = 180 in-game days (6 months). */
export const GAME_RATIO = 180;
export const GAME_START = process.env.MALINES_GAME_START ?? '1900-01-01T00:00:00.000Z';

export const FORMAT_VERSION = '1.1.0.13';
export const KEY_ID = process.env.MALINES_KEY_ID ?? 'mln-dev-1';
export const ADMIN_TOKEN = process.env.MALINES_ADMIN_TOKEN ?? 'dev-admin';
