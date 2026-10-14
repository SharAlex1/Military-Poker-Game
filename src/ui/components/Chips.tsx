import './chips.css';
const denominations = [250, 100, 25, 5, 1];
/** Cosmetic breakdown only; the numeric game balance is authoritative. */
export function chipBreakdown(amount: number) {
  let remaining = Math.max(0, Math.floor(amount));
  return denominations.flatMap(value => { const count = Math.floor(remaining / value); remaining %= value; return count ? [{ value, count }] : []; });
}
export function Chips({ amount, compact = false, moving = false }: { amount: number; compact?: boolean; moving?: boolean }) {
  return <span role="img" className={`chip-group${compact ? ' compact' : ''}${moving ? ' chip-transfer' : ''}`} aria-label={`${amount} fictional chips`}>
    {chipBreakdown(amount).map(({ value, count }) => <span className="chip-column" key={value} title={`${count} × ${value} chips`} aria-hidden="true">
      <span className="chip-stack">{Array.from({ length: Math.min(count, 4) }, (_, i) => <span key={i} className={`poker-chip denomination-${value}`} style={{ bottom: `${i * 3}px` }}><span>{value}</span></span>)}</span>
    </span>)}
  </span>;
}
