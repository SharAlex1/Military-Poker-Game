// @vitest-environment node
import { expect, it } from 'vitest';
import { createDeck } from './deck';
import { evaluateHand } from './evaluate';

it('matches the standard category frequencies across all 2,598,960 five-card hands',()=>{
  const deck=createDeck(); const counts=Array<number>(9).fill(0);
  for(let a=0;a<48;a++)for(let b=a+1;b<49;b++)for(let c=b+1;c<50;c++)for(let d=c+1;d<51;d++)for(let e=d+1;e<52;e++)
    counts[evaluateHand([deck[a],deck[b],deck[c],deck[d],deck[e]]).category]++;
  // Independent combinatorial totals, ordered high-card through straight-flush (royals included).
  expect(counts).toEqual([1302540,1098240,123552,54912,10200,5108,3744,624,40]);
  expect(counts.reduce((a,b)=>a+b,0)).toBe(2598960);
},60000);
