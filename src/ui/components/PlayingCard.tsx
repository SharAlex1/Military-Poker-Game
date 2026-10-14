import type { Card } from '../../poker/types';
import './cards.css';
const symbols = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
export function PlayingCard({ card, hidden = false, index = 0 }: { card?: Card; hidden?: boolean; index?: number }) {
  if (hidden) return <span role="img" className="playing-card card-back" aria-label="Hidden card" style={{ animationDelay: `${index * 45}ms` }}><span className="back-emblem">OP<small>SECTOR 07</small></span></span>;
  if (!card) return <span role="img" className="playing-card card-slot" aria-label="Undealt community card">+</span>;
  return <span role="img" className={`playing-card card-face ${['hearts', 'diamonds'].includes(card.suit) ? 'red' : ''}`} aria-label={`${card.rank} of ${card.suit}`} style={{ animationDelay: `${index * 70}ms` }}>
    <span className="card-corner">{card.rank}<small>{symbols[card.suit]}</small></span><span className="card-suit">{symbols[card.suit]}</span><span className="card-corner lower">{card.rank}<small>{symbols[card.suit]}</small></span>
  </span>;
}
