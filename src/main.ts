// Bundle entry: query the DOM, wire the events, and apply the saved language.
// Loaded by index.html via dist/main.iife.js; init() auto-runs on import.

import { flip, getPending, settle } from './game.js';
import { applyLang, clearHistory, getLang, isCollapsed, setCollapsed } from './ui.js';
import { readCollapsed, readLang } from './store.js';
import { toggleSound } from './sound.js';

export function init(): void {
  const coin = document.getElementById('coin');
  const lift = document.getElementById('coinLift');
  const clearBtn = document.getElementById('clearHistory');
  const toggleHistory = document.getElementById('toggleHistory');
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

  toggleHistory?.addEventListener('click', () => {
    setCollapsed(!isCollapsed());
  });

  for (const btn of langButtons) {
    btn.addEventListener('click', () => {
      applyLang(btn.dataset.lang ?? '');
    });
  }

  soundToggle?.addEventListener('click', () => {
    toggleSound(getLang());
  });

  // Saved preference wins; with none, narrow screens start collapsed so the
  // panel never covers the coin, wide screens start expanded.
  setCollapsed(readCollapsed() ?? window.matchMedia('(max-width: 620px)').matches);

  applyLang(readLang());
}

init();
