import { clan } from "../data.ts";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <h2>About Us</h2>
        <p>{clan.about}</p>
      </div>
    </section>
  );
}
