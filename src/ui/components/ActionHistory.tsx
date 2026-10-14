import type { Entry } from '../../state/session';
export function ActionHistory({ history }: { history: readonly Entry[] }) {
  return <aside className="history-panel" aria-label="Action history"><span className="eyebrow">Live / Tactical feed</span><h2>Action history</h2><ol>{history.slice(-80).reverse().map((entry,i)=><li key={`${history.length}-${i}`}><span>H{entry.hand} / {entry.phase}</span>{entry.text}</li>)}</ol><p className="feed-footnote">LOCAL SESSION · NO CASH VALUE</p></aside>;
}
