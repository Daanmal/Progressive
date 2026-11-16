# AGENTS.md

Project instructions for coding agents working in this repo.

## What this is

A casino-style table sign for a Blackjack progressive jackpot,
built to reproduce the physical sign in `images.jpg`: two hero cards, a stacked
logo, a vertical list of jackpot plaques, a table open/closed line, and a footer
with the progressive wager and table ID.

It ships an operator controller (gear button or `S`) for editing meters, awarding
jackpots, resetting seeds, theming, and JSON import/export. Everything lives in
the browser: there is no backend, account, or network call.

## Stack and commands

- React 19 + TypeScript + Vite; styles are a single plain CSS file (`src/index.css`).
- `npm run dev` — dev server (Vite, `http://localhost:5173`).
- `npm run build` — `tsc -b && vite build`; this is the check to run before finishing.
- `npm run lint` — oxlint (`.oxlintrc.json`).
- No test runner is configured; do not add one unless the task needs it.

## Layout

- `src/App.tsx` — state owner: config + award history, persistence, demo tick,
  keyboard shortcuts, controller/display roles.
- `src/engine.ts` — pure money logic: `applyWager`, `hitJackpot`, `tickDemo`.
- `src/types.ts` — `AppConfig`, `Jackpot`, `HitRecord`, theme keys.
- `src/defaultConfig.ts` — sample table, storage keys.
- `src/format.ts` — `formatMoney` (thousands separators, fixed decimals), `uid`.
- `src/components/DisplayBoard.tsx` — the sign itself; publishes theme colors as
  CSS custom properties (`--bg`, `--gold`, `--plaque-*`, ...) consumed in CSS.
- `src/components/AdminPanel.tsx` — operator controller.
- `src/components/PlayingCard.tsx` — inline SVG playing cards.

## Conventions

- Keep engine functions pure; do not call `Math.random` or touch React inside them
  except through the existing `random()` helper.
- Money is a plain number in the table's currency; always render it with
  `formatMoney(value, config.currencySymbol, config.decimals)`.
- New display colors go through `ThemeConfig` + the `--var` block in
  `DisplayBoard` so operators can recolor them from the controller.
- Jackpot kinds: `progressive` (climbs from wager volume, resets to seed on award),
  `must_hit` (same, but guaranteed to award before `mustHitBy`), `fixed` (constant
  payout, never incremented).
- Hidden meters (`enabled: false`) stay out of the sign but remain editable.
- `AppConfig.logo` (optional) is an operator-uploaded data URL capped at 1 MB that
  replaces the two hero cards. It is excluded from high-frequency sync messages and
  broadcast as its own `logo` message so meter ticks stay small.
- Persistence keys are versioned (`blackjack-match-config-v1`,
  `blackjack-match-hits-v1`); changing the config shape needs a new key or a
  migration. Writes are debounced 400ms.

## Layout

- The board is a query container (`.board`) and the sign is one too (`.sign`). Sign
  typography and spacing are in `cqh` units so the whole sign scales to its box
  instead of the viewport; keep new sizes container-relative.
- Portrait boards (< 1:1) keep the original vertical sign. Square-or-wider boards
  (16:9 TVs, laptop windows) switch to a grid: brand and table status on the left,
  meters on the right, wager/table footer across the bottom.
- The controller is a two-column grid of sections; meter rows are `<details>` with a
  name + amount summary so the panel fits without scrolling at 1080p. Keep new
  sections small enough to pair with a neighbour.

## Display mode

`?mode=display` runs the sign as a read-only window: no controller, no gear
button, no local incrementing and no writes to `localStorage`. It listens on the
`blackjack-match-sync-v1` BroadcastChannel for `state`/`hit` messages and asks
for the current state with `hello` on load. The controller (any normal tab)
broadcasts its config on change and every award. This is same-browser only —
it exists so the sign can run full screen on a second monitor or TV driven from
the controller window. Press `F` in either window for fullscreen.
