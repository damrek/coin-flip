// Language domain: supported locales and the translatable string keys.
// History stores language-neutral keys ('heads' / 'tails') and translates
// them at render time, so switching language re-labels existing history.

export type Lang = 'es' | 'en';

export type StringKey =
  | 'docTitle'
  | 'metaDescription'
  | 'heading'
  | 'subtitle'
  | 'hint'
  | 'heads'
  | 'tails'
  | 'historyTitle'
  | 'clear'
  | 'empty'
  | 'coinLabel'
  | 'langLabel'
  | 'historyLabel'
  | 'statsHeadsPct'
  | 'streakNow'
  | 'bestStreaks'
  | 'soundOn'
  | 'soundOff';

export type StringTable = Record<StringKey, string>;

export const STRINGS: Record<Lang, StringTable> = {
  es: {
    docTitle: 'Moneda',
    metaDescription: 'Lanza la moneda y deja que decida.',
    heading: 'Moneda',
    subtitle: 'Toca la moneda y deja que decida.',
    hint: 'Pulsa la moneda',
    heads: 'Cara',
    tails: 'Cruz',
    historyTitle: 'Histórico',
    clear: 'Limpiar',
    empty: 'Aún no hay lanzamientos.',
    coinLabel: 'Lanzar la moneda',
    langLabel: 'Idioma',
    historyLabel: 'Histórico de lanzamientos',
    statsHeadsPct: 'Cara %',
    streakNow: 'Racha actual',
    bestStreaks: 'Mejor racha',
    soundOn: 'Activar sonido',
    soundOff: 'Desactivar sonido',
  },
  en: {
    docTitle: 'Coin Toss',
    metaDescription: 'Toss the coin and let it decide.',
    heading: 'Coin Toss',
    subtitle: 'Toss the coin and let it decide.',
    hint: 'Toss the coin',
    heads: 'Heads',
    tails: 'Tails',
    historyTitle: 'History',
    clear: 'Clear',
    empty: 'No tosses yet.',
    coinLabel: 'Toss the coin',
    langLabel: 'Language',
    historyLabel: 'Toss history',
    statsHeadsPct: 'Heads %',
    streakNow: 'Current streak',
    bestStreaks: 'Best streaks',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
  },
};

export const DEFAULT_LANG: Lang = 'es';

/** Translate a key for the active language, falling back to Spanish. */
export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
}
