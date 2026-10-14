import { cardKey, createDeck, shuffle } from '../poker/deck';
import { compareHands, evaluateHand } from '../poker/evaluate';
import type { Action, observe } from '../poker/engine';

export type Observation = ReturnType<typeof observe>;
export type Style = 'cautious' | 'aggressive' | 'balanced';
export interface BettingEvent { seat: number; phase: string; action: Action; hand: number }
export const policies = {
  cautious: { margin: .13, raiseAt: .68, bluff: .01, sizing: .45 },
  aggressive: { margin: -.06, raiseAt: .40, bluff: .17, sizing: .95 },
  balanced: { margin: .03, raiseAt: .54, bluff: .05, sizing: .65 },
} as const;

/** Sample unknown cards only. Actual opponents' cards and the engine deck are never inputs. */
export function estimateEquity(view: Observation, seat: number, random: () => number, samples = 24): number {
  const own = view.players[seat].hole;
  if (own.length !== 2 || !Number.isInteger(samples) || samples < 1) throw new Error('Invalid equity input');
  const known = new Set([...own, ...view.board].map(cardKey));
  const unseen = createDeck().filter(card => !known.has(cardKey(card)));
  const rivals = view.players.filter((p, i) => i !== seat && (p.status === 'active' || p.status === 'all-in')).length;
  let wins = 0;
  for (let sample = 0; sample < samples; sample++) {
    const deck = shuffle(unseen, random);
    const board = [...view.board, ...deck.splice(0, 5 - view.board.length)];
    const hero = evaluateHand([...own, ...board]);
    let ties = 1; let beaten = false;
    for (let n = 0; n < rivals; n++) {
      const comparison = compareHands(hero, evaluateHand([...deck.splice(0, 2), ...board]));
      if (comparison < 0) beaten = true;
      if (comparison === 0) ties++;
    }
    if (!beaten) wins += 1 / ties;
  }
  return wins / samples;
}

export function decide(view: Observation, seat: number, style: Style, history: readonly BettingEvent[], random: () => number): Action {
  if (view.actor !== seat) throw new Error('AI asked to act out of turn');
  const legal = view.legal;
  const profile = policies[style];
  const equity = estimateEquity(view, seat, random);
  const own = view.players[seat];
  const call = legal.call ?? 0;
  const potOdds = call / Math.max(1, view.pot + call);
  const raises = history.filter(event => event.hand === history.at(-1)?.hand && event.phase === view.phase &&
    ['raise', 'bet', 'all-in'].includes(event.action.type) && event.seat !== seat).length;
  const pressure = Math.min(.15, raises * .035);
  const stackRisk = call / Math.max(1, own.chips);
  const value = equity - pressure;
  const range = legal.bet ?? legal.raise;
  const bluff = random() < profile.bluff / (1 + raises);
  if (legal.allIn && equity > .83 && own.chips <= Math.max(40, view.pot * 1.5)) return { type: 'all-in' };
  if (range && (value > profile.raiseAt || bluff)) {
    const to = Math.min(range.max, Math.max(range.min, view.currentBet + Math.round(Math.max(20, view.pot) * profile.sizing)));
    return { type: legal.bet ? 'bet' : 'raise', to };
  }
  if (legal.check) return { type: 'check' };
  if (legal.call !== null && (value >= potOdds + profile.margin + stackRisk * .12 || call <= 20 && equity > .18)) return { type: 'call' };
  return { type: 'fold' };
}
