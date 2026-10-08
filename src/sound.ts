import type { Lang } from './i18n.js';
import { t } from './i18n.js';
import { readSound, writeSound } from './store.js';

let soundEnabled: boolean = readSound() === 'on';
let audioCtx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/** Lazily create the AudioContext on a user-enabled flip. Returns null when OFF. */
function ensureAudio(): AudioContext | null {
  if (!soundEnabled) return null;
  try {
    if (!audioCtx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Resume is best-effort; playback simply stays silent.
      });
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a short enveloped oscillator blip. Never throws. */
function blip(freq: number, duration: number, gainValue: number, type: OscillatorType): void {
  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // Blocked or unsupported audio must never break the flip.
  }
}

/** High tick near the flip apex. */
export function playTick(): void {
  blip(880, 0.07, 0.12, 'sine');
}

/** Soft landing thud. */
export function playThud(): void {
  blip(150, 0.14, 0.2, 'sine');
}

/** Short haptic buzz on landing, only when sound is ON. No-op otherwise. */
export function buzz(): void {
  try {
    if (soundEnabled && navigator.vibrate) navigator.vibrate(15);
  } catch {
    // Haptics are best-effort.
  }
}

/** Sync the toggle glyph, pressed state, and bilingual label. */
export function updateSoundToggle(lang: Lang): void {
  const toggle = document.getElementById('soundToggle');
  if (!toggle) return;
  toggle.textContent = soundEnabled ? '🔊' : '🔇';
  toggle.setAttribute('aria-pressed', String(soundEnabled));
  const label = soundEnabled ? t(lang, 'soundOff') : t(lang, 'soundOn');
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('title', label);
}

/** Flip the persisted preference and refresh the toggle. Returns the new state. */
export function toggleSound(lang: Lang): boolean {
  soundEnabled = !soundEnabled;
  writeSound(soundEnabled ? 'on' : 'off');
  updateSoundToggle(lang);
  return soundEnabled;
}
