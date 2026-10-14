// @vitest-environment node
import { expect, it } from 'vitest';
import { act, createGame, startHand, validateGame, legalActions } from '../poker/engine';
import { orderedDeck } from '../poker/test-helpers';
import { createSession, computerAction, humanAction, nextHand, sessionOutcome, visibleCards, applyAction } from './session';

it('guards new hands, human turns, invalid seeds and preserves action history', () => {
  const session = createSession(42);
  expect(() => humanAction(session,{ type:'call' })).toThrow();
  expect(() => nextHand(session)).toThrow();
  expect(() => createSession(NaN)).toThrow();
  const next = computerAction(session);
  expect(next.history.length).toBeGreaterThan(session.history.length);
  expect(session.revision).toBe(0); expect(next.revision).toBe(1);
});
it('hides all opponents until showdown, keeps folded cards hidden and does not reveal uncontested winners', () => {
  let game = startHand(createGame(), {deck:orderedDeck('2c 3c 4c 5c 6c 7c 8c 9c 2d As Ks Qs 3d Js 4d 10s')});
  expect(visibleCards(game,0)).toHaveLength(2);
  for (const seat of [1,2,3]) expect(visibleCards(game,seat)).toHaveLength(0);
  game = act(game,3,{type:'fold'});
  while(game.actor !== null) game=act(game,game.actor,{type:game.currentBet>game.players[game.actor].streetBet?'call':'check'});
  expect(game.phase).toBe('showdown'); expect(visibleCards(game,1)).toHaveLength(2); expect(visibleCards(game,3)).toHaveLength(0);
  game=startHand(createGame()); for(let n=0;n<3;n++)game=act(game,game.actor!,{type:'fold'});
  expect(game.phase).toBe('complete'); for(const seat of [1,2,3])expect(visibleCards(game,seat)).toHaveLength(0);
});
it('completes 12 single-player sessions against all three opponents without stalled turns or lost chips', () => {
  let showdowns=0; let busts=0;
  for(let seed=1;seed<=12;seed++) {
    let session=createSession(seed); let hands=1; let steps=0;
    while(sessionOutcome(session)==='playing') {
      if(session.game.actor===null) { showdowns+=Number(session.game.phase==='showdown'); expect(++hands).toBeLessThan(600); session=nextHand(session); }
      else if(session.game.actor===0) {
        // An aggressive human repeatedly commits stacks, exercising elimination and short-stack calls.
        expect(session.game.players[0].chips).toBeGreaterThan(0);
        const actions = legalActions(session.game,0);
        session=humanAction(session,{type:actions.allIn?'all-in':actions.check?'check':'call'});
      } else session=computerAction(session);
      expect(++steps).toBeLessThan(10000); validateGame(session.game);
      expect(session.game.players.reduce((sum,p)=>sum+p.chips+p.committed,0)).toBe(4000);
    }
    busts+=Number(sessionOutcome(session)==='lost');
    expect(session.game.actor).toBeNull();
    expect(()=>nextHand(session)).toThrow();
  }
  expect(showdowns+busts).toBeGreaterThan(0);
},60000);

it('records whether all-ins increased the wager, distinguishing raises from short calls',()=>{
  let session={...createSession(42),game:startHand(createGame({stacks:[1000,1000,1000,30]}))};
  session=applyAction(session,3,{type:'all-in'});
  expect(session.history.at(-1)?.wagerIncreased).toBe(true);
  session={...createSession(42),game:startHand(createGame({stacks:[1000,1000,30,1000]}))};
  session=applyAction(session,3,{type:'raise',to:100});
  session=applyAction(session,0,{type:'call'}); session=applyAction(session,1,{type:'call'});
  session=applyAction(session,2,{type:'all-in'});
  const call=session.history.find(e=>e.seat===2 && e.action.type==='all-in');
  expect(call?.wagerIncreased).toBe(false);
  expect(call?.text).toContain('10'); // 20 chips were already posted as the big blind.
});
