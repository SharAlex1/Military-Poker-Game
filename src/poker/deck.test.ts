// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cardKey, createDeck, deal, seededRandom, shuffle } from './deck';

describe('deck', () => {
  it('contains every rank in every suit exactly once', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardKey)).size).toBe(52);
    for (const suit of ['clubs', 'diamonds', 'hearts', 'spades']) expect(deck.filter(c => c.suit === suit)).toHaveLength(13);
  });
  it('shuffles reproducibly without losing or mutating cards', () => {
    const original = createDeck();
    const shuffled = shuffle(original, seededRandom(123));
    expect(shuffled).toEqual(shuffle(original, seededRandom(123)));
    expect(shuffled).not.toEqual(original);
    expect(shuffled.map(cardKey).sort()).toEqual(original.map(cardKey).sort());
    expect(original).toEqual(createDeck());
    expect(shuffle(original, seededRandom(124))).not.toEqual(shuffled);
  });
  it('deals from the top without mutation and rejects exhaustion and invalid inputs', () => {
    const deck = createDeck();
    expect(deal(deck, 2)).toEqual({ cards: deck.slice(0, 2), remaining: deck.slice(2) });
    expect(deck).toHaveLength(52);
    expect(() => deal(deck, 53)).toThrow();
    expect(() => deal(deck, -1)).toThrow();
    expect(() => shuffle(deck, () => 1)).toThrow();
    expect(() => shuffle(deck, () => NaN)).toThrow();
    expect(() => shuffle([deck[0], deck[0]])).toThrow();
  });
});

it('keeps long random streams equivalent to a 32-bit state checkpoint', () => {
  const count=5_000_000;
  const stream=seededRandom(7);
  for(let i=0;i<count;i++)stream();
  const checkpoint=seededRandom((7+Math.imul(count,0x6D2B79F5))>>>0);
  expect(Array.from({length:10},()=>stream())).toEqual(Array.from({length:10},()=>checkpoint()));
});
