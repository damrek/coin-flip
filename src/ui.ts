import { DEFAULT_LANG, isLang, t } from './i18n.js';
import type { Lang, StringKey } from './i18n.js';
import { readHistory, writeHistory, writeLang } from './store.js';
import type { Side } from './game.js';
import { updateSoundToggle } from './sound.js';
import { renderStats } from './stats.js';

let lang: Lang = DEFAULT_LANG;
let lastSide: Side | null = null; // last landed outcome, kept so a language switch can relabel it

/** Active language. */
export function getLang(): Lang {
  return lang;
}

/** Record the last landed outcome so a language switch can relabel it. */
export function setLastSide(side: Side | null): void {
  lastSide = side;
}

export function applyLang(next: Lang | string): void {
  if (!isLang(next)) return;
  lang = next;
  writeLang(next);

  document.documentElement.lang = next;
  document.title = t(lang, 'docTitle');
  document.getElementById('metaDescription')?.setAttribute('content', t(lang, 'metaDescription'));

  // Every element carrying a data hook is relabelled in place.
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n as StringKey | undefined;
    if (key !== undefined) el.textContent = t(lang, key);
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    const key = el.dataset.i18nAria as StringKey | undefined;
    if (key !== undefined) el.setAttribute('aria-label', t(lang, key));
  }
  for (const btn of Array.from(document.querySelectorAll<HTMLElement>('.lang__btn'))) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === next));
  }

  if (lastSide) {
    const result = document.getElementById('result');
    if (result) result.textContent = t(lang, lastSide);
  }
  updateSoundToggle(lang);
  render();
}

export function render(): void {
  const entries = readHistory();

  const heads = entries.filter((e) => e.side === 'heads').length;
  const countHeads = document.getElementById('countHeads');
  const countTails = document.getElementById('countTails');
  if (countHeads) countHeads.textContent = String(heads);
  if (countTails) countTails.textContent = String(entries.length - heads);

  renderStats(entries, lang);

  const list = document.getElementById('historyList');
  if (!list) return;

  // The empty state is rendered here rather than living in the markup: the list
  // is rebuilt wholesale, so a static node inside it would be wiped on the very
  // first render and could never come back.
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.className = 'history__empty';
    li.textContent = t(lang, 'empty');
    list.replaceChildren(li);
    return;
  }

  // Every entry gets the entrance animation, which is what makes the newest
  // toss read as newest.
  const total = entries.length;
  list.replaceChildren(
    ...entries.map((entry, index) => {
      const li = document.createElement('li');
      li.className = `entry entry--${entry.side}`;

      const side = document.createElement('span');
      side.className = 'entry__side';
      side.textContent = t(lang, entry.side);

      const n = document.createElement('span');
      n.className = 'entry__n';
      n.textContent = `#${total - index}`;

      li.append(side, n);
      return li;
    }),
  );
}

export function commit(side: Side): void {
  const entries = readHistory();
  entries.unshift({ side, at: Date.now() });
  writeHistory(entries);
  render();
}

/** Clear persisted history, forget the last outcome, and hide the result. */
export function clearHistory(): void {
  writeHistory([]);
  lastSide = null;
  render();
  document.getElementById('result')?.classList.remove('is-visible');
}
