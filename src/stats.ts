import type { Side } from './game.js';
import type { Entry } from './store.js';

/** Leading run of the newest-first history, or empty when no tosses yet. */
export interface CurrentStreak {
  side: Side | null;
  length: number;
}

/** Stats derived from history (newest-first). */
export interface Stats {
  headsPct: number;
  current: CurrentStreak;
  bestHeads: number;
  bestTails: number;
}

// TODO(T2): port computeStats + renderStats from app.js.
export function computeStats(_entries: Entry[]): Stats {
  return {
    headsPct: 0,
    current: { side: null, length: 0 },
    bestHeads: 0,
    bestTails: 0,
  };
}

export function renderStats(_entries: Entry[]): void {
  // Stub for T2.
}
