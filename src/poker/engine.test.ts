// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { act, createGame, legalActions, observe, startHand, validateGame, type Game } from './engine';
import { cardKey, seededRandom } from './deck';
import { cards, finish, orderedDeck, passive } from './test-helpers';

const begin = (stacks?: number[]) => startHand(createGame({ stacks }), { random: seededRandom(17) });
const move = (g: Game, type: 'fold' | 'check' | 'call' | 'all-in') => act(g, g.actor!, { type });
const total = (g: Game) => g.players.reduce((sum, p) => sum + p.chips + p.committed, 0);
const flop = (g: Game) => { while (g.phase === 'preflop') g = passive(g); return g; };

describe('Hold’em state machine', () => {
  it('starts four seats at 1000, posts blinds and deals clockwise in two passes', () => {
    const ready = createGame();
    const g = startHand(ready, { deck: orderedDeck('As Ks Qs Js Ah Kh Qh Jh') });
    expect(g.players.map(p => p.chips)).toEqual([1000, 990, 980, 1000]);
    expect(g.players.map(p => p.hole)).toEqual([cards('Js Jh'), cards('As Ah'), cards('Ks Kh'), cards('Qs Qh')]);
    expect(g.actor).toBe(3); expect(g.smallBlindSeat).toBe(1); expect(g.bigBlindSeat).toBe(2);
    expect(g.currentBet).toBe(20); expect(total(g)).toBe(4000);
    expect(ready.phase).toBe('ready'); expect(ready.players[1].chips).toBe(1000);
  });
  it('retains the big blind option after calls and advances all streets with burns', () => {
    let g = begin();
    for (const actor of [3, 0, 1]) { expect(g.actor).toBe(actor); g = move(g, 'call'); }
    expect(g.actor).toBe(2); expect(g.phase).toBe('preflop');
    g = move(g, 'check');
    for (const [phase, board, burns] of [['flop', 3, 1], ['turn', 4, 2], ['river', 5, 3]] as const) {
      expect(g.phase).toBe(phase); expect(g.board).toHaveLength(board); expect(g.burns).toHaveLength(burns); expect(g.actor).toBe(1);
      for (let i = 0; i < 4; i++) g = move(g, 'check');
    }
    expect(g.phase).toBe('showdown'); expect(g.actor).toBeNull();
    expect(total(g)).toBe(4000); expect(g.players.every(p => p.committed === 0)).toBe(true);
    expect(new Set([...g.deck, ...g.board, ...g.burns, ...g.players.flatMap(p => p.hole)].map(cardKey)).size).toBe(52);
  });
  it('rejects out-of-turn actions, checks facing bets, invalid action types and illegal amounts without mutation', () => {
    const g = begin(); const snapshot = structuredClone(g);
    expect(() => act(g, 0, { type: 'call' })).toThrow();
    expect(() => move(g, 'check')).toThrow();
    expect(() => act(g, 3, { type: 'bet', to: 40 })).toThrow();
    for (const to of [39, 1001, -1, 40.5, NaN, Infinity]) expect(() => act(g, 3, { type: 'raise', to })).toThrow();
    expect(() => act(g, 3, { type: 'oops' } as never)).toThrow();
    expect(() => startHand(g)).toThrow();
    expect(g).toEqual(snapshot);
  });
  it('enforces the last full raise increment and revisits prior actors', () => {
    let g = begin();
    g = act(g, 3, { type: 'raise', to: 60 });
    expect(g.minRaise).toBe(40); expect(legalActions(g).raise?.min).toBe(100);
    g = move(g, 'call'); g = act(g, 1, { type: 'raise', to: 100 });
    expect(g.actor).toBe(2); g = move(g, 'call'); expect(g.actor).toBe(3);
    g = move(g, 'call'); expect(g.actor).toBe(0); g = move(g, 'call');
    expect(g.phase).toBe('flop'); expect(total(g)).toBe(4000);
  });
  it('requires bet rather than raise on an unopened street and disallows calls when checking', () => {
    let g = flop(begin());
    expect(legalActions(g).bet).toEqual({ min: 20, max: 1000 - 20 });
    expect(() => move(g, 'call')).toThrow();
    expect(() => act(g, 1, { type: 'raise', to: 20 })).toThrow();
    expect(() => act(g, 1, { type: 'bet', to: 19 })).toThrow();
    g = act(g, 1, { type: 'bet', to: 50 });
    expect(g.minRaise).toBe(50); expect(legalActions(g).raise?.min).toBe(100);
  });
  it('does not reopen betting for a single short all-in raise', () => {
    let g = begin([1000, 1000, 50, 1000]);
    g = act(g, 3, { type: 'raise', to: 40 });
    g = move(g, 'call'); g = move(g, 'call'); g = move(g, 'all-in');
    expect(g.currentBet).toBe(50); expect(g.minRaise).toBe(20); expect(g.actor).toBe(3);
    expect(legalActions(g).raise).toBeNull(); expect(legalActions(g).allIn).toBe(false);
    expect(() => act(g, 3, { type: 'raise', to: 70 })).toThrow();
    expect(() => move(g, 'all-in')).toThrow();
    g = move(g, 'call'); g = move(g, 'call'); g = move(g, 'call'); expect(g.phase).toBe('flop');
  });
  it('reopens after cumulative short raises total a full raise', () => {
    let g = begin([1000, 50, 60, 1000]);
    g = act(g, 3, { type: 'raise', to: 40 }); g = move(g, 'call');
    g = move(g, 'all-in'); expect(g.currentBet).toBe(50);
    g = move(g, 'all-in'); expect(g.currentBet).toBe(60);
    expect(g.actor).toBe(3); expect(legalActions(g).raise?.min).toBe(80);
    g = act(g, 3, { type: 'raise', to: 80 }); expect(g.actor).toBe(0);
  });
  it('allows an unacted player to raise after a short all-in', () => {
    let g = begin([1000, 1000, 1000, 25]);
    g = move(g, 'all-in'); expect(g.currentBet).toBe(25);
    expect(legalActions(g).raise?.min).toBe(45);
    g = act(g, 0, { type: 'raise', to: 45 }); expect(g.minRaise).toBe(20);
  });
  it('allows a prior checker to raise a short opening all-in by a full minimum increment', () => {
    let g = flop(begin([1000, 1000, 25, 1000]));
    g = move(g, 'check'); g = move(g, 'all-in');
    expect(g.currentBet).toBe(5); expect(legalActions(g).raise?.min).toBe(25);
    g = move(g, 'call'); g = move(g, 'call');
    expect(g.actor).toBe(1); expect(legalActions(g).raise?.min).toBe(25);
    g = act(g, 1, { type: 'raise', to: 25 }); expect(g.minRaise).toBe(20);
  });
  it('handles all-in calls smaller than the amount owed', () => {
    let g = begin([35, 1000, 1000, 1000]);
    g = act(g, 3, { type: 'raise', to: 100 });
    expect(legalActions(g).call).toBe(35);
    g = move(g, 'call'); expect(g.players[0].status).toBe('all-in'); expect(g.players[0].committed).toBe(35);
    expect(total(finish(g))).toBe(3035);
  });
  it('automatically runs out when all players are all-in and distributes unequal side pots', () => {
    let g = startHand(createGame({ stacks: [100, 200, 300, 400] }), { deck: orderedDeck('Ks Qs Js As Kh Qh Jh Ah 3c 2c 5d 7h 4c 9s 6c 10d') });
    g = move(g, 'all-in'); g = move(g, 'all-in'); g = move(g, 'call'); g = move(g, 'call');
    expect(g.phase).toBe('showdown'); expect(g.board).toHaveLength(5); expect(g.actor).toBeNull();
    expect(g.players.map(p => p.chips)).toEqual([400, 300, 200, 100]);
    expect(g.results.map(p => p.amount)).toEqual([400, 300, 200]);
    expect(g.refunds).toEqual([{ seat: 3, amount: 100 }]); expect(total(g)).toBe(1000);
  });
  it('splits a board-only winning hand without using suits as tie breakers', () => {
    const g = finish(startHand(createGame(), { deck: orderedDeck('2c 3c 4c 5c 6c 7c 8c 9c 2d As Ks Qs 3d Js 4d 10s') }));
    expect(g.results[0].winners).toHaveLength(4); expect(g.players.map(p => p.chips)).toEqual([1000, 1000, 1000, 1000]);
  });
  it('awards folds immediately and refunds an uncalled raise', () => {
    let g = begin(); g = act(g, 3, { type: 'raise', to: 100 });
    g = move(g, 'fold'); g = move(g, 'fold'); g = move(g, 'fold');
    expect(g.phase).toBe('complete'); expect(g.board).toHaveLength(0);
    expect(g.players.map(p => p.chips)).toEqual([1000, 990, 980, 1030]);
    expect(g.refunds).toEqual([{ seat: 3, amount: 80 }]); expect(total(g)).toBe(4000);
    expect(() => move(g, 'check')).toThrow();
  });
  it('uses dealer/small blind first preflop and big blind first postflop heads-up', () => {
    let g = begin([1000, 0, 1000, 0]);
    expect(g.dealer).toBe(0); expect(g.smallBlindSeat).toBe(0); expect(g.bigBlindSeat).toBe(2); expect(g.actor).toBe(0);
    g = move(g, 'call'); g = move(g, 'check'); expect(g.phase).toBe('flop'); expect(g.actor).toBe(2);
    const next = startHand(finish(g), { random: seededRandom(2) });
    expect(next.dealer).toBe(2); expect(next.smallBlindSeat).toBe(2); expect(next.bigBlindSeat).toBe(0); expect(next.actor).toBe(2);
  });
  it('posts short blinds without forcing an overcall or permitting side bets against only all-ins', () => {
    let g = begin([1000, 0, 5, 0]);
    expect(g.phase).toBe('showdown'); expect(g.players.reduce((sum, p) => sum + p.chips, 0)).toBe(1005);
    g = begin([1000, 0, 25, 0]); g = move(g, 'all-in');
    expect(g.actor).toBe(2); expect(legalActions(g).raise).toBeNull();
    g = move(g, 'call'); expect(g.phase).toBe('showdown'); expect(total(g)).toBe(1025);
  });
  it('permits only call or fold when the last active seat faces an all-in', () => {
    let g = begin([1000, 0, 50, 0]); g = move(g, 'call'); g = move(g, 'all-in');
    expect(g.actor).toBe(0); expect(legalActions(g).call).toBe(30);
    expect(legalActions(g).raise).toBeNull(); expect(legalActions(g).allIn).toBe(false);
    g = move(g, 'call'); expect(g.phase).toBe('showdown');
  });
  it('rotates the button and skips eliminated seats; ends sessions with one funded seat', () => {
    let g = begin([100, 0, 100, 0]); g = move(g, 'fold');
    g = startHand(g); expect(g.dealer).toBe(2);
    let end = startHand(createGame({ stacks: [10, 0, 10, 0] }), { deck: orderedDeck('Ks As Kh Ah 3c 2c 5d 7h 4c 9s 6c 10d') });
    expect(end.phase).toBe('showdown'); expect(end.players[0].chips).toBe(20);
    expect(() => startHand(end)).toThrow(/Session finished/);
  });
  it('rejects malformed configurations, decks and corrupted snapshots', () => {
    for (const stacks of [[1, 2], [0, 0, 0, 1], [1000, -1, 1000, 1000], [1.1, 1, 1, 1]]) expect(() => createGame({ stacks })).toThrow();
    expect(() => createGame({ smallBlind: 20, bigBlind: 10 })).toThrow();
    expect(() => createGame({ dealer: 4 })).toThrow();
    expect(() => startHand(createGame(), { deck: cards('As Ks') })).toThrow();
    const g = begin();
    const corruptions = [(s: Game) => { s.players[0].chips++; }, (s: Game) => { s.actor = 1; s.players[1].status = 'folded'; },
      (s: Game) => { s.board.push(s.players[0].hole[0]); }, (s: Game) => { s.players[0].streetBet = 100; },
      (s: Game) => { s.phase = 'river'; }, (s: Game) => { s.minRaise = 1; }];
    for (const corrupt of corruptions) { const state = structuredClone(g); corrupt(state); expect(() => validateGame(state)).toThrow(); expect(() => act(state, 3, { type: 'call' })).toThrow(); }
  });
  it('filters private information and returns detached observations', () => {
    const g = begin(); const view = observe(g, 0);
    expect(view.players[0].hole).toHaveLength(2);
    expect(view.players.slice(1).every(p => p.hole.length === 0)).toBe(true);
    expect(view).not.toHaveProperty('deck'); expect(view).not.toHaveProperty('burns');
    view.players[0].hole[0].rank = view.players[0].hole[0].rank === 2 ? 'A' : 2;
    expect(g.players[0].hole).not.toEqual(view.players[0].hole);
  });
  it('conserves chips and terminates across 150 seeded random legal-action hands', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const random = seededRandom(seed);
      let g = startHand(createGame(), { random }); let count = 0;
      while (g.actor !== null) {
        expect(++count).toBeLessThan(300);
        const legal = legalActions(g);
        const choices: Parameters<typeof act>[2][] = [{ type: 'fold' }];
        if (legal.check) choices.push({ type: 'check' });
        if (legal.call !== null) choices.push({ type: 'call' });
        if (legal.allIn) choices.push({ type: 'all-in' });
        if (legal.bet) choices.push({ type: 'bet', to: legal.bet.min });
        if (legal.raise) choices.push({ type: 'raise', to: legal.raise.min });
        g = act(g, g.actor, choices[Math.floor(random() * choices.length)]);
        expect(total(g)).toBe(4000); validateGame(g);
      }
      expect(['showdown', 'complete']).toContain(g.phase);
      expect(g.players.every(p => p.chips >= 0)).toBe(true);
    }
  });
  it('awards a real showdown odd chip to the tied winner left of the button', () => {
    let g = startHand(createGame({ stacks: [1, 1, 1, 0], smallBlind: 1, bigBlind: 2 }), {
      deck: orderedDeck('As Ks Ah Ad Kh Ac 3c 2c 5d 7h 4c 9s 6c 10d'),
    });
    g = move(g, 'call');
    expect(g.phase).toBe('showdown');
    expect(g.players.map(p => p.chips)).toEqual([1, 2, 0, 0]);
    expect(g.results[0].awards).toEqual([{ seat: 1, amount: 2 }, { seat: 0, amount: 1 }]);
  });
  it('keeps folded chips in both contribution layers while restricting side-pot eligibility', () => {
    let g = startHand(createGame({ stacks: [1000, 1000, 1000, 50] }), {
      deck: orderedDeck('Ks Qs As Js Kh Qh Ah Jh 3c 2c 5d 7h 4c 9s 6c 10d'),
    });
    g = move(g, 'all-in'); g = move(g, 'call');
    g = act(g, 1, { type: 'raise', to: 100 }); g = move(g, 'call'); g = move(g, 'fold');
    g = finish(g);
    expect(g.results.map(p => ({ amount: p.amount, eligible: p.eligible, winners: p.winners }))).toEqual([
      { amount: 200, eligible: [1, 2, 3], winners: [3] },
      { amount: 100, eligible: [1, 2], winners: [1] },
    ]);
    expect(g.players.map(p => p.chips)).toEqual([950, 1000, 900, 200]);
    expect(total(g)).toBe(3050);
  });
  it('allows a big-blind raise after limpers, and a full-sized all-in reopens betting', () => {
    let g = begin([1000, 1000, 60, 1000]);
    g = move(g, 'call'); g = move(g, 'call'); g = move(g, 'call');
    expect(g.actor).toBe(2); g = move(g, 'all-in');
    expect(g.currentBet).toBe(60); expect(g.minRaise).toBe(40);
    expect(legalActions(g).raise?.min).toBe(100);
    g = act(g, 3, { type: 'raise', to: 100 });
    expect(total(finish(g))).toBe(3060);
  });
  it('plays 50 seeded sessions through elimination and changing table size', () => {
    for (let seed = 200; seed < 250; seed++) {
      const random = seededRandom(seed);
      let g = createGame(); let hands = 0;
      while (g.players.filter(p => p.chips > 0).length > 1) {
        expect(++hands).toBeLessThan(100);
        g = startHand(g, { random });
        let actions = 0;
        while (g.actor !== null) {
          expect(++actions).toBeLessThan(20);
          const legal = legalActions(g);
          g = act(g, g.actor, { type: legal.allIn ? 'all-in' : legal.check ? 'check' : 'call' });
          validateGame(g); expect(total(g)).toBe(4000);
        }
      }
      expect(g.players.filter(p => p.chips === 4000)).toHaveLength(1);
      expect(() => startHand(g)).toThrow(/Session finished/);
    }
  });

  it('caps the call at actual short all-in contributions after multiple sub-blind calls', () => {
    let g = begin([1000, 1, 2, 3]);
    expect(g.actor).toBe(3); g = move(g, 'all-in');
    expect(g.actor).toBe(0); expect(legalActions(g).call).toBe(3);
    g = move(g, 'call');
    expect(g.phase).toBe('showdown'); expect(total(g)).toBe(1006);
  });
  it('runs with no DOM dependency', () => {
    expect(typeof document).toBe('undefined');
    expect(finish(begin()).phase).toBe('showdown');
  });
  it('conserves arbitrary short stacks over 100 seeded all-in scenarios', () => {
    for (let seed = 300; seed < 400; seed++) {
      const random = seededRandom(seed);
      const stacks = Array.from({ length: 4 }, () => Math.floor(random() * 40) + 1);
      let g = startHand(createGame({ stacks }), { random });
      while (g.actor !== null) {
        const legal = legalActions(g);
        g = act(g, g.actor, { type: legal.allIn ? 'all-in' : legal.check ? 'check' : 'call' });
        expect(total(g)).toBe(stacks.reduce((a, b) => a + b, 0));
      }
      expect(g.phase).toBe('showdown');
    }
  });

});

it('rejects inconsistent dealer/blind positions and incomplete settlement records',()=>{
  for(const mutate of [
    (g: Game)=>{g.dealer=1;},
    (g: Game)=>{[g.smallBlindSeat,g.bigBlindSeat]=[g.bigBlindSeat,g.smallBlindSeat];},
  ]) { const g=begin(); mutate(g); expect(()=>validateGame(g)).toThrow(); }
  const settled=finish(begin());
  settled.results=[];
  expect(()=>validateGame(settled)).toThrow();
  let refund=act(begin(),3,{type:'raise',to:100});
  for(let i=0;i<3;i++)refund=act(refund,refund.actor!,{type:'fold'});
  refund.refunds.push({...refund.refunds[0]});
  expect(()=>validateGame(refund)).toThrow();
});
