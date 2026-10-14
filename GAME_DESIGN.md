# Outpost Poker — Game design

## Vision and scope
An original single-player Texas Hold’em game for Windows, initially played in a browser. A fictional military outpost's recreation bunker provides an olive, charcoal and brass atmosphere. Use original visuals and fictional characters; do not copy military-game art, branding or characters.

One human plays against three future computer opponents. All chips are fictional: no purchases, deposits, cash-out, real-money wagers or monetary rewards. No accounts, backend or database are required.

## Implemented rules
- Standard no-limit Texas Hold’em with a 52-card deck, two private cards per funded seat, five community cards and the best five-card hand from seven available cards.
- Hands rank high card, pair, two pair, trips, straight, flush, full house, quads and straight flush. A royal flush is an ace-high straight flush. Aces are high or low in a five-high wheel; suits never break ties.
- Four fixed seats start with 1,000 chips each. Default blinds are 10/20 and remain fixed throughout a session; validated custom blinds/stacks support simulations. No antes, straddles or rebuys.
- The first dealer is seat 0 by default. Cards are dealt singly clockwise, left of the button first, in two passes. A card is burned before flop, turn and river.
- The button moves clockwise to the next funded seat after each hand, skipping eliminated seats (moving-button convention). At three/four players the next two funded seats post small/big blinds. Heads-up, the dealer posts the small blind and acts first preflop; the big blind acts first postflop.
- Preflop starts after the big blind, retaining the big blind's option after limpers. Postflop starts left of the button. Folded and all-in seats are skipped.
- Fold, check, call, bet, raise and all-in are legal only on the player's turn. Checks require no outstanding call. A short call uses the entire remaining stack. Bets/raises specify the total contribution on that street.
- Minimum opening bet is one big blind. A full raise increases the current wager by at least the last full raise increment, initially the big blind. A smaller raise is legal only when all-in and does not change the minimum increment. An incomplete postflop all-in opening may be raised by a full big-blind increment (for example 5 to 25 with a 20 big blind); it is not completed merely to 20.
- A player who already acted cannot raise again after a short increase unless cumulative increases since their last action reach a full raise. A prior checker can raise a short opening all-in. Unacted players retain raising rights. No side betting is allowed when only one non-all-in player remains; that player may still owe a call/fold decision.
- Contribution layers determine main and side pots. Folded money remains in the pots but folded seats cannot win. Unmatched amounts are refunded at hand settlement. Each pot is awarded independently to its best eligible hand and split equally on ties. Odd chips go clockwise from the seat left of the button, one per tied winner until exhausted.
- A sole survivor receives the pots immediately without revealing additional board cards. Otherwise the engine automatically runs out the board when betting is no longer possible, evaluates showdown and pays chips. The next hand begins explicitly. One funded seat ends the session.

## Opponents
Rook is planned to be disciplined and patient; Viper aggressive with selective bluffs; Anchor measured and observant. These are profile descriptions only. The engine labels one human and three computer seats but does not supply computer decisions. Future AI must consume its own cards plus public information from `observe`, never the full snapshot or opponents' private cards.

## Current experience and expansion
The original roster remains, with a rules simulator beneath it. The simulator deliberately shows all hole cards and lets the developer control every seat, submit bets, finish hands by calling/checking, rotate the button, and reset seeded sessions. It is a diagnostic interface, not the final single-player experience.

Prioritize readable cards, legal actions, visible chip amounts, keyboard access and responsive layouts when building that experience. Animations, optional sound, local statistics and configurable modes remain later work. A future Windows package may use Tauri or Electron; no wrapper is selected or tested yet.
