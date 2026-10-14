import { useState } from 'react';
import { act, createGame, legalActions, startHand, type Action, type Game } from '../poker/engine';
import { seededRandom } from '../poker/deck';
import type { Card } from '../poker/types';

const formatCard = (card: Card) => `${card.rank}${{ clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' }[card.suit]}`;
const fresh = (seed: number) => startHand(createGame(), { random: seededRandom(seed) });

/** Debug harness: controls every seat. This is deliberately not opponent AI. */
export function Simulator() {
  const [seed, setSeed] = useState(42);
  const [game, setGame] = useState<Game>(() => fresh(42));
  const [amount, setAmount] = useState('40');
  const [error, setError] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const legal = legalActions(game);
  const actor = game.actor === null ? null : game.players[game.actor];
  const range = legal.bet ?? legal.raise;
  const apply = (action: Action) => {
    try {
      const next = act(game, game.actor!, action);
      setGame(next); setError('');
      setLog(previous => [...previous, `${actor?.name}: ${action.type}${'to' in action ? ` to ${action.to}` : ''} → ${next.phase}`]);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Invalid action'); }
  };
  const reset = () => {
    try { setGame(fresh(seed)); setLog([]); setError(''); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Invalid seed'); }
  };
  const finish = () => {
    try {
      let next = game;
      while (next.actor !== null) {
        const actions = legalActions(next);
        next = act(next, next.actor, { type: actions.check ? 'check' : 'call' });
      }
      setGame(next); setError(''); setLog(previous => [...previous, 'Remaining actors called/checked to showdown.']);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Simulation failed'); }
  };
  return (
    <section className="simulator" aria-labelledby="simulator-title">
      <h2 id="simulator-title">Rules engine simulator</h2>
      <p>Debug mode: control all four seats; all hole cards are visible. Computer strategy is not implemented.</p>
      <div className="sim-controls">
        <label>Shuffle seed <input type="number" value={seed} onChange={event => setSeed(Number(event.target.value))} /></label>
        <button onClick={reset}>Reset simulation</button>
        <button disabled={game.actor !== null || game.players.filter(p => p.chips > 0).length < 2} onClick={() => {
          try { setGame(startHand(game, { random: seededRandom(seed + game.handNumber) })); setLog([]); setError(''); }
          catch (problem) { setError(problem instanceof Error ? problem.message : 'Cannot start hand'); }
        }}>Next hand</button>
      </div>
      <p role="status">Hand {game.handNumber} · Phase: {game.phase} · Dealer: {game.players[game.dealer].name} · Blinds: {game.smallBlind}/{game.bigBlind}</p>
      <p>Board: {game.board.map(formatCard).join(' ') || 'Not dealt'} · Pot: {game.players.reduce((sum, p) => sum + p.committed, 0)} · Current bet: {game.currentBet}</p>
      <div className="sim-table-wrap"><table>
        <thead><tr><th>Seat</th><th>Cards</th><th>Stack</th><th>Street bet</th><th>Committed</th><th>Status</th></tr></thead>
        <tbody>{game.players.map((player, i) => <tr key={player.id} aria-current={game.actor === i ? 'true' : undefined}>
          <th>{player.name}{game.actor === i ? ' ← acting' : ''}</th><td>{player.hole.map(formatCard).join(' ') || '—'}</td>
          <td>{player.chips}</td><td>{player.streetBet}</td><td>{player.committed}</td><td>{player.status}</td>
        </tr>)}</tbody>
      </table></div>
      <p>Acting seat: {actor?.name ?? 'Hand resolved'}</p>
      <div className="sim-controls">
        <button disabled={!legal.fold} onClick={() => apply({ type: 'fold' })}>Fold</button>
        <button disabled={!legal.check} onClick={() => apply({ type: 'check' })}>Check</button>
        <button disabled={legal.call === null} onClick={() => apply({ type: 'call' })}>Call{legal.call === null ? '' : ` ${legal.call}`}</button>
        <button disabled={!legal.allIn} onClick={() => apply({ type: 'all-in' })}>All-in</button>
        <label>Street total <input type="number" value={amount} onChange={event => setAmount(event.target.value)} min={range?.min} max={range?.max} step="1" /></label>
        <button disabled={!range} onClick={() => apply({ type: legal.bet ? 'bet' : 'raise', to: Number(amount) })}>{legal.bet ? 'Bet' : 'Raise'}</button>
        <button disabled={game.actor === null} onClick={finish}>Call/check to showdown</button>
      </div>
      {range && <p>Legal {legal.bet ? 'bet' : 'raise'} total: {range.min}–{range.max} chips.</p>}
      {error && <p role="alert">{error}</p>}
      {game.results.map((pot, i) => <p key={i}>Pot {i + 1}: {pot.amount} chips → {pot.awards.map(award => `${game.players[award.seat].name} +${award.amount}`).join(', ')}</p>)}
      {game.refunds.map(refund => <p key={refund.seat}>Uncalled refund: {game.players[refund.seat].name} +{refund.amount}</p>)}
      {game.actor === null && game.players.filter(p => p.chips > 0).length < 2 && <p>Session complete. Reset to start again.</p>}
      <details><summary>Action log</summary><pre>{log.join('\n') || 'No actions yet.'}</pre></details>
    </section>
  );
}
