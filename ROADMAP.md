# Roadmap

## Milestone 0 — Project foundation
- [x] React, TypeScript, Vite and CSS application.
- [x] Separate poker, state, AI, UI and asset modules.
- [x] Bunker-themed placeholder for one human and three computer seats.
- [x] Project documentation and future-agent instructions.
- [x] Vitest tests, type-check and production build commands.
- [x] Verify checks and launch; create the initial local commit.

## Milestone 1 — Poker engine
- [ ] Decide blind progression, odd-chip distribution and session end conditions.
- [ ] Seedable shuffle, dealing, hand evaluation and ranking tests.
- [ ] Legal betting, turn order, blinds and street transitions.
- [ ] All-ins, side pots, ties, payouts and heads-up rules with tests.

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

Gameplay is intentionally outside the foundation milestone. Record validation results and remaining limitations here as milestones progress.

## Foundation validation

Three Vitest tests passed across two files. Strict TypeScript checking and Vite production build passed. Chromium smoke checks passed against both development and production preview servers: title, four seats, disabled deal button, narrow viewport without horizontal overflow, and no runtime errors. Windows-native browser testing and desktop packaging are not yet performed.
