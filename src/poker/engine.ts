import type { BettingRound, Card } from './types';
import { createDeck, shuffle, validateCards } from './deck';
import { evaluateHand } from './evaluate';
import { awardPots, buildPots, type Award, type PotResult } from './pots';

export type Phase = 'ready' | BettingRound | 'showdown' | 'complete';
export interface Player {
  id: string; name: string; controller: 'human' | 'computer';
  chips: number; hole: Card[]; status: 'out' | 'active' | 'folded' | 'all-in';
  committed: number; streetBet: number; actedAt: number | null;
}
export interface Game {
  players: Player[]; phase: Phase; dealer: number; smallBlindSeat: number | null; bigBlindSeat: number | null;
  smallBlind: number; bigBlind: number; handNumber: number; actor: number | null;
  board: Card[]; burns: Card[]; deck: Card[]; currentBet: number; minRaise: number;
  totalChips: number; results: PotResult[]; refunds: Award[];
}
export type Action = { type: 'fold' } | { type: 'check' } | { type: 'call' } | { type: 'all-in' } | { type: 'bet'; to: number } | { type: 'raise'; to: number };
export interface LegalActions {
  fold: boolean; check: boolean; call: number | null; allIn: boolean;
  bet: { min: number; max: number } | null; raise: { min: number; max: number } | null;
}
const betting = (phase: Phase): phase is BettingRound => ['preflop', 'flop', 'turn', 'river'].includes(phase);
const integer = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const live = (p: Player): boolean => p.status === 'active' || p.status === 'all-in';
const nextSeat = (after: number, seats: number[]): number => {
  for (let n = 1; n <= 4; n++) if (seats.includes((after + n) % 4)) return (after + n) % 4;
  throw new Error('No next seat');
};
const pending = (g: Game): number[] => g.players.flatMap((p, i) => p.status === 'active' && (p.actedAt === null || p.streetBet < g.currentBet) ? [i] : []);
const copy = (g: Game): Game => structuredClone(g);

export function createGame(options: { stacks?: number[]; smallBlind?: number; bigBlind?: number; dealer?: number } = {}): Game {
  const stacks = options.stacks ?? [1000, 1000, 1000, 1000];
  if (stacks.length !== 4 || stacks.some(n => !integer(n)) || stacks.filter(n => n > 0).length < 2 || !Number.isSafeInteger(stacks.reduce((a, b) => a + b, 0))) throw new Error('Four stacks with at least two funded seats required');
  const smallBlind = options.smallBlind ?? 10;
  const bigBlind = options.bigBlind ?? 20;
  const dealer = options.dealer ?? stacks.findIndex(n => n > 0);
  if (!integer(smallBlind) || !smallBlind || !integer(bigBlind) || bigBlind <= smallBlind || !integer(dealer) || dealer > 3 || !stacks[dealer]) throw new Error('Invalid blinds or dealer');
  const names = ['You', 'Rook', 'Viper', 'Anchor'];
  const g: Game = {
    players: names.map((name, i) => ({ id: ['player', 'rook', 'viper', 'anchor'][i], name,
      controller: i === 0 ? 'human' : 'computer', chips: stacks[i], hole: [], status: stacks[i] ? 'active' : 'out', committed: 0, streetBet: 0, actedAt: null })),
    phase: 'ready', dealer, smallBlindSeat: null, bigBlindSeat: null, smallBlind, bigBlind,
    handNumber: 0, actor: null, board: [], burns: [], deck: [], currentBet: 0, minRaise: bigBlind,
    totalChips: stacks.reduce((a, b) => a + b, 0), results: [], refunds: [],
  };
  validateGame(g);
  return g;
}

/** Validate public snapshots at every API boundary. Engine-produced states remain immutable to callers. */
export function validateGame(g: Game): void {
  if (!g || !Array.isArray(g.players) || g.players.length !== 4 ||
    new Set(g.players.map(p => p.id)).size !== 4 || g.players.filter(p => p.controller === 'human').length !== 1 ||
    g.players.filter(p => p.controller === 'computer').length !== 3 ||
    !['ready', 'preflop', 'flop', 'turn', 'river', 'showdown', 'complete'].includes(g.phase) ||
    !integer(g.dealer) || g.dealer > 3 || !integer(g.handNumber) ||
    !integer(g.smallBlind) || g.smallBlind === 0 || !integer(g.bigBlind) || g.bigBlind <= g.smallBlind ||
    !integer(g.currentBet) || !integer(g.minRaise) || g.minRaise < g.bigBlind || !integer(g.totalChips)) throw new Error('Invalid game metadata');
  for (const p of g.players) {
    if (!p.id || !['active', 'folded', 'all-in', 'out'].includes(p.status) ||
      !integer(p.chips) || !integer(p.committed) || !integer(p.streetBet) || p.streetBet > p.committed ||
      (p.actedAt !== null && (!integer(p.actedAt) || p.actedAt > g.currentBet)) ||
      (p.status === 'out' && (p.chips || p.hole.length || p.committed)) ||
      (betting(g.phase) && ((p.status === 'active' && p.chips === 0) || (p.status === 'all-in' && p.chips !== 0)))) throw new Error('Invalid player state');
  }
  if (g.phase === 'ready' && (g.smallBlindSeat !== null || g.bigBlindSeat !== null || g.results.length || g.refunds.length || g.players.some(p => !['active', 'out'].includes(p.status)))) throw new Error('Invalid ready metadata');
  const cards = [...g.deck, ...g.board, ...g.burns, ...g.players.flatMap(p => p.hole)];
  validateCards(cards);
  if (g.phase === 'ready') {
    if (cards.length || g.handNumber || g.actor !== null || g.players.some(p => p.committed || (p.status === 'active' && p.chips === 0)) || g.players.filter(p => p.chips > 0).length < 2 || g.currentBet) throw new Error('Invalid ready state');
  } else {
    if (cards.length !== 52 || g.handNumber === 0 || g.players.some(p => p.hole.length !== (p.status === 'out' ? 0 : 2))) throw new Error('Invalid dealt deck');
    const size = { preflop: 0, flop: 3, turn: 4, river: 5, showdown: 5, complete: g.board.length }[g.phase];
    if (g.board.length !== size || ![0, 3, 4, 5].includes(size) || g.burns.length !== (size === 0 ? 0 : size - 2)) throw new Error('Invalid board or burn cards');
    if (g.smallBlindSeat === null || g.bigBlindSeat === null || g.smallBlindSeat === g.bigBlindSeat ||
      ![g.dealer, g.smallBlindSeat, g.bigBlindSeat].every(i => integer(i) && i < 4 && g.players[i].hole.length === 2)) throw new Error('Invalid button or blind seats');
  }
  const conserved = g.players.reduce((sum, p) => sum + p.chips + p.committed, 0);
  if (conserved !== g.totalChips) throw new Error('Chip conservation violated');
  if (betting(g.phase)) {
    if (g.actor === null || !integer(g.actor) || g.actor > 3 || !pending(g).includes(g.actor) || g.players.filter(live).length < 2 ||
      g.players.some(p => p.streetBet > g.currentBet || (p.status === 'active' && p.actedAt !== null && p.actedAt !== p.streetBet)) ||
      (g.currentBet !== Math.max(...g.players.map(p => p.streetBet)) && !(g.phase === 'preflop' && g.currentBet === g.bigBlind && g.currentBet > Math.max(...g.players.map(p => p.streetBet)))) ||
      g.minRaise > Math.max(g.bigBlind, g.currentBet) || g.results.length || g.refunds.length) throw new Error('Invalid betting state');
  } else if (g.actor !== null || g.players.some(p => p.committed || p.streetBet) || g.currentBet) throw new Error('Invalid inactive state');
  if (g.phase === 'complete' && g.players.filter(live).length !== 1) throw new Error('Invalid fold settlement');
  if (g.phase === 'showdown' && g.players.filter(live).length < 2) throw new Error('Invalid showdown');
  for (const refund of g.refunds) if (!integer(refund.seat) || refund.seat > 3 || !integer(refund.amount) || !refund.amount) throw new Error('Invalid refund');
  for (const pot of g.results) {
    if (!integer(pot.amount) || !pot.amount || !pot.eligible.length || !pot.winners.length ||
      new Set(pot.eligible).size !== pot.eligible.length || new Set(pot.winners).size !== pot.winners.length ||
      pot.eligible.some(seat => !integer(seat) || seat > 3 || !live(g.players[seat])) ||
      pot.winners.some(seat => !pot.eligible.includes(seat)) ||
      pot.awards.length !== pot.winners.length || new Set(pot.awards.map(a => a.seat)).size !== pot.awards.length ||
      pot.awards.some(a => !pot.winners.includes(a.seat) || !integer(a.amount)) ||
      pot.awards.reduce((sum, a) => sum + a.amount, 0) !== pot.amount) throw new Error('Invalid pot result');
  }
}

function pay(g: Game, seat: number, amount: number): void {
  const p = g.players[seat];
  p.chips -= amount; p.streetBet += amount; p.committed += amount;
  if (!p.chips) p.status = 'all-in';
}
function draw(g: Game): Card { const card = g.deck.shift(); if (!card) throw new Error('Deck exhausted'); return card; }

/** Supply a full ordered deck only for controlled scenarios; otherwise inject a random source. */
export function startHand(input: Game, options: { random?: () => number; deck?: readonly Card[] } = {}): Game {
  validateGame(input);
  if (!['ready', 'showdown', 'complete'].includes(input.phase)) throw new Error('Hand still running');
  const g = copy(input);
  const seats = g.players.flatMap((p, i) => p.chips > 0 ? [i] : []);
  if (seats.length < 2) throw new Error('Session finished: fewer than two funded players');
  if (g.handNumber) g.dealer = nextSeat(g.dealer, seats);
  const deck = options.deck ?? shuffle(createDeck(), options.random);
  if (deck.length !== 52) throw new Error('Full deck required');
  validateCards(deck);
  g.deck = deck.map(card => ({ ...card })); g.board = []; g.burns = []; g.results = []; g.refunds = [];
  g.handNumber++; g.phase = 'preflop'; g.currentBet = g.bigBlind; g.minRaise = g.bigBlind;
  g.players.forEach(p => { p.hole = []; p.status = p.chips ? 'active' : 'out'; p.committed = 0; p.streetBet = 0; p.actedAt = null; });
  let seat = g.dealer;
  for (let round = 0; round < 2; round++) for (let n = 0; n < seats.length; n++) {
    seat = nextSeat(seat, seats); g.players[seat].hole.push(draw(g));
  }
  g.smallBlindSeat = seats.length === 2 ? g.dealer : nextSeat(g.dealer, seats);
  g.bigBlindSeat = nextSeat(g.smallBlindSeat, seats);
  pay(g, g.smallBlindSeat, Math.min(g.smallBlind, g.players[g.smallBlindSeat].chips));
  pay(g, g.bigBlindSeat, Math.min(g.bigBlind, g.players[g.bigBlindSeat].chips));
  progress(g, g.bigBlindSeat);
  validateGame(g);
  return g;
}

export function legalActions(g: Game, seat = g.actor): LegalActions {
  validateGame(g);
  const empty: LegalActions = { fold: false, check: false, call: null, allIn: false, bet: null, raise: null };
  if (seat === null || seat !== g.actor || !betting(g.phase)) return empty;
  const p = g.players[seat];
  const owed = Math.max(0, g.currentBet - p.streetBet);
  const max = p.streetBet + p.chips;
  // Cumulative short raises reopen when the player faces a full raise since their last action.
  const reopened = p.actedAt === null || (p.actedAt === 0 && g.phase !== 'preflop') || g.currentBet - p.actedAt >= g.minRaise;
  const canRaise = reopened && g.players.some((other, i) => i !== seat && other.status === 'active');
  const min = g.currentBet + g.minRaise;
  return {
    fold: true, check: owed === 0, call: owed ? Math.min(owed, p.chips) : null,
    allIn: max <= g.currentBet || canRaise,
    bet: g.currentBet === 0 && canRaise && max >= g.bigBlind ? { min: g.bigBlind, max } : null,
    raise: g.currentBet > 0 && canRaise && max >= min ? { min, max } : null,
  };
}

/** Bet/raise `to` is the player's total contribution on the current street, not an increment. */
export function act(input: Game, seat: number, action: Action): Game {
  const legal = legalActions(input, seat);
  if (!betting(input.phase) || seat !== input.actor) throw new Error('Not this player’s turn');
  const g = copy(input);
  const p = g.players[seat];
  const before = g.currentBet;
  if (action.type === 'fold') { if (!legal.fold) throw new Error('Illegal fold'); p.status = 'folded'; }
  else if (action.type === 'check') { if (!legal.check) throw new Error('Cannot check facing a bet'); }
  else if (action.type === 'call') { if (legal.call === null) throw new Error('Nothing to call'); pay(g, seat, legal.call); }
  else if (action.type === 'all-in' || action.type === 'bet' || action.type === 'raise') {
    let to: number;
    if (action.type === 'all-in') {
      if (!legal.allIn) throw new Error('Betting not reopened or no opponent can respond');
      to = p.streetBet + p.chips;
    } else {
      const range = action.type === 'bet' ? legal.bet : legal.raise;
      if (!range || !integer(action.to) || action.to < range.min || action.to > range.max) throw new Error('Illegal bet or raise size');
      to = action.to;
    }
    pay(g, seat, to - p.streetBet);
    if (to > before) {
      const increment = to - before;
      if (increment >= g.minRaise) g.minRaise = increment;
      g.currentBet = to;
    }
  } else throw new Error('Unknown action');
  p.actedAt = g.currentBet;
  progress(g, seat);
  validateGame(g);
  return g;
}

function settle(g: Game, showdown: boolean): void {
  const { pots, refunds } = buildPots(g.players.map((p, seat) => ({ seat, amount: p.committed, folded: !live(p) })));
  g.refunds = refunds;
  if (showdown) {
    const hands = Object.fromEntries(g.players.flatMap((p, seat) => live(p) ? [[seat, evaluateHand([...p.hole, ...g.board])]] : []));
    g.results = awardPots(pots, hands, g.dealer);
  } else {
    const winner = g.players.findIndex(live);
    g.results = pots.map(pot => ({ ...pot, winners: [winner], awards: [{ seat: winner, amount: pot.amount }] }));
  }
  for (const award of [...refunds, ...g.results.flatMap(pot => pot.awards)]) g.players[award.seat].chips += award.amount;
  g.players.forEach(p => { p.committed = 0; p.streetBet = 0; p.actedAt = null; });
  g.currentBet = 0; g.actor = null; g.phase = showdown ? 'showdown' : 'complete';
}

function progress(g: Game, after: number): void {
  for (;;) {
    if (g.players.filter(live).length === 1) { settle(g, false); return; }
    const able = g.players.flatMap((p, i) => p.status === 'active' ? [i] : []);
    if (able.length <= 1) {
      // The nominal big blind is no longer a callable wager when all opponents posted/called short.
      g.currentBet = Math.max(...g.players.map(p => p.streetBet));
      g.players.forEach(p => { if (p.actedAt !== null && p.actedAt > g.currentBet) p.actedAt = g.currentBet; });
    }
    // With no side betting possible, only an outstanding call/fold decision remains.
    const needs = able.length <= 1 ? able.filter(i => g.players[i].streetBet < g.currentBet) : pending(g);
    if (needs.length) { g.actor = nextSeat(after, needs); return; }
    if (g.phase === 'river') { settle(g, true); return; }
    g.burns.push(draw(g));
    const count = g.phase === 'preflop' ? 3 : 1;
    for (let i = 0; i < count; i++) g.board.push(draw(g));
    g.phase = g.phase === 'preflop' ? 'flop' : g.phase === 'flop' ? 'turn' : 'river';
    g.currentBet = 0; g.minRaise = g.bigBlind;
    g.players.forEach(p => { p.streetBet = 0; p.actedAt = null; });
    after = g.dealer;
  }
}

/** AI-safe observation: never exposes the deck, burns, or another player's hole cards. */
export function observe(g: Game, seat: number) {
  validateGame(g);
  if (!integer(seat) || seat > 3) throw new Error('Invalid observing seat');
  return {
    phase: g.phase, actor: g.actor, dealer: g.dealer, board: g.board.map(c => ({ ...c })),
    currentBet: g.currentBet, pot: g.players.reduce((sum, p) => sum + p.committed, 0),
    players: g.players.map((p, i) => ({ id: p.id, name: p.name, chips: p.chips, status: p.status,
      streetBet: p.streetBet, committed: p.committed, hole: i === seat ? p.hole.map(c => ({ ...c })) : [] })),
    legal: legalActions(g, seat),
  };
}
