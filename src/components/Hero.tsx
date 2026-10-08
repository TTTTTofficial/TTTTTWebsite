import { clan } from "../data.ts";

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">{clan.name}</h1>
        <p className="hero-tagline">{clan.tagline}</p>
        <a href="#join" className="btn">
          Join the Clan
        </a>
      </div>
    </section>
  );
}
