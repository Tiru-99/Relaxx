# Still Grove

Calm, nature-inspired browser games, built with Next.js, TypeScript and Tailwind CSS v4.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

```
public/games/<slug>/   Each game and its logic, separate from the site (Lumen Isle lives here)
src/
  app/                 Routes: home, /games, /games/[slug], /about, 404
  components/
    ui/                Generic UI (AmbientSky)
    layout/            SiteHeader, SiteFooter, PageSection
    games/             GameCard, GameGrid, GameFrame
  lib/games.ts         Game registry: add new games here
  types/game.ts        Shared Game and Biome types
  app/globals.css      Design tokens + Tailwind theme (the only stylesheet)
```

The full engineering guide (layers, the file-size limit, where code goes, API rules, calm design rules) is in
[AGENTS.md](AGENTS.md). Claude-specific workflow is in [CLAUDE.md](CLAUDE.md).
