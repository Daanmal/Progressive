# Blackjack Match Progressive

Casino-style table display for a Blackjack progressive jackpot, with a live controller for meters, must-hit progressives, and fixed payouts on weaker hands.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Use

- The main screen is the vertical table sign.
- Click the gear (bottom right) or press `S` to open settings.
- Press `F` for fullscreen.
- **Table open** starts demo increment while auto-play is on.
- Add **Progressive**, **Must-hit**, or **Fixed payout** rows as needed.
- Hidden by default: an **Unsuited Blackjack** fixed $50 example. Enable it in settings to show a set payout for a weaker hand.

Configuration is saved in the browser (`localStorage`) and can be exported/imported as JSON.
