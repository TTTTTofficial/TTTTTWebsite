import { clan } from "../data.ts";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          &copy; {new Date().getFullYear()} {clan.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
