/**
 * Game registry — the single source of truth for every game on the site.
 * To add a game: put it in `public/games/<slug>/` (entry point `index.html`)
 * and add an entry below. Pages, cards and routes are generated from this list.
 */

import type { Metadata } from "next";
import type { Biome, Game } from "@/types/game";

/** URL of a game's entry page, served as a static file from `public/games/<slug>/`. */
export const gamePath = (slug: string): string => `/games/${slug}/index.html`;

export const games: Game[] = [
  {
    slug: "lumen-isle",
    title: "Lumen Isle",
    tagline: "a quiet place to wander",
    description:
      "Wander a large glowing island from sunlit meadow to highland falls. Find twelve quiet places, meet the creatures, gather motes of light and wake nine sleeping lanterns. Your journal remembers where you have been. Nothing to lose, no timers.",
    biome: "island",
    duration: "20–60 min",
    controls: [
      { keys: "W A S D", action: "wander" },
      { keys: "shift", action: "drift faster" },
      { keys: "drag", action: "look" },
      { keys: "scroll", action: "zoom" },
      { keys: "space", action: "hop" },
      { keys: "E", action: "plant a flower" },
      { keys: "Q", action: "listen for unfound places" },
      { keys: "J", action: "journal and map" },
      { keys: "B", action: "breathe" },
      { keys: "M", action: "music" },
      { keys: "H", action: "show or hide controls" },
    ],
    src: gamePath("lumen-isle"),
    headphones: true,
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

/** Static params for `/games/[slug]`: one pre-rendered page per registered game. */
export function getGameStaticParams(): { slug: string }[] {
  return games.map((g) => ({ slug: g.slug }));
}

export function getGameMetadata(slug: string): Metadata {
  const game = getGame(slug);
  return game ? { title: game.title, description: game.description } : {};
}

export const biomeLabel: Record<Biome, string> = {
  island: "Island",
  forest: "Forest",
  meadow: "Meadow",
  ocean: "Ocean",
  mountain: "Mountain",
  sky: "Sky",
};
