// Toss domain. Core rule: the outcome is drawn BEFORE the animation starts,
// and the final spin angle is derived from it. Drawing mid-flight would let
// the coin land on a face that disagrees with the outcome already decided.

import { t } from './i18n.js';
import { commit, getLang, setLastSide } from './ui.js';
import { buzz, isSoundEnabled, playThud, playTick } from './sound.js';

export type Side = 'heads' | 'tails';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let busy = false;
let pending: Side | null = null;

/** The outcome currently animating, or null when the coin is at rest. */
export function getPending(): Side | null {
  return pending;
}

/**
 * Landing angle for a given outcome.
 * One full turn is 360°. Heads is a multiple of 360; tails adds 180 more.
 * Five or six turns are drawn so two consecutive tosses never feel identical,
 * but the final angle is always exact.
 */
export function spinEndFor(isHeads: boolean): number {
  const turns = 5 + Math.floor(Math.random() * 2);
  return turns * 360 + (isHeads ? 0 : 180);
}

export function flip(): void {
  if (busy) return;

  const coin = document.getElementById('coin') as HTMLButtonElement | null;
  const lift = document.getElementById('coinLift');
  const spin = document.getElementById('coinSpin');
  const shadow = document.getElementById('coinShadow');
  const result = document.getElementById('result');
  if (!coin || !lift || !spin || !shadow || !result) return;

  const isHeads = Math.random() < 0.5;
  const endAngle = spinEndFor(isHeads);
  const side: Side = isHeads ? 'heads' : 'tails';

  // The outcome is settled here. The animation only represents it.
  spin.style.setProperty('--spin-end', `${endAngle}deg`);

  if (reduceMotion.matches) {
    // No animation: show the outcome directly.
    spin.style.transform = `rotateX(${endAngle}deg)`;
    setLastSide(side);
    result.textContent = t(getLang(), side);
    result.classList.add('is-visible');
    commit(side);
    // Sound is decorative here: stats + result are already correct without it.
    playThud();
    buzz();
    return;
  }

  busy = true;
  pending = side;
  coin.disabled = true;
  result.classList.remove('is-visible');

  // Tick near the flight apex (~630ms of the 1400ms flight). Guarded so a
  // stale timer can never sound for a flip that already settled or cleared.
  if (isSoundEnabled()) {
    window.setTimeout(() => {
      if (pending === side) playTick();
    }, 630);
  }

  restart(lift, spin, shadow);
  lift.classList.add('is-flipping');
  spin.classList.add('is-flipping');
  shadow.classList.add('is-flipping');
}

/** Restart the animations. Removing the class is not enough when the element
 *  already finished an animation in the same computed style. */
function restart(lift: HTMLElement, spin: HTMLElement, shadow: HTMLElement): void {
  for (const el of [lift, spin, shadow]) el.classList.remove('is-flipping');
  void lift.offsetWidth; // forced reflow
}

export function settle(side: Side): void {
  const coin = document.getElementById('coin') as HTMLButtonElement | null;
  const result = document.getElementById('result');
  if (!coin || !result) return;

  busy = false;
  coin.disabled = false;

  setLastSide(side);
  result.textContent = t(getLang(), side);
  result.classList.add('is-visible');

  // The bounce lives on .coin, separate from the arc, so the two do not fight
  // over the same transform.
  coin.classList.remove('is-landed');
  void coin.offsetWidth;
  coin.classList.add('is-landed');
  coin.addEventListener('animationend', () => coin.classList.remove('is-landed'), { once: true });

  commit(side);
  playThud();
  buzz();
  pending = null;
}
