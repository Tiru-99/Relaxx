import type { Metadata } from "next";
import { GameGrid } from "@/components/games/GameGrid";
import { PageSection } from "@/components/layout/PageSection";
import { games } from "@/lib/games";

export const metadata: Metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <PageSection title="All games" lede="Pick a world. There is no wrong way to play.">
      <div className="mt-7">
        <GameGrid games={games} />
      </div>
    </PageSection>
  );
}
