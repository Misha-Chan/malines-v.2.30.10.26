import { DatabaseSync, type StatementSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, DB_PATH, SNAPSHOT_DIR, KEY_DIR } from './config.js';

const here = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
fs.mkdirSync(KEY_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

const schema = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
db.exec(schema);

export function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...(params as never[])) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...(params as never[])) as T | undefined;
}

export function run(sql: string, ...params: unknown[]): void {
  const stmt: StatementSync = db.prepare(sql);
  stmt.run(...(params as never[]));
}

export function transaction(fn: () => void): void {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
