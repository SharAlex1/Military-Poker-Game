import type { Card, Rank, Suit } from './types';
import { cardKey, createDeck } from './deck';
import { act, legalActions, type Game } from './engine';

export function cards(text: string): Card[] {
  const suits: Record<string, Suit> = { c: 'clubs', d: 'diamonds', h: 'hearts', s: 'spades' };
  return text.split(' ').map(token => {
    const value = token.slice(0, -1);
    return { rank: (/^\d+$/.test(value) ? Number(value) : value) as Rank, suit: suits[token.slice(-1)] };
  });
}
export function orderedDeck(top: string): Card[] {
  const first = cards(top);
  const keys = new Set(first.map(cardKey));
  return [...first, ...createDeck().filter(c => !keys.has(cardKey(c)))];
}
export function passive(g: Game): Game {
  if (g.actor === null) throw new Error('No actor');
  const legal = legalActions(g);
  return act(g, g.actor, { type: legal.check ? 'check' : 'call' });
}
export function finish(g: Game): Game {
  let count = 0;
  while (g.actor !== null) {
    if (++count > 100) throw new Error('Engine did not finish');
    g = passive(g);
  }
  return g;
}
