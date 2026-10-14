import { describe, expect, it } from 'vitest';
import { createLobby } from './lobby';

describe('placeholder lobby', () => {
  it('reserves one human seat and three unique computer seats with fictional chips', () => {
    const seats = createLobby();
    expect(seats).toHaveLength(4);
    expect(seats.filter(seat => seat.controller === 'human')).toHaveLength(1);
    expect(seats.filter(seat => seat.controller === 'computer')).toHaveLength(3);
    expect(new Set(seats.map(seat => seat.id)).size).toBe(4);
    expect(seats.every(seat => seat.chips === 1000)).toBe(true);
  });
  it('does not share mutable seat state between lobbies', () => {
    const first = createLobby();
    first[0].chips = 0;
    expect(createLobby()[0].chips).toBe(1000);
  });
});
