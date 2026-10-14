import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('shows the roster, fictional-chip notice, and an unavailable deal action', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Outpost Poker' })).toBeInTheDocument();
  const table = screen.getByRole('region', { name: 'Table roster' });
  expect(within(table).getAllByRole('listitem')).toHaveLength(4);
  for (const name of ['You', 'Rook', 'Viper', 'Anchor']) {
    expect(within(table).getByRole('heading', { name })).toBeInTheDocument();
  }
  expect(screen.getByText(/No real-money gambling/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Deal hand/ })).toBeDisabled();
});
