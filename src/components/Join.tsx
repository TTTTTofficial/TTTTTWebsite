import { clan } from "../data.ts";

export default function Join() {
  return (
    <section id="join" className="section section-alt">
      <div className="container center">
        <h2>Join Us</h2>
        <p>Looking for new members. Hop into our Discord and say hi.</p>
        <a href={clan.discordUrl} className="btn" target="_blank" rel="noopener noreferrer">
          Join our Discord
        </a>
      </div>
    </section>
  );
}
