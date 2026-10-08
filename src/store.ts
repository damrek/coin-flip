import { HISTORY_KEY, LANG_KEY, MAX_ENTRIES } from './config.js';
import type { Lang } from './i18n.js';
import type { Side } from './game.js';

/** One toss record. `side` is language-neutral; labels resolve at render. */
export interface Entry {
  side: Side;
  at: number;
}

/** Read history newest-first, dropping malformed entries. Full port in T2. */
export function readHistory(): Entry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (e): e is Entry =>
            typeof e === 'object' &&
            e !== null &&
            ((e as Entry).side === 'heads' || (e as Entry).side === 'tails'),
        )
      : [];
  } catch {
    // Corrupt history or blocked storage: start from an empty list.
    return [];
  }
}

/** Persist history capped at MAX_ENTRIES. Full port in T2. */
export function writeHistory(entries: Entry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Without persistence everything still works; it just resets on reload.
  }
}

/** Read the saved language. Detection fallback is ported in T2. */
export function readLang(): Lang {
  // TODO(T2): port saved-value + navigator detection from app.js.
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // Fall through to the default.
  }
  return 'es';
}

/** Persist the language choice. */
export function writeLang(value: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, value);
  } catch {
    // Preference simply will not survive a reload.
  }
}
