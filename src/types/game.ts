/** Shared game types: used by the registry and the game components. */

export type Biome = "island" | "forest" | "meadow" | "ocean" | "mountain" | "sky";

export type Game = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  biome: Biome;
  /** Rough session length, e.g. "5–15 min". */
  duration: string;
  controls: { keys: string; action: string }[];
  /** Path under /public that hosts the playable build. */
  src: string;
  headphones?: boolean;
};
