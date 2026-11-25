# AGENTS.md

Project instructions for coding agents working in this repo.

## What this is

A casino-style table sign for a Blackjack progressive jackpot,
built to reproduce the physical sign in `images.jpg`: two hero cards, a stacked
logo, a vertical list of jackpot plaques, a table open/closed line, and a footer
with the progressive wager and table ID.

It ships an operator controller (gear button or `S`) for editing meters, awarding
jackpots, resetting seeds, theming, presets, and JSON import/export. Fixed-kind
jackpots can render as a Hand / Pays payout table above the table status line.
Everything lives in the browser: there is no backend, account, or network call.

## Stack and commands

- React 19 + TypeScript + Vite; styles are a single plain CSS file (`src/index.css`).
- `npm run dev` — dev server (Vite, `http://localhost:5173`).
- `npm run build` — `tsc -b && vite build`; this is the check to run before finishing.
- `npm run lint` — oxlint (`.oxlintrc.json`).
- No test runner is configured; do not add one unless the task needs it.

## File layout

- `src/App.tsx` — state owner: config + award history, persistence, demo tick,
  keyboard shortcuts, controller/display roles.
- `src/engine.ts` — pure money logic: `applyWager`, `hitJackpot`, `tickDemo`.
- `src/types.ts` — `AppConfig`, `Jackpot`, `HitRecord`, theme keys.
- `src/defaultConfig.ts` — sample table, storage keys.
- `src/presets.ts` — built-in sign presets (name, blurb, full `AppConfig`).
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
- Presets in `src/presets.ts` are complete configs built from `defaultConfig`
  with the `progressive` / `mustHit` / `fixed` jackpot factories; adding one is
  an entry in `presets` only. Applying one replaces meters, theme and table
  details but keeps the operator's uploaded `logo`.
- `AppConfig.fixedPayoutsAtBottom` (default `true`) renders visible `fixed`
  jackpots as a two-column payout table (`.payouts`: Hand / Pays) directly above
  the table status line and wager footer, instead of as plaques; the table is
  omitted when none are visible.
- `AppConfig.logo` (optional) is an operator-uploaded data URL capped at 1 MB that
  replaces the two hero cards. It is excluded from high-frequency sync messages and
  broadcast as its own `logo` message so meter ticks stay small.
- Persistence keys are versioned (`blackjack-match-config-v1`,
  `blackjack-match-hits-v1`); changing the config shape needs a new key or a
  migration. Writes are debounced 400ms.

## Screen layout

- The board is a query container (`.board`) and the sign is one too (`.sign`). Sign
  typography and spacing are in `cqh` units so the whole sign scales to its box
  instead of the viewport; keep new sizes container-relative.
- Portrait boards (< 1:1) keep the original vertical sign. Square-or-wider boards
  (16:9 TVs, laptop windows) switch to a grid: brand left and meters right, then
  the payout table and table status as full-width rows, with the wager/table
  footer across the bottom.
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

## Handoff · current state (2026-11-24)

Resume point for continuing this project on another machine. Nothing is
half-finished: there are no `TODO`/`FIXME` markers in `src/`.

**Landed** in commit `72824eb` ("Update 15.11.2026"): the widescreen
container-query sign layout, the two-column controller, logo upload, the
read-only sign window (`?mode=display`), must-hit and fixed meter kinds, and
JSON export/import.

**Uncommitted as of 2026-11-24**: the fixed-payout table —
`AppConfig.fixedPayoutsAtBottom` (default `true`), the `.payouts` Hand/Pays
table and its CSS, and the controller checkbox under **Meters & payouts** — plus
three built-in presets in `src/presets.ts` shown as cards in the controller.
The old **Restore sample** button is gone; the Blackjack Match preset replaces it.
`npm run build` and `npm run lint` pass with all of it in the tree.

**Verified on 2026-11-24** (Node 20+, clean `npm ci`):

- `npm run build` — passes (`tsc -b` + Vite bundle, 25 modules).
- `npm run lint` — passes with 0 warnings.
- `npm run dev` — served on the chat preview port and checked in the browser at
  portrait and 16:9 sizes: the Hand / Pays table and all three presets were
  exercised. Those screenshots live in `artifacts/` and are not committed.

### Continuing on another device

```bash
npm ci          # Node 20 or newer; install from the lockfile, do not upgrade
npm run dev     # http://localhost:5173
npm run build   # the check to run before finishing
```

State lives in browser `localStorage`, not in the repo, so a fresh machine starts
from the sample table. Use **Export JSON** in the controller to carry an operator
setup across machines, then **Import JSON** on the other one.

The reference photo of the physical sign (`images.jpg`) is **not** committed. If
more visual matching work is needed, ask the user for that image again.

### Known gaps and ideas not yet built

None of these are commitments; they are the obvious places to pick up.

- The sign window is same-browser only (`BroadcastChannel`): no cross-device
  sync, no backend, no accounts. A second machine cannot drive a table screen.
- `AppConfig.logo` is a data URL in `localStorage`; a logo near the 1 MB cap can
  crowd the ~5 MB origin quota, and it is re-broadcast whole to the sign window.
- No automated tests are configured; `npm run build` plus a manual look is the
  current check. Adding a runner is fine if a change actually needs one.
- Controller numeric inputs are unvalidated: negative values are accepted and
  `formatMoney` clamps them to 0 only at render time.
- `src/index.css` is one long stylesheet. Split it only if it starts to hurt;
  keep new sign sizes in `cqh` and new colours in `ThemeConfig`.
