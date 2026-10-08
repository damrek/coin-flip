// Bundle entry: query the DOM, wire the events, and apply the saved language.
// index.html keeps loading app.js until the T3 cutover, so this bundle
// is not live yet.

import { flip, getPending, settle } from './game.js';
import { applyLang, clearHistory, getLang } from './ui.js';
import { readLang } from './store.js';
import { toggleSound } from './sound.js';

export function init(): void {
  const coin = document.getElementById('coin');
  const lift = document.getElementById('coinLift');
  const clearBtn = document.getElementById('clearHistory');
  const soundToggle = document.getElementById('soundToggle');
  const langButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.lang__btn'));

  coin?.addEventListener('click', flip);

  lift?.addEventListener('animationend', () => {
    const pending = getPending();
    if (pending) settle(pending);
  });

  clearBtn?.addEventListener('click', () => {
    clearHistory();
  });

  for (const btn of langButtons) {
    btn.addEventListener('click', () => {
      applyLang(btn.dataset.lang ?? '');
    });
  }

  soundToggle?.addEventListener('click', () => {
    toggleSound(getLang());
  });

  applyLang(readLang());
}

init();
