// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compareHands, evaluateHand } from './evaluate';
import { cards } from './test-helpers';

const examples = [
  'As Jd 9h 6c 3s', 'As Ad 9h 6c 3s', 'As Ad 9h 9c 3s',
  'As Ad Ah 6c 3s', '9s 8d 7h 6c 5s', 'As Js 9s 6s 3s',
  'As Ad Ah 6c 6s', 'As Ad Ah Ac 3s', 'As Ks Qs Js 10s',
];
describe('hand evaluation', () => {
  it.each(examples.map((text, category) => ({ text, category })))('recognizes category $category', ({ text, category }) => {
    expect(evaluateHand(cards(text)).category).toBe(category);
  });
  it('orders every category above its predecessor', () => {
    examples.slice(1).forEach((text, i) => expect(compareHands(evaluateHand(cards(text)), evaluateHand(cards(examples[i])))).toBeGreaterThan(0));
  });
  it('recognizes the wheel but does not wrap king through ace', () => {
    expect(evaluateHand(cards('As 2d 3h 4c 5s')).kickers).toEqual([5]);
    expect(evaluateHand(cards('Qs Kd Ah 2c 3s')).category).toBe(0);
    expect(compareHands(evaluateHand(cards('2s 3d 4h 5c 6s')), evaluateHand(cards('As 2d 3h 4c 5s')))).toBeGreaterThan(0);
  });
  it('uses the best five of seven, including two trips and three pairs', () => {
    expect(evaluateHand(cards('As Ad Ah Ks Kd Kh 2c')).kickers).toEqual([14, 13]);
    expect(evaluateHand(cards('As Ad Ks Kd Qs Qd 2c')).kickers).toEqual([14, 13, 12]);
    expect(evaluateHand(cards('As Ks Qs Js 10s 9h 8d')).category).toBe(8);
  });
  it.each([
    ['As Ad Kh Qc 9s', 'Ah Ac Ks Qd 8s'],
    ['As Ad Ks Kd Qh', 'Ah Ac Kh Kc Js'],
    ['As Ad Ah Ks Qh', 'Ac Ad Ah Kd Jh'],
    ['As Js 9s 6s 4s', 'Ah Jh 9h 6h 3h'],
    ['As Ad Ah Ac Ks', 'As Ad Ah Ac Qs'],
    ['Ks Kd Kh As Ad', 'Qs Qd Qh As Ad'],
  ])('breaks ties using category-specific kickers: %s vs %s', (a, b) => {
    expect(compareHands(evaluateHand(cards(a)), evaluateHand(cards(b)))).toBeGreaterThan(0);
  });
  it('ties identical rank patterns regardless of suits or unused hole cards', () => {
    expect(compareHands(evaluateHand(cards('As Ks Qs Js 10s 2h 3d')), evaluateHand(cards('As Ks Qs Js 10s 4h 5d')))).toBe(0);
    expect(compareHands(evaluateHand(cards('As Ad Kh Qc 9s')), evaluateHand(cards('Ah Ac Ks Qd 9h')))).toBe(0);
  });
  it('rejects duplicate, invalid and wrong-count cards', () => {
    expect(() => evaluateHand(cards('As As Kh Qc 9s'))).toThrow();
    expect(() => evaluateHand(cards('As Kd Qh Jc'))).toThrow();
    expect(() => evaluateHand(cards('As Kd Qh Jc 1s'))).toThrow();
  });
});
