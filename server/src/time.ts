import { GAME_RATIO } from './config.js';

export const REAL_MS_PER_DAY = 86_400_000;

/** Advance an in-game ISO timestamp by a number of game days. */
export function addGameDays(gameTimeIso: string, days: number): string {
  return new Date(new Date(gameTimeIso).getTime() + days * REAL_MS_PER_DAY).toISOString();
}

/** 1 real minute = 180 / 1440 game days. */
export function gameDaysForRealMinutes(minutes: number): number {
  return (minutes * GAME_RATIO) / 1440;
}

export function advanceForRealMinutes(gameTimeIso: string, minutes: number): string {
  return addGameDays(gameTimeIso, gameDaysForRealMinutes(minutes));
}

export function gameDaysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / REAL_MS_PER_DAY;
}
