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
- [x] Hand/session state orchestration and legal human actions.
- [x] Baseline AI using private/public information boundaries.
- [x] Complete four-seat hand, elimination and restart flows.
- [x] Automated full-session and Chromium browser gameplay validation.
- [ ] Human Windows-browser and accessibility playtesting.

## Milestone 3 — Character and presentation
- [x] Distinct, tested cautious, aggressive and balanced opponent strategies.
- [x] Original CSS bunker/felt textures, professional cards, fictional identity placeholders and reduced-motion animations.
- [ ] Optional sound and accessibility release polish.
- [ ] Local statistics and additional configurable game modes.

## Milestone 4 — Windows release
- [ ] Select desktop wrapper and platform adapters.
- [ ] Package, installer, offline startup, Windows smoke tests.
- [ ] Asset licensing review and release documentation.

The rules engine and playable single-player milestone are implemented. Windows-native/manual release validation and the remaining presentation/packaging features are still outstanding. Record validation results and limitations as milestones progress.

## Foundation validation

Three Vitest tests passed across two files. Strict TypeScript checking and Vite production build passed. Chromium smoke checks passed against both development and production preview servers: title, four seats, disabled deal button, narrow viewport without horizontal overflow, and no runtime errors. Windows-native browser testing and desktop packaging are not yet performed.

## Rules engine validation

59 automated tests passed across seven files, including 150 seeded random-action hands and 50 seeded sessions through elimination and 100 short-stack scenarios. TypeScript and Vite production build passed. Chromium simulator smoke checks passed on development and production preview: rejected/accepted raises, showdown, 4,000-chip conservation, next hand, reset, narrow-screen layout and no runtime errors. Computer decision strategies, the final table experience, sound/statistics, persistence and Windows packaging remain unimplemented.

## Playable single-player validation

74 tests pass across nine files. New coverage includes distinct policy sizing, equity/ties, betting-history and chip-risk responses, closed raising rights, information boundaries, 20 complete hands and 12 complete single-player sessions against all three policies. UI tests cover checks/calls/raises/folds/all-ins, automatic turns, StrictMode scheduling, restart, payouts, showdown privacy, elimination/victory and next hands. All prior rules-engine tests remain intact. TypeScript and production build pass. Chromium development and production preview each completed a reproducible 22-hand single-player session via the actual betting UI (with accelerated timer clock). Browser checks verified disabled invalid raises, automatic opponents, privacy/showdown reveals, exact 4,000-chip conservation at hand boundaries, next hands, victory/elimination termination, restart, 1366×768 control visibility, narrow-screen width, reduced motion and no runtime errors.

Remaining limitations: heuristic (non-optimal) AI, fixed blinds, no audio, saved sessions, statistics, extra modes or desktop installer. Native Windows Edge/Firefox, screen-reader/keyboard usability, animation comfort and strategic balance still require manual verification.

## QA and stability pass

- [x] Review rules, deck/evaluation, pots, AI, session flow, UI scheduling and locked dependencies.
- [x] Add deterministic 1,000+ hand stress coverage and independent settlement-ledger checks.
- [x] Verify 1,464 complete hands (1,306 four-funded-seat starts), side/split pots, all-ins, elimination and dealer rotation.
- [x] Verify all 2,598,960 five-card category frequencies.
- [x] Fix all-in-call aggression history, closed-raise hint, long-stream RNG precision and snapshot validation gaps.
- [x] Consolidate restart handling and avoid repeated history copies during rendering.
- [x] Pass 88 tests, TypeScript, production build, dependency audit and development/production Chromium QA.
- [ ] Complete native Windows/other-browser, screen-reader and human difficulty/comfort playtesting.

No new gameplay features or redesign were introduced. See [QA_REPORT.md](QA_REPORT.md) for reproducible test commands, exact coverage, fixes and manual limitations. Earlier milestone sections record historical validation; this pass is the current validation result.
