import { games } from "../data.ts";

export default function Games() {
  return (
    <section id="games" className="section">
      <div className="container">
        <h2>Games We Play</h2>
        <div className="grid">
          {games.map((g) => (
            <div className="card" key={g.name}>
              <h3>{g.name}</h3>
              <p className="muted">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
