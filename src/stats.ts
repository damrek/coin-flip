import type { Lang } from './i18n.js';
import { t } from './i18n.js';
import type { Entry } from './store.js';
import type { Side } from './game.js';

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

/**
 * Derive heads %, the current streak, and the longest run per side.
 * Entries are newest-first, so the current streak is the leading run.
 */
export function computeStats(entries: Entry[]): Stats {
  const total = entries.length;
  if (total === 0) {
    return {
      headsPct: 0,
      current: { side: null, length: 0 },
      bestHeads: 0,
      bestTails: 0,
    };
  }

  let heads = 0;
  for (const e of entries) if (e.side === 'heads') heads += 1;

  // Current streak: leading run.
  const firstSide: Side = entries[0].side;
  let length = 0;
  while (length < total && entries[length].side === firstSide) length += 1;

  // Longest run per side.
  let bestHeads = 0;
  let bestTails = 0;
  let runSide: Side | null = null;
  let runLen = 0;
  for (const e of entries) {
    if (e.side === runSide) {
      runLen += 1;
    } else {
      runSide = e.side;
      runLen = 1;
    }
    if (runSide === 'heads' && runLen > bestHeads) bestHeads = runLen;
    if (runSide === 'tails' && runLen > bestTails) bestTails = runLen;
  }

  return {
    headsPct: Math.round((heads / total) * 100),
    current: { side: firstSide, length },
    bestHeads,
    bestTails,
  };
}

export function renderStats(entries: Entry[], lang: Lang): void {
  const headsPct = document.getElementById('statsHeadsPct');
  const streak = document.getElementById('statsStreak');
  const best = document.getElementById('statsBest');
  if (!headsPct || !streak || !best) return;
  const stats = computeStats(entries);
  if (entries.length === 0) {
    headsPct.textContent = '–';
    streak.textContent = '–';
    best.textContent = '–';
    return;
  }
  headsPct.textContent = `${stats.headsPct}%`;
  const currentSide: Side = stats.current.side ?? 'heads';
  streak.textContent = `${t(lang, currentSide)} ×${stats.current.length}`;
  best.textContent = `${t(lang, 'heads')} ${stats.bestHeads} · ${t(lang, 'tails')} ${stats.bestTails}`;
}
