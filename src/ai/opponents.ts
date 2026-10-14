export interface OpponentProfile {
  id: string;
  callsign: string;
  plannedStyle: string;
}

/** Profiles are presentation metadata, not implemented decision policies. */
export const opponents: readonly OpponentProfile[] = [
  { id: 'rook', callsign: 'Rook', plannedStyle: 'Disciplined and patient' },
  { id: 'viper', callsign: 'Viper', plannedStyle: 'Aggressive and unpredictable' },
  { id: 'anchor', callsign: 'Anchor', plannedStyle: 'Measured and observant' },
];
