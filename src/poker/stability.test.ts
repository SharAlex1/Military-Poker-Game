// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import { act, createGame, legalActions, startHand, validateGame, type Action, type Game } from './engine';
import { seededRandom } from './deck';
import { compareHands, evaluateHand } from './evaluate';
import { orderedDeck } from './test-helpers';

const royalBoard = () => orderedDeck('2c 3c 4c 5c 6c 7c 8c 9c 2d As Ks Qs 3d Js 4d 10s');
const stats = { completedHands: 0, fourSeatHands: 0, allIns: 0, sidePotHands: 0, splitPotHands: 0, eliminations: 0, rotations: 0 };
function assertState(g: Game, total: number) {
  validateGame(g);
  expect(g.players.reduce((sum,p) => sum+p.chips+p.committed,0)).toBe(total);
  expect(g.players.every(p=>Number.isSafeInteger(p.chips) && p.chips>=0)).toBe(true);
  if (g.actor!==null) expect(g.players[g.actor].status).toBe('active');
}
function complete(input: Game, random: () => number, policy: 'mixed' | 'all-in' | 'passive'): Game {
  let g=input; let turns=0;
  const originalStacks=g.players.map(p=>p.chips+p.committed);
  if(g.players.every(p=>p.hole.length===2))stats.fourSeatHands++;
  while(g.actor!==null) {
    if(++turns>500)throw new Error(`Turn bound exceeded: hand ${g.handNumber}, ${g.phase}`);
    const seat=g.actor; const player=g.players[seat]; const legal=legalActions(g);
    let action: Action;
    if(policy==='all-in')action={type:legal.allIn?'all-in':legal.check?'check':'call'};
    else if(policy==='passive')action={type:legal.check?'check':'call'};
    else {
      const choices:Action[]=[{type:legal.check?'check':'call'}];
      if(legal.call!==null)choices.push({type:'fold'});
      if(legal.allIn)choices.push({type:'all-in'});
      const range=legal.bet??legal.raise;
      if(range)choices.push({type:legal.bet?'bet':'raise',to:range.min+Math.floor(random()*(range.max-range.min+1))});
      action=choices[Math.floor(random()*choices.length)];
    }
    stats.allIns+=Number(action.type==='all-in');
    const paid=action.type==='all-in'?player.chips:action.type==='call'?Math.min(player.chips,g.currentBet-player.streetBet):'to' in action?action.to-player.streetBet:0;
    const contributions=g.players.map((p,i)=>p.committed+(i===seat?paid:0));
    const previous=JSON.stringify(g);
    const next=act(g,seat,action);
    expect(JSON.stringify(g)).toBe(previous);
    assertState(next,input.totalChips);
    if(next.actor===null) {
      const awards=next.results.flatMap(p=>p.awards);
      const refunds=next.refunds;
      // Independent ledger: no chips may disappear, be created, or be paid twice at settlement.
      expect([...awards,...refunds].reduce((sum,a)=>sum+a.amount,0)).toBe(contributions.reduce((a,b)=>a+b,0));
      next.players.forEach((p,i)=>expect(p.chips).toBe(originalStacks[i]-contributions[i]+[...awards,...refunds].filter(a=>a.seat===i).reduce((sum,a)=>sum+a.amount,0)));
      for(const pot of next.results) {
        expect(pot.awards.reduce((sum,a)=>sum+a.amount,0)).toBe(pot.amount);
        expect(pot.winners.every(i=>['active','all-in'].includes(next.players[i].status))).toBe(true);
        if(next.phase==='showdown') {
          const winner=evaluateHand([...next.players[pot.winners[0]].hole,...next.board]);
          for(const eligible of pot.eligible)expect(compareHands(winner,evaluateHand([...next.players[eligible].hole,...next.board]))).toBeGreaterThanOrEqual(0);
          for(const tied of pot.winners)expect(compareHands(winner,evaluateHand([...next.players[tied].hole,...next.board]))).toBe(0);
        }
        if(pot.winners.length>1)expect(Math.max(...pot.awards.map(a=>a.amount))-Math.min(...pot.awards.map(a=>a.amount))).toBeLessThanOrEqual(1);
      }
    }
    g=next;
  }
  stats.completedHands++;
  expect(['complete','showdown']).toContain(g.phase);
  expect(g.players.every(p=>p.committed===0 && p.streetBet===0)).toBe(true);
  stats.sidePotHands+=Number(g.results.length>1);
  stats.splitPotHands+=Number(g.results.some(p=>p.winners.length>1));
  stats.eliminations+=g.players.filter((p,i)=>originalStacks[i]>0 && p.chips===0).length;
  return g;
}

afterAll(()=>console.info('QA simulation coverage:',JSON.stringify(stats)));

describe('deterministic stability simulations',()=>{
  it.each(['mixed equal','mixed unequal','all-in unequal','split side pots'] as const)('completes 250 four-player hands: %s',mode=>{
    const before={...stats};
    for(let seed=0;seed<250;seed++) {
      const random=seededRandom(seed+17000);
      const stacks=mode==='mixed equal'?[1000,1000,1000,1000]:[100,600,1300,2000];
      const game=startHand(createGame({stacks,dealer:seed%4}),mode==='split side pots'?{deck:royalBoard()}:{random});
      expect(game.players.every(p=>p.hole.length===2)).toBe(true);
      complete(game,random,mode.startsWith('mixed')?'mixed':'all-in');
    }
    expect(stats.fourSeatHands-before.fourSeatHands).toBe(250);
    if(mode==='all-in unequal' || mode==='split side pots')expect(stats.sidePotHands-before.sidePotHands).toBe(250);
    if(mode==='split side pots')expect(stats.splitPotHands-before.splitPotHands).toBe(250);
  },30000);
  it('retains four funded seats across 200 consecutive split-pot hands and rotates the dealer',()=>{
    const before={...stats};
    for(let seed=0;seed<50;seed++) {
      let g=createGame({dealer:seed%4});
      for(let hand=0;hand<4;hand++) {
        g=complete(startHand(g,{deck:royalBoard()}),seededRandom(seed),'passive');
        expect(g.dealer).toBe((seed+hand)%4);
        expect(g.players.map(p=>p.chips)).toEqual([1000,1000,1000,1000]);
        if(hand)stats.rotations++;
      }
    }
    expect(stats.fourSeatHands-before.fourSeatHands).toBe(200);
    expect(stats.splitPotHands-before.splitPotHands).toBe(200);
    expect(stats.rotations-before.rotations).toBe(150);
  });
  it('plays 100 sessions through four-, three-, two- and one-funded-seat states',()=>{
    const tableSizes = new Set<number>();
    for(let seed=0;seed<100;seed++) {
      const random=seededRandom(seed+30000); let g=createGame({stacks:[100,600,1300,2000]}); let hands=0;
      while(g.players.filter(p=>p.chips>0).length>1) {
        if(++hands>100)throw new Error(`Session did not finish: seed ${seed}`);
        const funded=g.players.flatMap((p,i)=>p.chips>0?[i]:[]);
        tableSizes.add(funded.length);
        const expected=g.handNumber?Array.from({length:4},(_,n)=>(g.dealer+n+1)%4).find(i=>funded.includes(i))!:g.dealer;
        g=startHand(g,{random}); expect(g.dealer).toBe(expected);
        if(g.handNumber>1)stats.rotations++;
        if(funded.length===2) { expect(g.smallBlindSeat).toBe(g.dealer); expect(g.bigBlindSeat).not.toBe(g.dealer); }
        g=complete(g,random,'all-in');
      }
      tableSizes.add(1);
      expect(g.players.filter(p=>p.chips===4000)).toHaveLength(1);
      expect(()=>startHand(g)).toThrow(/Session finished/);
    }
    expect([...tableSizes].sort()).toEqual([1,2,3,4]);

  },30000);
});
