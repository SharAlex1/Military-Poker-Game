import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Simulator } from './Simulator';

it('plays a complete hand, rotates the button and resets the seeded session', () => {
  render(<Simulator />);
  expect(screen.getByRole('status')).toHaveTextContent('Phase: preflop');
  expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next hand' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Call/check to showdown' }));
  expect(screen.getByRole('status')).toHaveTextContent('Phase: showdown');
  expect(screen.getByText(/Pot 1: 80 chips/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next hand' }));
  expect(screen.getByRole('status')).toHaveTextContent('Hand 2');
  expect(screen.getByRole('status')).toHaveTextContent('Dealer: Rook');
  fireEvent.click(screen.getByRole('button', { name: 'Reset simulation' }));
  expect(screen.getByRole('status')).toHaveTextContent('Hand 1');
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(5);
});

it('reports illegal raises while preserving the hand, then accepts a legal raise', () => {
  render(<Simulator />);
  fireEvent.change(screen.getByLabelText('Street total'), { target: { value: '39' } });
  fireEvent.click(screen.getByRole('button', { name: 'Raise' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Illegal bet or raise size');
  expect(screen.getByText('Acting seat: Anchor')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Street total'), { target: { value: '40' } });
  fireEvent.click(screen.getByRole('button', { name: 'Raise' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('Acting seat: You')).toBeInTheDocument();
});
