import type { Game } from '../../poker/engine';
import { evaluateHand } from '../../poker/evaluate';
import { visibleCards, type Entry } from '../../state/session';
import { opponents } from '../../ai/opponents';
import { PlayingCard } from './PlayingCard';
import { Chips } from './Chips';
import operator from '../../assets/portraits/operator.svg';
import rook from '../../assets/portraits/rook.svg';
import viper from '../../assets/portraits/viper.svg';
import anchor from '../../assets/portraits/anchor.svg';
import './players.css';
const portraits = [operator, rook, viper, anchor];
const affiliations = ['Outpost operator', 'Recon / R-01', 'Assault / V-02', 'Command / A-03'];
export function PlayerPanel({ game, seat, lastAction, winner }: { game: Game; seat: number; lastAction?: Entry; winner: boolean }) {
  const player = game.players[seat];
  const cards = visibleCards(game, seat);
  const resolved = game.actor === null;
  const reveal = game.phase === 'showdown' && !['folded','out'].includes(player.status);
  const status = player.status === 'out' || resolved && player.chips === 0 ? 'Eliminated' : player.status === 'folded' ? 'Folded' : winner ? 'Winner' : player.status === 'all-in' && !resolved ? 'All-in' : game.actor === seat ? (seat === 0 ? 'Your turn' : 'Acting') : 'Ready';
  return <article className={`seat-panel position-${seat}${game.actor === seat ? ' acting' : ''}${['folded','out'].includes(player.status) ? ' inactive' : ''}${winner ? ' winner' : ''}`} aria-label={`${player.name} seat`}>
    <div className="identity"><img className="portrait" src={portraits[seat]} alt="" /><div><span className="affiliation">{affiliations[seat]}</span><h2>{player.name}</h2><span className="seat-role">{seat === 0 ? 'You / Local player' : opponents[seat - 1].style}</span></div>
      <span className="markers">{game.dealer === seat && <span title="Dealer" aria-label="Dealer button">D</span>}{game.smallBlindSeat === seat && <span title="Small blind">SB</span>}{game.bigBlindSeat === seat && <span title="Big blind">BB</span>}</span>
    </div>
    <div className="seat-cards" aria-label={`${player.name} cards`}>{player.hole.map((_, i) => <PlayingCard key={`${game.handNumber}-${i}-${Boolean(cards[i])}`} card={cards[i]} hidden={!cards[i]} index={seat * 2 + i} />)}{player.status === 'out' && <span className="out-label">OUT OF ACTION</span>}</div>
    <div className="stack-line"><strong data-testid={`stack-${seat}`}>{player.chips.toLocaleString('en-US')}</strong><span>chips</span><span className="street-bet">Bet: {player.streetBet}</span></div>
    <div className="seat-ledger"><Chips key={`${game.handNumber}-${resolved}-${winner}`} amount={player.chips} compact /><span className={`seat-status status-${player.status}`}>{status}</span></div>
    {player.streetBet > 0 && <span className="wager-chips" key={`${game.handNumber}-${game.phase}-${player.streetBet}`}><Chips amount={player.streetBet} compact moving /></span>}
    <p className="seat-action">{reveal ? evaluateHand([...player.hole, ...game.board]).name : lastAction?.text ?? (player.status === 'out' ? 'Out of the session' : game.actor === seat ? 'Acting now' : 'Standing by')}</p>
    {player.status === 'all-in' && !resolved && <span className="all-in-tag">ALL-IN</span>}
  </article>;
}
