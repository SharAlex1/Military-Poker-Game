import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Chips, chipBreakdown } from './Chips';
it.each([0,1,6,26,101,999,1000,3999,4000])('represents %i fictional chips with exact denominations', amount => {
  expect(chipBreakdown(amount).reduce((sum,p)=>sum+p.value*p.count,0)).toBe(amount);
});
it('bounds decorative stacks while retaining the exact accessible amount',()=>{
  const {container}=render(<Chips amount={4000} />);
  expect(screen.getByLabelText('4000 fictional chips')).toBeInTheDocument();
  expect(container.querySelectorAll('.poker-chip')).toHaveLength(4);
});
