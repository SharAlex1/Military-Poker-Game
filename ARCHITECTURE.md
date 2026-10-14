# Architecture

## Runtime
React + TypeScript + Vite form a client-only application. CSS supplies the initial aesthetic. Vitest with jsdom and Testing Library validates state and rendered UI. No backend or database exists. TypeScript strict checking runs before production builds.

## Module boundaries
| Path | Responsibility |
| --- | --- |
| `src/poker/` | Pure card vocabulary; future deck, hand evaluation, betting rules and payouts |
| `src/state/` | Fresh lobby construction; future hand transitions and session orchestration |
| `src/ai/` | Opponent profiles; future decisions from filtered observations |
| `src/ui/` | React presentation, input controls, accessible feedback and CSS |
| `src/assets/` | Original or licensed images, fonts and sound with provenance |
| `src/main.tsx` | Browser entry point |

Domain modules must not import React, browser APIs, or platform wrappers. State may consume poker rules and AI results; AI may consume poker types and legal-action helpers. UI renders state and dispatches commands, rather than deciding poker outcomes. AI input must exclude opponents' private information. Introduce seeded randomness at the engine boundary for reproducible tests.

## Current implementation
`createLobby` produces independent seat objects for one human and three named opponents. `App` renders their starting fictional-chip balances and clearly labels gameplay unavailable. Poker types establish vocabulary only. There are no live hand transitions or betting actions.

## Planned evolution
Use explicit action and event types and a pure transition function for hand state. Keep effects such as timers, sounds, statistics and animations outside that transition. Add modes through validated configuration rather than UI branches. Put optional local persistence behind a versioned adapter. Define platform adapters when needed for packaged storage or window integration.

Vite uses a relative asset base for eventual packaging. This is a packaging prerequisite, not proof of desktop compatibility. A Windows wrapper, security settings, installer, licensing review, and native smoke tests remain future work.

## Validation
`npm run test` runs existing tests once; `npm run typecheck` validates TypeScript; `npm run build` checks types and builds `dist`; `npm run check` runs tests and build together. Future engine tests must cover hand rankings, betting legality, side pots, all-ins, split pots, and information isolation before claiming gameplay works.
