import type { Style } from './strategy';
export interface OpponentProfile { id: string; callsign: string; plannedStyle: string; style: Style; role: string }
export const opponents: readonly OpponentProfile[] = [
  { id: 'rook', callsign: 'Rook', plannedStyle: 'Disciplined and patient', style: 'cautious', role: 'Recon specialist' },
  { id: 'viper', callsign: 'Viper', plannedStyle: 'Aggressive and unpredictable', style: 'aggressive', role: 'Assault lead' },
  { id: 'anchor', callsign: 'Anchor', plannedStyle: 'Measured and observant', style: 'balanced', role: 'Watch commander' },
];
