import { randomBytes } from 'node:crypto';
import { get, run } from './db.js';

export interface DecisionRow {
  id: string;
  player_id: string | null;
  state_id: string | null;
  kind: string;
  action: string;
  payload: string;
  game_time: string;
  status: string;
  source: string;
}

function parsePayload(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function recordEvent(gameTime: string, decision: DecisionRow, notes: string[]): void {
  run(
    'INSERT INTO events (id, game_time, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    `evt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gameTime,
    'decision_applied',
    JSON.stringify({ decisionId: decision.id, action: decision.action, kind: decision.kind, notes }),
    Date.now(),
  );
}

function applyRail(payload: Record<string, unknown>): string[] {
  const from = typeof payload.from === 'string' ? payload.from : null;
  const to = typeof payload.to === 'string' ? payload.to : null;
  const notes: string[] = [];
  for (const provinceId of [from, to]) {
    if (!provinceId) continue;
    const row = get<{ infrastructure: string }>('SELECT infrastructure FROM provinces WHERE id = ?', provinceId);
    if (!row) {
      notes.push(`مقاطعة غير موجودة: ${provinceId}`);
      continue;
    }
    let infrastructure: Record<string, unknown> = {};
    try {
      infrastructure = JSON.parse(row.infrastructure || '{}') as Record<string, unknown>;
    } catch {
      infrastructure = {};
    }
    infrastructure.rail = Number(infrastructure.rail ?? 0) + 1;
    run('UPDATE provinces SET infrastructure = ?, updated_at = ? WHERE id = ?', JSON.stringify(infrastructure), new Date().toISOString(), provinceId);
    notes.push(`سكة حديد +1 في ${provinceId}`);
  }
  return notes;
}

function applyFortify(payload: Record<string, unknown>): string[] {
  const provinceId = typeof payload.provinceId === 'string' ? payload.provinceId : null;
  if (!provinceId) return ['لا توجد مقاطعة محددة'];
  const province = get<{ is_sea: number }>('SELECT is_sea FROM provinces WHERE id = ?', provinceId);
  if (!province) return [`مقاطعة غير موجودة: ${provinceId}`];
  if (province.is_sea) return [`مقاطعة بحرية لا تقبل حامية: ${provinceId}`];
  const level = Math.max(1, Math.min(5, Number(payload.level ?? 1) || 1));
  const added = level * 500;
  run(
    'UPDATE provinces SET garrison = garrison + ?, updated_at = ? WHERE id = ?',
    added,
    new Date().toISOString(),
    provinceId,
  );
  return [`حامية +${added} في ${provinceId}`];
}

function applyInternal(decision: DecisionRow): string[] {
  if (!decision.state_id) return ['لا توجد دولة محددة'];
  const delta = Number(payloadNumber(decision.payload, 'stability', 1));
  run('UPDATE states SET stability = MIN(100, stability + ?) WHERE id = ?', delta, decision.state_id);
  return [`استقرار ${delta > 0 ? '+' : ''}${delta} للدولة ${decision.state_id}`];
}

function payloadNumber(raw: string, key: string, fallback: number): number {
  const payload = parsePayload(raw);
  const value = Number(payload[key]);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Apply an approved decision to the world where the action is known.
 * Unknown actions are still recorded so the human referee can adjudicate them.
 */
export function applyDecision(decision: DecisionRow): string[] {
  const payload = parsePayload(decision.payload);
  let notes: string[] = [];

  if (decision.kind === 'military') {
    notes = applyFortify(payload);
  } else if (decision.kind === 'economic' && decision.action === 'build_rail') {
    notes = applyRail(payload);
  } else if (decision.kind === 'internal') {
    notes = applyInternal(decision);
  } else if (decision.kind === 'diplomatic') {
    notes = ['معاهدة مسجّلة — تحتاج اعتماداً بشرياً في العالم'];
  } else {
    notes = ['قرار مسجّل دون أثر آلي'];
  }

  recordEvent(decision.game_time, decision, notes);
  return notes;
}
