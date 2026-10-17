import Link from "next/link";
import { biomeLabel } from "@/lib/games";
import type { Biome, Game } from "@/types/game";

type Props = { game: Game };

// Placeholder art per biome. Replace with a cover image when you have one.
// Full class names (not built from strings) so Tailwind can detect them.
const biomeArt: Record<Biome, string> = {
  island: "bg-(image:--art-island)",
  forest: "bg-(image:--art-forest)",
  meadow: "bg-(image:--art-meadow)",
  ocean: "bg-(image:--art-ocean)",
  mountain: "bg-(image:--art-mountain)",
  sky: "bg-(image:--art-sky)",
};

export function GameCard({ game }: Props) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="block overflow-hidden rounded-card border border-line bg-bg-elev shadow-soft transition duration-900 ease-calm hover:-translate-y-0.75 hover:shadow-[0_18px_40px_-20px_var(--glow)]"
    >
      <div className={`aspect-video ${biomeArt[game.biome]}`} aria-hidden />
      <div className="px-4.5 pt-4 pb-5">
        <div className="flex justify-between text-xs tracking-[0.12em] text-ink-soft uppercase">
          <span>{biomeLabel[game.biome]}</span>
          <span>{game.duration}</span>
        </div>
        <h3 className="mt-2 text-xl">{game.title}</h3>
        <p className="mt-1 text-ink-soft">{game.tagline}</p>
      </div>
    </Link>
  );
}
