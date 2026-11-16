// Flip speed domain. The slider drives a speed factor; the flight duration is
// derived from it and published as --flip-duration, which is what the CSS
// animations read. The sound tick is timed from the same duration, so changing
// the speed can never desynchronize the tick from the apex.

import { FLIP_BASE_MS, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN, SPEED_STEP } from './config.js';
import { readSpeed, writeSpeed } from './store.js';

let durationMs = FLIP_BASE_MS;

/** Snap to the slider grid and keep the factor inside the allowed band. */
export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) return SPEED_DEFAULT;
  const snapped = Math.round(value / SPEED_STEP) * SPEED_STEP;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, snapped));
}

/** Flight duration in ms for the active factor. Sound timing depends on it. */
export function getFlipDurationMs(): number {
  return durationMs;
}

/** Publish a factor to the CSS variable and the control. Never persists. */
export function applySpeed(factor: number): void {
  const speed = clampSpeed(factor);
  durationMs = Math.round(FLIP_BASE_MS / speed);
  document.documentElement.style.setProperty('--flip-duration', `${durationMs}ms`);

  const slider = document.getElementById('speedRange') as HTMLInputElement | null;
  if (slider) {
    slider.value = String(speed);
    slider.setAttribute('aria-valuetext', `${speed}×`);
  }
  const readout = document.getElementById('speedValue');
  if (readout) readout.textContent = `${speed}×`;
}

/** Persist a new factor and apply it. */
export function setSpeed(factor: number): void {
  const speed = clampSpeed(factor);
  writeSpeed(speed);
  applySpeed(speed);
}

/** Apply the saved factor, or the default when nothing valid was stored. */
export function initSpeed(): void {
  applySpeed(readSpeed() ?? SPEED_DEFAULT);
}
