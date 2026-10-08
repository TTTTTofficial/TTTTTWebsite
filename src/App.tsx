import Header from "./components/Header.tsx";
import Hero from "./components/Hero.tsx";
import About from "./components/About.tsx";
import Roster from "./components/Roster.tsx";
import Games from "./components/Games.tsx";
import Join from "./components/Join.tsx";
import Footer from "./components/Footer.tsx";

export default function App() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <About />
        <Roster />
        <Games />
        <Join />
      </main>
      <Footer />
    </>
  );
}
