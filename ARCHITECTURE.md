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
| `src/state/` | Placeholder lobby; future presentation/session integration |
| `src/ai/` | Opponent profiles; future decisions from filtered observations |
| `src/ui/` | Original roster, React simulator and CSS |
| `src/assets/` | Original or licensed images, fonts and sound with provenance |
| `src/main.tsx` | Browser entry point |

Poker modules import no React, DOM, storage, network or desktop APIs. UI dispatches actions and renders results; it does not decide poker outcomes. Each transition validates its input, clones it, applies a command, validates the result and returns a new snapshot. Failed actions leave inputs unchanged. Snapshots are ordinary serializable data; callers must not mutate them. `validateGame` rejects malformed cards, inconsistent phases, impossible actors, invalid stacks and chip-conservation violations.

## API and state machine
`createGame()` creates four seats with 1,000 chips each and fixed 10/20 blinds. `startHand(game, { random })` deals and posts blinds. Inject `seededRandom(seed)` for repeatable simulations; a complete ordered `deck` is supported for deterministic test scenarios only.

Phases are `ready → preflop → flop → turn → river → showdown`. A sole survivor ends a hand in `complete` on any street. Showdown evaluates and pays pots immediately; `showdown` and `complete` are resolved states, with no actor. `startHand` rotates the button to the next funded seat. Two funded seats use heads-up positions. When fewer than two funded seats remain, attempting another hand raises a session-finished error.

`act(game, seat, action)` enforces the current actor and legal fold/check/call/bet/raise/all-in actions. Bet and raise amounts use **street totals**, not increments. `legalActions(game)` describes available actions and amount ranges. `committed` records total contributions across streets; `streetBet` resets per street. `actedAt` records the wager level at the player's last action, supporting cumulative short-raise reopening. The engine automatically burns/deals between rounds and runs out the board when no further betting is possible.

`results` contains each pot, eligible seats, tied winners and exact awards. `refunds` records unmatched contributions. Settled commitments are zero; stacks include payouts/refunds. Player statuses at settlement describe their last hand participation (including all-in), not current funding; the next hand rebuilds statuses from stacks.

`observe(game, seat)` returns detached public information plus only that seat's hole cards. It omits the deck, burn cards and every other seat's hole cards, even at showdown. Future AI must use this observation, never the full engine snapshot. The debug simulator intentionally controls every seat and exposes all hole cards; it is not an AI implementation or the final human-facing table.

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
