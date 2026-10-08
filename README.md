# TTTTT Website

Official website for the TTTTT clan. Built with React + TypeScript + Vite and deployed to GitHub Pages via GitHub Actions.

## Getting started

Requires Node.js 20+.

```sh
npm install
npm run dev       # local dev server with hot reload
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Structure

```
index.html                 HTML shell (title, fonts, meta)
public/                    Static files copied as-is (favicon, images)
src/data.ts                Clan info, roster, games, Discord link — edit this to update content
src/App.tsx                Page layout
src/components/            One component per section
src/index.css              Styles (colors are CSS variables at the top)
vite.config.ts             Vite config (`base` must match the repo name)
.github/workflows/         Build & deploy to GitHub Pages
```

## Editing content

- **Text, members, games, Discord link:** edit `src/data.ts`.
- **Avatars:** put images in `public/avatars/` and set `avatar: "avatars/name.png"` on the member.
- **Colors:** change the variables in `:root` at the top of `src/index.css`.

## Deploying

1. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The workflow builds and publishes the site to
   `https://tttttofficial.github.io/TTTTTWebsite/`.

If you add a custom domain, change `base` in `vite.config.ts` to `"/"`.
