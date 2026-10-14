# Outpost Poker v0.2 — Visual system

## Direction and assets
A fictional off-duty recreation bunker: desaturated olive felt, charcoal steel, weathered brass/amber accents, warm paper cards and illustrated military dossier placeholders. Existing military games are atmosphere references only. No art, logos, characters or interface layouts were copied from them.

The room is original SVG architecture with metal seams, pipes, fixtures, supply crates and floor perspective. Static gradients and procedural CSS supply felt weave, lighting and material depth. Portrait placeholders are original vector illustrations with distinct gear for the operator, Rook, Viper and Anchor; they are intentionally not photorealistic character art. All assets are local and usable offline after installation. System fonts are retained; no external font or animation package was added.

## Presentation modules

| Module | Responsibility |
| --- | --- |
| `src/ui/theme/tokens.css` | Palette, spacing, type, radii, shadows, card sizing and motion duration |
| `src/ui/components/TableScene.tsx` / `table.css` | Rounded stitched rail, overhead fixture, community cards, pot and deck prop |
| `src/ui/components/PlayerPanel.tsx` / `players.css` | Portraits, fictional affiliations, public status, stacks, bets and position badges |
| `src/ui/components/PlayingCard.tsx` / `cards.css` | Tactile cards, original backs and readable rank/suit corners |
| `src/ui/components/Chips.tsx` / `chips.css` | Denomination presentation with bounded decorative stacks |
| `src/ui/components/Controls.tsx` | Existing legal-action API, tactical buttons and numeric wager input |
| `src/ui/components/ActionHistory.tsx` | Compact public tactical feed |
| `src/ui/animations.css` | One-shot dealing, chip transfer, payout and reduced-motion rules |
| `src/assets/` and `public/favicon.svg` | Original room/portrait artwork, materials and application icon |

Portrait imports can be replaced with detailed original/licensed images without changing callsigns, AI policies or poker rules. Theme colors and sizing can be tuned independently of domain code.

## Chips, motion and safety
Denominations are 250, 100, 25, 5 and 1 fictional chips. The numeric game balance remains authoritative; denominations do not change wagering rules. Breakdown sums exactly to the balance. At most four decorative chips are drawn per denomination so large stacks do not inflate the DOM. The accessible image label and numeric text retain the exact amount. Compact desktop layouts suppress some decorative stacks while preserving every balance and current bet.

Card identities/remounts follow actual deals and legal showdown reveals. Wager graphics are keyed to hand, street and actual bet amount. Payout effects follow resolved outcomes. CSS animates presentation only: no animation/transition callbacks dispatch actions, modify stacks, wait for animation completion or control AI. There are no perpetual lighting or turn-pulse animations.

The Animations checkbox disables cosmetic animations and transitions; operating-system `prefers-reduced-motion` overrides it. It does not change AI timing or game state. Preferences are in memory only. New hands may be dealt immediately even while an old cosmetic effect is ending.

## Responsive layout and verification
Target CSS viewport sizes are 1366×768, 1920×1080 and 2560×1440. Short-height desktops use smaller cards and denser identity panels. At narrow widths the table becomes a two-column roster with the board across the middle; the feed moves below the table. Small windows allow vertical scrolling; no horizontal scrolling is required in tested layouts.

The 88-test baseline and production build passed before work. Checkpoint `checkpoint/v0.1-stable-c86bd94` and feature branch `visual-v0.2` preserved the starting version. The final suite passes 99 tests, including denomination arithmetic and cosmetic-setting isolation; TypeScript and production build pass. Poker, AI and session files (including their tests) match baseline SHA-256 checksums. The only package/lockfile edits bump the project version to 0.2.0; dependency versions are unchanged.

Chromium development and production were checked at all three desktop targets, 1024×768 and 390×844. Assertions covered portrait loading, no horizontal overflow, no overlap between player panels and community cards, desktop betting-control visibility, private-card concealment, reduced motion, animation disablement and synthetic animation events leaving gameplay unchanged. Both builds completed the same reproducible 22-hand session with legal controls, automatic opponents, payouts, new hands, restart and exactly 4,000 chips at hand boundaries.

## Remaining manual work and next visual milestone
Native Windows browsers, display scaling, screen readers, keyboard focus across rounds and real-monitor contrast/comfort still need human verification. These are Linux Chromium automation results, not a Windows certification. The current art remains lightweight original illustration/procedural materials; no audio, saved games or desktop package was added.

Recommended next visual priorities:
1. Commission or create detailed original character portraits with consistent bunker lighting.
2. Replace selected procedural surfaces with optimized original leather, canvas and steel textures.
3. Refine chip trajectories and card origins with measured seat/deck coordinates, preserving immediate engine transitions.
4. Add a small set of original background props and localized light/shadow details without obscuring gameplay.
5. Improve hand-result emphasis, keyboard focus transitions and high-DPI/accessibility presentation through human playtesting.
