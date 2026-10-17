/**
 * Game registry — the single source of truth for every game on the site.
 * To add a game: drop its build into `public/games/<slug>/index.html`
 * and add an entry below. Pages, cards and routes are generated from this list.
 */

import type { Biome, Game } from "@/types/game";

export const games: Game[] = [
  {
    slug: "lumen-isle",
    title: "Lumen Isle",
    tagline: "a quiet place to wander",
    description:
      "Drift across a small glowing island as day turns to dusk. Plant flowers, gather light motes, ring the stones and release sky lanterns. Nothing to lose, no timers.",
    biome: "island",
    duration: "10–20 min",
    controls: [
      { keys: "W A S D", action: "wander" },
      { keys: "drag", action: "look" },
      { keys: "scroll", action: "zoom" },
      { keys: "space", action: "hop" },
      { keys: "E", action: "plant a flower" },
      { keys: "B", action: "breathe" },
      { keys: "M", action: "music" },
    ],
    src: "/games/lumen-isle/index.html",
    headphones: true,
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export const biomeLabel: Record<Biome, string> = {
  island: "Island",
  forest: "Forest",
  meadow: "Meadow",
  ocean: "Ocean",
  mountain: "Mountain",
  sky: "Sky",
};
