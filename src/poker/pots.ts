import { compareHands, type HandRank } from './evaluate';

export interface Contribution { seat: number; amount: number; folded: boolean }
export interface Pot { amount: number; eligible: number[] }
export interface Award { seat: number; amount: number }
export interface PotResult extends Pot { winners: number[]; awards: Award[] }

/** Contribution layers include folded money, but folded seats cannot win. */
export function buildPots(contributions: readonly Contribution[]): { pots: Pot[]; refunds: Award[] } {
  if (new Set(contributions.map(c => c.seat)).size !== contributions.length || contributions.some(c =>
    !Number.isSafeInteger(c.seat) || c.seat < 0 || !Number.isSafeInteger(c.amount) || c.amount < 0) ||
    !Number.isSafeInteger(contributions.reduce((sum, c) => sum + c.amount, 0))) throw new Error('Invalid contributions');
  const levels = [...new Set(contributions.map(c => c.amount).filter(Boolean))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  const refunds: Award[] = [];
  let previous = 0;
  for (const level of levels) {
    const participants = contributions.filter(c => c.amount >= level);
    const amount = (level - previous) * participants.length;
    if (participants.length === 1) refunds.push({ seat: participants[0].seat, amount });
    else {
      const eligible = participants.filter(c => !c.folded).map(c => c.seat);
      if (!eligible.length) throw new Error('Pot has no eligible player');
      pots.push({ amount, eligible });
    }
    previous = level;
  }
  return { pots, refunds };
}

/** Odd chips go clockwise from the seat left of the dealer, independently per pot. */
export function awardPots(pots: readonly Pot[], hands: Readonly<Record<number, HandRank>>, dealer: number, seatCount = 4): PotResult[] {
  if (!Number.isInteger(seatCount) || seatCount < 2 || !Number.isInteger(dealer) || dealer < 0 || dealer >= seatCount) throw new Error('Invalid dealer');
  return pots.map(pot => {
    if (!Number.isSafeInteger(pot.amount) || pot.amount <= 0 || !pot.eligible.length ||
      new Set(pot.eligible).size !== pot.eligible.length || pot.eligible.some(seat => !Number.isInteger(seat) || seat < 0 || seat >= seatCount || !hands[seat])) throw new Error('Invalid pot or missing hand');
    const best = pot.eligible.reduce((a, b) => compareHands(hands[a], hands[b]) >= 0 ? a : b);
    const winners = pot.eligible.filter(seat => compareHands(hands[seat], hands[best]) === 0)
      .sort((a, b) => ((a - dealer - 1 + seatCount) % seatCount) - ((b - dealer - 1 + seatCount) % seatCount));
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;
    return { ...pot, eligible: [...pot.eligible], winners, awards: winners.map((seat, i) => ({ seat, amount: share + (i < remainder ? 1 : 0) })) };
  });
}
