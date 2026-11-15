# Blackjack Match · Progressive

A casino table sign for a blackjack progressive jackpot, with a live operator
controller. The sign runs full screen in any browser — a vertical table sign on a
portrait screen, or a widescreen layout on a 16:9 TV or laptop — and the
controller edits meters, caps, payouts and colours in real time.

Everything is local: no backend, no accounts, no analytics. Configuration lives in
`localStorage` and can be exported to JSON; the only outbound request is the Google
Fonts stylesheet.

## Features

- **Progressive meters** — each meter takes a configurable share of every side
  wager, resets to its seed when awarded, and renders on a glossy plaque.
- **Must-hit meters** — guaranteed to award before their cap; the sign shows the
  cap next to the meter label (`Must Hit · MUST HIT BY $300.00`).
- **Fixed payouts** — constant prizes for weaker hands.
- **Custom logo** — upload a PNG/JPG/WebP/SVG (max 1 MB) to replace the two hero
  cards, or pick the cards yourself.
- **Title toggle** — hide the `BLACKJACK MATCH` wordmark (and its flourishes) when
  the sign carries a logo instead.
- **Widescreen support** — the sign is sized with container queries: portrait
  boards keep the vertical sign, square-or-wider boards place the brand left and
  the meters right.
- **Sign window** — open a second, read-only window for a table screen; it mirrors
  the controller over a `BroadcastChannel`.
- **Demo play** — meters increment automatically while the table is open, with
  `+1` / `+10` / `+100` wager buttons for manual testing.
- **Award history** — recent hits are logged in the controller (last 50 kept).

## Quick start

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

| Script            | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Dev server with hot reload                 |
| `npm run build`   | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally         |
| `npm run lint`    | Lint with oxlint                           |

## Using it

- The main window is the sign. `F` toggles fullscreen.
- `S` or the gear button opens the controller; `Esc` closes it.
- **Sign window** opens the sign in its own read-only window — put it on a TV and
  keep the controller on the laptop. Same browser only; press `F` there too.
- **Table** sets the wordmark, table ID, side wager, currency and decimals, and
  whether the table is open and the title shown.
- **Logo** uploads a custom logo (replacing the hero cards) or lets you choose the
  two cards.
- **Meters & payouts** edits each meter: label, type, current value, reset seed,
  share of each side wager, must-hit cap, visibility, ordering, and
  **Award / reset**. Rows expand one at a time.
- **Live play (demo)** toggles automatic increments and adds manual wagers.
- **Look** recolours the sign; **Backup** exports/imports JSON or restores the
  sample table.

Configuration and award history are saved in the browser under the versioned keys
`blackjack-match-config-v1` and `blackjack-match-hits-v1`. Use **Export JSON** to
back up or move a setup to another machine.

## How it is built

React 19 + TypeScript + Vite, with a single plain stylesheet and no UI
dependencies.

```
src/
  App.tsx                     state, persistence, demo tick, controller/display roles
  engine.ts                   pure jackpot maths (wagers, must-hit, awards)
  sync.ts                     BroadcastChannel messages between windows
  types.ts                    AppConfig, Jackpot, HitRecord, theme keys
  defaultConfig.ts            sample table and storage keys
  format.ts                   money formatting helpers
  index.css                   sign, controller and responsive layout
  components/
    DisplayBoard.tsx          the sign
    AdminPanel.tsx            the operator controller
    PlayingCard.tsx           inline SVG cards
```

Sign typography and spacing use container query units (`cqh`), so the whole sign
scales to its own box rather than the viewport. See `AGENTS.md` for the conventions
this project follows.

## Notes

- No test runner is configured; `npm run build` (type-check plus bundle) is the
  check used for changes.
- Fonts are loaded from Google Fonts in `index.html`; the app works without them
  but falls back to system faces.
