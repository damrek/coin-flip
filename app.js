/**
 * Coin Toss — toss logic, history, and localisation.
 *
 * Core rule: the outcome is drawn BEFORE the animation starts, and the final
 * spin angle is derived from it. Drawing mid-flight would let the coin land on
 * a face that disagrees with the outcome that was already decided.
 *
 * Localisation stores language-neutral keys ('heads' / 'tails') in history and
 * translates them at render time, so switching language re-labels the existing
 * history instead of invalidating it.
 */

const HISTORY_KEY = 'coinflip.history.v1';
const LANG_KEY = 'coinflip.lang';
const SOUND_KEY = 'coinflip.sound.v1';
const MAX_ENTRIES = 50;

/* ----------------------------------------------------------------
   Strings
   ---------------------------------------------------------------- */

const STRINGS = {
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

const DEFAULT_LANG = 'es';

let lang = DEFAULT_LANG;
let lastSide = null; // last landed outcome, kept so a language switch can relabel it

/** Translate a key for the active language, falling back to Spanish. */
function t(key) {
  const table = STRINGS[lang] || STRINGS[DEFAULT_LANG];
  return table[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
}

/* ----------------------------------------------------------------
   DOM
   ---------------------------------------------------------------- */

const coin = document.getElementById('coin');
const lift = document.getElementById('coinLift');
const spin = document.getElementById('coinSpin');
const shadow = document.getElementById('coinShadow');
const result = document.getElementById('result');
const list = document.getElementById('historyList');
const clearBtn = document.getElementById('clearHistory');
const countHeads = document.getElementById('countHeads');
const countTails = document.getElementById('countTails');
const metaDescription = document.getElementById('metaDescription');
const langButtons = Array.from(document.querySelectorAll('.lang__btn'));
const statsHeadsPct = document.getElementById('statsHeadsPct');
const statsStreak = document.getElementById('statsStreak');
const statsBest = document.getElementById('statsBest');
const soundToggle = document.getElementById('soundToggle');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let busy = false;
let pending = null;

/* ----------------------------------------------------------------
   Persistence
   ---------------------------------------------------------------- */

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((e) => e && (e.side === 'heads' || e.side === 'tails'))
      : [];
  } catch {
    // Corrupt history or blocked storage: start from an empty list.
    return [];
  }
}

function writeHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Without persistence everything still works; it just resets on reload.
  }
}

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch {
    // fall through to detection
  }
  const preferred = navigator.language || '';
  return preferred.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function writeLang(value) {
  try {
    localStorage.setItem(LANG_KEY, value);
  } catch {
    // Preference simply will not survive a reload.
  }
}

/* ----------------------------------------------------------------
   Sound preference (persisted, default OFF) + WebAudio blips
   ---------------------------------------------------------------- */

let soundEnabled = false;
let audioCtx = null;

function readSound() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on' ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

function writeSound(value) {
  try {
    localStorage.setItem(SOUND_KEY, value);
  } catch {
    // Preference simply will not survive a reload.
  }
}

soundEnabled = readSound() === 'on';

/** Lazily create the AudioContext on a user-enabled flip. Returns null when OFF. */
function ensureAudio() {
  if (!soundEnabled) return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a short enveloped oscillator blip. Never throws. */
function blip(freq, duration, gainValue, type) {
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
function playTick() {
  blip(880, 0.07, 0.12, 'sine');
}

/** Soft landing thud. */
function playThud() {
  blip(150, 0.14, 0.2, 'sine');
}

/** Short haptic buzz on landing, only when sound is ON. No-op otherwise. */
function buzz() {
  try {
    if (soundEnabled && navigator.vibrate) navigator.vibrate(15);
  } catch {
    // Haptics are best-effort.
  }
}

/** Sync the toggle glyph, pressed state, and bilingual label. */
function updateSoundToggle() {
  if (!soundToggle) return;
  soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  const label = soundEnabled ? t('soundOff') : t('soundOn');
  soundToggle.setAttribute('aria-label', label);
  soundToggle.setAttribute('title', label);
}

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    writeSound(soundEnabled ? 'on' : 'off');
    updateSoundToggle();
  });
}

/* ----------------------------------------------------------------
   Language
   ---------------------------------------------------------------- */

function applyLang(next) {
  if (!STRINGS[next]) return;
  lang = next;
  writeLang(next);

  document.documentElement.lang = next;
  document.title = t('docTitle');
  metaDescription.setAttribute('content', t('metaDescription'));

  // Every element carrying a data hook is relabelled in place.
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  }
  for (const btn of langButtons) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === next));
  }

  if (lastSide) result.textContent = t(lastSide);
  updateSoundToggle();
  render();
}

for (const btn of langButtons) {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
}

/* ----------------------------------------------------------------
   History rendering
   ---------------------------------------------------------------- */

/* ----------------------------------------------------------------
   Stats (derived from history, newest-first)
   ---------------------------------------------------------------- */

/**
 * Derive heads %, the current streak, and the longest run per side.
 * Entries are newest-first, so the current streak is the leading run.
 */
function computeStats(entries) {
  const total = entries.length;
  if (total === 0) {
    return {
      headsPct: 0,
      current: { side: null, length: 0 },
      bestHeads: 0,
      bestTails: 0,
    };
  }

  let heads = 0;
  for (const e of entries) if (e.side === 'heads') heads += 1;

  // Current streak: leading run.
  const firstSide = entries[0].side;
  let length = 0;
  while (length < total && entries[length].side === firstSide) length += 1;

  // Longest run per side.
  let bestHeads = 0;
  let bestTails = 0;
  let runSide = null;
  let runLen = 0;
  for (const e of entries) {
    if (e.side === runSide) {
      runLen += 1;
    } else {
      runSide = e.side;
      runLen = 1;
    }
    if (runSide === 'heads' && runLen > bestHeads) bestHeads = runLen;
    if (runSide === 'tails' && runLen > bestTails) bestTails = runLen;
  }

  return {
    headsPct: Math.round((heads / total) * 100),
    current: { side: firstSide, length },
    bestHeads,
    bestTails,
  };
}

function renderStats(entries) {
  const stats = computeStats(entries);
  if (entries.length === 0) {
    statsHeadsPct.textContent = '–';
    statsStreak.textContent = '–';
    statsBest.textContent = '–';
    return;
  }
  statsHeadsPct.textContent = `${stats.headsPct}%`;
  statsStreak.textContent = `${t(stats.current.side)} ×${stats.current.length}`;
  statsBest.textContent = `${t('heads')} ${stats.bestHeads} · ${t('tails')} ${stats.bestTails}`;
}

function render() {
  const entries = readHistory();

  const heads = entries.filter((e) => e.side === 'heads').length;
  countHeads.textContent = String(heads);
  countTails.textContent = String(entries.length - heads);

  renderStats(entries);

  // The empty state is rendered here rather than living in the markup: the list
  // is rebuilt wholesale, so a static node inside it would be wiped on the very
  // first render and could never come back.
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.className = 'history__empty';
    li.textContent = t('empty');
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
      side.textContent = t(entry.side);

      const n = document.createElement('span');
      n.className = 'entry__n';
      n.textContent = `#${total - index}`;

      li.append(side, n);
      return li;
    })
  );
}

function commit(side) {
  const entries = readHistory();
  entries.unshift({ side, at: Date.now() });
  writeHistory(entries);
  render();
}

/* ----------------------------------------------------------------
   Toss
   ---------------------------------------------------------------- */

/**
 * Landing angle for a given outcome.
 * One full turn is 360°. Heads is a multiple of 360; tails adds 180 more.
 * Five or six turns are drawn so two consecutive tosses never feel identical,
 * but the final angle is always exact.
 */
function spinEndFor(isHeads) {
  const turns = 5 + Math.floor(Math.random() * 2);
  return turns * 360 + (isHeads ? 0 : 180);
}

function flip() {
  if (busy) return;

  const isHeads = Math.random() < 0.5;
  const endAngle = spinEndFor(isHeads);
  const side = isHeads ? 'heads' : 'tails';

  // The outcome is settled here. The animation only represents it.
  spin.style.setProperty('--spin-end', `${endAngle}deg`);

  if (reduceMotion.matches) {
    // No animation: show the outcome directly.
    spin.style.transform = `rotateX(${endAngle}deg)`;
    lastSide = side;
    result.textContent = t(side);
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
  if (soundEnabled) {
    setTimeout(() => {
      if (pending === side) playTick();
    }, 630);
  }

  restart();
  lift.classList.add('is-flipping');
  spin.classList.add('is-flipping');
  shadow.classList.add('is-flipping');
}

/** Restart the animations. Removing the class is not enough when the element
 *  already finished an animation in the same computed style. */
function restart() {
  [lift, spin, shadow].forEach((el) => el.classList.remove('is-flipping'));
  void lift.offsetWidth; // forced reflow
}

function settle(side) {
  busy = false;
  coin.disabled = false;

  lastSide = side;
  result.textContent = t(side);
  result.classList.add('is-visible');

  // The bounce lives on .coin, separate from the arc, so the two do not fight
  // over the same transform.
  coin.classList.remove('is-landed');
  void coin.offsetWidth;
  coin.classList.add('is-landed');
  coin.addEventListener(
    'animationend',
    () => coin.classList.remove('is-landed'),
    { once: true }
  );

  commit(side);
  playThud();
  buzz();
  pending = null;
}

lift.addEventListener('animationend', () => {
  if (pending) settle(pending);
});

coin.addEventListener('click', flip);

clearBtn.addEventListener('click', () => {
  writeHistory([]);
  lastSide = null;
  render();
  result.classList.remove('is-visible');
});

applyLang(readLang());
