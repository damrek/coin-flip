# Coin Flip

A tap-to-flip coin that settles the argument. Tap the coin, it spins, it lands,
and the history keeps score.

![Vanilla HTML, CSS and JavaScript](https://img.shields.io/badge/stack-vanilla%20HTML%20%2F%20CSS%20%2F%20JS-informational)
![No dependencies](https://img.shields.io/badge/dependencies-none-success)
![No build step](https://img.shields.io/badge/build-none-success)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Screenshot of the coin flip app showing the coin, a 4/4 tally and a history of eight flips](assets/screenshot.png)

## Features

- CSS-only flip animation with a drop shadow that scales with the lift
- Coin faces drawn as inline SVG (a classical medallion for heads, a cross pattée for tails)
- Running heads/tails tally
- Scrollable history of the last 50 flips, persisted in `localStorage`
- Spanish / English language selector
- Respects `prefers-reduced-motion`: the result is announced without the animation
- Keyboard accessible, with `aria-pressed`, `role="status"` and `aria-live` regions

## Run it

There is no build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## How it works

| File | Role |
| --- | --- |
| `index.html` | Markup, i18n hooks via `data-i18n`, inline SVG coin faces |
| `style.css` | Layout, glow background, flip animation, scrollbar styling |
| `app.js` | Flip state machine, history persistence, i18n |

State lives in two `localStorage` keys: `coinflip.history.v1` and `coinflip.lang`.
Clearing the history empties the first one and leaves the rest untouched.

## Contributing

Issues and pull requests are welcome.

## License

[MIT](LICENSE) © 2026 damrek
