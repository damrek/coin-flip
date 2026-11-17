# Coin Flip

A tap-to-flip coin that settles the argument. Tap the coin, it spins, it lands,
and the history keeps score.

**Live demo: https://damrek.github.io/coin-flip/**

![TypeScript, HTML and CSS](https://img.shields.io/badge/stack-TypeScript%20%2F%20HTML%20%2F%20CSS-informational)
![Runtime dependency: three.js](https://img.shields.io/badge/runtime-three.js-informational)
![TypeScript bundled with tsdown](https://img.shields.io/badge/build-tsdown-informational)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Screenshot of the coin flip app showing the 3D aureus, a 4/4 tally with flip stats, and a history of eight flips](assets/screenshot.png)

## Features

- Photogrammetry-scanned Roman aureus rendered in WebGL with three.js, with the drawn SVG coin as fallback
- Flip animation with a drop shadow that scales with the lift
- Coin faces drawn as inline SVG (a classical medallion for heads, a cross pattée for tails)
- Running heads/tails tally
- Flip stats with heads %, current streak, and best streaks per side
- Optional WebAudio flip sounds (tick at the apex, thud on landing) with haptics, off by default and persisted in `localStorage`
- Adjustable flip speed from 0.5× to 2×, persisted in `localStorage`; the tick and the thud follow the chosen duration
- Scrollable history of the last 50 flips, persisted in `localStorage`
- Collapsible history panel, with its expanded/collapsed state persisted in `localStorage`
- Spanish / English language selector
- Respects `prefers-reduced-motion`: the result is announced without the animation
- Keyboard accessible, with `aria-pressed`, `role="status"` and `aria-live` regions

## Run it

Install dependencies, build the bundle, then serve the repo root:

```bash
npm install
npm run build
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## How it works

| File | Role |
| --- | --- |
| `index.html` | Markup, i18n hooks via `data-i18n`, inline SVG coin faces |
| `style.css` | Layout, glow background, flip animation, scrollbar styling |
| `src/main.ts` | Bundle entry: queries the DOM and wires events |
| `src/game.ts` | Flip state machine and outcome logic |
| `src/coin3d.ts` | three.js scene, the scanned aureus and its flip tween |
| `src/ui.ts` | DOM rendering, language switching, history view |
| `src/store.ts` | `localStorage` persistence for history, language, sound |
| `src/stats.ts` | Tally, heads %, streaks |
| `src/sound.ts` | WebAudio tick/thud and haptics |
| `src/speed.ts` | Flip-speed factor, `--flip-duration` and sound timing |
| `src/i18n.ts` | Spanish/English strings |
| `src/config.ts` | Shared constants |
| `assets/models/aureus/` | CC0 scan of the coin, loaded at runtime by `GLTFLoader` |
| `dist/` | Built minified IIFE bundle loaded by `index.html` (gitignored, produced by `npm run build`) |

State lives in four `localStorage` keys: `coinflip.history.v1`, `coinflip.lang`,
`coinflip.sound.v1` (`on`/`off`, default `off`), and `coinflip.flip-speed.v1`
(`0.5`–`2`, default `1`).
Clearing the history empties the first one and leaves the rest untouched.

## Deploy

GitHub Pages deploys on every push to `main`: the Actions workflow installs
dependencies, runs `npm run build`, and publishes the repo root (including the
fresh `dist/` bundle) to Pages.

## Contributing

Issues and pull requests are welcome.

## Credits

The 3D coin is a CC0 scan of an aureus of Marcus Aurelius (165 AD) by the
Musée Saint-Raymond, digitised by IMA Solutions from photographs by Daniel
Martin. `assets/models/aureus/license.txt` keeps the original notice.

## License

[MIT](LICENSE) © 2026 damrek
