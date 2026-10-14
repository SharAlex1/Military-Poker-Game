import { useEffect, useState } from 'react';
import { legalActions } from '../poker/engine';
import { computerAction, createSession, humanAction, nextHand, sessionOutcome, type Session, type Entry } from '../state/session';
import { TableScene } from './components/TableScene';
import { ActionHistory } from './components/ActionHistory';
import './theme/tokens.css';
import { Controls } from './components/Controls';
import { Simulator } from './Simulator';
import './animations.css';
import '../assets/bunker.css';

export interface AppProps { initialSession?: Session; aiDelay?: number }
const fresh = () => createSession(Math.floor(Math.random() * 4294967296));
export function App({ initialSession, aiDelay = 650 }: AppProps) {
  const [session, setSession] = useState(() => initialSession ?? fresh());
  const [error, setError] = useState('');
  const [debug, setDebug] = useState(false);
  const [motion, setMotion] = useState(true);
  const { game } = session;
  const outcome = sessionOutcome(session);
  const humanTurn = game.actor === 0;
  const legal = legalActions(game, 0);
  const resolved = game.actor === null;
  const restart = () => { setSession(fresh()); setError(''); };
  const lastActions: Partial<Record<number, Entry>> = {};
  for (let i = session.history.length - 1; i >= 0; i--) {
    const entry = session.history[i];
    if (entry.hand !== game.handNumber) break;
    if (entry.seat >= 0 && !lastActions[entry.seat]) lastActions[entry.seat] = entry;
  }
  useEffect(() => {
    if (game.actor === null || game.actor === 0 || error) return;
    const timer = setTimeout(() => {
      try { setSession(computerAction(session)); }
      catch (problem) { setError(problem instanceof Error ? problem.message : 'Opponent decision failed'); }
    }, aiDelay);
    return () => clearTimeout(timer);
  }, [session, aiDelay, error, game.actor]);
  const turnText = outcome === 'won' ? 'Outpost secured. You won the table.' : outcome === 'lost' ? 'Your stack is depleted. Restart for another mission.' :
    resolved ? 'Hand complete. Review the results, then deal a new hand.' : humanTurn ? 'Your turn. Choose your action.' : `${game.players[game.actor!].name} is considering the next move…`;
  return <main className="outpost bunker" data-motion={motion ? "full" : "off"}>
    <header className="masthead">
      <div><span className="eyebrow">Sector 07 / Off-duty operations</span><h1>Outpost <span>Poker</span></h1></div>
      <div className="header-tools"><span className="status">Single-player / Local play</span><label className="motion-control"><input type="checkbox" checked={motion} onChange={e => setMotion(e.target.checked)} />Animations</label><button onClick={restart}>Restart game</button></div>
    </header>
    <div className="mission-strip"><span>NO-LIMIT HOLD’EM</span><span>Hand {game.handNumber} / Blinds {game.smallBlind}–{game.bigBlind}</span><span>Fictional chips only · No real-money gambling</span></div>
    <div className="game-layout">
      <div className="game-main">
        <TableScene game={game} lastActions={lastActions} />
        <div className={`turn-banner ${humanTurn ? 'your-turn' : ''}`} role="status">{turnText}</div>
        {error && <div role="alert" className="error-panel">{error} <button onClick={() => setError('')}>Retry turn</button></div>}
        {resolved ? <section className="results-panel" aria-label="Hand results">
          <h2>{outcome === 'won' ? 'Mission accomplished' : outcome === 'lost' ? 'Mission ended' : 'After-action report'}</h2>
          {game.results.map((p, i) => <p key={i}>{i === 0 ? 'Main pot' : `Side pot ${i}`} · {p.amount} chips → {p.awards.map(a => `${game.players[a.seat].name} +${a.amount}`).join(' / ')}</p>)}
          {game.refunds.map(r => <p key={r.seat}>{game.players[r.seat].name}: {r.amount} uncalled chips returned</p>)}
          {outcome === 'playing' && <button className="primary" onClick={() => { try { setSession(nextHand(session)); setError(''); } catch (problem) { setError(String(problem)); } }}>New hand</button>}
          {outcome !== 'playing' && <button className="primary" onClick={restart}>Play again</button>}
        </section> : <Controls key={`${game.handNumber}-${game.phase}-${game.actor}-${game.currentBet}`} legal={legal} enabled={humanTurn && !error} onAction={action => {
          try { setSession(humanAction(session, action)); setError(''); }
          catch (problem) { setError(problem instanceof Error ? problem.message : 'Invalid action'); }
        }} />}
      </div>
      <ActionHistory history={session.history} />
    </div>
    <footer><span className="version-label">OUTPOST POKER / v0.2</span><span>4,000 fictional chips in circulation / No accounts / No cash value</span><button aria-expanded={debug} onClick={() => setDebug(!debug)}>{debug ? 'Close' : 'Open'} diagnostic simulator</button></footer>
    {debug && <><p className="debug-warning">Separate developer sandbox. All cards are visible here; this does not affect your game.</p><Simulator /></>}
  </main>;
}
