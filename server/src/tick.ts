import { randomBytes } from 'node:crypto';
import { all, get, run } from './db.js';
import { TICK_MINUTES } from './config.js';
import { advanceForRealMinutes, gameDaysForRealMinutes } from './time.js';
import { createSnapshot, type SnapshotSummary } from './snapshot.js';

export interface TickResult {
  gameTime: string;
  daysAdvanced: number;
  snapshot: SnapshotSummary;
}

/**
 * Advance the world by one tick.
 * - game clock advances 3.75 days per real 30 minutes (1:180)
 * - simple economy and supply drift for beta
 * - a signed SAR.json snapshot is produced
 */
export function runTick(realMinutes = TICK_MINUTES): TickResult {
  const game = get<{ game_time: string }>('SELECT game_time FROM game WHERE id = 1');
  if (!game) throw new Error('game row missing');

  const nextTime = advanceForRealMinutes(game.game_time, realMinutes);
  const days = gameDaysForRealMinutes(realMinutes);

  run('UPDATE game SET game_time = ? WHERE id = 1', nextTime);

  // Beta economy: industry produces, agriculture feeds, stability drifts to 50.
  for (const state of all<{ id: string; industry: number; agriculture: number; stability: number }>(
    'SELECT id, industry, agriculture, stability FROM states',
  )) {
    const treasuryDelta = (state.industry * 0.1 + state.agriculture * 0.05) * days;
    const stability = state.stability + (50 - state.stability) * 0.02 * days;
    run('UPDATE states SET treasury = treasury + ?, stability = ? WHERE id = ?', treasuryDelta, stability, state.id);
  }

  // Units recover supply slowly when not in combat.
  for (const unit of all<{ id: string; supply: number; morale: number }>('SELECT id, supply, morale FROM units')) {
    const supply = Math.min(1, unit.supply + 0.01 * days);
    const morale = Math.min(100, unit.morale + 0.05 * days);
    run('UPDATE units SET supply = ?, morale = ? WHERE id = ?', supply, morale, unit.id);
  }

  run(
    'INSERT INTO events (id, game_time, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    `evt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    nextTime,
    'tick',
    JSON.stringify({ realMinutes, daysAdvanced: days }),
    Date.now(),
  );

  const snapshot = createSnapshot();
  return { gameTime: nextTime, daysAdvanced: days, snapshot };
}
