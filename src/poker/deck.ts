import type { Card, Rank, Suit } from './types';

export const suits: readonly Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
export const ranks: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
export const cardKey = (card: Card): string => `${card.rank}:${card.suit}`;
export const rankValue = (rank: Rank): number => typeof rank === 'number' ? rank : { J: 11, Q: 12, K: 13, A: 14 }[rank];

export function validateCards(cards: readonly Card[]): void {
  if (cards.some(card => !card || !suits.includes(card.suit) || !ranks.includes(card.rank)) ||
      new Set(cards.map(cardKey)).size !== cards.length) {
    throw new Error('Cards must be valid and unique');
  }
}
export function createDeck(): Card[] {
  return suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
}

/** Seeded Mulberry32 with bounded 32-bit state for repeatable simulations, not money play. */
export function seededRandom(seed: number): () => number {
  if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer');
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let t = Math.imul(value ^ value >>> 15, value | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates. Never mutates the source; the first card is dealt first. */
export function shuffle(deck: readonly Card[], random: () => number = Math.random): Card[] {
  validateCards(deck);
  const result = deck.map(card => ({ ...card }));
  for (let i = result.length - 1; i > 0; i--) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random sample must be in [0, 1)');
    const j = Math.floor(sample * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function deal(deck: readonly Card[], count: number): { cards: Card[]; remaining: Card[] } {
  validateCards(deck);
  if (!Number.isInteger(count) || count < 0 || count > deck.length) throw new Error('Invalid deal count');
  return { cards: deck.slice(0, count).map(card => ({ ...card })), remaining: deck.slice(count).map(card => ({ ...card })) };
}
