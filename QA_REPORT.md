# Outpost Poker — QA and stability report

QA pass: October 14, 2026. Scope: existing rules, AI, sessions, UI and dependencies. No new gameplay features or visual redesign.

## Results

- `npm run check`: **88 tests passed across 11 files**, strict TypeScript passed, Vite production build passed.
- `npm audit --json --cache /tmp/outpost-poker-npm-cache`: **zero known vulnerabilities** reported for the locked dependencies. No dependency upgrades or new packages were needed.
- `npm run test -- src/poker/stability.test.ts --reporter=verbose --silent=false`: **1,464 complete hands**, including **1,306 hands starting with four funded seats**. No action bounds were exceeded; all observed snapshots passed validation and conserved chips.
- `src/poker/evaluation-histogram.test.ts`: every one of the **2,598,960 possible five-card hands** was evaluated; aggregate category frequencies matched standard combinatorial counts. Existing exact ranking, kicker, wheel and seven-card selection tests remain in place.
- `src/ai/strategy.test.ts`: **100 complete hands** with all three real policies, using only permitted observations. Existing 12 full single-player sessions and prior engine tests also passed.

## Simulation coverage

| Scenario | Complete hands |
| --- | ---: |
| Mixed legal actions, equal starting stacks | 250 |
| Mixed legal actions, unequal starting stacks | 250 |
| Unequal-stack all-ins | 250 |
| Forced shared-board ties with side pots | 250 |
| Consecutive split-pot hands preserving four funded seats and rotating dealers | 200 |
| 100 unequal-stack sessions through elimination | 264 |
| **Total** | **1,464** |

Counters recorded 3,364 all-in actions, 1,021 hands with side pots, 507 hands with split pots, 1,373 elimination events and 314 dealer rotations. Session tests explicitly observed tables with four, three, two and one funded seat.

Each transition checks safe nonnegative stacks, conservation of the original chip total, valid actors, and unchanged input snapshots. Settlement checks use a separate contribution ledger to verify every player's final stack, total awards plus refunds, eligible winning hands and equal tie shares. Tests fail on excessive turns or sessions; no zero-test or skipped-run result is counted as validation. Deterministic forced ties supplement random cases so critical branches cannot disappear due to seed luck.

## Bugs fixed

1. **All-in calls incorrectly counted as aggression.** Public history now records whether an action increased the wager. AI distinguishes short/all-in calls from actual bets and raises. No private card information was added.
2. **Misleading closed-raise UI hint.** When it is the human's turn but raising is unavailable, the panel now says “Bet/raise unavailable this turn,” while legal calls/checks remain enabled.
3. **Long PRNG streams lost integer precision.** The seeded Mulberry32 state now wraps to 32 bits on every draw. A five-million-draw checkpoint regression fails on the former implementation and passes after the fix; ordinary seeded replays are preserved.
4. **Snapshot validation gaps.** Dealer/blind mismatches, missing settlement results and duplicate refunds are rejected. Valid engine transitions and established rule conventions are preserved.

Duplicate restart handlers were consolidated and four full-history copies per table render were replaced with one scan of the current hand's actions. No poker accounting defect or infinite-turn loop was observed in the completed simulations.

## Browser verification

Automated Chromium checks passed against both Vite development and production preview servers. Each completed a reproducible 22-hand single-player session via real controls with an accelerated timer clock. Checks covered legal/invalid wager controls, automatic opponents, folded-card privacy, showdown reveals, payout totals, exactly 4,000 chips at hand boundaries, new hands, terminal sessions and restart. Additional checks verified restart just before an opponent timeout, isolation of the diagnostic sandbox, keyboard entry of invalid/valid amounts, no horizontal overflow on narrow screens, 1366×768 control visibility, reduced motion and absence of runtime exceptions.

Timer tests verify cleanup on unmount, no stale actions after restart, one scheduled action in StrictMode, and **no AI polling timer while waiting for human input**. Browser automation was run in the cloud's Linux Chromium environment; it does not establish native Windows or other-browser compatibility. Temporary QA servers were stopped after verification.

## Still requires manual playtesting

- Native Windows Edge and Firefox; latest Windows Chrome with this patch.
- Full keyboard-only and screen-reader usability, including focus after phase/result changes.
- Animation comfort, display scaling and readability across real monitors.
- Long human sessions and opponent difficulty/balance; strategies remain approximate heuristics.

Known scope limitations remain unchanged: fixed blinds, in-memory sessions, no audio, statistics, extra modes or Windows installer. Audit results and deterministic simulations provide evidence for this version, not a guarantee against every future dependency issue or undiscovered gameplay defect.

## v0.2 visual regression verification

The visual upgrade retains all QA suites above. **99 tests across 12 files**, TypeScript and production build passed. Domain-source checksums verify that poker, AI and session logic are unchanged. New tests cover exact denomination totals, bounded decorative chip counts and animation preferences leaving session state/timers untouched. Development and production Chromium passed target desktop/narrow layouts, portrait loading, privacy, cosmetic-event isolation, reduced motion and complete 22-hand sessions. See VISUAL_DESIGN.md for the full visual verification scope. Native Windows and human visual/accessibility checks remain pending.
