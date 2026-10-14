import { opponents } from '../ai/opponents';

export interface Seat {
  id: string;
  name: string;
  controller: 'human' | 'computer';
  chips: number;
}

/** A fresh placeholder lobby; this is not an active hand. */
export function createLobby(): Seat[] {
  return [
    { id: 'player', name: 'You', controller: 'human', chips: 1000 },
    ...opponents.map(({ id, callsign }) => ({
      id, name: callsign, controller: 'computer' as const, chips: 1000,
    })),
  ];
}
