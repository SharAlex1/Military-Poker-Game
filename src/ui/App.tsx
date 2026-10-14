import { useEffect, useState } from 'react';
import { legalActions } from '../poker/engine';
import { evaluateHand } from '../poker/evaluate';
import { opponents } from '../ai/opponents';
import { computerAction, createSession, humanAction, nextHand, sessionOutcome, visibleCards, type Session } from '../state/session';
import { PlayingCard } from './components/PlayingCard';
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
  const { game } = session;
  const outcome = sessionOutcome(session);
  const humanTurn = game.actor === 0;
  const legal = legalActions(game, 0);
  const resolved = game.actor === null;
  const pot = resolved ? game.results.reduce((sum, p) => sum + p.amount, 0) : game.players.reduce((sum, p) => sum + p.committed, 0);
  const wonSeats = new Set(game.results.flatMap(p => p.winners));
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
  return <main className="outpost bunker">
    <header className="masthead">
      <div><span className="eyebrow">Sector 07 / Recreation bunker</span><h1>Outpost <span>Poker</span></h1></div>
      <div className="header-tools"><span className="status">Single-player / Local play</span><button onClick={() => { setSession(fresh()); setError(''); }}>Restart game</button></div>
    </header>
    <div className="mission-strip"><span>NO-LIMIT HOLD’EM</span><span>Hand {game.handNumber} / Blinds {game.smallBlind}–{game.bigBlind}</span><span>Fictional chips only · No real-money gambling</span></div>
    <div className="game-layout">
      <div className="game-main">
        <section className="poker-table felt" aria-label="Poker table">
          {game.players.map((player, seat) => {
            const profile = opponents[seat - 1];
            const cards = visibleCards(game, seat);
            const reveal = game.phase === 'showdown' && player.status !== 'folded' && player.status !== 'out';
            const lastAction = [...session.history].reverse().find(e => e.hand === game.handNumber && e.seat === seat);
            return <article key={player.id} className={`seat-panel position-${seat}${game.actor === seat ? ' acting' : ''}${player.status === 'folded' || player.status === 'out' ? ' inactive' : ''}${wonSeats.has(seat) ? ' winner' : ''}`} aria-label={`${player.name} seat`}>
              <div className="identity"><span className={`portrait portrait-${seat}`} aria-hidden="true">{seat === 0 ? 'OP' : player.name[0]}</span><div><h2>{player.name}</h2><span className="seat-role">{seat === 0 ? 'You / Outpost operator' : `${profile.role} / ${profile.style}`}</span></div><span className="markers">{game.dealer === seat && <span title="Dealer" aria-label="Dealer button">D</span>}{game.smallBlindSeat === seat && <span title="Small blind">SB</span>}{game.bigBlindSeat === seat && <span title="Big blind">BB</span>}</span></div>
              <div className="seat-cards" aria-label={`${player.name} cards`}>
                {player.hole.map((_, i) => <PlayingCard key={`${game.handNumber}-${i}`} card={cards[i]} hidden={!cards[i]} index={i} />)}
                {player.status === 'out' && <span className="out-label">Eliminated</span>}
              </div>
              <div className="stack-line"><strong data-testid={`stack-${seat}`}>{player.chips.toLocaleString('en-US')}</strong><span>chips</span><span className="street-bet">Bet: {player.streetBet}</span></div>
              <p className="seat-action">{reveal ? evaluateHand([...player.hole, ...game.board]).name : lastAction?.text ?? (player.status === 'out' ? 'Out of the session' : game.actor === seat ? 'Acting now' : 'Standing by')}</p>
              {player.status === 'all-in' && !resolved && <span className="all-in-tag">ALL-IN</span>}
            </article>;
          })}
          <div className="table-center">
            <span className="table-stencil">OUTPOST 07</span><p className="phase-label">{game.phase === 'complete' ? 'Hand complete' : game.phase}</p>
            <div className="community" aria-label="Community cards">{Array.from({ length: 5 }, (_, i) => <PlayingCard key={game.board[i] ? `${game.handNumber}-${i}` : `empty-${i}`} card={game.board[i]} index={i} />)}</div>
            <div className="pot-display"><span>{resolved ? 'Pot awarded' : 'Total pot'}</span><strong>{pot.toLocaleString('en-US')}</strong></div>
            <span className="current-bet">Current wager: {game.currentBet} chips</span>
          </div>
        </section>
        <div className={`turn-banner ${humanTurn ? 'your-turn' : ''}`} role="status">{turnText}</div>
        {error && <div role="alert" className="error-panel">{error} <button onClick={() => setError('')}>Retry turn</button></div>}
        {resolved ? <section className="results-panel" aria-label="Hand results">
          <h2>{outcome === 'won' ? 'Mission accomplished' : outcome === 'lost' ? 'Mission ended' : 'After-action report'}</h2>
          {game.results.map((p, i) => <p key={i}>{i === 0 ? 'Main pot' : `Side pot ${i}`} · {p.amount} chips → {p.awards.map(a => `${game.players[a.seat].name} +${a.amount}`).join(' / ')}</p>)}
          {game.refunds.map(r => <p key={r.seat}>{game.players[r.seat].name}: {r.amount} uncalled chips returned</p>)}
          {outcome === 'playing' && <button className="primary" onClick={() => { try { setSession(nextHand(session)); setError(''); } catch (problem) { setError(String(problem)); } }}>New hand</button>}
          {outcome !== 'playing' && <button className="primary" onClick={() => { setSession(fresh()); setError(''); }}>Play again</button>}
        </section> : <Controls key={`${game.handNumber}-${game.phase}-${game.actor}-${game.currentBet}`} legal={legal} enabled={humanTurn && !error} onAction={action => {
          try { setSession(humanAction(session, action)); setError(''); }
          catch (problem) { setError(problem instanceof Error ? problem.message : 'Invalid action'); }
        }} />}
      </div>
      <aside className="history-panel" aria-label="Action history"><span className="eyebrow">Tactical feed</span><h2>Action history</h2><ol>{session.history.slice(-80).reverse().map((entry, i) => <li key={`${session.revision}-${i}`}><span>H{entry.hand} / {entry.phase}</span>{entry.text}</li>)}</ol></aside>
    </div>
    <footer><span>4,000 fictional chips in circulation / No accounts / No cash value</span><button aria-expanded={debug} onClick={() => setDebug(!debug)}>{debug ? 'Close' : 'Open'} diagnostic simulator</button></footer>
    {debug && <><p className="debug-warning">Separate developer sandbox. All cards are visible here; this does not affect your game.</p><Simulator /></>}
  </main>;
}
