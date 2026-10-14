# Outpost Poker — Game design

## Vision and scope
An original single-player Texas Hold’em game for Windows, initially played in a browser. A fictional military outpost's recreation bunker provides a restrained olive, charcoal, and brass atmosphere. Use original visuals and fictional characters; do not copy military-game art, branding, or characters.

One human plays against three computer opponents. All chips are fictional, with no purchases, deposits, cash-out, real-money wagers, or monetary rewards. No accounts, backend, or database are required.

## Planned rules
The first playable mode will use standard no-limit Texas Hold’em: a 52-card deck, two private cards per seat, rotating dealer, small and big blinds, preflop betting, three-card flop, turn, river, and best five-card hand from seven available cards. Betting supports fold, check, call, bet, raise, and all-in. Enforce turn order, legal minimum raises, short all-in reopening rules, side pots, ties and split pots, heads-up blind rules, and elimination. Document odd-chip distribution and blind progression before implementing them. No wild cards or custom military rule variants.

The placeholder shows 1,000 fictional chips per seat, but does not deal cards or enforce any rules. Starting stacks and blind levels are provisional.

## Opponents
- Rook: planned disciplined, patient play.
- Viper: planned aggressive play with selective bluffs.
- Anchor: planned measured, observant play.

These are profile descriptions only. Future AI receives its own cards and public information, never another player's hidden cards. Decision policies must return legal actions and allow seeded test scenarios.

## Presentation and future expansion
Prioritize readable cards, visible legal actions, clear pot and bet amounts, keyboard access, and responsive layouts. Add optional animations, sound with mute controls, local statistics, and game modes through modular interfaces. A future Windows package may wrap the frontend with Tauri or Electron; choose that separately when packaging requirements are known.

## Current build
An informational roster and disabled deal button. No poker engine, AI decisions, persistence, sound, or desktop wrapper is implemented.
