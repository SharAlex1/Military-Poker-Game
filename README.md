# Outpost Poker

An original single-player military-themed Texas Hold’em game for Windows browsers. One human will face three computer opponents using fictional chips only. No real-money gambling, backend, database, account or game engine is required.

**Current status:** independently testable no-limit Hold’em engine plus a minimal browser simulator. The final table UI and autonomous opponent strategies are not implemented.

## Requirements
Node.js 22.12 or newer and npm. Node 24 is recommended. Use a modern Windows browser such as Edge, Chrome or Firefox.

## Install and launch
From the project directory:

```sh
npm ci
npm run dev
```

Open the address printed by Vite in your browser, normally `http://localhost:5173`. Stop the server with Ctrl+C. On Windows these commands work in PowerShell from the repository folder. If npm's cache is unwritable, use `npm ci --cache <writable-cache-directory>`.

## Checks and production build

```sh
npm run test
npm run typecheck
npm run build
```

`npm run check` runs the tests and production build together. `npm run test:watch` watches tests. Production output goes to `dist/`. To inspect that output locally, run `npm run preview` and open Vite's printed address. Preview is for local verification.

## Project map
- `src/poker`: deck, evaluation, betting state machine, pots and independent engine API.
- `src/state`: lobby and future game state.
- `src/ai`: opponent profiles and future strategies.
- `src/ui`: React roster, diagnostic simulator and CSS.
- `src/assets`: future licensed/original graphics and audio.

Read [GAME_DESIGN.md](GAME_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), and [AGENTS.md](AGENTS.md) before development. The frontend has relative build assets and isolated domain modules to support a future Windows wrapper. No desktop package exists yet.

The GitHub repository currently retains its `Military-Poker-Game` repository name; the application is named **Outpost Poker**.

## Demonstrate the rules engine

Launch with `npm run dev` and scroll to **Rules engine simulator**:

1. The seeded four-seat hand starts with the dealer, blinds, cards and current actor shown.
2. Use Fold, Check, Call, All-in, or enter a **street total** and submit Bet/Raise. Disabled controls indicate unavailable actions; invalid amounts produce an error without changing the hand.
3. **Call/check to showdown** finishes the hand with passive actions and displays individual pot payouts and unmatched refunds.
4. **Next hand** rotates the button using the remaining stacks. **Reset simulation** restores four 1,000-chip stacks using the shuffle seed.

This is a developer tool: all hole cards are visible and you control every seat. It does not pretend to implement AI. The engine defaults to fixed 10/20 blinds, moving-button rotation and clockwise odd-chip awards; see GAME_DESIGN.md for detailed conventions and ARCHITECTURE.md for the standalone API. Domain tests run without a browser, React rendering, backend or database.

Engine checks cover hand rankings/kickers/ties, betting transitions, minimum and short raises, all-ins, side pots, odd chips, refunds, heads-up rules, elimination, chip conservation and AI-safe observations. The suite also simulates 150 random-action hands and 50 complete seeded sessions and 100 short-stack scenarios. All chips remain fictional.
