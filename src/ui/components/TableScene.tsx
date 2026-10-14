import type { Game } from '../../poker/engine';
import type { Entry } from '../../state/session';
import { PlayingCard } from './PlayingCard';
import { PlayerPanel } from './PlayerPanel';
import { Chips } from './Chips';
import './table.css';
export function TableScene({ game, lastActions }: { game: Game; lastActions: Partial<Record<number, Entry>> }) {
  const resolved = game.actor === null;
  const pot = resolved ? game.results.reduce((sum,p)=>sum+p.amount,0) : game.players.reduce((sum,p)=>sum+p.committed,0);
  const winners = new Set(game.results.flatMap(p=>p.winners));
  return <section className="table-stage" aria-label="Poker table"><div className="overhead-fixture" aria-hidden="true"><span/><span/><span/></div><div className="poker-table felt">
    <span className="rail-label" aria-hidden="true">OUTPOST / PROPERTY OF SECTOR 07</span>
    {game.players.map((p,seat)=><PlayerPanel key={p.id} game={game} seat={seat} lastAction={lastActions[seat]} winner={winners.has(seat)} />)}
    <div className="table-center"><span className="table-stencil">OUTPOST 07</span><p className="phase-label">{game.phase==='complete'?'Hand complete':game.phase}</p>
      <div className="community" aria-label="Community cards">{Array.from({length:5},(_,i)=><PlayingCard key={game.board[i]?`${game.handNumber}-${i}`:`empty-${i}`} card={game.board[i]} index={i} />)}</div>
      <div className={`pot-display${resolved?' pot-settled':''}`} key={`${game.handNumber}-${resolved}`}><span>{resolved?'Pot awarded':'Total pot'}</span><strong>{pot.toLocaleString('en-US')}</strong><Chips amount={pot} /></div>
      <span className="current-bet">Current wager: {game.currentBet} chips</span><span className="deck-prop" aria-hidden="true">OP</span>
    </div>
  </div></section>;
}
