import { act, createGame, observe, startHand, type Action, type Game } from '../poker/engine';
import { seededRandom } from '../poker/deck';
import { decide, type BettingEvent } from '../ai/strategy';
import { opponents } from '../ai/opponents';

export interface Entry extends BettingEvent { text: string }
export interface Session { game: Game; seed: number; history: Entry[]; revision: number }
const rng = (seed: number, hand: number, turn = 0) => seededRandom((seed + hand * 13007 + turn * 977) >>> 0);
export function createSession(seed: number): Session {
  if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer');
  const game = startHand(createGame(), { random: rng(seed, 1) });
  return { game, seed, history: [announcement(game)], revision: 0 };
}
function announcement(game: Game): Entry {
  return { seat: -1, phase: 'preflop', action: { type: 'check' }, hand: game.handNumber,
    text: `Hand ${game.handNumber} • ${game.players[game.dealer].name} deals. ${game.players[game.smallBlindSeat!].name} posts small blind; ${game.players[game.bigBlindSeat!].name} posts big blind (${game.smallBlind}/${game.bigBlind}).` };
}
export function sessionOutcome(session: Session): 'playing' | 'won' | 'lost' {
  if (session.game.actor !== null) return 'playing';
  if (!session.game.players[0].chips) return 'lost';
  return session.game.players.filter(p => p.chips > 0).length === 1 ? 'won' : 'playing';
}
export function applyAction(session: Session, seat: number, action: Action): Session {
  const before = session.game;
  const game = act(before, seat, action);
  const paid = action.type === 'call' ? Math.min(before.currentBet - before.players[seat].streetBet, before.players[seat].chips) :
    action.type === 'all-in' ? before.players[seat].chips : 0;
  const text = `${before.players[seat].name} ${action.type}${'to' in action ? ` to ${action.to}` : paid ? ` (${paid})` : ''}.`;
  const entries: Entry[] = [{ seat, phase: before.phase, action: { ...action }, hand: before.handNumber, text }];
  if (before.phase !== game.phase) entries.push({ seat: -1, phase: game.phase, action: { type: 'check' }, hand: game.handNumber,
    text: game.actor === null ? 'Hand resolved. Payouts distributed.' : `${game.phase.toUpperCase()} • community cards dealt.` });
  if (game.actor === null) for (const [i, pot] of game.results.entries()) entries.push({ seat: -1, phase: game.phase, action: { type: 'check' }, hand: game.handNumber,
    text: `Pot ${i + 1}: ${pot.awards.map(a => `${game.players[a.seat].name} +${a.amount}`).join(', ')}.` });
  if (game.actor === null) for (const refund of game.refunds) entries.push({ seat: -1, phase: game.phase, action: { type: 'check' }, hand: game.handNumber,
    text: `${game.players[refund.seat].name} receives ${refund.amount} uncalled chips back.` });
  return { ...session, game, history: [...session.history, ...entries], revision: session.revision + 1 };
}
export function humanAction(session: Session, action: Action): Session {
  if (session.game.actor !== 0) throw new Error('Wait for your turn');
  return applyAction(session, 0, action);
}
export function computerAction(session: Session): Session {
  const seat = session.game.actor;
  if (seat === null || seat === 0) return session;
  const profile = opponents[seat - 1];
  const action = decide(observe(session.game, seat), seat, profile.style, session.history, rng(session.seed, session.game.handNumber, session.revision + 1));
  return applyAction(session, seat, action);
}
export function nextHand(session: Session): Session {
  if (sessionOutcome(session) !== 'playing') throw new Error('Session finished; restart to play again');
  const game = startHand(session.game, { random: rng(session.seed, session.game.handNumber + 1) });
  return { ...session, game, history: [...session.history, announcement(game)], revision: session.revision + 1 };
}
/** Only showdown participants reveal. Folded cards and uncontested winners remain private. */
export function visibleCards(game: Game, seat: number) {
  const p = game.players[seat];
  return seat === 0 || game.phase === 'showdown' && ['active', 'all-in'].includes(p.status) ? p.hole : [];
}
