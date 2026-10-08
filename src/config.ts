// Shared storage keys and limits. These exact strings are the persistence
// contract with stored user data and must not change.

export const HISTORY_KEY = 'coinflip.history.v1';
export const LANG_KEY = 'coinflip.lang';
export const SOUND_KEY = 'coinflip.sound.v1';

/** Maximum history entries kept, newest-first. */
export const MAX_ENTRIES = 50;
