# Architecture

## Runtime and boundaries
React + TypeScript + Vite form a client-only application. CSS supplies the initial aesthetic. Vitest runs pure-engine tests in Node and UI tests in jsdom. TypeScript strict checking runs before production builds. No backend or database exists.

| Path | Responsibility |
| --- | --- |
| `src/poker/types.ts` | Cards, suits, ranks and street vocabulary |
| `src/poker/deck.ts` | Validated 52-card deck, Fisher–Yates shuffle, seeded randomness and dealing |
| `src/poker/evaluate.ts` | Best-five evaluation of 5–7 cards, categories and lexicographic kickers |
| `src/poker/pots.ts` | Contribution layers, eligibility, unmatched refunds, split/odd-chip awards |
| `src/poker/engine.ts` | Four-seat session, immutable hand transitions, legal-action queries and validation |
| `src/poker/index.ts` | Public domain API |
| `src/state/session.ts` | Session creation, human/AI actions, seeded next hands, history and visibility |
| `src/state/lobby.ts` | Retained foundation lobby helper |
| `src/ai/` | Three opponent policies and sampled equity from private/public observations |
| `src/ui/` | Playable bunker table, accessible controls, card components, animations and diagnostic simulator |
| `src/assets/` | Original SVG bunker/portraits, procedural materials and provenance |
| `src/main.tsx` | Browser entry point |

Poker modules import no React, DOM, storage, network or desktop APIs. UI dispatches actions and renders results; it does not decide poker outcomes. Each transition validates its input, clones it, applies a command, validates the result and returns a new snapshot. Failed actions leave inputs unchanged. Snapshots are ordinary serializable data; callers must not mutate them. `validateGame` rejects malformed cards, inconsistent phases, impossible actors, invalid stacks and chip-conservation violations.

## API and state machine
`createGame()` creates four seats with 1,000 chips each and fixed 10/20 blinds. `startHand(game, { random })` deals and posts blinds. Inject `seededRandom(seed)` for repeatable simulations; a complete ordered `deck` is supported for deterministic test scenarios only.

Phases are `ready → preflop → flop → turn → river → showdown`. A sole survivor ends a hand in `complete` on any street. Showdown evaluates and pays pots immediately; `showdown` and `complete` are resolved states, with no actor. `startHand` rotates the button to the next funded seat. Two funded seats use heads-up positions. When fewer than two funded seats remain, attempting another hand raises a session-finished error.

`act(game, seat, action)` enforces the current actor and legal fold/check/call/bet/raise/all-in actions. Bet and raise amounts use **street totals**, not increments. `legalActions(game)` describes available actions and amount ranges. `committed` records total contributions across streets; `streetBet` resets per street. `actedAt` records the wager level at the player's last action, supporting cumulative short-raise reopening. The engine automatically burns/deals between rounds and runs out the board when no further betting is possible.

`results` contains each pot, eligible seats, tied winners and exact awards. `refunds` records unmatched contributions. Settled commitments are zero; stacks include payouts/refunds. Player statuses at settlement describe their last hand participation (including all-in), not current funding; the next hand rebuilds statuses from stacks.

`observe(game, seat)` returns detached public information plus only that seat's hole cards. It omits the deck, burn cards and every other seat's hole cards, even at showdown. The implemented AI uses this observation, never the full engine snapshot. The optional diagnostic simulator controls every seat and exposes its own separate sandbox cards; it does not affect the playable session.

```ts
import { createGame, startHand, seededRandom, legalActions, act } from './src/poker';
let game = startHand(createGame(), { random: seededRandom(42) });
const options = legalActions(game);
if (game.actor !== null && options.call !== null) {
  game = act(game, game.actor, { type: 'call' });
}
```

## Future integration
Keep timers, sounds, statistics and animations outside poker transitions. Add modes through validated configuration. Optional local persistence should use a versioned adapter. Vite uses relative asset paths for eventual Windows packaging; a wrapper, installer, security configuration and Windows-native validation remain future work.

## Validation
`npm run test` runs all tests once; `npm run typecheck` checks TypeScript; `npm run build` checks types and builds `dist`; `npm run check` runs tests and build together. Engine suites cover categories/kickers, wheel straights, ties, all-ins, short/cumulative reopening, street transitions, folded dead money, side pots/refunds, odd chips, heads-up play, elimination, privacy and invalid commands/states. Seeded stress tests exercise 150 random-action hands and 50 complete elimination sessions and 100 short-stack scenarios.

## Playable session and opponents

`createSession(seed)` starts a four-seat game. `humanAction`, `computerAction`, and `nextHand` return new session objects. Deck and decision random streams derive from the session seed, hand number and revision, enabling reproducible tests without mutable RNG state. History records public actions, phase changes, blinds, awards and refunds; it never records hole cards. The visible tactical feed shows the latest 80 entries.

`decide` consumes only an `observe` result, public betting events and injected randomness. It estimates equity using 24 unknown-card samples against remaining participants. Cautious, aggressive and balanced policies have distinct call margins, value-raise thresholds, bluff frequencies and pot-relative sizing. Pressure from recent same-street aggression and the fraction of available chips required to call influence decisions. Every amount is clamped to the engine's legal ranges; closed raising rights prevent raises. These are heuristic opponents, not an optimal poker solver or learned models.

React schedules one opponent action at a time, normally 650 ms apart, and cleans up the timeout whenever the session changes, restarts, or unmounts. AI uses no hidden state through React. Unexpected errors halt scheduling and show a retry control rather than looping silently. StrictMode tests verify one action per scheduled turn. Human controls are enabled only for seat 0's turn.

`visibleCards` permits human cards throughout a hand and non-folded opponents at showdown only. Folded cards and uncontested winners stay hidden. Betting results and revealed hand names are rendered after engine settlement. The single-player UI ends on human elimination or human victory; the underlying engine also supports continuing remaining seats separately.

Card rendering, card CSS, animation keyframes, procedural texture CSS and game logic live in separate modules. Reduced-motion preferences disable animations. Session state and history are in memory only; refreshing or restarting clears them. No extra dependency, service, account or persistent storage was added.

The playable milestone passes 74 tests across nine files, including 12 full single-player sessions and 20 opponent-policy hands in addition to prior engine stress tests. Chromium development/production each pass a reproducible 22-hand session through the actual UI. Native Windows and human usability/difficulty testing are separate outstanding checks.

## QA invariants and regressions

The current QA pass adds deterministic stress and exhaustive five-card category tests to the normal `npm run check` suite (88 tests total). `src/poker/stability.test.ts` completes 1,464 hands, including at least 1,200 prescribed four-seat starts plus elimination sessions, and validates each transition and settlement ledger. `src/poker/evaluation-histogram.test.ts` compares all five-card category counts with independent combinatorial totals. See QA_REPORT.md for exact recorded counters and browser/manual scope.

Seeded randomness uses bounded 32-bit Mulberry32 state so long streams retain precision. Snapshot validation verifies blind positions against participants who were dealt into the current hand, including all-in seats that now have zero chips. Settled snapshots require pot results and unique refund entries.

Betting events optionally carry `wagerIncreased`. Session-generated events set it explicitly, distinguishing all-in calls from all-in raises. AI uses the flag for aggression pressure; legacy ordinary bet/raise events remain supported without it. No hidden information crosses this boundary.

The table obtains last seat actions with one backwards scan restricted to the current hand, and uses one shared restart handler. Regression tests verify that pending timers are cancelled on restart/unmount and that no polling timer exists during a human turn. Layout, rule conventions and independent module boundaries remain unchanged.

## v0.2 presentation architecture

The playable interface is split into TableScene, PlayerPanel, PlayingCard, Chips, Controls and ActionHistory components. Material assets, component CSS, animation keyframes and shared theme tokens are separate. See VISUAL_DESIGN.md for the module map, asset sources and tested layouts. App retains the existing session/AI timer flow and adds only an independent cosmetic Animations preference. No poker, AI or session modules were modified; baseline checksums were verified.

The visual suite passes 99 tests plus type checking/build. CSS effects never dispatch game actions or gate progress. Denomination breakdown is display-only; the engine continues to use integer chip balances. Portraits and bunker SVGs are original local assets; no dependency was added.
