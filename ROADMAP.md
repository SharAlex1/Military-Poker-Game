# Roadmap

## Milestone 0 — Project foundation
- [x] React, TypeScript, Vite and CSS application.
- [x] Separate poker, state, AI, UI and asset modules.
- [x] Bunker-themed placeholder for one human and three computer seats.
- [x] Project documentation and future-agent instructions.
- [x] Vitest tests, type-check and production build commands.
- [x] Verify checks and launch; create the initial local commit.

## Milestone 1 — Poker engine
- [x] Choose fixed 10/20 blinds, clockwise odd chips, moving button and last-funded-seat session end.
- [x] Seedable shuffle, dealing, hand evaluation and ranking tests.
- [x] Legal betting, turn order, blinds and street transitions.
- [x] All-ins, side pots, ties, payouts and heads-up rules with tests.
- [x] Independent API and all-seat debug simulator.

## Milestone 2 — Playable single-player table
- [ ] Hand/session state orchestration and legal human actions.
- [ ] Baseline AI using private/public information boundaries.
- [ ] Complete four-seat hand, elimination and restart flows.
- [ ] Functional gameplay tests and manual browser validation.

## Milestone 3 — Character and presentation
- [ ] Distinct, tested opponent strategies.
- [ ] Card art, animations, optional sound and accessibility polish.
- [ ] Local statistics and additional configurable game modes.

## Milestone 4 — Windows release
- [ ] Select desktop wrapper and platform adapters.
- [ ] Package, installer, offline startup, Windows smoke tests.
- [ ] Asset licensing review and release documentation.

The rules engine milestone is complete. Final human-facing gameplay with autonomous opponents remains in Milestone 2. Record validation results and limitations as milestones progress.

## Foundation validation

Three Vitest tests passed across two files. Strict TypeScript checking and Vite production build passed. Chromium smoke checks passed against both development and production preview servers: title, four seats, disabled deal button, narrow viewport without horizontal overflow, and no runtime errors. Windows-native browser testing and desktop packaging are not yet performed.

## Rules engine validation

59 automated tests passed across seven files, including 150 seeded random-action hands and 50 seeded sessions through elimination and 100 short-stack scenarios. TypeScript and Vite production build passed. Chromium simulator smoke checks passed on development and production preview: rejected/accepted raises, showdown, 4,000-chip conservation, next hand, reset, narrow-screen layout and no runtime errors. Computer decision strategies, the final table experience, sound/statistics, persistence and Windows packaging remain unimplemented.
