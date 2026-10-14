import { createLobby } from '../state/lobby';

export function App() {
  const seats = createLobby();
  return (
    <main className="outpost">
      <header className="masthead">
        <span className="eyebrow">Sector 07 / Recreation bunker</span>
        <span className="status">Foundation build</span>
      </header>
      <section className="briefing" aria-labelledby="title">
        <p className="eyebrow">Off duty. On the felt.</p>
        <h1 id="title">Outpost <span>Poker</span></h1>
        <p className="intro">A quiet bunker. Three rivals. One seat reserved for you.</p>
        <p className="disclaimer">Single-player Texas Hold’em · Fictional chips only · No real-money gambling</p>
      </section>
      <section className="table" aria-labelledby="table-title">
        <div className="table-heading">
          <h2 id="table-title">Table roster</h2>
          <span>4 seats / 1 human</span>
        </div>
        <ul className="seats">
          {seats.map(seat => (
            <li key={seat.id} className={seat.controller === 'human' ? 'seat human' : 'seat'}>
              <span className="seat-role">{seat.controller === 'human' ? 'Your seat' : 'Computer opponent'}</span>
              <h3>{seat.name}</h3>
              <p>{seat.chips.toLocaleString('en-US')} <span>fictional chips</span></p>
              <span className="seat-note">{seat.controller === 'human' ? 'Awaiting deployment' : 'Strategy coming soon'}</span>
            </li>
          ))}
        </ul>
        <div className="deployment">
          <p>Gameplay is under construction. This build establishes the project foundation.</p>
          <button disabled title="Playable hands arrive in a future milestone">Deal hand — coming soon</button>
        </div>
      </section>
      <footer>OUTPOST POKER / Local play / No account required</footer>
    </main>
  );
}
