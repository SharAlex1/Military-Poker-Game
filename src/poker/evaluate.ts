import type { Card } from './types';
import { rankValue, validateCards } from './deck';

export const handNames = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'] as const;
export interface HandRank { category: number; kickers: number[]; name: typeof handNames[number] }

/** Positive means left wins; suits never break a tie. */
export function compareHands(left: HandRank, right: HandRank): number {
  if (left.category !== right.category) return left.category - right.category;
  for (let i = 0; i < Math.max(left.kickers.length, right.kickers.length); i++) {
    const diff = (left.kickers[i] ?? 0) - (right.kickers[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

function five(cards: readonly Card[]): HandRank {
  const values = cards.map(card => rankValue(card.rank)).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every(card => card.suit === cards[0].suit);
  const unique = [...counts.keys()];
  const straight = unique.length === 5 ? (values[0] - values[4] === 4 ? values[0] : values.join(',') === '14,5,4,3,2' ? 5 : 0) : 0;
  let category = 0;
  let kickers = values;
  if (flush && straight) { category = 8; kickers = [straight]; }
  else if (groups[0][1] === 4) { category = 7; kickers = groups.map(group => group[0]); }
  else if (groups[0][1] === 3 && groups[1][1] === 2) { category = 6; kickers = groups.map(group => group[0]); }
  else if (flush) category = 5;
  else if (straight) { category = 4; kickers = [straight]; }
  else if (groups[0][1] === 3) { category = 3; kickers = groups.map(group => group[0]); }
  else if (groups[0][1] === 2 && groups[1][1] === 2) { category = 2; kickers = groups.map(group => group[0]); }
  else if (groups[0][1] === 2) { category = 1; kickers = groups.map(group => group[0]); }
  return { category, kickers, name: handNames[category] };
}

/** Exhaustive best-five selection: 21 combinations at seven cards. */
export function evaluateHand(cards: readonly Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) throw new Error('Evaluate 5 to 7 cards');
  validateCards(cards);
  let best: HandRank | undefined;
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const candidate = five([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || compareHands(candidate, best) > 0) best = candidate;
          }
  return best!;
}
