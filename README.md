# Outpost Poker

An original single-player military-themed Texas Hold’em game for Windows browsers. One human will face three computer opponents using fictional chips only. No real-money gambling, backend, database, account or game engine is required.

**Current status:** project foundation only. The bunker-themed screen displays four seats; dealing and gameplay are deliberately unavailable.

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
- `src/poker`: pure poker vocabulary and future rules.
- `src/state`: lobby and future game state.
- `src/ai`: opponent profiles and future strategies.
- `src/ui`: React components and CSS.
- `src/assets`: future licensed/original graphics and audio.

Read [GAME_DESIGN.md](GAME_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), and [AGENTS.md](AGENTS.md) before development. The frontend has relative build assets and isolated domain modules to support a future Windows wrapper. No desktop package exists yet.

The GitHub repository currently retains its `Military-Poker-Game` repository name; the application is named **Outpost Poker**.
