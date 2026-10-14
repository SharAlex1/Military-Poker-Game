/** Domain vocabulary only. Rule enforcement arrives in a later milestone. */
export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A';
export interface Card { suit: Suit; rank: Rank }
export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river';
