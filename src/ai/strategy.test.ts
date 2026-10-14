// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decide, estimateEquity, type Observation } from './strategy';
import { seededRandom } from '../poker/deck';
import { cards } from '../poker/test-helpers';
import { createSession, computerAction, humanAction } from '../state/session';
import { observe, validateGame } from '../poker/engine';

function view(): Observation {
  const game = createSession(42).game;
  const observation = observe(game, 3);
  observation.phase = 'river';
  observation.board = cards('Qs Js 10s 2d 3h');
  observation.players[3].hole = cards('As Ks');
  observation.pot = 200;
  observation.currentBet = 20;
  observation.legal = { fold: true, check: false, call: 20, allIn: true, bet: null, raise: { min: 40, max: 1000 } };
  return observation;
}
describe('opponent strategies', () => {
  it('estimates a guaranteed winner and shared board tie correctly', () => {
    const observation = view();
    expect(estimateEquity(observation, 3, seededRandom(2))).toBe(1);
    observation.board = cards('As Ks Qs Js 10s'); observation.players[3].hole = cards('2h 3h');
    expect(estimateEquity(observation, 3, seededRandom(2))).toBe(.25);
  });
  it('uses distinct legal sizing for cautious, balanced and aggressive value bets', () => {
    const observation = view();
    expect(decide(observation, 3, 'cautious', [], seededRandom(4))).toEqual({ type: 'raise', to: 110 });
    expect(decide(observation, 3, 'balanced', [], seededRandom(4))).toEqual({ type: 'raise', to: 150 });
    expect(decide(observation, 3, 'aggressive', [], seededRandom(4))).toEqual({ type: 'raise', to: 210 });
  });
  it('responds to betting history and stack risk rather than making a fixed action', () => {
    const observation = view();
    observation.board = cards('As Ks Qs Js 10s'); observation.players[3].hole = cards('2h 3h');
    observation.legal.call = 45; observation.pot = 200;
    // Equity .25: balanced calls without pressure, but folds after repeated aggression.
    expect(decide(observation, 3, 'balanced', [], () => .5).type).toBe('call');
    expect(decide(observation, 3, 'balanced', [0,1,2].map(seat => ({ seat, phase: 'river', hand: 1, action: { type: 'raise', to: 100 } })), () => .5).type).toBe('fold');
    observation.players[3].chips = 45;
    expect(decide(observation, 3, 'balanced', [], () => .5).type).toBe('fold');
  });
  it('never raises when raising rights are closed and checks for free', () => {
    const observation = view(); observation.legal.raise = null; observation.legal.allIn = false;
    expect(decide(observation, 3, 'aggressive', [], seededRandom(4))).toEqual({ type: 'call' });
    observation.legal.call = null; observation.legal.check = true;
    expect(decide(observation, 3, 'aggressive', [], seededRandom(4))).toEqual({ type: 'check' });
  });
  it('operates with opponents cards absent, rejects out-of-turn calls, and is reproducible', () => {
    const observation = observe(createSession(42).game, 3);
    expect(observation.players.slice(0,3).every(p => p.hole.length === 0)).toBe(true);
    expect(decide(observation, 3, 'aggressive', [], seededRandom(42))).toEqual(decide(observation, 3, 'aggressive', [], seededRandom(42)));
    expect(() => decide(observation, 2, 'balanced', [], seededRandom(42))).toThrow();
  });
  it('produces legal actions with all three profiles across 100 complete hands', () => {
    const actors = new Set<number>();
    for (let seed=0; seed<100; seed++) {
      let session = createSession(seed); let steps=0;
      while (session.game.actor !== null) {
        expect(++steps).toBeLessThan(300);
        const actor = session.game.actor;
        if (actor === 0) { const legal = observe(session.game,0).legal; session=humanAction(session, { type: legal.check ? 'check' : 'call' }); }
        else { actors.add(actor); session=computerAction(session); }
        validateGame(session.game);
        expect(session.game.players.reduce((sum,p)=>sum+p.chips+p.committed,0)).toBe(4000);
      }
    }
    expect([...actors].sort()).toEqual([1,2,3]);
  }, 30000);
});

it('does not treat recorded all-in calls as raises',()=>{
  const observation=view();
  observation.board=cards('As Ks Qs Js 10s'); observation.players[3].hole=cards('2h 3h');
  observation.legal.call=45; observation.pot=200;
  const calls=[0,1,2].map(seat=>({seat,phase:'river',hand:1,action:{type:'all-in' as const},wagerIncreased:false}));
  expect(decide(observation,3,'balanced',calls,()=>.5).type).toBe('call');
  const raises=calls.map(event=>({...event,wagerIncreased:true}));
  expect(decide(observation,3,'balanced',raises,()=>.5).type).toBe('fold');
});
