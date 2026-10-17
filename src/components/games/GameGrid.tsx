import type { Game } from "@/types/game";
import { GameCard } from "./GameCard";

type Props = { games: Game[] };

export function GameGrid({ games }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
      {games.map((g) => (
        <GameCard key={g.slug} game={g} />
      ))}
    </div>
  );
}
