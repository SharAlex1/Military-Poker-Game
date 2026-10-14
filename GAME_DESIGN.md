# Outpost Poker — Game design

## Vision and scope
An original single-player Texas Hold’em game for Windows, initially played in a browser. A fictional military outpost's recreation bunker provides an olive, charcoal and brass atmosphere. Use original visuals and fictional characters; do not copy military-game art, branding or characters.

One human plays against three computer-controlled opponents. All chips are fictional: no purchases, deposits, cash-out, real-money wagers or monetary rewards. No accounts, backend or database are required.

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
- Rook, recon specialist: cautious; higher call/value-raise thresholds, smaller sizing and rare bluffs.
- Viper, assault lead: aggressive; wider calls, larger raises and more frequent selective bluffs.
- Anchor, watch commander: balanced; middle-ground thresholds, sizing and bluff frequency.

Each decision estimates strength from its own two cards, the board and sampled unknown cards. Pot odds, available chips and current-street betting history influence the action. AI never sees the actual engine deck, burn cards or another seat's private cards. Decisions must satisfy the existing engine's legal actions. Sampling and heuristic policies aim for varied, functional opponents; strategic difficulty/balance still needs human playtesting.

## Playable experience
The bunker table displays four fictional identities, original shield placeholders, cards, stacks, current bets, pot, dealer/blind markers, board and active seat. Human betting controls provide Fold, Check, Call, All-in, and a numeric Bet/Raise total. AI acts automatically, with a short delay for clear feedback. New hand retains stacks and rotates the button; Restart game restores four 1,000-chip stacks with a fresh shuffle.

Opponents' cards remain hidden until showdown and only non-folded participants reveal. Folded hands and uncontested winners stay private. The human always sees their own cards. Hand results report main/side-pot awards and uncalled refunds; the tactical feed lists important public actions and phase changes. The single-player session ends when the human is eliminated or has all 4,000 chips, with Play again available.

Original CSS creates charcoal bunker walls, worn olive felt, steel panels and muted amber controls. Cards use clean rank/suit corners with readable suit symbols and restrained dealing animations. Reduced-motion settings disable animation. Layouts support Windows desktop browsers and adapt to narrow viewports. No external game artwork or custom font was downloaded.

The optional diagnostic simulator is a separate, explicitly labeled developer sandbox that exposes all of its own cards. It remains closed by default and is not part of opponent gameplay.

## Remaining expansion
Sound, local statistics/save games, additional modes, custom illustrated portraits and Windows packaging remain future work. Sessions do not persist after refresh. A future Windows wrapper may use Tauri or Electron; none is selected or tested yet. Keyboard-only, screen-reader, Windows Edge/Firefox and strategic-balance playtesting remain release checks.

## Stability verification

The QA pass preserves these rules and the existing presentation. AI history now distinguishes calls that use a player's full stack from actions that actually increase the wager. The engine rejects inconsistent dealer/blind metadata and incomplete payout records. See QA_REPORT.md for deterministic simulation coverage and remaining human playtesting; no new mode or rule variant was introduced.
