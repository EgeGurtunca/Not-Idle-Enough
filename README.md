# Solo Fan Idle

A fantasy clicker / idle / incremental game. Click to slay creatures, hire companions
that fight for you, and climb an endless ladder of regions through **three prestige
layers** — Prestige (crystals), Ascension (stardust), and Realm Shift (essence).

Built with **React + Vite + Zustand**, with procedural 3D creatures rendered in **Three.js**.
No backend — the whole game runs in the browser and saves to `localStorage`, so it can be
hosted anywhere static (GitHub Pages, itch.io, …).

## Play

- **Click** the creature to deal damage. Every 15 hero levels doubles your click damage.
- Slay 10 creatures → a **mini-boss**; every 10th region → a **big boss** (30s timer).
- **Companions** auto-attack; **artifacts** (gacha chests) and **upgrades** boost you.
- **Region 100 → Prestige** (crystals), **500 → Ascension** (stardust),
  **1000 → Realm Shift** (essence). Each layer resets what's below it for a permanent boost.
- Regions are **endless** past 500.

English and Turkish, toggle in Settings. Progress is saved in your browser; export a JSON
backup from Settings before clearing site data or switching devices.

## Develop

```bash
npm install
npm run dev        # client (Vite) at http://localhost:5173
```

The `server/` folder (Express + PGlite) is optional and only used for local experiments —
the game itself does not need it.

## Build & deploy

```bash
npm run build -w client   # static output in client/dist/
```

Pushing to `main` auto-builds and deploys to **GitHub Pages** via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Enable it once under
**Settings → Pages → Source: GitHub Actions**. The Vite `base` is `./` (relative paths),
so it works from a project subpath.
