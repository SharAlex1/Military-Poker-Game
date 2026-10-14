import { useState } from 'react';
import type { Action, LegalActions } from '../../poker/engine';
export function Controls({ legal, enabled, onAction }: { legal: LegalActions; enabled: boolean; onAction: (action: Action) => void }) {
  const range = legal.bet ?? legal.raise;
  const [amount, setAmount] = useState(String(range?.min ?? 20));
  const valid = range && Number.isSafeInteger(Number(amount)) && Number(amount) >= range.min && Number(amount) <= range.max;
  return <section className="controls-panel" aria-label="Betting controls">
    <div className="control-buttons">
      <button disabled={!enabled || !legal.fold} onClick={() => onAction({ type: 'fold' })}>Fold</button>
      <button disabled={!enabled || !legal.check} onClick={() => onAction({ type: 'check' })}>Check</button>
      <button className="primary" disabled={!enabled || legal.call === null} onClick={() => onAction({ type: 'call' })}>Call{legal.call !== null ? ` ${legal.call}` : ''}</button>
      <button disabled={!enabled || !legal.allIn} onClick={() => onAction({ type: 'all-in' })}>All-in</button>
    </div>
    <div className="raise-controls">
      <label htmlFor="wager">{legal.bet ? 'Bet' : 'Raise'} to <small>(total this round)</small></label>
      <input id="wager" type="number" min={range?.min} max={range?.max} step="1" value={amount} disabled={!enabled || !range} onChange={e => setAmount(e.target.value)} />
      <button className="primary" disabled={!enabled || !valid} onClick={() => onAction({ type: legal.bet ? 'bet' : 'raise', to: Number(amount) })}>{legal.bet ? 'Bet' : 'Raise'}</button>
      <span>{enabled && range ? `Legal total: ${range.min}–${range.max}` : 'Controls unlock on your turn'}</span>
    </div>
  </section>;
}
