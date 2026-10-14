// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { awardPots, buildPots } from './pots';
import { evaluateHand } from './evaluate';
import { cards } from './test-helpers';
const rank = (text: string) => evaluateHand(cards(text));
describe('pots and distribution', () => {
  it('builds multiple side pots and refunds the unmatched top layer', () => {
    expect(buildPots([100, 200, 300, 400].map((amount, seat) => ({ seat, amount, folded: false })))).toEqual({
      pots: [{ amount: 400, eligible: [0, 1, 2, 3] }, { amount: 300, eligible: [1, 2, 3] }, { amount: 200, eligible: [2, 3] }],
      refunds: [{ seat: 3, amount: 100 }],
    });
  });
  it('includes dead money but excludes folded players from winning', () => {
    const result = buildPots([100, 200, 200].map((amount, seat) => ({ seat, amount, folded: seat === 1 })));
    expect(result.pots).toEqual([{ amount: 300, eligible: [0, 2] }, { amount: 200, eligible: [2] }]);
    const awards = awardPots(result.pots, { 0: rank('As Ks Qs Js 10s'), 2: rank('2c 3d 4h 6s 8c') }, 0);
    expect(awards.map(pot => pot.awards)).toEqual([[{ seat: 0, amount: 300 }], [{ seat: 2, amount: 200 }]]);
  });
  it('splits ties and awards odd chips clockwise after the button per pot', () => {
    const hand = rank('As Ks Qs Js 10s');
    expect(awardPots([{ amount: 11, eligible: [0, 2, 3] }, { amount: 7, eligible: [0, 2] }], { 0: hand, 2: hand, 3: hand }, 2).map(p => p.awards))
      .toEqual([[{ seat: 3, amount: 4 }, { seat: 0, amount: 4 }, { seat: 2, amount: 3 }], [{ seat: 0, amount: 4 }, { seat: 2, amount: 3 }]]);
  });
  it('rejects invalid contributions, orphan pots and missing hands', () => {
    expect(() => buildPots([{ seat: 0, amount: -1, folded: false }])).toThrow();
    expect(() => buildPots([{ seat: 0, amount: 1, folded: true }, { seat: 1, amount: 1, folded: true }])).toThrow();
    expect(() => awardPots([{ amount: 2, eligible: [0, 1] }], {}, 0)).toThrow();
  });
});
