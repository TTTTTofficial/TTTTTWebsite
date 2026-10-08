import { useState } from "react";
import { clan } from "../data.ts";

const links = [
  { href: "#about", label: "About" },
  { href: "#roster", label: "Roster" },
  { href: "#games", label: "Games" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <nav className="nav container">
        <a href="#top" className="logo">
          {clan.name}
        </a>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <ul className={`nav-links${open ? " open" : ""}`}>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={close}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#join" className="btn btn-small" onClick={close}>
              Join
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
