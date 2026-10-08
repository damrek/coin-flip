import { HISTORY_KEY, LANG_KEY, MAX_ENTRIES, SOUND_KEY } from './config.js';
import type { Lang } from './i18n.js';
import type { Side } from './game.js';

/** One toss record. `side` is language-neutral; labels resolve at render. */
export interface Entry {
  side: Side;
  at: number;
}

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

export function writeHistory(entries: Entry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Without persistence everything still works; it just resets on reload.
  }
}

export function readLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // Blocked storage: fall through to navigator detection.
  }
  const preferred: string =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : '';
  return preferred.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function writeLang(value: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, value);
  } catch {
    // Preference simply will not survive a reload.
  }
}

/** Persisted sound preference. Default is OFF. */
export type SoundState = 'on' | 'off';

export function readSound(): SoundState {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on' ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

export function writeSound(value: SoundState): void {
  try {
    localStorage.setItem(SOUND_KEY, value);
  } catch {
    // Preference simply will not survive a reload.
  }
}
