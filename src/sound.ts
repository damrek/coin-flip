import { SOUND_KEY } from './config.js';

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

// TODO(T2): port WebAudio tick/thud, haptics (only when sound is on),
// and the toggle wiring from app.js.
export function playTick(): void {
  // Stub for T2.
}

export function playThud(): void {
  // Stub for T2.
}

export function buzz(): void {
  // Stub for T2.
}

export function updateSoundToggle(): void {
  // Stub for T2.
}
