// Bundle entry. T1 wires the module skeleton so the build compiles;
// T2 ports the DOM behavior from app.js. index.html keeps loading app.js
// until the T3 cutover, so this bundle is not live yet.

import { readLang } from './store.js';
import { readSound } from './sound.js';
import { applyLang } from './ui.js';

export function init(): void {
  // TODO(T2): replace with the full startup sequence from app.js.
  applyLang(readLang());
  readSound();
}

export { readLang, readSound, applyLang };
