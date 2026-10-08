// Shared storage keys and limits. These exact strings are the persistence
// contract with app.js and must not change (T2 ports the behavior as-is).

export const HISTORY_KEY = 'coinflip.history.v1';
export const LANG_KEY = 'coinflip.lang';
export const SOUND_KEY = 'coinflip.sound.v1';

/** Maximum history entries kept, newest-first. */
export const MAX_ENTRIES = 50;
